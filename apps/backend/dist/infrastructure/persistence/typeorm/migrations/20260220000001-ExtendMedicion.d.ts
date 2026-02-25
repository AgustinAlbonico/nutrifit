import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class ExtendMedicion20260220000001 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
