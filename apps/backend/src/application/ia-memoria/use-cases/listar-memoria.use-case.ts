import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  NUTRICIONISTA_IA_MEMORIA_REPOSITORY,
  NutricionistaIAMemoriaRepository,
} from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import { NutricionistaIAMemoriaEntity } from 'src/domain/entities/NutricionistaIAPreferencias/nutricionista-ia-memoria.entity';

export interface SolicitudListarMemoria {
  nutricionistaId: number;
}

export interface RespuestaListarMemoria {
  positivos: NutricionistaIAMemoriaEntity[];
  negativos: NutricionistaIAMemoriaEntity[];
  totalActivas: number;
  archivadas: number;
}

/**
 * ListarMemoriaUseCase
 * ====================
 *
 * Devuelve la memoria IA activa del nutricionista, separada en
 * positivos y negativos, junto con totales (activas + archivadas).
 */
@Injectable()
export class ListarMemoriaUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_IA_MEMORIA_REPOSITORY)
    private readonly memoriaRepo: NutricionistaIAMemoriaRepository,
  ) {}

  async execute(
    solicitud: SolicitudListarMemoria,
  ): Promise<RespuestaListarMemoria> {
    const { nutricionistaId } = solicitud;

    const [activas, archivadas, totalActivas] = await Promise.all([
      this.memoriaRepo.listarPorNutricionista(nutricionistaId, false),
      this.memoriaRepo.listarPorNutricionista(nutricionistaId, true),
      this.memoriaRepo.contarActivas(nutricionistaId),
    ]);

    const archivadasCount = archivadas.length;

    const positivos: NutricionistaIAMemoriaEntity[] = [];
    const negativos: NutricionistaIAMemoriaEntity[] = [];

    for (const entry of activas) {
      if (entry.tipoEjemplo === 'POSITIVO') {
        positivos.push(entry);
      } else if (entry.tipoEjemplo === 'NEGATIVO') {
        negativos.push(entry);
      }
    }

    return {
      positivos,
      negativos,
      totalActivas,
      archivadas: archivadasCount,
    };
  }
}
