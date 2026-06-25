import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  NUTRICIONISTA_IA_MEMORIA_REPOSITORY,
  NutricionistaIAMemoriaRepository,
} from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';

export interface SolicitudEliminarMemoria {
  memoriaId: number;
  user: {
    id: number;
    rol: Rol;
    personaId: number | null;
    gimnasioId: number | null;
  };
}

/**
 * EliminarMemoriaUseCase (soft archive)
 * ======================================
 *
 * Marca una entrada de memoria IA como archivada (no se borra
 * físicamente para preservar auditoría).
 *
 * Reglas:
 *  - 404 si la memoria no existe.
 *  - 403 si el usuario no es el dueño (NUTRICIONISTA).
 */
@Injectable()
export class EliminarMemoriaUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_IA_MEMORIA_REPOSITORY)
    private readonly memoriaRepo: NutricionistaIAMemoriaRepository,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async execute(solicitud: SolicitudEliminarMemoria): Promise<void> {
    const { memoriaId, user } = solicitud;

    // 1) Verificar que existe
    const entrada = await this.memoriaRepo.obtenerPorId(memoriaId);
    if (!entrada) {
      throw new NotFoundError('Memoria IA', String(memoriaId));
    }

    // 2) Validar ownership
    if (user.rol !== Rol.NUTRICIONISTA) {
      throw new ForbiddenError(
        'Solo el nutricionista dueño puede archivar memoria IA',
      );
    }
    if (entrada.idNutricionista !== user.personaId) {
      throw new ForbiddenError(
        'Solo el nutricionista dueño puede archivar memoria IA',
      );
    }

    // 3) Soft archive
    await this.memoriaRepo.marcarArchivada(memoriaId);

    // 4) Auditoría tolerante a fallos
    try {
      await this.auditoriaService.registrar({
        accion: AccionAuditoria.MEMORIA_IA_ARCHIVADA,
        entidad: 'NutricionistaIAMemoria',
        entidadId: memoriaId,
        usuarioId: user.id,
        gimnasioId: user.gimnasioId,
        metadata: { tipoEjemplo: entrada.tipoEjemplo },
      });
    } catch {
      // No afecta operación
    }
  }
}
