import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AdjuntoClinicoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/adjunto-clinico.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface AdjuntoClinicoDto {
  turnoId: number;
  usuarioId: number;
  buffer: Buffer;
  nombreOriginal: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ListarAdjuntosResponse {
  id: number;
  nombreOriginal: string;
  urlFirmada: string;
  mimeType: string;
  sizeBytes: number;
  esPostCierre: boolean;
  createdAt: Date;
}

@Injectable()
export class AdjuntoClinicoService {
  constructor(
    @InjectRepository(AdjuntoClinicoOrmEntity)
    private readonly adjuntoRepository: Repository<AdjuntoClinicoOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly objectStorageService: IObjectStorageService,
  ) {}

  async subir(dto: AdjuntoClinicoDto): Promise<{
    id: number;
    nombreOriginal: string;
    urlFirmada: string;
    esPostCierre: boolean;
  }> {
    // Validar tipo MIME
    if (!MIME_PERMITIDOS.includes(dto.mimeType)) {
      throw new BadRequestError(
        `Tipo de archivo no permitido. Solo se aceptan: ${MIME_PERMITIDOS.join(', ')}`,
      );
    }

    // Validar tamaño
    if (dto.sizeBytes > MAX_SIZE_BYTES) {
      throw new BadRequestError(`El archivo excede el límite de 10MB`);
    }

    // Validar turno existe
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: dto.turnoId },
    });
    if (!turno) {
      throw new BadRequestError('Turno no encontrado');
    }

    if (turno.estadoTurno === EstadoTurno.CANCELADO) {
      throw new BadRequestError(
        'No se pueden agregar adjuntos a un turno cancelado',
      );
    }

    // Determinar si es post-cierre
    const esPostCierre =
      turno.consultaFinalizadaAt !== null ||
      turno.estadoTurno === EstadoTurno.REALIZADO;

    // Generar objectKey: adjuntos/{turnoId}/{uuid}.{ext}
    const extension = dto.nombreOriginal.split('.').pop() ?? 'bin';
    const objectKey = `adjuntos/${dto.turnoId}/${uuidv4()}.${extension}`;

    // Subir a MinIO
    await this.objectStorageService.subirArchivo(
      objectKey,
      dto.buffer,
      dto.mimeType,
    );

    // Guardar registro en BD
    const adjunto = this.adjuntoRepository.create({
      nombreOriginal: dto.nombreOriginal,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      objectKey,
      turnoId: dto.turnoId,
      usuarioSubioId: dto.usuarioId,
      esPostCierre,
    });

    const saved = await this.adjuntoRepository.save(adjunto);

    // Generar URL firmada (1 hora)
    const urlFirmada = await this.objectStorageService.obtenerUrlFirmada(
      objectKey,
      3600,
    );

    return {
      id: saved.idAdjunto,
      nombreOriginal: saved.nombreOriginal,
      urlFirmada,
      esPostCierre,
    };
  }

  async listarPorTurno(turnoId: number): Promise<ListarAdjuntosResponse[]> {
    const adjuntos = await this.adjuntoRepository.find({
      where: { turnoId },
      order: { createdAt: 'DESC' },
    });

    const resultados: ListarAdjuntosResponse[] = [];
    for (const adjunto of adjuntos) {
      const urlFirmada = await this.objectStorageService.obtenerUrlFirmada(
        adjunto.objectKey,
        3600,
      );
      resultados.push({
        id: adjunto.idAdjunto,
        nombreOriginal: adjunto.nombreOriginal,
        urlFirmada,
        mimeType: adjunto.mimeType,
        sizeBytes: adjunto.sizeBytes,
        esPostCierre: adjunto.esPostCierre,
        createdAt: adjunto.createdAt,
      });
    }

    return resultados;
  }

  async eliminar(
    adjuntoId: number,
    usuarioId: number,
    esAdmin: boolean,
  ): Promise<void> {
    const adjunto = await this.adjuntoRepository.findOne({
      where: { idAdjunto: adjuntoId },
    });

    if (!adjunto) {
      throw new BadRequestError('Adjunto no encontrado');
    }

    // Solo el autor o un admin puede eliminar
    if (!esAdmin && adjunto.usuarioSubioId !== usuarioId) {
      throw new BadRequestError('No tienes permiso para eliminar este adjunto');
    }

    // Eliminar de MinIO
    await this.objectStorageService.eliminarArchivo(adjunto.objectKey);

    // Eliminar de BD
    await this.adjuntoRepository.remove(adjunto);
  }

  async obtenerUrlFirmada(adjuntoId: number): Promise<string> {
    const adjunto = await this.adjuntoRepository.findOne({
      where: { idAdjunto: adjuntoId },
    });

    if (!adjunto) {
      throw new BadRequestError('Adjunto no encontrado');
    }

    return this.objectStorageService.obtenerUrlFirmada(adjunto.objectKey, 3600);
  }
}
