import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import {
  normalizarCertificaciones,
  normalizarFormacionAcademica,
} from './trayectoria-profesional.helper';

describe('trayectoria-profesional.helper', () => {
  it('normaliza formación académica desde JSON string', () => {
    const formacion = normalizarFormacionAcademica(
      JSON.stringify([
        {
          idFormacionAcademica: '7',
          titulo: 'Maestría en Nutrición Deportiva',
          institucion: 'Universidad Favaloro',
          anioInicio: '2020',
          anioFin: null,
          nivel: 'MAESTRIA',
        },
      ]),
    );

    expect(formacion).toHaveLength(1);
    expect(formacion[0].idFormacionAcademica).toBe(7);
    expect(formacion[0].añoComienzo).toBe(2020);
    expect(formacion[0].añoFin).toBeNull();
    expect(formacion[0].nivel).toBe('MAESTRIA');
  });

  it('normaliza certificaciones desde array plano', () => {
    const certificaciones = normalizarCertificaciones([
      {
        idCertificacion: null,
        nombre: 'ISAK Nivel 2',
        entidad: 'ISAK',
        anio: '2023',
        cargaHoraria: '40',
        nivel: 'CURSO',
      },
    ]);

    expect(certificaciones).toHaveLength(1);
    expect(certificaciones[0].nombre).toBe('ISAK Nivel 2');
    expect(certificaciones[0].anio).toBe(2023);
    expect(certificaciones[0].cargaHoraria).toBe(40);
  });

  it('rechaza niveles inválidos', () => {
    expect(() =>
      normalizarFormacionAcademica([
        {
          titulo: 'Curso X',
          institucion: 'Entidad Y',
          anioInicio: 2024,
          anioFin: 2025,
          nivel: 'RANDOM',
        },
      ]),
    ).toThrow(BadRequestError);
  });
});
