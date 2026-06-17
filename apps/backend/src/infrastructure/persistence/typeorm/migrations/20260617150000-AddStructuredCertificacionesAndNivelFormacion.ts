import { MigrationInterface, QueryRunner } from 'typeorm';

type FilaCertificacionLegacy = {
  id_persona: number;
  certificaciones: string | null;
};

const MAPA_NIVELES: Record<string, string> = {
  Grado: 'GRADO',
  Posgrado: 'POSGRADO',
  Maestría: 'MAESTRIA',
  Maestria: 'MAESTRIA',
  Doctorado: 'DOCTORADO',
  Diplomatura: 'DIPLOMATURA',
  Especializacion: 'ESPECIALIZACION',
  Especialización: 'ESPECIALIZACION',
  Curso: 'CURSO',
};

export class AddStructuredCertificacionesAndNivelFormacion20260617150000 implements MigrationInterface {
  name = 'AddStructuredCertificacionesAndNivelFormacion20260617150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE certificacion (
        id_certificacion INT AUTO_INCREMENT PRIMARY KEY,
        id_nutricionista INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        entidad VARCHAR(255) NOT NULL,
        anio INT NULL,
        carga_horaria INT NULL,
        nivel ENUM('GRADO','POSGRADO','MAESTRIA','DOCTORADO','ESPECIALIZACION','DIPLOMATURA','CURSO') NULL,
        fecha_baja DATETIME NULL,
        CONSTRAINT FK_certificacion_nutricionista FOREIGN KEY (id_nutricionista)
          REFERENCES persona(id_persona) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'ALTER TABLE formacion_academica MODIFY COLUMN anio_fin INT NULL',
    );

    for (const [valorViejo, valorNuevo] of Object.entries(MAPA_NIVELES)) {
      await queryRunner.query(
        'UPDATE formacion_academica SET nivel = ? WHERE nivel = ?',
        [valorNuevo, valorViejo],
      );
    }

    await queryRunner.query(`
      ALTER TABLE formacion_academica
      MODIFY COLUMN nivel ENUM('GRADO','POSGRADO','MAESTRIA','DOCTORADO','ESPECIALIZACION','DIPLOMATURA','CURSO') NOT NULL
    `);

    const filas = (await queryRunner.query(`
      SELECT id_persona, certificaciones
      FROM persona
      WHERE certificaciones IS NOT NULL AND TRIM(certificaciones) <> ''
    `)) as FilaCertificacionLegacy[];

    for (const fila of filas) {
      const certificaciones = this.parsearCertificaciones(fila.certificaciones);

      for (const certificacion of certificaciones) {
        await queryRunner.query(
          `
            INSERT INTO certificacion
              (id_nutricionista, nombre, entidad, anio, carga_horaria, nivel, fecha_baja)
            VALUES (?, ?, ?, ?, ?, ?, NULL)
          `,
          [
            fila.id_persona,
            certificacion.nombre,
            certificacion.entidad,
            certificacion.anio,
            certificacion.cargaHoraria,
            certificacion.nivel,
          ],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE formacion_academica MODIFY COLUMN nivel VARCHAR(50) NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE formacion_academica MODIFY COLUMN anio_fin INT NOT NULL',
    );
    await queryRunner.query('DROP TABLE IF EXISTS certificacion');
  }

  private parsearCertificaciones(texto: string | null): Array<{
    nombre: string;
    entidad: string;
    anio: number | null;
    cargaHoraria: number | null;
    nivel: string | null;
  }> {
    if (!texto) return [];

    return texto
      .split(',')
      .map((parte) => parte.trim())
      .filter(Boolean)
      .map((parte) => {
        const matchEntidad = parte.match(/\(([^)]+)\)/);
        const entidad = matchEntidad?.[1]?.trim() || 'No especificada';
        const nombreLimpio = parte
          .replace(/\(([^)]+)\)/g, '')
          .replace(/\.$/, '')
          .trim();
        const nivel = this.detectarNivel(nombreLimpio);

        return {
          nombre: nombreLimpio,
          entidad,
          anio: null,
          cargaHoraria: null,
          nivel,
        };
      });
  }

  private detectarNivel(nombre: string): string | null {
    const nombreNormalizado = nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (nombreNormalizado.includes('DOCTORADO')) return 'DOCTORADO';
    if (nombreNormalizado.includes('MAESTRIA')) return 'MAESTRIA';
    if (nombreNormalizado.includes('POSGRADO')) return 'POSGRADO';
    if (nombreNormalizado.includes('DIPLOMATURA')) return 'DIPLOMATURA';
    if (nombreNormalizado.includes('ESPECIALIZACION')) return 'ESPECIALIZACION';
    if (nombreNormalizado.includes('CURSO')) return 'CURSO';
    if (
      nombreNormalizado.includes('LICENCIATURA') ||
      nombreNormalizado.includes('GRADO')
    ) {
      return 'GRADO';
    }

    return null;
  }
}
