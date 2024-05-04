import { Injectable } from '@nestjs/common';
import { PaginationParamsDto } from './pagination.dto';

@Injectable()
export class PaginationService {
  async paginate<T>(data: T[], params: PaginationParamsDto) {
    const page = parseInt(params.page?.toString()) || 1;
    const limit = parseInt(params.limit?.toString()) || 10;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedData = data.slice(startIndex, endIndex);

    return {
      metadata: {
        total: data.length,
        page,
        limit,
        totalPages: Math.ceil(data.length / limit),
      },
      data: paginatedData,
    };
  }
}
