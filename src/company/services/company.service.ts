import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { PaginationService } from 'src/pagination/pagination.service';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UserService } from 'src/user/services/user.service';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    const findCompany = await this.prismaService.company.findFirst({
      where: {
        cnpj: createCompanyDto.cnpj,
      },
    });
    if (findCompany) {
      throw new BadRequestException('Já existe uma conta com esse cnpj');
    }

    const company = await this.prismaService.company.create({
      data: {
        name: createCompanyDto.name,
        cnpj: createCompanyDto.cnpj,
        address: createCompanyDto.address,
        phone: createCompanyDto.phone,
        email: createCompanyDto.email,
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
  }
}
