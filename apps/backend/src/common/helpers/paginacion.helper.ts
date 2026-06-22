import { PaginationParams, PaginationMeta, PaginatedData } from '@nutrifit/shared';
import { SelectQueryBuilder, Repository, FindManyOptions, ObjectLiteral } from 'typeorm';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

export function crearParametrosPaginacion(
  query: Record<string, string | undefined>,
  opciones?: { maxLimit?: number },
): PaginationParams {
  const maxLimit = opciones?.maxLimit ?? 100;
  const rawPage = query.page ?? '1';
  const rawLimit = query.limit ?? '10';

  const page = parseInt(rawPage, 10);
  const limit = parseInt(rawLimit, 10);

  if (isNaN(page) || page < 1) {
    throw new BadRequestError('page debe ser un número >= 1');
  }
  if (isNaN(limit) || limit < 1 || limit > maxLimit) {
    throw new BadRequestError(`limit debe ser un número entre 1 y ${maxLimit}`);
  }

  return { page, limit };
}

export function calcularMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export async function paginarQuery<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  params: PaginationParams,
): Promise<PaginatedData<T>> {
  const [total, data] = await Promise.all([
    qb.getCount(),
    qb.skip((params.page - 1) * params.limit).take(params.limit).getMany(),
  ]);

  return {
    data,
    pagination: calcularMeta(total, params.page, params.limit),
  };
}

export async function paginarFindAndCount<T extends ObjectLiteral>(
  repo: Repository<T>,
  params: PaginationParams,
  options?: FindManyOptions<T>,
): Promise<PaginatedData<T>> {
  const [data, total] = await repo.findAndCount({
    ...options,
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  });
  return {
    data,
    pagination: calcularMeta(total, params.page, params.limit),
  };
}
