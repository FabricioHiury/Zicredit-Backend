import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/control-roles/guards/roleGuards';
import { CompanyService } from '../services/company.service';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { PaginationParamsDto } from 'src/pagination/pagination.dto';
import { Role } from 'src/control-roles/decorators/roles.decorator';
import { UpdateCompanyDto } from '../dto/update-company.dto';

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

  @Role('ZICREDIT', 'SELLER', 'INVESTOR')
  @Get()
  async findAll(@Query() paginationParamsDto: PaginationParamsDto) {
    return this.companyService.findAll(paginationParamsDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza a companhia' })
  @ApiResponse({
    status: 200,
    description: 'Companhia atualizada',
    type: UpdateCompanyDto,
  })
  @ApiResponse({ status: 404, description: 'Companhia não encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateCOmpanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, updateCOmpanyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma companhia' })
  @ApiResponse({ status: 200, description: 'Comapanhia removida' })
  @ApiResponse({ status: 404, description: 'Companhia não encontrada' })
  async remove(@Param('id') id: string) {
    return this.companyService.remove(id);
  }
}
