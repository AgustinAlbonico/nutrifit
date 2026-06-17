import { CertificacionEntity } from 'src/domain/entities/Certificacion/certificacion.entity';
import { NivelFormacion } from 'src/domain/entities/Certificacion/nivel-formacion';
import { FormacionAcademicaEntity } from 'src/domain/entities/FormacionAcademica/formacion-academica.entity';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

type RegistroPlano = Record<string, unknown>;

function parsearColeccion(input: unknown, campo: string): RegistroPlano[] {
  if (input === undefined || input === null || input === '') {
    return [];
  }

  let valor: unknown;

  try {
    valor = typeof input === 'string' ? JSON.parse(input) : input;
  } catch {
    throw new BadRequestError(`${campo} no tiene un JSON válido.`);
  }

  if (!Array.isArray(valor)) {
    throw new BadRequestError(`${campo} debe ser un arreglo.`);
  }

  return valor as RegistroPlano[];
}

function leerTextoObligatorio(
  valor: unknown,
  campo: string,
  indice: number,
): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new BadRequestError(`${campo}[${indice}] es obligatorio.`);
  }

  return valor.trim();
}

function leerNumeroObligatorio(
  valor: unknown,
  campo: string,
  indice: number,
): number {
  const numero = Number(valor);
  if (!Number.isInteger(numero)) {
    throw new BadRequestError(`${campo}[${indice}] debe ser un número entero.`);
  }

  return numero;
}

function leerNumeroOpcional(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  const numero = Number(valor);
  if (!Number.isInteger(numero)) {
    throw new BadRequestError('El valor numérico informado no es válido.');
  }

  return numero;
}

function leerNivelFormacion(
  valor: unknown,
  campo: string,
  indice: number,
  admiteNull: boolean = false,
): NivelFormacion | null {
  if ((valor === undefined || valor === null || valor === '') && admiteNull) {
    return null;
  }

  if (typeof valor !== 'string' || !(valor in NivelFormacion)) {
    throw new BadRequestError(`${campo}[${indice}] no tiene un nivel válido.`);
  }

  return valor as NivelFormacion;
}

export function normalizarFormacionAcademica(
  input: unknown,
): FormacionAcademicaEntity[] {
  return parsearColeccion(input, 'formacionAcademica').map(
    (item, indice) =>
      new FormacionAcademicaEntity(
        leerNumeroOpcional(item.idFormacionAcademica),
        leerTextoObligatorio(item.titulo, 'formacionAcademica.titulo', indice),
        leerTextoObligatorio(
          item.institucion,
          'formacionAcademica.institucion',
          indice,
        ),
        leerNumeroObligatorio(
          item.anioInicio,
          'formacionAcademica.anioInicio',
          indice,
        ),
        leerNumeroOpcional(item.anioFin),
        leerNivelFormacion(item.nivel, 'formacionAcademica.nivel', indice)!,
      ),
  );
}

export function normalizarCertificaciones(
  input: unknown,
): CertificacionEntity[] {
  return parsearColeccion(input, 'certificaciones').map(
    (item, indice) =>
      new CertificacionEntity(
        leerNumeroOpcional(item.idCertificacion),
        leerTextoObligatorio(item.nombre, 'certificaciones.nombre', indice),
        leerTextoObligatorio(item.entidad, 'certificaciones.entidad', indice),
        leerNumeroOpcional(item.anio),
        leerNumeroOpcional(item.cargaHoraria),
        leerNivelFormacion(item.nivel, 'certificaciones.nivel', indice, true),
      ),
  );
}
