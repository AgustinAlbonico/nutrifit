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
  alimentosDisponibles?: string[];
  categoriasGruposAlimenticios?: string[];
}

@Injectable()
export class PromptIdeasComidaBuilder {
  build({
    ficha,
    slot,
    cantidad,
    alimentosDisponibles,
    categoriasGruposAlimenticios,
  }: ArgsPromptIdeasComida): {
    system: string;
    user: string;
  } {
    const restriccionesTexto = this.componerContextoRestricciones(ficha);
    const catalogoTexto = this.componerCatalogoAlimentos(alimentosDisponibles);
    const coherenciaTexto = this.componerGuiaTipoComida(
      slot.tipoComida,
      alimentosDisponibles ?? [],
    );
    const categoriasTexto = categoriasGruposAlimenticios?.length
      ? `Categorías válidas para alimentos nuevos: ${categoriasGruposAlimenticios.join(', ')}.`
      : '';
    const slotTexto =
      `${this.formatearDia(slot.dia)} ${this.formatearTipoComida(slot.tipoComida)}`.toLowerCase();
    const cantidadTexto = `${cantidad} alternativa${cantidad === 1 ? '' : 's'}`;

    const system = `Sos un asistente de nutrición. Tu tarea es sugerir ${cantidadTexto} para ${slotTexto}.
Todas las sugerencias deben cumplir ESTRICTAMENTE las restricciones del paciente listadas abajo. Una alternativa que viole una restricción crítica (alergia, restricción alimentaria dura) debe ser descartada internamente antes de devolver la respuesta.

${restriccionesTexto}

${catalogoTexto}

${coherenciaTexto}

Reglas:
- Devuelve EXACTAMENTE ${cantidad} alternativas distintas.
- Usá exclusivamente alimentos del catálogo disponible y copiá sus nombres exactos en alimentoNombre.
- El nombre de cada alternativa debe describir el plato con sus alimentos principales. No uses nombres genéricos como "Desayuno 1", "Alternativa 2" u "Opción 3".
- Cada alternativa debe tener nombre, alimentos con cantidades en gramos o mililitros.
- Incluí calorías, proteínas, carbohidratos y grasas estimadas.
- Si no podés cumplir todas las restricciones, devolvé menos alternativas y agregá un campo "advertencias" explicando el motivo.
- OBLIGATORIO: si usás un alimento que NO está en el catálogo disponible, declaralo en 'alimentosNuevos' con TODOS los campos completos: 'nombre', 'categoriaNombre', 'cantidadBase', 'unidadBase', 'calorias', 'proteinas', 'carbohidratos' y 'grasas' por porción base. Si no podés estimar los macros con confianza, NO incluyas ese ingrediente — usá uno del catálogo.${categoriasTexto ? `\n${categoriasTexto}` : ''}`;

    const user = `Generá ${cantidadTexto} para ${slotTexto} del paciente.`;

    return { system, user };
  }

  private componerContextoRestricciones(ficha: FichaSaludInput): string {
    const lineas: string[] = [];
    if (ficha.alergias?.length) {
      lineas.push(`- Alergias: ${ficha.alergias.join(', ')}`);
    }
    if (ficha.restriccionesAlimentarias) {
      lineas.push(
        `- Restricciones alimentarias: ${ficha.restriccionesAlimentarias}`,
      );
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

  private componerCatalogoAlimentos(alimentosDisponibles?: string[]): string {
    if (!alimentosDisponibles?.length) {
      return 'Catálogo de alimentos disponible: no informado.';
    }

    return `Catálogo de alimentos disponible (usar nombres exactos):\n${alimentosDisponibles
      .map((nombre) => `- ${nombre}`)
      .join('\n')}`;
  }

  private componerGuiaTipoComida(
    tipoComida: TipoComida,
    alimentosDisponibles: string[],
  ): string {
    const guia = GUIA_ALIMENTOS_POR_TIPO_COMIDA[tipoComida];
    if (!guia) return '';

    const apropiadosDisponibles = guia.apropiados.filter((nombre) =>
      alimentosDisponibles.some((disp) =>
        disp.toLowerCase().includes(nombre.toLowerCase()),
      ),
    );
    const inapropiadosDisponibles = guia.inapropiados.filter((nombre) =>
      alimentosDisponibles.some((disp) =>
        disp.toLowerCase().includes(nombre.toLowerCase()),
      ),
    );

    const lineas: string[] = [
      `Alimentos apropiados para ${this.formatearTipoComida(tipoComida).toLowerCase()}: ${
        apropiadosDisponibles.length
          ? apropiadosDisponibles.join(', ')
          : guia.apropiados.join(', ')
      }.`,
    ];

    if (inapropiadosDisponibles.length > 0) {
      lineas.push(
        `Los siguientes alimentos del catálogo NO son apropiados para ${this.formatearTipoComida(tipoComida).toLowerCase()} y no deben usarse: ${inapropiadosDisponibles.join(', ')}.`,
      );
    }

    return `Coherencia con el tipo de comida:\n${lineas.join('\n')}`;
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

interface GuiaTipoComida {
  apropiados: string[];
  inapropiados: string[];
}

const GUIA_ALIMENTOS_POR_TIPO_COMIDA: Record<TipoComida, GuiaTipoComida> = {
  [TipoComida.DESAYUNO]: {
    apropiados: [
      'Avena',
      'Yogur',
      'Leche',
      'Huevo',
      'Pan',
      'Banana',
      'Manzana',
      'Frutas',
      'Granola',
      'Cereal',
      'Café',
      'Té',
    ],
    inapropiados: [
      'Pechuga de pollo',
      'Carne',
      'Merluza',
      'Arroz',
      'Lentejas',
      'Garbanzos',
      'Papa',
      'Batata',
      'Pasta',
      'Milanesas',
    ],
  },
  [TipoComida.MERIENDA]: {
    apropiados: [
      'Yogur',
      'Leche',
      'Pan',
      'Frutas',
      'Granola',
      'Cereal',
      'Vainillas',
      'Galletitas',
      'Té',
      'Café',
    ],
    inapropiados: [
      'Pechuga de pollo',
      'Carne',
      'Merluza',
      'Arroz',
      'Lentejas',
      'Garbanzos',
      'Papa',
      'Pasta',
      'Milanesas',
    ],
  },
  [TipoComida.ALMUERZO]: {
    apropiados: [
      'Pechuga de pollo',
      'Carne',
      'Merluza',
      'Arroz',
      'Lentejas',
      'Garbanzos',
      'Papa',
      'Ensalada',
      'Lechuga',
      'Tomate',
      'Zanahoria',
      'Pan',
    ],
    inapropiados: ['Avena', 'Yogur', 'Granola', 'Café', 'Té'],
  },
  [TipoComida.CENA]: {
    apropiados: [
      'Pechuga de pollo',
      'Carne',
      'Merluza',
      'Arroz',
      'Lentejas',
      'Garbanzos',
      'Papa',
      'Ensalada',
      'Lechuga',
      'Tomate',
      'Zanahoria',
      'Huevo',
    ],
    inapropiados: ['Avena', 'Yogur', 'Granola', 'Café', 'Té'],
  },
  [TipoComida.COLACION]: {
    apropiados: [
      'Frutas',
      'Yogur',
      'Manzana',
      'Banana',
      'Nueces',
      'Maní',
      'Almendras',
      'Galletitas',
      'Barra',
    ],
    inapropiados: [
      'Pechuga de pollo',
      'Carne',
      'Merluza',
      'Arroz',
      'Pasta',
      'Milanesas',
    ],
  },
};
