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
    cover: Express.Multer.File,
    pdfFile: Express.Multer.File,
    imageFiles: Express.Multer.File[],
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
      if (cover) {
        coverUrl = await this.uploadService.uploadImage(cover);
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

      if (createProjectDto.sellerId && createProjectDto.sellerId.length > 0) {
        await Promise.all(
          createProjectDto.sellerId.map((sellerId) => {
            return this.prismaService.projectSeller.create({
              data: {
                projectId: project.id,
                sellerId: sellerId,
              },
            });
          }),
        );
      }

      if (imageFiles && imageFiles.length > 0) {
        await Promise.all(
          imageFiles.map(async (image) => {
            const imageUrl = await this.uploadService.uploadImage(image);
            await this.prismaService.projectImages.create({
              data: {
                images: imageUrl,
                projectId: project.id,
              },
            });
          }),
        );
      }

      let reportUrl = null;
      if (pdfFile) {
        reportUrl = await this.uploadService.uploadReport(project.id, pdfFile);
      }

      if (reportUrl) {
        await this.prismaService.report.create({
          data: {
            file: reportUrl,
            projectId: project.id,
          },
        });
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
          ProjectFiles: {
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
          },
          ProjectImages: {
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!project) {
        throw new NotFoundException('Projeto não encontrado.');
      }

      // Obter a data da imagem mais recente
      const latestImageDate = project.ProjectImages.length
        ? project.ProjectImages[0].created_at
        : null;

      // Buscar todas as imagens com a mesma data de criação
      let recentImages = [];
      if (latestImageDate) {
        recentImages = await this.prismaService.projectImages.findMany({
          where: {
            projectId: id,
            created_at: latestImageDate,
          },
        });
      }

      // Total investido baseado nos logs de investimento
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

      // Calcula quanto falta ser vendido
      const amountRemaining = project.totalValue - totalInvested;

      // Calcula a distribuição mensal para os aumentos
      const monthlyDistribution = project.investments.reduce(
        (total, investment) => {
          const monthlyTotal = investment.InvestmentLog.reduce((acc, log) => {
            if (log.type === 'INCREASE') {
              return acc + log.amountChanged * 0.03; // 3% do investimento total naquele empreendimento
            }
            return acc;
          }, 0);
          return total + monthlyTotal;
        },
        0,
      );

      const lastFile = project.ProjectFiles.length
        ? project.ProjectFiles[0]
        : null;

      // Desestruturar o project para excluir ProjectFiles e ProjectImages
      const { ProjectFiles, ProjectImages, ...projectWithoutFilesAndImages } =
        project;

      return {
        ...projectWithoutFilesAndImages,
        totalInvested,
        amountRemaining,
        monthlyDistribution,
        lastFile,
        recentImages,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getActiveProjectsCountByCompanyId(companyId: string) {
    try {
      const projectsCount = await this.prismaService.project.count({
        where: {
          companyId: companyId,
          deleted_at: null,
        },
      });

      return { projectsCount };
    } catch (error) {
      throw new BadRequestException(
        'Erro ao calcular o total de projetos ativos por companhia: ' +
          error.message,
      );
    }
  }

  async findProjectsByCompanyId(
    companyId: string,
    paginationParams: PaginationParamsDto,
  ) {
    try {
      const projects = await this.prismaService.project.findMany({
        where: { companyId: companyId },
      });

      const metadata = await this.paginationService.paginate(projects, {
        page: paginationParams.page,
        limit: paginationParams.limit,
      });

      return { status: 200, metadata };
    } catch (error) {
      throw new BadRequestException(
        'Erro ao listar projetos por companhia: ' + error.message,
      );
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

      await this.prismaService.projectSeller.deleteMany({
        where: { projectId: id },
      });

      // Vincular novos vendedores, se algum foi fornecido
      if (updateProjectDto.sellerId && updateProjectDto.sellerId.length > 0) {
        await Promise.all(
          updateProjectDto.sellerId.map((sellerId) => {
            return this.prismaService.projectSeller.create({
              data: {
                projectId: id,
                sellerId: sellerId,
              },
            });
          }),
        );
      }

      if (updateProjectDto.images && updateProjectDto.images.length > 0) {
        await Promise.all(
          updateProjectDto.images.map(async (image) => {
            const imageUrl = await this.uploadService.uploadBase64Image(image);
            await this.prismaService.projectImages.create({
              data: {
                images: imageUrl,
                projectId: id,
              },
            });
          }),
        );
      }

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
