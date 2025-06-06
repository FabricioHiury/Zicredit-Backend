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

  private calculateAppreciation(amount: number): number {
    if (amount <= 250000) {
      return 1.25;
    } else if (amount <= 500000) {
      return 1.5;
    } else if (amount <= 750000) {
      return 1.75;
    } else if (amount <= 1000000) {
      return 2.0;
    } else {
      return 2.5;
    }
  }

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
      const hash = await bcrypt.hash(
        createInvestorDto.password,
        await bcrypt.genSalt(Number(process.env.APP_PASSWORD_HASH)),
      );
      const investor = await this.prismaService.user.create({
        data: {
          name: createInvestorDto.name,
          cpf: createInvestorDto.cpf,
          email: createInvestorDto.email,
          phone: createInvestorDto.phone,
          password: hash,
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
              bankData: investment.bankData,
              sellerId: investment.sellerId || null,
              appreciation: this.calculateAppreciation(
                investment.amountInvested,
              ),
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
      const investments = await this.prismaService.investment.findMany({
        where: {
          userId: userId,
        },
        include: {
          InvestmentLog: true,
          project: true,
          seller: true,
          user: true,
        },
      });

      let totalInvested = 0;
      let totalMonthlyYield = 0;

      // Calculate totalInvested and totalMonthlyYield
      investments.forEach((investment) => {
        const { InvestmentLog, appreciation } = investment;
        let investmentTotal = 0;

        InvestmentLog.forEach((log) => {
          if (log.type === 'INCREASE') {
            investmentTotal += log.amountChanged;
          } else if (log.type === 'DECREASE') {
            investmentTotal -= log.amountChanged;
          }
        });

        totalInvested += investmentTotal;
        const monthlyAppreciation = appreciation / 12; // Calcular a apreciação mensal
        totalMonthlyYield += investmentTotal * monthlyAppreciation;
      });

      // Round totalMonthlyYield to 2 decimal places
      totalMonthlyYield = Number(totalMonthlyYield.toFixed(2));

      // Add percentage of totalInvested to each investment and sort by amountInvested
      const sortedInvestments = investments
        .map((investment) => {
          const { InvestmentLog } = investment;
          let investmentTotal = 0;

          InvestmentLog.forEach((log) => {
            if (log.type === 'INCREASE') {
              investmentTotal += log.amountChanged;
            } else if (log.type === 'DECREASE') {
              investmentTotal -= log.amountChanged;
            }
          });

          return {
            ...investment,
            amountInvested: investmentTotal,
            percentageOfTotal: (investmentTotal / totalInvested) * 100,
          };
        })
        .sort((a, b) => b.amountInvested - a.amountInvested);

      const response = {
        investments: sortedInvestments,
        totalInvested,
        totalMonthlyYield,
      };

      return { status: 200, response };
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

  async findSellers(paginationParams: PaginationParamsDto) {
    try {
      const whereClause: Prisma.InvestmentWhereInput = {};
      if (paginationParams.search) {
        whereClause.OR = [
          {
            seller: {
              name: { contains: paginationParams.search, mode: 'insensitive' },
              cpf: { contains: paginationParams.search, mode: 'insensitive' },
              email: { contains: paginationParams.search, mode: 'insensitive' },
            },
          },
        ];
      }
      const response = await this.prismaService.investment.findMany({
        where: whereClause,
        select: {
          seller: true,
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

  async getTotalInvestedByProjectId(projectId: string) {
    try {
      const increases = await this.prismaService.investmentLog.aggregate({
        _sum: {
          amountChanged: true,
        },
        where: {
          investment: { projectId: projectId },
          type: 'INCREASE',
        },
      });

      const decreases = await this.prismaService.investmentLog.aggregate({
        _sum: {
          amountChanged: true,
        },
        where: {
          investment: { projectId: projectId },
          type: 'DECREASE',
        },
      });

      const totalInvested =
        (increases._sum.amountChanged || 0) -
        (decreases._sum.amountChanged || 0);
      return totalInvested;
    } catch (error) {
      throw new BadRequestException(
        'Erro ao calcular o total investido por projeto: ' + error.message,
      );
    }
  }

  async findInvestorsByCompanyAndUserId(
    companyId: string,
    userId: string | null,
    paginationParams: PaginationParamsDto,
  ) {
    try {
      const whereClause: Prisma.InvestmentWhereInput = {
        project: { companyId },
        ...(userId && { userId }), // Conditionally add userId to the filter if it's provided
      };

      const investments = await this.prismaService.investment.findMany({
        where: whereClause,
        include: {
          user: true,
          project: true,
        },
      });

      const investorsMap = new Map<string, any>();

      investments.forEach((investment) => {
        const investorId = investment.userId;
        const projectId = investment.projectId;

        if (!investorsMap.has(investorId)) {
          investorsMap.set(investorId, {
            ...investment.user,
            totalInvested: 0,
            investments: [],
          });
        }

        const investor = investorsMap.get(investorId);
        investor.totalInvested += investment.amountInvested;
        investor.investments.push({
          projectId: projectId,
          projectName: investment.project.name,
          amountInvested: investment.amountInvested,
        });
      });

      const uniqueInvestors = Array.from(investorsMap.values());

      const metadata = await this.paginationsService.paginate(uniqueInvestors, {
        page: paginationParams.page,
        limit: paginationParams.limit,
      });

      return { status: 200, metadata };
    } catch (error) {
      throw new BadRequestException(
        'Erro ao listar investidores por companhia: ' + error.message,
      );
    }
  }

  async getTotalInvestedByCompanyId(companyId: string) {
    try {
      const increases = await this.prismaService.investmentLog.aggregate({
        _sum: {
          amountChanged: true,
        },
        where: {
          investment: { project: { companyId: companyId } },
          type: 'INCREASE',
        },
      });

      const decreases = await this.prismaService.investmentLog.aggregate({
        _sum: {
          amountChanged: true,
        },
        where: {
          investment: { project: { companyId: companyId } },
          type: 'DECREASE',
        },
      });

      const totalInvested =
        (increases._sum.amountChanged || 0) -
        (decreases._sum.amountChanged || 0);
      return totalInvested;
    } catch (error) {
      throw new BadRequestException(
        'Erro ao calcular o total investido por companhia: ' + error.message,
      );
    }
  }

  async getTotalInvestedOverall() {
    try {
      const increases = await this.prismaService.investmentLog.aggregate({
        _sum: {
          amountChanged: true,
        },
        where: {
          type: 'INCREASE',
        },
      });

      const decreases = await this.prismaService.investmentLog.aggregate({
        _sum: {
          amountChanged: true,
        },
        where: {
          type: 'DECREASE',
        },
      });

      const totalInvested =
        (increases._sum.amountChanged || 0) -
        (decreases._sum.amountChanged || 0);

      // Calculando o rendimento total com base em 3% do total investido
      const totalYield = totalInvested * 0.03;

      return { totalInvested, totalYield };
    } catch (error) {
      throw new BadRequestException(
        'Erro ao calcular o total investido geral: ' + error.message,
      );
    }
  }

  async getInvestorsCountByCompanyId(companyId: string) {
    try {
      const investorsCount = await this.prismaService.investment.count({
        where: {
          project: {
            companyId: companyId,
          },
        },
      });

      return { investorsCount };
    } catch (error) {
      throw new BadRequestException(
        'Erro ao calcular o total de investidores por companhia: ' +
          error.message,
      );
    }
  }

  async update(id: string, updateInvestorDto: UpdateInvestorDto) {
    try {
      // Atualizando os dados do usuário, incluindo a senha se for fornecida
      const userDataUpdate: any = {
        name: updateInvestorDto.name,
        cpf: updateInvestorDto.cpf,
        email: updateInvestorDto.email,
        phone: updateInvestorDto.phone,
        bankData: updateInvestorDto.investment?.bankData,
      };

      if (updateInvestorDto.password) {
        userDataUpdate.password = await bcrypt.hash(
          updateInvestorDto.password,
          await bcrypt.genSalt(Number(process.env.APP_PASSWORD_HASH)),
        );
      }

      const updatedInvestor = await this.prismaService.user.update({
        where: { id },
        data: userDataUpdate,
      });

      // Atualizando o investimento, se fornecido
      if (updateInvestorDto.investment) {
        const { investmentId, amountInvested, sellerId } =
          updateInvestorDto.investment;
        const investment = await this.prismaService.investment.findUnique({
          where: { id: investmentId },
          include: { project: true },
        });

        if (!investment || investment.userId !== id) {
          throw new NotFoundException(
            'Investimento não encontrado ou não pertence ao usuário.',
          );
        }

        if (amountInvested > investment.project.totalValue) {
          throw new BadRequestException(
            'Investimento excede o valor total do projeto.',
          );
        }

        const investmentDataUpdate: any = {
          amountInvested,
          sellerId,
          appreciation: this.calculateAppreciation(amountInvested),
        };

        if (amountInvested !== 0) {
          await this.prismaService.investment.update({
            where: { id: investmentId },
            data: investmentDataUpdate,
          });

          await this.prismaService.investmentLog.create({
            data: {
              investmentId: investmentId,
              amountChanged: amountInvested - investment.amountInvested,
              newTotalAmount: amountInvested,
              type:
                amountInvested > investment.amountInvested
                  ? 'INCREASE'
                  : 'DECREASE',
            },
          });
        } else {
          await this.prismaService.investmentLog.create({
            data: {
              investmentId: investmentId,
              amountChanged: -investment.amountInvested,
              newTotalAmount: 0,
              type: 'DECREASE',
            },
          });

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
