import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class Fase5Notificaciones20260504000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notificacion',
        columns: [
          {
            name: 'id_notificacion',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'destinatario_id', type: 'int' },
          {
            name: 'tipo',
            type: 'enum',
            enum: [
              'TURNO_RESERVADO',
              'TURNO_CANCELADO',
              'TURNO_REPROGRAMADO',
              'CHECK_IN',
              'PLAN_CREADO',
              'PLAN_EDITADO',
              'PLAN_ELIMINADO',
              'CONSULTA_FINALIZADA',
            ],
          },
          { name: 'titulo', type: 'varchar', length: '150' },
          { name: 'mensaje', type: 'varchar', length: '500' },
          { name: 'estado', type: 'enum', enum: ['NO_LEIDA', 'LEIDA'] },
          { name: 'metadata', type: 'json', isNullable: true },
          { name: 'leida_en', type: 'datetime', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['destinatario_id'],
            referencedTableName: 'usuario',
            referencedColumnNames: ['id_usuario'],
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'recordatorio_enviado',
        columns: [
          {
            name: 'id_recordatorio_enviado',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'turno_id', type: 'int' },
          {
            name: 'tipo_recordatorio',
            type: 'enum',
            enum: ['REMINDER_24H', 'REMINDER_48H'],
          },
          {
            name: 'enviado_en',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'uq_recordatorio_turno_tipo',
            columnNames: ['turno_id', 'tipo_recordatorio'],
            isUnique: true,
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'turno_confirmacion_token',
        columns: [
          {
            name: 'id_turno_confirmacion_token',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'turno_id', type: 'int' },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          { name: 'expira_en', type: 'datetime' },
          { name: 'usado_en', type: 'datetime', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.addColumn(
      'turno',
      new TableColumn({
        name: 'token_confirmacion',
        type: 'varchar',
        length: '255',
        isNullable: true,
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('turno', 'token_confirmacion');
    await queryRunner.dropTable('turno_confirmacion_token');
    await queryRunner.dropTable('recordatorio_enviado');
    await queryRunner.dropTable('notificacion');
  }
}
