import { Injectable } from '@nestjs/common';
import { BaseUseCase } from '../shared/use-case.base';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import {
  SOCIO_REPOSITORY,
  SocioRepository,
} from 'src/domain/entities/Persona/Socio/socio.repository';
import { Inject } from '@nestjs/common';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';

@Injectable()
export class ListarSociosUseCase implements BaseUseCase {
  constructor(
    @Inject(SOCIO_REPOSITORY) private readonly socioRepository: SocioRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(): Promise<SocioEntity[]> {
    const socios = await this.socioRepository.findAll();

    const rol = this.tenantContext.rol;
    if (rol === Rol.ADMIN || rol === Rol.SUPERADMIN) {
      return socios;
    }

    const gimnasioId = this.tenantContext.gimnasioId;
    if (gimnasioId === null) {
      return [];
    }

    return socios.filter((socio) => socio.gimnasioId === gimnasioId);
  }

  async findById(id: number): Promise<SocioEntity | null> {
    return this.socioRepository.findById(id);
  }
}
