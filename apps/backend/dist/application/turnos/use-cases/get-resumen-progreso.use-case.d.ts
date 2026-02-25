import { Repository } from 'typeorm';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
export type Tendencia = 'subiendo' | 'bajando' | 'estable';
export type CategoriaIMC = 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad';
export type RiesgoCardiovascular = 'bajo' | 'moderado' | 'alto';
export interface ProgresoMetrica {
    inicial: number | null;
    actual: number | null;
    diferencia: number | null;
    tendencia: Tendencia | null;
}
export interface ResumenProgresoResponse {
    peso: {
        inicial: number | null;
        actual: number | null;
        diferencia: number | null;
        tendencia: Tendencia | null;
    };
    imc: {
        inicial: number | null;
        actual: number | null;
        diferencia: number | null;
        categoriaActual: CategoriaIMC | null;
    };
    perimetros: {
        cintura: ProgresoMetrica;
        cadera: ProgresoMetrica;
        brazo: ProgresoMetrica;
        muslo: ProgresoMetrica;
    };
    relacionCinturaCadera: {
        inicial: number | null;
        actual: number | null;
        riesgoCardiovascular: RiesgoCardiovascular | null;
    };
    rangoSaludable: {
        pesoMinimo: number | null;
        pesoMaximo: number | null;
    };
    totalMediciones: number;
    primeraMedicion: Date | null;
    ultimaMedicion: Date | null;
}
export declare class GetResumenProgresoUseCase {
    private readonly medicionRepository;
    private readonly socioRepository;
    constructor(medicionRepository: Repository<MedicionOrmEntity>, socioRepository: Repository<SocioOrmEntity>);
    execute(socioId: number): Promise<ResumenProgresoResponse>;
    private calcularTendencia;
    private categorizarIMC;
    private calcularProgresoMetrica;
    private calcularRelacionCinturaCadera;
    private evaluarRiesgoCardiovascular;
    private calcularPesoPorIMC;
}
