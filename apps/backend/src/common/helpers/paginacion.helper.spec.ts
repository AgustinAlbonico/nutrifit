import { crearParametrosPaginacion, calcularMeta } from './paginacion.helper';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

describe('crearParametrosPaginacion', () => {
  it('usa defaults cuando no hay query params', () => {
    const result = crearParametrosPaginacion({});
    expect(result).toEqual({ page: 1, limit: 10 });
  });

  it('parsea page y limit del query', () => {
    const result = crearParametrosPaginacion({ page: '3', limit: '25' });
    expect(result).toEqual({ page: 3, limit: 25 });
  });

  it('lanza error si page es menor a 1', () => {
    expect(() => crearParametrosPaginacion({ page: '0' })).toThrow(BadRequestError);
  });

  it('lanza error si limit excede maxLimit', () => {
    expect(() => crearParametrosPaginacion({ limit: '101' })).toThrow(BadRequestError);
  });

  it('lanza error si page no es número', () => {
    expect(() => crearParametrosPaginacion({ page: 'abc' })).toThrow(BadRequestError);
  });

  it('acepta maxLimit custom', () => {
    expect(() => crearParametrosPaginacion({ limit: '50' }, { maxLimit: 25 })).toThrow(BadRequestError);
    const result = crearParametrosPaginacion({ limit: '50' }, { maxLimit: 100 });
    expect(result.limit).toBe(50);
  });

  it('lanza error si limit es 0', () => {
    expect(() => crearParametrosPaginacion({ limit: '0' })).toThrow(BadRequestError);
  });

  it('lanza error si limit no es número', () => {
    expect(() => crearParametrosPaginacion({ limit: 'abc' })).toThrow(BadRequestError);
  });
});

describe('calcularMeta', () => {
  it('calcula meta básica correctamente', () => {
    const meta = calcularMeta(100, 1, 10);
    expect(meta).toEqual({
      page: 1, limit: 10, total: 100, totalPages: 10,
      hasNextPage: true, hasPreviousPage: false,
    });
  });

  it('no tiene nextPage en la última página', () => {
    const meta = calcularMeta(100, 10, 10);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(true);
  });

  it('maneja total=0 correctamente', () => {
    const meta = calcularMeta(0, 1, 10);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });

  it('maneja página intermedia correctamente', () => {
    const meta = calcularMeta(55, 3, 10);
    expect(meta.totalPages).toBe(6);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPreviousPage).toBe(true);
  });

  it('maneja total menor que limit', () => {
    const meta = calcularMeta(3, 1, 10);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
    expect(meta.total).toBe(3);
  });
});
