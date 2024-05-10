import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { PaginationService } from 'src/pagination/pagination.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { PaginationParamsDto } from 'src/pagination/pagination.dto';
import { Prisma } from '@prisma/client';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { UploadService } from 'src/Upload/upload.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly uploadService: UploadService,
  ) {}
  async create(
    createProjectDto: CreateProjectDto,
    base64: string,
    pdfFile: Express.Multer.File,
  ) {
    const findOneProject = await this.prismaService.project.findFirst({
      where: {
        companyId: createProjectDto.companyId,
        name: createProjectDto.name,
        deleted_at: null,
      },
    });

    if (findOneProject) {
      throw new BadRequestException(
        'Já existe um projeto vinculado a essa empresa com esse nome',
      );
    }

    try {
      let coverUrl = null;
      if (base64) {
        coverUrl = await this.uploadService.uploadBase64Image(base64);
      }

      const project = await this.prismaService.project.create({
        data: {
          name: createProjectDto.name,
          location: createProjectDto.location,
          cover: coverUrl,
          companyId: createProjectDto.companyId,
          totalValue: createProjectDto.totalValue,
          created_at: new Date(),
        },
      });

      let reportUrl = null;
      if (pdfFile) {
        reportUrl = await this.uploadService.uploadReport(project.id, pdfFile);
      }

      return project;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(paginationParams: PaginationParamsDto) {
    try {
      const whereClause: Prisma.ProjectWhereInput = {};

      if (paginationParams.search) {
        whereClause.OR = [
          {
            name: { contains: paginationParams.search, mode: 'insensitive' },
          },
          {
            location: {
              contains: paginationParams.search,
              mode: 'insensitive',
            },
          },
          {
            company: {
              name: { contains: paginationParams.search, mode: 'insensitive' },
              cnpj: { contains: paginationParams.search, mode: 'insensitive' },
            },
          },
        ];
      }

      if (paginationParams.isActive) {
        whereClause.OR = [
          {
            deleted_at: null,
          },
        ];
      }

      const projects = await this.prismaService.project.findMany({
        include: {
          company: true,
          investments: {
            include: {
              InvestmentLog: true,
            },
          },
        },
        where: whereClause,
      });

      // calcular o total investido para cada projeto
      const projectsWithTotalInvested = await Promise.all(
        projects.map(async (project) => {
          const investmentLogs = project.investments.flatMap(
            (investment) => investment.InvestmentLog,
          );
          const totalInvested = investmentLogs.reduce((acc, log) => {
            if (log.type === 'INCREASE') {
              return acc + log.amountChanged;
            } else if (log.type === 'DECREASE') {
              return acc - log.amountChanged;
            }
            return acc;
          }, 0);

          return {
            ...project,
            totalInvested,
          };
        }),
      );

      const metadata = await this.paginationService.paginate(
        projectsWithTotalInvested,
        {
          page: paginationParams.page,
          limit: paginationParams.limit,
        },
      );

      return { status: 200, metadata };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findOne(id: string) {
    try {
      const project = await this.prismaService.project.findUnique({
        where: { id: id },
        include: {
          investments: {
            include: {
              InvestmentLog: true,
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundException('Projeto não encontrado.');
      }

      // total investido baseado nos logs de investimento
      const totalInvested = project.investments.reduce((total, investment) => {
        const investmentTotal = investment.InvestmentLog.reduce((acc, log) => {
          if (log.type === 'INCREASE') {
            return acc + log.amountChanged;
          } else if (log.type === 'DECREASE') {
            return acc - log.amountChanged;
          }
          return acc;
        }, 0);
        return total + investmentTotal;
      }, 0);

      return {
        ...project,
        totalInvested,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    base64?: string,
    pdfFile?: Express.Multer.File,
  ) {
    try {
      const existingProject = await this.prismaService.project.findUnique({
        where: { id: id },
      });

      if (!existingProject) {
        throw new NotFoundException(`Projeto não encontrado.`);
      }

      let coverUrl = existingProject.cover;
      if (base64) {
        coverUrl = await this.uploadService.uploadBase64Image(base64);
        updateProjectDto.cover = coverUrl;
      }

      if (pdfFile) {
        const report = await this.uploadService.uploadReport(
          existingProject.id,
          pdfFile,
        );
      }

      const updatedProject = await this.prismaService.project.update({
        where: { id },
        data: updateProjectDto,
      });

      return updatedProject;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(
          'Falha na atualização do projeto devido a restrições do banco de dados.',
        );
      }
      throw new InternalServerErrorException(
        'Erro na atualização do projeto: ' + error.message,
      );
    }
  }

  async remove(id: string) {
    try {
      await this.prismaService.project.update({
        where: { id: id },
        data: {
          deleted_at: new Date(),
        },
      });

      return 'Projeto excluído com sucesso';
    } catch (error) {
      throw new Error(error);
    }
  }
}
