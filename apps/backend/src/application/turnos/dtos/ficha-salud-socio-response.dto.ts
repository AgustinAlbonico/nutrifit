import { NivelActividadFisica } from 'src/domain/entities/FichaSalud/NivelActividadFisica';
import { FrecuenciaComidas } from 'src/domain/entities/FichaSalud/FrecuenciaComidas';
import { ConsumoAlcohol } from 'src/domain/entities/FichaSalud/ConsumoAlcohol';

export class FichaSaludSocioResponseDto {
  socioId: number;
  fichaSaludId: number;
  altura: number;
  peso: number;
  nivelActividadFisica: NivelActividadFisica;
  alergias: string[];
  patologias: string[];
  objetivoPersonal: string;
  // --- Medicación y suplementos ---
  medicacionActual: string | null;
  suplementosActuales: string | null;
  // --- Historial médico ---
  cirugiasPrevias: string | null;
  antecedentesFamiliares: string | null;
  // --- Hábitos alimentarios ---
  frecuenciaComidas: FrecuenciaComidas | null;
  consumoAguaDiario: number | null;
  restriccionesAlimentarias: string | null;
  // --- Hábitos de vida ---
  consumoAlcohol: ConsumoAlcohol | null;
  fumaTabaco: boolean;
  horasSueno: number | null;
  // --- Contacto de emergencia ---
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
}
