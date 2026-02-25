import { UsuarioOrmEntity } from '../entities/usuario.entity';
import { Repository } from 'typeorm';
import { UsuarioEntity } from 'src/domain/entities/Usuario/usuario.entity';
import { PerfilUsuario, UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
export declare class UsuarioRepositoryImplementation implements UsuarioRepository {
    private readonly userRepository;
    constructor(userRepository: Repository<UsuarioOrmEntity>);
    findByEmail(email: string): Promise<UsuarioEntity | null>;
    findPersonaIdByUserId(userId: number): Promise<number | null>;
    findPerfilByUserId(userId: number): Promise<PerfilUsuario | null>;
    save(entity: UsuarioEntity): Promise<UsuarioEntity>;
    update(id: number, entity: UsuarioEntity): Promise<UsuarioEntity>;
    delete(id: number): Promise<void>;
    findAll(): Promise<UsuarioEntity[]>;
    findByPersonaId(personaId: number): Promise<UsuarioEntity | null>;
}
