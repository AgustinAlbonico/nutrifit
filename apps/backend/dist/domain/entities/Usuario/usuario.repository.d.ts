import { BaseRepository } from 'src/domain/shared/base.repository';
import { UsuarioEntity } from './usuario.entity';
export declare const USUARIO_REPOSITORY: unique symbol;
export interface PerfilUsuario {
    idUsuario: number;
    idPersona: number | null;
    email: string;
    rol: UsuarioEntity['rol'];
    nombre: string | null;
    apellido: string | null;
    fotoPerfilKey: string | null;
}
export declare abstract class UsuarioRepository implements BaseRepository<UsuarioEntity> {
    abstract findAll(): Promise<UsuarioEntity[]>;
    abstract findPersonaIdByUserId(userId: number): Promise<number | null>;
    abstract findPerfilByUserId(userId: number): Promise<PerfilUsuario | null>;
    abstract save(entity: UsuarioEntity): Promise<UsuarioEntity>;
    abstract update(id: number, entity: UsuarioEntity): Promise<UsuarioEntity>;
    abstract delete(id: number): Promise<void>;
    abstract findByEmail(email: string): Promise<UsuarioEntity | null>;
    abstract findByPersonaId(personaId: number): Promise<UsuarioEntity | null>;
}
