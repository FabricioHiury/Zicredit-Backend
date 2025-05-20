import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Patch,
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

  @Get('investor/:userId')
  @ApiOperation({ summary: 'Get a specific investor by ID' })
  @ApiResponse({ status: 200 })
  async findByInvestor(
    @Param('userId') userId: string,
    @Query() paginationParams: PaginationParamsDto,
  ) {
    return await this.investmentService.findByUser(userId, paginationParams);
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get a specific seller by ID' })
  @ApiResponse({ status: 200 })
  async findBySeller(
    @Param('sellerId') sellerId: string,
    @Query() paginationParams: PaginationParamsDto,
  ) {
    return await this.investmentService.findBySeller(
      sellerId,
      paginationParams,
    );
  }

  @Get('logs/investor/:investorId')
  @ApiOperation({ summary: 'Retrieve investment logs by investor ID' })
  @ApiResponse({ status: 200, description: 'List of investment logs' })
  @ApiParam({ name: 'investorId', description: 'Investor ID' })
  async findByInvestorLog(
    @Param('investorId') investorId: string,
    @Query() paginationParams: PaginationParamsDto,
  ) {
    return await this.investmentService.findByInvestorLog(
      investorId,
      paginationParams,
    );
  }

  @Get('logs/investor/:investorId/project/:projectId')
  @ApiOperation({
    summary: 'Retrieve investment logs by investor ID and project ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of investment logs for specific project',
  })
  @ApiParam({ name: 'investorId', description: 'Investor ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async findAllByInvestorAndProjects(
    @Param('investorId') investorId: string,
    @Param('projectId') projectId: string,
    @Query() paginationParams: PaginationParamsDto,
  ) {
    return await this.investmentService.findAllByInvestorAndProjects(
      investorId,
      projectId,
      paginationParams,
    );
  }

  @Get('sellers')
  @ApiOperation({ summary: 'Retrieve all sellers' })
  @ApiResponse({ status: 200, description: 'List of sellers' })
  async findSeller(@Query() paginationParams: PaginationParamsDto) {
    return await this.investmentService.findSellers(paginationParams);
  }

  @Post('total-by-project/:projectId')
  @ApiOperation({ summary: 'Get total invested by project ID' })
  @ApiResponse({ status: 200, description: 'Total invested in the project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getTotalInvestedByProjectId(@Param('projectId') projectId: string) {
    const total =
      await this.investmentService.getTotalInvestedByProjectId(projectId);
    return { projectId, totalInvested: total };
  }

  @Post('total-by-company/:companyId')
  @ApiOperation({ summary: 'Get total invested by company ID' })
  @ApiResponse({ status: 200, description: 'Total invested in the company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  async getTotalInvestedByCompanyId(@Param('companyId') companyId: string) {
    const total =
      await this.investmentService.getTotalInvestedByCompanyId(companyId);
    return { companyId, totalInvested: total };
  }

  @Post('total-invested-overall')
  @ApiOperation({ summary: 'Get total invested overall' })
  @ApiResponse({ status: 200, description: 'Total invested overall' })
  async getTotalInvestedOverall() {
    const { totalInvested, totalYield } =
      await this.investmentService.getTotalInvestedOverall();
    return { totalInvested, totalYield };
  }

  @Get('investors-count/:companyId')
  async getInvestorsCountByCompanyId(@Param('companyId') companyId: string) {
    return this.investmentService.getInvestorsCountByCompanyId(companyId);
  }

  @Get('investors-by-company/:companyId')
  async getInvestorsByCompanyId(
    @Param('companyId') companyId: string,
    @Query() paginationParams: PaginationParamsDto,
  ) {
    return this.investmentService.findInvestorsByCompanyAndUserId(
      companyId,
      paginationParams.userId,
      paginationParams,
    );
  }

  @Patch(':id')
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
