import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
//   import { RecoveryService } from 'src/mail/services/send-email-for-recovert-password.service';
import { Role } from 'src/control-roles/decorators/roles.decorator';
import { RolesGuard } from 'src/control-roles/guards/roleGuards';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaginationParamsDto } from 'src/pagination/pagination.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@ApiTags('User')
@Controller('user')
@UseGuards(RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    //   private readonly recoveryService: RecoveryService,
  ) {}
  @IsPublic()
  @Post()
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Role('ZICREDIT', 'SELLER')
  @Get()
  async findAll(@Query() paginationParams: PaginationParamsDto) {
    return this.userService.findAll(paginationParams);
  }

  @Role('ZICREDIT', 'SELLER', 'INVESTOR', 'COMPANY')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado',
    type: UpdateUserDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um usuário' })
  @ApiResponse({ status: 200, description: 'Usuário removido' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
