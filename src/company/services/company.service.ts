import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { PaginationService } from 'src/pagination/pagination.service';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UserService } from 'src/user/services/user.service';
import * as bcrypt from 'bcrypt';
import { PaginationParamsDto } from 'src/pagination/pagination.dto';
import { Prisma } from '@prisma/client';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { UploadService } from 'src/Upload/upload.service';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly paginationService: PaginationService,
    private readonly uploadService: UploadService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    const findCompany = await this.prismaService.company.findFirst({
      where: {
        OR: [
          { cnpj: createCompanyDto.cnpj },
          { email: createCompanyDto.email },
          { users: { some: { email: createCompanyDto.userEmail } } },
        ],
        deleted_at: null,
      },
    });
    if (findCompany) {
      throw new BadRequestException(
        'Já existe uma conta com esse cnpj ou email',
      );
    }

    try {
      let logoUrl = null; // Local para armazenar a URL da logo após o upload
      if (createCompanyDto.logo) {
        logoUrl = await this.uploadService.uploadBase64Image(
          createCompanyDto.logo,
        );
      }

      const company = await this.prismaService.company.create({
        data: {
          name: createCompanyDto.name,
          cnpj: createCompanyDto.cnpj,
          address: createCompanyDto.address,
          phone: createCompanyDto.phone,
          email: createCompanyDto.email,
          logo: logoUrl,
          bankData: createCompanyDto.bankData,
        },
      });

      const user = await this.userService.create({
        name: createCompanyDto.userName,
        email: createCompanyDto.userEmail,
        password: createCompanyDto.userPassword,
        cpf: createCompanyDto.userCpf,
        phone: createCompanyDto.userPhone,
        role: 'COMPANY',
        companyId: company.id,
      });

      return { company, user };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(paginationParams: PaginationParamsDto) {
    try {
      const whereClause: Prisma.CompanyWhereInput = {};

      if (paginationParams.search) {
        whereClause.OR = [
          {
            name: { contains: paginationParams.search, mode: 'insensitive' },
          },
          {
            cnpj: { contains: paginationParams.search, mode: 'insensitive' },
          },
          {
            users: {
              some: {
                name: {
                  contains: paginationParams.search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ];
      }

      const response = await this.prismaService.company.findMany({
        where: whereClause,
        select: {
          id: true,
          cnpj: true,
          name: true,
          email: true,
          address: true,
          phone: true,
          created_at: true,
          deleted_at: true,
          projects: true,
          users: true,
        },
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
      throw new BadRequestException(error);
    }
  }

  async findOne(id: string) {
    try {
      const response = await this.prismaService.company.findFirst({
        where: { id: id },
        select: {
          id: true,
          cnpj: true,
          name: true,
          email: true,
          address: true,
          phone: true,
          created_at: true,
          deleted_at: true,
          projects: true,
          users: true,
        },
      });

      return response;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    try {
      let logoUrl = updateCompanyDto.logo; // Assume que logo já está na forma de uma URL ou Base64
      if (
        updateCompanyDto.logo &&
        updateCompanyDto.logo.startsWith('data:image')
      ) {
        const base64Data = updateCompanyDto.logo.split(',')[1];
        logoUrl = await this.uploadService.uploadBase64Image(base64Data);
      }

      const hash = await bcrypt.hash(
        updateCompanyDto.userPassword,
        await bcrypt.genSalt(Number(process.env.APP_PASSWORD_HASH)),
      );

      const company = await this.prismaService.company.update({
        where: { id: id },
        data: {
          name: updateCompanyDto.name,
          cnpj: updateCompanyDto.cnpj,
          address: updateCompanyDto.address,
          email: updateCompanyDto.email,
          phone: updateCompanyDto.phone,
          bankData: updateCompanyDto.bankData,
          logo: logoUrl, 
        },
      });

      const user = await this.prismaService.user.findFirst({
        where: { companyId: id },
      });

      if (!user) {
        throw new Error('Nenhum usuário encontrado para esta empresa.');
      }

      const updatedUser = await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          name: updateCompanyDto.userName,
          cpf: updateCompanyDto.userCpf,
          email: updateCompanyDto.userEmail,
          phone: updateCompanyDto.userPhone,
          password: hash,
        },
      });

      return { company, updatedUser };
    } catch (error) {
      throw new Error(
        error.message || 'Erro ao atualizar a empresa e o usuário.',
      );
    }
  }

  async remove(id: string) {
    try {
      const transaction = await this.prismaService.$transaction(
        async (trans) => {
          const company = await trans.company.update({
            where: { id: id },
            data: { deleted_at: new Date() },
          });

          const users = await trans.user.updateMany({
            where: { companyId: id },
            data: { deleted_at: new Date() },
          });

          const project = await trans.project.updateMany({
            where: { companyId: id },
            data: { deleted_at: new Date() },
          });

          return 'Companhia excluída com sucesso';
        },
      );

      return transaction;
    } catch (error) {
      console.error('Error removing company and its users:', error);
      throw new Error('Failed to remove company and its users.');
    }
  }
}
