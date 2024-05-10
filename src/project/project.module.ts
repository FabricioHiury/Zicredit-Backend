import { Module } from '@nestjs/common';
import { ProjectController } from './controllers/project.controller';
import { ProjectService } from './services/project.service';
import { PaginationModule } from 'src/pagination/pagination.module';
import { DatabaseModule } from 'src/database/database.module';
import { UploadService } from 'src/Upload/upload.service';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, UploadService],
  imports: [PaginationModule, DatabaseModule],
})
export class ProjectModule {}
