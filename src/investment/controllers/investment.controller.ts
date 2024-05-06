import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { InvestmentService } from '../services/investment.service';
import { CreateInvestorDto } from '../dto/create-investor.dto';
import { PaginationParamsDto } from 'src/pagination/pagination.dto';
import { UpdateInvestorDto } from '../dto/update-investor.dto';

@ApiTags('investment')
@Controller('investment')
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new investor and their investments' })
  @ApiResponse({ status: 201, description: 'Investor created successfully.' })
  @ApiBody({ type: CreateInvestorDto })
  async create(@Body() createInvestorDto: CreateInvestorDto) {
    return await this.investmentService.create(createInvestorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all investments' })
  @ApiResponse({ status: 200, description: 'List of investments' })
  async findAll(@Query() paginationParams: PaginationParamsDto) {
    return await this.investmentService.findAll(paginationParams);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific investment by ID' })
  @ApiResponse({ status: 200, description: 'Investment details' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  async findOne(@Param('id') id: string) {
    return await this.investmentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an investor and their investment' })
  @ApiResponse({ status: 200, description: 'Investor updated successfully.' })
  @ApiBody({ type: UpdateInvestorDto })
  @ApiParam({ name: 'id', description: 'Investor ID' })
  async update(
    @Param('id') id: string,
    @Body() updateInvestorDto: UpdateInvestorDto,
  ) {
    return await this.investmentService.update(id, updateInvestorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an investment' })
  @ApiResponse({ status: 200, description: 'Investment deleted successfully.' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  async remove(@Param('id') id: string) {
    return await this.investmentService.remove(id);
  }
}