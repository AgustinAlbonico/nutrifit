import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { SocioResponseDto } from 'src/application/socios/dtos/socio-response.dto';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
export declare class AlimentoResponseDto {
    idAlimento: number;
    nombre: string;
    cantidad: number;
    calorias: number | null;
    proteinas: number | null;
    carbohidratos: number | null;
    grasas: number | null;
    unidadMedida: string;
}
export declare class ItemComidaResponseDto {
    idItemComida: number;
    cantidad: number;
    unidad: UnidadMedida;
    notas: string | null;
    alimento: AlimentoResponseDto;
}
export declare class OpcionComidaResponseDto {
    idOpcionComida: number;
    tipoComida: TipoComida;
    comentarios: string | null;
    items: ItemComidaResponseDto[];
}
export declare class DiaPlanResponseDto {
    idDiaPlan: number;
    dia: DiaSemana;
    orden: number;
    opcionesComida: OpcionComidaResponseDto[];
}
export declare class PlanAlimentacionResponseDto {
    idPlanAlimentacion: number;
    fechaCreacion: Date;
    objetivoNutricional: string;
    activo: boolean;
    eliminadoEn: Date | null;
    motivoEliminacion: string | null;
    motivoEdicion: string | null;
    ultimaEdicion: Date | null;
    socioId: number;
    nutricionistaId: number;
    socio?: SocioResponseDto;
    dias: DiaPlanResponseDto[];
}
