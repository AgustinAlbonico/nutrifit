import { PoliticaOperativaEntity } from 'src/domain/politicas/politica-operativa.entity';

export const POLITICA_OPERATIVA_REPOSITORY = 'POLITICA_OPERATIVA_REPOSITORY';

export interface IPoliticaOperativaRepository {
  findByGimnasioId(gimnasioId: number): Promise<PoliticaOperativaEntity | null>;
  getPlazoCancelacion(gimnasioId: number): Promise<number>;
  getPlazoReprogramacion(gimnasioId: number): Promise<number>;
  getUmbralAusente(gimnasioId: number): Promise<number>;
}
