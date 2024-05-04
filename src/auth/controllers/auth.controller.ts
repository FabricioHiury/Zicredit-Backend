import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthRequest } from '../models/AuthRequest';
import { IsPublic } from '../decorators/is-public.decorator';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginRequestBody } from '../models/LoginRequestBody';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login do usuário' })
  @ApiBody({ description: 'Credenciais do usuário', type: LoginRequestBody })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário autenticado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credenciais inválidas',
  })
  async login(@Request() req: AuthRequest) {
    return this.authService.login(req.user);
  }
}
