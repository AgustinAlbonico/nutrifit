import { OnModuleInit } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AlimentoOrmEntity } from '../persistence/typeorm/entities/alimento.entity';
type OrigenSync = 'manual' | 'cron' | 'curacion-manual';
type EstadoSync = 'OK' | 'ERROR';
interface ResultadoCuracion {
    eliminados: number;
    renombrados: number;
    duplicadosDetectados: number;
    ruidososDetectados: number;
}
export interface ResultadoSyncAlimentos {
    candidatos: number;
    insertados: number;
    eliminadosPorCuracion: number;
    duplicadosOmitidos: number;
    paginasConsultadas: number;
    mensaje: string;
}
export interface EstadoSyncAlimentos {
    id: number;
    origen: OrigenSync;
    estado: EstadoSync;
    inicio: string;
    fin: string;
    candidatos: number;
    insertados: number;
    eliminados: number;
    duplicadosOmitidos: number;
    paginasConsultadas: number;
    mensaje: string | null;
}
export declare class AlimentosSyncService implements OnModuleInit {
    private readonly alimentoRepo;
    private readonly dataSource;
    private readonly logger;
    private readonly urlOpenFoodFacts;
    constructor(alimentoRepo: Repository<AlimentoOrmEntity>, dataSource: DataSource);
    onModuleInit(): Promise<void>;
    sincronizacionAutomaticaHabilitada(): boolean;
    obtenerUltimoEstadoSync(): Promise<EstadoSyncAlimentos | null>;
    sincronizarCatalogo(origen?: OrigenSync): Promise<ResultadoSyncAlimentos>;
    curarCatalogoManual(): Promise<ResultadoCuracion>;
    private obtenerParametrosSync;
    private obtenerEnteroEntorno;
    private obtenerAlimentosOpenFoodFacts;
    private curarCatalogoInterno;
    private calcularScoreFila;
    private asegurarTablaLogSync;
    private registrarLogSync;
}
export {};
