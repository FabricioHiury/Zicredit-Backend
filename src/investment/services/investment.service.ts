import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { PaginationService } from 'src/pagination/pagination.service';
import { CreateInvestorDto } from '../dto/create-investor.dto';
import { PaginationParamsDto } from 'src/pagination/pagination.dto';
import { Prisma } from '@prisma/client';
import { UpdateInvestorDto } from '../dto/update-investor.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InvestmentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paginationsService: PaginationService,
  ) {}
  async create(createInvestorDto: CreateInvestorDto) {
    const findOneUser = await this.prismaService.user.findFirst({
      where: {
        OR: [
          { cpf: createInvestorDto.cpf },
          { email: createInvestorDto.email },
        ],
        deleted_at: null,
      },
    });
    if (findOneUser) {
      throw new BadRequestException(
        'Já existe uma conta com este email ou com este CPF.',
      );
    }

    try {
      const investor = await this.prismaService.user.create({
        data: {
          name: createInvestorDto.name,
          cpf: createInvestorDto.cpf,
          email: createInvestorDto.email,
          phone: createInvestorDto.phone,
          password: createInvestorDto.password,
          role: 'INVESTOR',
        },
      });

      const investments = await Promise.all(
        createInvestorDto.investments.map(async (investment) => {
          const project = await this.prismaService.project.findUnique({
            where: { id: investment.projectId },
          });
          if (!project) {
            throw new NotFoundException('Projeto não encontrado.');
          }

          const totalInvested = await this.prismaService.investment.aggregate({
            _sum: {
              amountInvested: true,
            },
            where: {
              projectId: investment.projectId,
            },
          });

          const currentInvested = totalInvested._sum.amountInvested || 0;
          const newPotentialTotal = currentInvested + investment.amountInvested;

          if (newPotentialTotal > project.totalValue) {
            throw new BadRequestException(
              'Investimento excede o valor total do projeto.',
            );
          }

          const createdInvestment = await this.prismaService.investment.create({
            data: {
              userId: investor.id,
              projectId: investment.projectId,
              amountInvested: investment.amountInvested,
              sellerId: investment.sellerId || null,
            },
          });

          await this.prismaService.investmentLog.create({
            data: {
              investmentId: createdInvestment.id,
              amountChanged: investment.amountInvested,
              newTotalAmount: investment.amountInvested,
              type: 'INCREASE',
            },
          });

          return createdInvestment;
        }),
      );

      return {
        investor,
        investments,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  async findAll(paginationParams: PaginationParamsDto) {
    try {
      const whereClause: Prisma.InvestmentWhereInput = {};

      if (paginationParams.search) {
        whereClause.OR = [
          {
            seller: {
              name: { contains: paginationParams.search, mode: 'insensitive' },
            },
          },
          {
            user: {
              name: { contains: paginationParams.search, mode: 'insensitive' },
              cpf: { contains: paginationParams.search, mode: 'insensitive' },
            },
          },
          {
            project: {
              name: { contains: paginationParams.search, mode: 'insensitive' },
              company: {
                name: {
                  contains: paginationParams.search,
                  mode: 'insensitive',
                },
                cnpj: {
                  contains: paginationParams.search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ];
      }

      const response = await this.prismaService.investment.findMany({
        include: { project: true, seller: true, user: true },
      });

      const metadata = await this.paginationsService.paginate(response, {
        page: paginationParams.page,
        limit: paginationParams.limit,
      });

      return {
        status: 200,
        metadata,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findOne(id: string) {
    try {
      const response = await this.prismaService.investment.findFirst({
        where: { id: id },
        include: { project: true, seller: true, user: true },
      });

      return response;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findByUser(userId: string, paginationParams: PaginationParamsDto) {
    try {
      const response = await this.prismaService.investment.findMany({
        where: {
          userId: userId,
        },
      });

      const metadata = await this.paginationsService.paginate(response, {
        page: paginationParams.page,
        limit: paginationParams.limit,
      });

      return { status: 200, metadata };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findBySeller(sellerId: string, paginationParams: PaginationParamsDto) {
    try {
      const response = await this.prismaService.investment.findMany({
        where: {
          sellerId: sellerId,
        },
      });

      const metadata = await this.paginationsService.paginate(response, {
        page: paginationParams.page,
        limit: paginationParams.limit,
      });

      return { status: 200, metadata };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findByInvestorLog(
    investorId: string,
    paginationParams: PaginationParamsDto,
  ) {
    try {
      const whereClause: Prisma.InvestmentLogWhereInput = {};

      if (paginationParams.search) {
        const amountChanged = parseFloat(paginationParams.search);
        if (!isNaN(amountChanged)) {
          whereClause.amountChanged = { equals: amountChanged };
        }
      }
      const response = await this.prismaService.investmentLog.findMany({
        include: { investment: true },
        where: { investment: { userId: investorId } },
        orderBy: { createdAt: 'desc' },
      });

      // Calcular o saldo total considerando INCREASE e DECREASE
      const balance = await this.prismaService.investmentLog.aggregate({
        _sum: {
          amountChanged: true,
        },
        where: {
          investment: { userId: investorId },
          type: 'INCREASE',
        },
      });

      const deductions = await this.prismaService.investmentLog.aggregate({
        _sum: {
          amountChanged: true,
        },
        where: {
          investment: { userId: investorId },
          type: 'DECREASE',
        },
      });

      const totalBalance =
        (balance._sum.amountChanged || 0) -
        (deductions._sum.amountChanged || 0);

      const metadata = await this.paginationsService.paginate(response, {
        page: paginationParams.page,
        limit: paginationParams.limit,
      });

      return { status: 200, metadata, balance: totalBalance };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findAllByInvestorAndProjects(
    investorId: string,
    projectId: string,
    paginationParams: PaginationParamsDto,
  ) {
    try {
      const whereClause: Prisma.InvestmentLogWhereInput = {};

      const response = await this.prismaService.investmentLog.findMany({
        include: { investment: true },
        where: { investment: { projectId: projectId, userId: investorId } },
        orderBy: { createdAt: 'desc' },
      });

      // Calculando o saldo total investido no projeto pelo investidor
      const balance = await this.prismaService.investmentLog.aggregate({
        _sum: {
          amountChanged: true,
        },
        where: {
          ...whereClause,
          type: 'INCREASE',
        },
      });

      const deductions = await this.prismaService.investmentLog.aggregate({
        _sum: {
          amountChanged: true,
        },
        where: {
          ...whereClause,
          type: 'DECREASE',
        },
      });

      const totalBalance =
        (balance._sum.amountChanged || 0) -
        (deductions._sum.amountChanged || 0);

      const metadata = await this.paginationsService.paginate(response, {
        page: paginationParams.page,
        limit: paginationParams.limit,
      });

      return { status: 200, metadata, balance: totalBalance };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async update(id: string, updateInvestorDto: UpdateInvestorDto) {
    try {
      const hash = await bcrypt.hash(
        updateInvestorDto.password,
        await bcrypt.genSalt(Number(process.env.APP_PASSWORD_HASH)),
      );

      const updatedInvestor = await this.prismaService.user.update({
        where: { id },
        data: {
          name: updateInvestorDto.name,
          cpf: updateInvestorDto.cpf,
          email: updateInvestorDto.email,
          phone: updateInvestorDto.phone,
          password: hash,
        },
      });

      if (updateInvestorDto.investment) {
        const { investmentId, amountInvested } = updateInvestorDto.investment;

        const investment = await this.prismaService.investment.findUnique({
          where: { id: investmentId },
          include: { project: true },
        });

        if (!investment || investment.userId !== id) {
          throw new NotFoundException(
            'Investimento não encontrado ou não pertence ao usuário.',
          );
        }

        const totalInvested = await this.prismaService.investment.aggregate({
          _sum: {
            amountInvested: true,
          },
          where: {
            projectId: investment.projectId,
            id: { not: investmentId }, // Exclui o investimento atual da soma
          },
        });

        const currentInvested = totalInvested._sum.amountInvested || 0;
        const newPotentialTotal = currentInvested + amountInvested;

        if (newPotentialTotal > investment.project.totalValue) {
          throw new BadRequestException(
            'Investimento excede o valor total do projeto.',
          );
        }

        if (amountInvested !== 0) {
          await this.prismaService.investment.update({
            where: { id: investmentId },
            data: { amountInvested: newPotentialTotal },
          });

          await this.prismaService.investmentLog.create({
            data: {
              investmentId: investmentId,
              amountChanged: amountInvested,
              newTotalAmount: newPotentialTotal,
              type: amountInvested > 0 ? 'INCREASE' : 'DECREASE',
            },
          });
        } else {
          await this.prismaService.investment.update({
            where: { id: investmentId },
            data: {
              deleted_at: new Date(),
            },
          });
        }
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async remove(id: string) {
    try {
      const investment = await this.prismaService.investment.update({
        where: { id: id },
        data: { deleted_at: new Date() },
      });

      return investment;
    } catch (error) {
      throw new Error(error);
    }
  }
}
