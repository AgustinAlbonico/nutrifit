import { z } from 'zod';

const campoNumericoOpcional = z
  .string()
  .trim()
  .optional()
  .transform((valor) => (valor === '' || valor == null ? undefined : Number(valor)));

const campoNumericoRequerido = (mensaje: string) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .transform((valor) => Number(valor));

export const medicionesConsultaSchema = z
  .object({
    peso: campoNumericoRequerido('El peso es obligatorio.').pipe(
      z
        .number()
        .min(20, 'El peso debe ser al menos 20 kg.')
        .max(500, 'El peso debe ser como máximo 500 kg.'),
    ),
    altura: campoNumericoOpcional.pipe(
      z
        .number()
        .min(100, 'La altura debe ser al menos 100 cm.')
        .max(250, 'La altura debe ser como máximo 250 cm.')
        .optional(),
    ),
    perimetroCintura: campoNumericoOpcional.pipe(z.number().min(0).max(300).optional()),
    perimetroCadera: campoNumericoOpcional.pipe(z.number().min(0).max(300).optional()),
    perimetroBrazo: campoNumericoOpcional.pipe(z.number().min(0).max(100).optional()),
    perimetroMuslo: campoNumericoOpcional.pipe(z.number().min(0).max(150).optional()),
    perimetroPecho: campoNumericoOpcional.pipe(z.number().min(0).max(200).optional()),
    pliegueTriceps: campoNumericoOpcional.pipe(z.number().min(0).max(100).optional()),
    pliegueAbdominal: campoNumericoOpcional.pipe(z.number().min(0).max(100).optional()),
    pliegueMuslo: campoNumericoOpcional.pipe(z.number().min(0).max(100).optional()),
    porcentajeGrasa: campoNumericoOpcional.pipe(
      z.number().min(0).max(70, 'El porcentaje de grasa debe ser como máximo 70%.').optional(),
    ),
    frecuenciaCardiaca: campoNumericoOpcional.pipe(z.number().min(30).max(220).optional()),
    tensionSistolica: campoNumericoOpcional.pipe(z.number().min(60).max(250).optional()),
    tensionDiastolica: campoNumericoOpcional.pipe(z.number().min(40).max(150).optional()),
    notasMedicion: z.string().trim().optional(),
  })
  .superRefine((valores, contexto) => {
    const tieneSistolica = valores.tensionSistolica !== undefined;
    const tieneDiastolica = valores.tensionDiastolica !== undefined;

    if (tieneSistolica !== tieneDiastolica) {
      contexto.addIssue({
        code: 'custom',
        path: ['tensionDiastolica'],
        message: 'Para registrar la tensión arterial debes informar el valor sistólico y el diastólico.',
      });
    }

    if (
      valores.tensionSistolica !== undefined &&
      valores.tensionDiastolica !== undefined &&
      valores.tensionDiastolica >= valores.tensionSistolica
    ) {
      contexto.addIssue({
        code: 'custom',
        path: ['tensionDiastolica'],
        message: 'La tensión diastólica debe ser menor que la sistólica.',
      });
    }

    if (valores.peso && valores.altura) {
      const alturaMetros = valores.altura / 100;
      const imc = valores.peso / (alturaMetros * alturaMetros);

      if (imc < 10 || imc > 80) {
        contexto.addIssue({
          code: 'custom',
          path: ['altura'],
          message: 'El IMC calculado queda fuera de un rango clínico razonable. Revisá peso y altura.',
        });
      }
    }
  });

export type ValoresMedicionesConsulta = z.infer<typeof medicionesConsultaSchema>;
export type ValoresFormularioMedicionesConsulta = z.input<typeof medicionesConsultaSchema>;

export function convertirMedicionesConsultaPayload(valores: ValoresMedicionesConsulta) {
  return {
    peso: valores.peso,
    altura: valores.altura,
    perimetroCintura: valores.perimetroCintura,
    perimetroCadera: valores.perimetroCadera,
    perimetroBrazo: valores.perimetroBrazo,
    perimetroMuslo: valores.perimetroMuslo,
    perimetroPecho: valores.perimetroPecho,
    pliegueTriceps: valores.pliegueTriceps,
    pliegueAbdominal: valores.pliegueAbdominal,
    pliegueMuslo: valores.pliegueMuslo,
    porcentajeGrasa: valores.porcentajeGrasa,
    frecuenciaCardiaca: valores.frecuenciaCardiaca,
    tensionSistolica: valores.tensionSistolica,
    tensionDiastolica: valores.tensionDiastolica,
    notasMedicion: valores.notasMedicion || undefined,
  };
}
