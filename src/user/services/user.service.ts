import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bycrpt from 'bcrypt';
import { PrismaService } from 'src/database/prisma.service';
import { v4 as uuid } from 'uuid';
import { CreateUserDto } from '../dto/create-user.dto';
//import { UpdateUserDto } from '../dto/update-user.dto';
//import { PaginationService } from 'src/pagination/pagination.service';
//import { PaginationParamsDto } from 'src/pagination/pagination.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    //private readonly paginationService: PaginationService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const findOneUser = await this.prismaService.user.findFirst({
      where: {
        cpf: createUserDto.cpf,
      },
    });
    if (findOneUser) {
      throw new BadRequestException(
        'já existe uma conta com este email ou com este username',
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
          createdAt: new Date(),
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
}
