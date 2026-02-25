import { NivelActividadFisica } from 'src/domain/entities/FichaSalud/NivelActividadFisica';
import { FrecuenciaComidas } from 'src/domain/entities/FichaSalud/FrecuenciaComidas';
import { ConsumoAlcohol } from 'src/domain/entities/FichaSalud/ConsumoAlcohol';
import { PatologiaEntity } from 'src/domain/entities/FichaSalud/patologia.entity';
import { AlergiaEntity } from 'src/domain/entities/FichaSalud/alergia.entity';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
export declare class FichaSaludOrmEntity {
    idFichaSalud: number;
    altura: number;
    peso: number;
    fechaCreacion: Date;
    objetivoPersonal: string | null;
    nivelActividadFisica: NivelActividadFisica;
    medicacionActual: string | null;
    suplementosActuales: string | null;
    cirugiasPrevias: string | null;
    antecedentesFamiliares: string | null;
    frecuenciaComidas: FrecuenciaComidas | null;
    consumoAguaDiario: number | null;
    restriccionesAlimentarias: string | null;
    consumoAlcohol: ConsumoAlcohol | null;
    fumaTabaco: boolean;
    horasSueno: number | null;
    contactoEmergenciaNombre: string | null;
    contactoEmergenciaTelefono: string | null;
    socio: SocioEntity;
    patologias: PatologiaEntity[];
    alergias: AlergiaEntity[];
}
export declare class PatologiaOrmEntity {
    idPatologia: number;
    nombre: string;
}
export declare class AlergiaOrmEntity {
    idAlergia: number;
    nombre: string;
}
