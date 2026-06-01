import { SetMetadata } from '@nestjs/common';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';

export const ROLE_KEY = 'rol';
export const Rol = (...roles: RolEnum[]) => SetMetadata(ROLE_KEY, roles);
