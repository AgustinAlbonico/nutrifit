import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class Fase6GimnasioBranding20260507000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Branding fields
    await queryRunner.addColumn(
      'gimnasio',
      new TableColumn({
        name: 'logo_url',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'gimnasio',
      new TableColumn({
        name: 'color_primario',
        type: 'varchar',
        length: '7',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'gimnasio',
      new TableColumn({
        name: 'color_secundario',
        type: 'varchar',
        length: '7',
        isNullable: true,
      }),
    );

    // Políticas operativas
    await queryRunner.addColumn(
      'gimnasio',
      new TableColumn({
        name: 'plazo_cancelacion_horas',
        type: 'int',
        default: 24,
      }),
    );

    await queryRunner.addColumn(
      'gimnasio',
      new TableColumn({
        name: 'plazo_reprogramacion_horas',
        type: 'int',
        default: 12,
      }),
    );

    await queryRunner.addColumn(
      'gimnasio',
      new TableColumn({
        name: 'antelacion_minima_reserva_horas',
        type: 'int',
        default: 2,
      }),
    );

    await queryRunner.addColumn(
      'gimnasio',
      new TableColumn({
        name: 'umbral_ausente_minutos',
        type: 'int',
        default: 15,
      }),
    );

    // Notificaciones
    await queryRunner.addColumn(
      'gimnasio',
      new TableColumn({
        name: 'email_notificaciones',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'gimnasio',
      new TableColumn({
        name: 'email_habilitado',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('gimnasio', 'email_habilitado');
    await queryRunner.dropColumn('gimnasio', 'email_notificaciones');
    await queryRunner.dropColumn('gimnasio', 'umbral_ausente_minutos');
    await queryRunner.dropColumn('gimnasio', 'antelacion_minima_reserva_horas');
    await queryRunner.dropColumn('gimnasio', 'plazo_reprogramacion_horas');
    await queryRunner.dropColumn('gimnasio', 'plazo_cancelacion_horas');
    await queryRunner.dropColumn('gimnasio', 'color_secundario');
    await queryRunner.dropColumn('gimnasio', 'color_primario');
    await queryRunner.dropColumn('gimnasio', 'logo_url');
  }
}
