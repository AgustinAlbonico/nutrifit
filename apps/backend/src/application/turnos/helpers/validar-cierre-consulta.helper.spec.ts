import { validarCierreConsulta } from './validar-cierre-consulta.helper';

describe('validarCierreConsulta', () => {
  it('devuelve faltantes cuando no hay medicion base ni comentario clinico', () => {
    expect(
      validarCierreConsulta({
        tieneMedicionBase: false,
        tieneComentarioClinico: false,
      }),
    ).toEqual({
      puedeCerrar: false,
      faltantes: ['MEDICION_BASE', 'COMENTARIO_CLINICO'],
    });
  });

  it('devuelve faltante de medicion base cuando solo existe comentario clinico', () => {
    expect(
      validarCierreConsulta({
        tieneMedicionBase: false,
        tieneComentarioClinico: true,
      }),
    ).toEqual({
      puedeCerrar: false,
      faltantes: ['MEDICION_BASE'],
    });
  });

  it('devuelve faltante de comentario clinico cuando solo existe medicion base', () => {
    expect(
      validarCierreConsulta({
        tieneMedicionBase: true,
        tieneComentarioClinico: false,
      }),
    ).toEqual({
      puedeCerrar: false,
      faltantes: ['COMENTARIO_CLINICO'],
    });
  });

  it('permite cerrar cuando existe medicion base y comentario clinico', () => {
    expect(
      validarCierreConsulta({
        tieneMedicionBase: true,
        tieneComentarioClinico: true,
      }),
    ).toEqual({ puedeCerrar: true, faltantes: [] });
  });
});
