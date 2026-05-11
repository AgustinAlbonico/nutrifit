import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { DiaPlanOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/dia-plan.entity';
import { ItemComidaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/item-comida.entity';
import { OpcionComidaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/opcion-comida.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import { mapPlanToResponse } from './plan-alimentacion.mapper';

describe('plan-alimentacion.mapper', () => {
  it('mapea los items de comida con su alimento anidado', () => {
    const alimento = new AlimentoOrmEntity();
    alimento.idAlimento = 7;
    alimento.nombre = 'Pollo grillado';
    alimento.cantidad = 100;
    alimento.calorias = 165;
    alimento.proteinas = 31;
    alimento.carbohidratos = 0;
    alimento.grasas = 4;
    alimento.hidratosDeCarbono = 0;
    alimento.unidadMedida = UnidadMedida.GRAMO;

    const item = new ItemComidaOrmEntity();
    item.idItemComida = 13;
    item.alimentoId = alimento.idAlimento;
    item.alimentoNombre = alimento.nombre;
    item.cantidad = 250;
    item.unidad = UnidadMedida.GRAMO;
    item.notas = 'Sin piel';
    item.calorias = alimento.calorias;
    item.proteinas = alimento.proteinas;
    item.carbohidratos = alimento.carbohidratos;
    item.grasas = alimento.grasas;
    item.alimento = alimento;

    const opcion = new OpcionComidaOrmEntity();
    opcion.idOpcionComida = 3;
    opcion.tipoComida = TipoComida.ALMUERZO;
    opcion.comentarios = 'Priorizar proteina';
    opcion.items = [item];

    const dia = new DiaPlanOrmEntity();
    dia.idDiaPlan = 2;
    dia.dia = DiaSemana.LUNES;
    dia.orden = 1;
    dia.opcionesComida = [opcion];

    const plan = new PlanAlimentacionOrmEntity();
    plan.idPlanAlimentacion = 1;
    plan.fechaCreacion = new Date('2026-05-07T00:00:00.000Z');
    plan.objetivoNutricional = 'Ganancia muscular';
    plan.activo = true;
    plan.eliminadoEn = null;
    plan.motivoEliminacion = null;
    plan.motivoEdicion = null;
    plan.ultimaEdicion = null;
    plan.socio = {
      idPersona: 20,
    } as unknown as PlanAlimentacionOrmEntity['socio'];
    plan.nutricionista = {
      idPersona: 10,
    } as unknown as PlanAlimentacionOrmEntity['nutricionista'];
    plan.dias = [dia];

    const dto = mapPlanToResponse(plan);
    const opcionDto = dto.dias[0].opcionesComida[0];
    const itemDto = opcionDto.items[0];

    expect(opcionDto.items).toHaveLength(1);
    expect(Object.prototype.hasOwnProperty.call(opcionDto, 'alimentos')).toBe(
      false,
    );
    expect(itemDto.idItemComida).toBe(13);
    expect(itemDto.cantidad).toBe(250);
    expect(itemDto.unidad).toBe(UnidadMedida.GRAMO);
    expect(itemDto.notas).toBe('Sin piel');
    expect(itemDto.alimento.idAlimento).toBe(7);
    expect(itemDto.alimento.nombre).toBe('Pollo grillado');
    expect(itemDto.alimento.cantidad).toBe(100);
  });
});
