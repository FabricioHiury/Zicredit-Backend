import { Module } from '@nestjs/common';
import { ProjectController } from './controllers/project.controller';
import { ProjectService } from './services/project.service';
import { PaginationModule } from 'src/pagination/pagination.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
  imports: [PaginationModule, DatabaseModule],
})
export class ProjectModule {}