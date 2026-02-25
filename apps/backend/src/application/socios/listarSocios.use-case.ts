import { Injectable } from '@nestjs/common';
import { BaseUseCase } from '../shared/use-case.base';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import {
  SOCIO_REPOSITORY,
  SocioRepository,
} from 'src/domain/entities/Persona/Socio/socio.repository';
import { Inject } from '@nestjs/common';

@Injectable()
export class ListarSociosUseCase implements BaseUseCase {
  constructor(
    @Inject(SOCIO_REPOSITORY) private readonly socioRepository: SocioRepository,
  ) {}

  async execute(): Promise<SocioEntity[]> {
    return this.socioRepository.findAll();
  }

  async findById(id: number): Promise<SocioEntity | null> {
    return this.socioRepository.findById(id);
  }
}
