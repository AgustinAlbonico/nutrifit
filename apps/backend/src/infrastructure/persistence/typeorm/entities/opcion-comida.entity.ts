import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
import { DiaPlanOrmEntity } from './dia-plan.entity';
import { ItemComidaOrmEntity } from './item-comida.entity';
import { AlimentoOrmEntity } from './alimento.entity';

@Entity('opcion_comida')
export class OpcionComidaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_opcion_comida' })
  idOpcionComida: number;

  @Column({ name: 'comentarios', type: 'varchar', length: 255, nullable: true })
  comentarios: string | null;

  @Column({ name: 'tipo_comida', type: 'enum', enum: TipoComida })
  tipoComida: TipoComida;

  @ManyToOne(() => DiaPlanOrmEntity, (diaPlan) => diaPlan.opcionesComida, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_dia_plan' })
  diaPlan: DiaPlanOrmEntity;

  @OneToMany(() => ItemComidaOrmEntity, (item) => item.opcionComida, {
    cascade: ['insert', 'update'],
  })
  items: ItemComidaOrmEntity[];

  /**
   * Acceso backwards-compatible a alimentos.
   * Deriva los alimentos desde los items cargados.
   * Requiere que se carguen los items con su relacion alimento.
   */
  get alimentos(): AlimentoOrmEntity[] {
    if (!this.items || this.items.length === 0) {
      return [];
    }
    return this.items
      .filter((item) => item.alimento != null)
      .map((item) => item.alimento);
  }

  /**
   * Setter backwards-compatible para mantener la API existente.
   * Cuando se asigna `opcion.alimentos = [...]}`, se crean Items de comida.
   * Deprecated: usar `items` directamente.
   */
  set alimentos(alimentos: AlimentoOrmEntity[]) {
    if (!alimentos || alimentos.length === 0) {
      this.items = [];
      return;
    }
    this.items = alimentos.map((alimento) => {
      const item = new ItemComidaOrmEntity();
      item.alimentoId = alimento.idAlimento;
      item.alimentoNombre = alimento.nombre;
      item.alimento = alimento;
      item.cantidad = alimento.cantidad;
      item.unidad = alimento.unidadMedida;
      item.opcionComida = this;
      return item;
    });
  }

  get tieneItemsReales(): boolean {
    return (
      this.items !== undefined && this.items !== null && this.items.length > 0
    );
  }
}
