import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Patch,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { ProjectService } from '../services/project.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { PaginationParamsDto } from 'src/pagination/pagination.dto';
import { Role } from 'src/control-roles/decorators/roles.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Role('ZICREDIT', 'COMPANY')
  @Post()
  @ApiOperation({ summary: 'Cria projeto' })
  @ApiResponse({
    status: 200,
    description: 'Projeto criado',
    type: CreateProjectDto,
  })
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const cover = files.find((file) => file.fieldname === 'cover');
    const pdfFile = files.find((file) => file.fieldname === 'pdfFile');
    const imageFiles = files.filter((file) => file.fieldname === 'imageFiles');
    return await this.projectService.create(
      createProjectDto,
      cover,
      pdfFile,
      imageFiles,
    );
  }

  @Get()
  async findAll(@Query() paginationParams: PaginationParamsDto) {
    return await this.projectService.findAll(paginationParams);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.projectService.findOne(id);
  }

  @Get('active-projects-count/:companyId')
  async getActiveProjectsCountByCompanyId(
    @Param('companyId') companyId: string,
  ) {
    return this.projectService.getActiveProjectsCountByCompanyId(companyId);
  }

  @Get('projects-by-company/:companyId')
  async getProjectsByCompanyId(
    @Param('companyId') companyId: string,
    @Query() paginationParams: PaginationParamsDto,
  ) {
    return this.projectService.findProjectsByCompanyId(
      companyId,
      paginationParams,
    );
  }

  @Role('ZICREDIT', 'COMPANY')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza o projeto' })
  @ApiResponse({
    status: 200,
    description: 'Projeto atualizada',
    type: UpdateProjectDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    pdfFile?: Express.Multer.File,
    base64?: string,
  ) {
    return await this.projectService.update(
      id,
      updateProjectDto,
      base64,
      pdfFile,
    );
  }

  @Role('ZICREDIT', 'COMPANY')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove um projeto' })
  @ApiResponse({ status: 200, description: 'Projeto removido' })
  async remove(@Param('id') id: string) {
    return await this.projectService.remove(id);
  }
}
