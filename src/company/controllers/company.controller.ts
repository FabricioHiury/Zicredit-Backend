import {
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/control-roles/guards/roleGuards';
import { CompanyService } from '../services/company.service';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { CreateCompanyDto } from '../dto/create-company.dto';

@ApiTags('Company')
@Controller('company')
@UseGuards(RolesGuard)
export class CompanyController {
  constructor(private companyService: CompanyService) {}
  @IsPublic()
  @Post()
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Cria uma nova companhia' })
  @ApiResponse({
    status: 200,
    description: 'Companhia Criada',
    type: CreateCompanyDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }
}
