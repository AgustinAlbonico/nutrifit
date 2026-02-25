import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class PlanAlimentacionDias20260220000000 implements MigrationInterface {
    name: string;
    private columnExists;
    private getForeignKeyName;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
