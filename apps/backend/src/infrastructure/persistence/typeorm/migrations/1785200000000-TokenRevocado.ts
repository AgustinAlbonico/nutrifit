import { MigrationInterface, QueryRunner } from 'typeorm';

export class TokenRevocado1785200000000 implements MigrationInterface {
  name = 'TokenRevocado1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`token_revocado\` (
        \`id_token_revocado\` int NOT NULL AUTO_INCREMENT,
        \`jti\` varchar(36) NOT NULL,
        \`id_usuario\` int NOT NULL,
        \`id_gimnasio\` int NULL,
        \`expires_at\` datetime NOT NULL,
        \`revocado_en\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_token_revocado\`),
        UNIQUE INDEX \`idx_token_revocado_jti\` (\`jti\`),
        INDEX \`idx_token_revocado_expires\` (\`expires_at\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`token_revocado\``);
  }
}