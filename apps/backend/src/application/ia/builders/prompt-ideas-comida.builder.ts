import { Injectable } from '@nestjs/common';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

export interface FichaSaludInput {
  alergias?: string[] | null;
  restriccionesAlimentarias?: string | null;
  patologias?: string[] | null;
  medicacionActual?: string | null;
  suplementosActuales?: string | null;
}

interface ArgsPromptIdeasComida {
  ficha: FichaSaludInput;
  slot: { dia: DiaSemana; tipoComida: TipoComida };
  cantidad: number;
}

@Injectable()
export class PromptIdeasComidaBuilder {
  build({ ficha, slot, cantidad }: ArgsPromptIdeasComida): {
    system: string;
    user: string;
  } {
    const restriccionesTexto = this.componerContextoRestricciones(ficha);
    const slotTexto = `${this.formatearDia(slot.dia)} ${this.formatearTipoComida(slot.tipoComida)}`.toLowerCase();
    const cantidadTexto = `${cantidad} alternativa${cantidad === 1 ? '' : 's'}`;

    const system = `Sos un asistente de nutrición. Tu tarea es sugerir ${cantidadTexto} para ${slotTexto}.
Todas las sugerencias deben cumplir ESTRICTAMENTE las restricciones del paciente listadas abajo. Una alternativa que viole una restricción crítica (alergia, restricción alimentaria dura) debe ser descartada internamente antes de devolver la respuesta.

${restriccionesTexto}

Reglas:
- Devuelve EXACTAMENTE ${cantidad} alternativas distintas.
- Cada alternativa debe tener nombre, alimentos con cantidades en gramos o mililitros.
- Incluye calorías, proteínas, carbohidratos y grasas estimadas.
- Si no podés cumplir todas las restricciones, devolvé menos alternativas y agregá un campo "advertencias" explicando el motivo.`;

    const user = `Generá ${cantidadTexto} para ${slotTexto} del paciente.`;

    return { system, user };
  }

  private componerContextoRestricciones(ficha: FichaSaludInput): string {
    const lineas: string[] = [];
    if (ficha.alergias?.length) {
      lineas.push(`- Alergias: ${ficha.alergias.join(', ')}`);
    }
    if (ficha.restriccionesAlimentarias) {
      lineas.push(`- Restricciones alimentarias: ${ficha.restriccionesAlimentarias}`);
    }
    if (ficha.patologias?.length) {
      lineas.push(`- Patologías: ${ficha.patologias.join(', ')}`);
    }
    if (ficha.medicacionActual) {
      lineas.push(`- Medicación: ${ficha.medicacionActual}`);
    }
    if (ficha.suplementosActuales) {
      lineas.push(`- Suplementos: ${ficha.suplementosActuales}`);
    }
    return lineas.length
      ? `Restricciones del paciente:\n${lineas.join('\n')}`
      : 'El paciente no tiene restricciones alimentarias registradas.';
  }

  private formatearDia(dia: DiaSemana): string {
    return {
      [DiaSemana.LUNES]: 'Lunes',
      [DiaSemana.MARTES]: 'Martes',
      [DiaSemana.MIERCOLES]: 'Miércoles',
      [DiaSemana.JUEVES]: 'Jueves',
      [DiaSemana.VIERNES]: 'Viernes',
      [DiaSemana.SABADO]: 'Sábado',
      [DiaSemana.DOMINGO]: 'Domingo',
    }[dia];
  }

  private formatearTipoComida(tipo: TipoComida): string {
    return tipo.charAt(0) + tipo.slice(1).toLowerCase();
  }
}
