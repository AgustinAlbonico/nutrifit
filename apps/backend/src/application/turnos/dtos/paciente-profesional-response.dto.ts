export class PacienteProfesionalResponseDto {
  socioId: number;
  nombreCompleto: string;
  dni: string;
  objetivo: string | null;
  ultimoTurno: string | null;
  proximoTurno: string | null;
  fotoPerfilUrl: string | null;
}
