import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class EnableBlockedTurnosAndNullableSocio1768410000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
