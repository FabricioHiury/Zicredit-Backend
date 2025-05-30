import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bycrpt from 'bcrypt';
import { PrismaService } from 'src/database/prisma.service';
import { v4 as uuid } from 'uuid';
import { CreateUserDto } from '../dto/create-user.dto';
import { PaginationService } from 'src/pagination/pagination.service';
import { PaginationParamsDto } from 'src/pagination/pagination.dto';
import { Prisma, Roles } from '@prisma/client';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserData } from '../entities/user.entity';
import { NotFoundError } from 'rxjs';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const findOneUser = await this.prismaService.user.findFirst({
      where: {
        OR: [{ cpf: createUserDto.cpf }, { email: createUserDto.email }],
        deleted_at: null,
      },
    });
    if (findOneUser) {
      throw new BadRequestException(
        'Já existe uma conta com este email ou com este CPF.',
      );
    }

    try {
      const hash = await bycrpt.hash(
        createUserDto.password,
        await bycrpt.genSalt(Number(process.env.APP_PASSWORD_HASH)),
      );

      const response = await this.prismaService.user.create({
        data: {
          id: uuid(),
          name: createUserDto.name,
          cpf: createUserDto.cpf,
          email: createUserDto.email,
          password: hash,
          phone: createUserDto.phone,
          role: createUserDto.role,
          created_at: new Date(),
          companyId: createUserDto.companyId,
        },
      });
      return {
        ...response,
        password: undefined,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByIdentifier(identifier: string) {
    try {
      const user = await this.prismaService.user.findFirst({
        include: {
          company: true,
        },
        where: {
          OR: [{ cpf: identifier }, { company: { cnpj: identifier } }],
        },
      });
      return user;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findAll(paginationParams: PaginationParamsDto) {
    try {
      let select = {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        role: true,
        created_at: true,
        deleted_at: true,
      };
      let response = [];
      const whereClause: Prisma.UserWhereInput = {};

      if (paginationParams.search) {
        whereClause.OR = [
          {
            email: { startsWith: paginationParams.search, mode: 'insensitive' },
          },
          {
            cpf: {
              startsWith: paginationParams.search,
              mode: 'insensitive',
            },
          },
          {
            name: { startsWith: paginationParams.search, mode: 'insensitive' },
          },
        ];
      }

      if (paginationParams.typeUser) {
        const role: Roles = paginationParams.typeUser.toUpperCase() as Roles;
        whereClause.role = role;
      }

      response = await this.prismaService.user.findMany({
        where: whereClause,
        select,
      });

      const metadata = await this.paginationService.paginate(response, {
        page: paginationParams.page,
        limit: paginationParams.limit,
      });

      return {
        status: 200,
        metadata,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  async findOne(id: string) {
    try {
      let select = {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        cpf: true,
        created_at: true,
        deleted_at: true,
      };
      const response = this.prismaService.user.findFirst({
        where: { id: id },
        select,
      });
      return response;
    } catch (error) {
      throw new Error(error);
    }
  }

  async findSellerId(id: string) {
    try {
      const response = await this.prismaService.user.findFirst({
        where: { id: id },
        include: {
          sales: {
            include: {
              InvestmentLog: true,
              project: true,
            },
          },
          projects: {
            include: {
              project: true,
            },
          },
        },
      });

      let totalInvestment = 0;
      const projectInvestmentMap = new Map();

      response.sales.forEach((sale) => {
        sale.InvestmentLog.forEach((log) => {
          if (log.type === 'INCREASE') {
            totalInvestment += log.amountChanged;

            if (projectInvestmentMap.has(sale.project.id)) {
              projectInvestmentMap.set(
                sale.project.id,
                projectInvestmentMap.get(sale.project.id) + log.amountChanged,
              );
            } else {
              projectInvestmentMap.set(sale.project.id, log.amountChanged);
            }
          }
        });
      });

      const projectInvestments = [];
      for (const [projectId, amount] of projectInvestmentMap.entries()) {
        const project = response.projects.find(
          (p) => p.project.id === projectId,
        );
        if (project) {
          projectInvestments.push({
            projectName: project.project.name,
            amount: amount,
          });
        }
      }

      const totalCommission = totalInvestment * 0.02;

      return {
        name: response.name,
        totalInvestment,
        totalCommission,
        projectInvestments,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.prismaService.user.findFirst({ where: { email } });
    } catch (error) {
      throw new NotFoundError('não encontrado');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      let dataToUpdate: UpdateUserData = {
        name: updateUserDto.name,
        email: updateUserDto.email,
        cpf: updateUserDto.cpf,
        phone: updateUserDto.phone,
        role: updateUserDto.role,
      };

      if (updateUserDto.password) {
        const salt = await bcrypt.genSalt(
          Number(process.env.APP_PASSWORD_HASH),
        );
        const hash = await bcrypt.hash(updateUserDto.password, salt);
        dataToUpdate.password = hash;
      }

      const response = await this.prismaService.user.update({
        where: { id: id },
        data: dataToUpdate,
      });

      return {
        status: 200,
        data: response,
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(error.message || 'Failed to update user');
    }
  }
  async remove(id: string) {
    try {
      const response = await this.prismaService.user.update({
        where: { id: id },
        data: { deleted_at: new Date() },
      });

      return {
        status: 200,
        data: response,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
}
