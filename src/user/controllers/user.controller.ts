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
  ExecutionContext,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
//   import { UpdateUserDto } from '../dto/update-user.dto';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
//   import { RecoveryService } from 'src/mail/services/send-email-for-recovert-password.service';
import { Role } from 'src/control-roles/decorators/roles.decorator';
import { RolesGuard } from 'src/control-roles/guards/roleGuards';
//   import { PaginationParamsDto } from 'src/pagination/pagination.dto';
//   import { ExcludeUserDto } from '../dto/excludeUser.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

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
}
