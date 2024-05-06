import { Module } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { PaginationService } from 'src/pagination/pagination.service';
import { InvestmentController } from './controllers/investment.controller';
import { InvestmentService } from './services/investment.service';

@Module({
  imports: [],
  controllers: [InvestmentController],
  providers: [InvestmentService, PrismaService, PaginationService],
})
export class InvestmentModule {}
