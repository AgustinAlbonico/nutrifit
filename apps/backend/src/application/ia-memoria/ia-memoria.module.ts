import { Module } from '@nestjs/common';
import { SeleccionarEjemplosMemoriaUseCase } from './use-cases/seleccionar-ejemplos-memoria.use-case';
import { ListarMemoriaUseCase } from './use-cases/listar-memoria.use-case';
import { EliminarMemoriaUseCase } from './use-cases/eliminar-memoria.use-case';
import { RepositoriesModule } from 'src/infrastructure/persistence/typeorm/repositories/repositories.module';

/**
 * IaMemoriaModule
 * ===============
 *
 * Módulo que agrupa los use-cases de gestión y selección de la memoria
 * IA del nutricionista (few-shot learning).
 *
 * - SeleccionarEjemplosMemoriaUseCase es lógica pura (recibe repo por
 *   parámetro), por lo tanto no requiere providers externos.
 * - ListarMemoriaUseCase y EliminarMemoriaUseCase sí usan el repo por DI.
 *   El token `NUTRICIONISTA_IA_MEMORIA_REPOSITORY` se importa desde
 *   RepositoriesModule.
 */
@Module({
  imports: [RepositoriesModule],
  providers: [
    SeleccionarEjemplosMemoriaUseCase,
    ListarMemoriaUseCase,
    EliminarMemoriaUseCase,
  ],
  exports: [
    SeleccionarEjemplosMemoriaUseCase,
    ListarMemoriaUseCase,
    EliminarMemoriaUseCase,
  ],
})
export class IaMemoriaModule {}
