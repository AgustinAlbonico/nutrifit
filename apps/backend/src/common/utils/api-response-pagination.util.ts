import { IPaginatedData } from '../interfaces/api-response.interface';

export class ResponseUtil {
  static createPaginatedData<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): IPaginatedData<T> {
    const totalPages = Math.ceil(total / limit);

    const paginatedData: IPaginatedData<T> = {
      items: data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };

    return paginatedData;
  }

  static paginated<T>(data: T[], total: number, page: number, limit: number) {
    const paginatedData = this.createPaginatedData(data, total, page, limit);

    return paginatedData;
  }
}
