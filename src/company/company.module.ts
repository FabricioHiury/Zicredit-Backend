import { Module } from '@nestjs/common';
import { CompanyController } from './controllers/company.controller';
import { CompanyService } from './services/company.service';
import { UserModule } from 'src/user/user.module';
import { PaginationModule } from 'src/pagination/pagination.module';
import { DatabaseModule } from 'src/database/database.module';
import { UploadService } from 'src/Upload/upload.service';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService, UploadService],
  imports: [UserModule, PaginationModule, DatabaseModule],
})
export class CompanyModule {}
