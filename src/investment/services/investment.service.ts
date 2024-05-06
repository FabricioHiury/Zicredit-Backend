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
          return this.prismaService.investment.create({
            data: {
              userId: investor.id,
              projectId: investment.projectId,
              amountInvested: investment.amountInvested,
              sellerId: investment.sellerId || null,
            },
          });
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

  async update(id: string, updateInvestmentDto: UpdateInvestorDto) {
    try {
      const hash = await bcrypt.hash(
        updateInvestmentDto.password,
        await bcrypt.genSalt(Number(process.env.APP_PASSWORD_HASH)),
      );

      const updatedInvestor = await this.prismaService.user.update({
        where: { id },
        data: {
          name: updateInvestmentDto.name,
          cpf: updateInvestmentDto.cpf,
          email: updateInvestmentDto.email,
          phone: updateInvestmentDto.phone,
          password: hash,
        },
      });

      if (updateInvestmentDto.investment) {
        const { investmentId, amountInvested } = updateInvestmentDto.investment;

        // Checar se o investimento realmente pertence ao investidor
        const investment = await this.prismaService.investment.findFirst({
          where: {
            id: investmentId,
            userId: id,
          },
        });

        if (!investment) {
          throw new NotFoundException(
            'Investimento não encontrado ou não pertence ao usuário.',
          );
        }

        // Atualizar ou remover o investimento baseado no valor fornecido
        if (amountInvested === 0) {
          // Remover o investimento
          await this.prismaService.investment.delete({
            where: { id: investmentId },
          });
        } else if (amountInvested > 0) {
          // Atualizar o valor do investimento
          const newAmount = investment.amountInvested + amountInvested;
          await this.prismaService.investment.update({
            where: { id: investmentId },
            data: { amountInvested: newAmount },
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
