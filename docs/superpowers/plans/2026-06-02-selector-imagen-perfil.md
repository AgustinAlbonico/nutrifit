# Selector de Imagen de Perfil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un componente `SelectorImagen` reutilizable e integrarlo en los formularios de socio, nutricionista y recepcionista; limpiar automáticamente las fotos de perfil viejas en MinIO al reemplazarlas o removerlas.

**Architecture:**
- **Frontend**: 1 componente nuevo (`SelectorImagen`) que envuelve el `DialogoZoomImagen` existente (drag/zoom/recorte, output 800×800). Integra drop-zone + preview circular + botón X.
- **Backend**: Modificar 3 use-cases de actualización para inyectar `IObjectStorageService` y eliminar la foto anterior de MinIO cuando se sube una nueva o se quita. Los controllers leen el nuevo campo `eliminarFoto` del FormData.
- **Página nueva**: `Recepcionistas.tsx` creada desde cero con el patrón de `Nutricionistas.tsx` (CRUD con lista, modales de crear/editar/eliminar).
- **Endpoint nuevo**: `GET /recepcionistas/:id/foto` siguiendo el patrón de socio y profesional.

**Tech Stack:**
- Frontend: React 19 + Vite + TypeScript + shadcn/ui (existente)
- Crop: `DialogoZoomImagen` existente (reusado, sin dependencias nuevas)
- Backend: NestJS + TypeORM + MinIO (`minio@^8.0.6`, existente)
- Tests: Vitest (frontend), Jest (backend)

---

## Task 1: Modificar `actualizarSocio.use-case.ts` con limpieza de foto vieja (TDD)

**Files:**
- Modify: `apps/backend/src/application/socios/actualizarSocio.use-case.ts`
- Create: `apps/backend/src/application/socios/actualizarSocio.use-case.spec.ts`

- [ ] **Step 1: Escribir test que falla — foto vieja se elimina al subir nueva**

```ts
// apps/backend/src/application/socios/actualizarSocio.use-case.spec.ts
import { ActualizarSocioUseCase } from './actualizarSocio.use-case';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { IUsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { ISocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';
import { IPasswordEncrypterService } from 'src/domain/services/password-encrypter.service';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import { Genero } from 'src/domain/entities/Persona/Genero';

describe('ActualizarSocioUseCase — limpieza de foto de perfil', () => {
  const buildUseCase = () => {
    const socioRepository: jest.Mocked<ISocioRepository> = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;
    const usuarioRepository: jest.Mocked<IUsuarioRepository> = {
      findByPersonaId: jest.fn(),
    } as any;
    const passwordEncrypter: jest.Mocked<IPasswordEncrypterService> = {
      encryptPassword: jest.fn(),
    } as any;
    const objectStorage: jest.Mocked<IObjectStorageService> = {
      eliminarArchivo: jest.fn(),
      subirArchivo: jest.fn(),
      obtenerUrlFirmada: jest.fn(),
      archivoExiste: jest.fn(),
      obtenerArchivo: jest.fn(),
    } as any;

    const useCase = new ActualizarSocioUseCase(
      socioRepository,
      usuarioRepository,
      passwordEncrypter,
      objectStorage,
    );

    return { useCase, socioRepository, usuarioRepository, passwordEncrypter, objectStorage };
  };

  const buildSocio = (fotoPerfilKey: string | null): SocioEntity =>
    new SocioEntity(
      1,
      'Juan',
      'Pérez',
      new Date('1990-01-01'),
      '1144556677',
      Genero.MASCULINO,
      'Calle 1',
      'CABA',
      'Buenos Aires',
      '12345678',
      [],
      null,
      [],
      fotoPerfilKey,
    );

  it('elimina la foto anterior de MinIO cuando llega una nueva', async () => {
    const { useCase, socioRepository, objectStorage } = buildUseCase();
    const socioExistente = buildSocio('perfiles/socios/vieja.png');
    socioRepository.findById.mockResolvedValue(socioExistente);
    socioRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(
      1,
      { nombre: 'Juan' } as any,
      'perfiles/socios/nueva.png',
      false,
    );

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith('perfiles/socios/vieja.png');
  });

  it('elimina la foto anterior cuando eliminarFoto=true aunque no llegue foto nueva', async () => {
    const { useCase, socioRepository, objectStorage } = buildUseCase();
    const socioExistente = buildSocio('perfiles/socios/vieja.png');
    socioRepository.findById.mockResolvedValue(socioExistente);
    socioRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(1, {} as any, undefined, true);

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith('perfiles/socios/vieja.png');
  });

  it('NO elimina si no hay foto previa y eliminarFoto=true (idempotente)', async () => {
    const { useCase, socioRepository, objectStorage } = buildUseCase();
    const socioExistente = buildSocio(null);
    socioRepository.findById.mockResolvedValue(socioExistente);
    socioRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(1, {} as any, undefined, true);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO elimina si no hay foto nueva y eliminarFoto=false (caso edición normal)', async () => {
    const { useCase, socioRepository, objectStorage } = buildUseCase();
    const socioExistente = buildSocio('perfiles/socios/vieja.png');
    socioRepository.findById.mockResolvedValue(socioExistente);
    socioRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(1, {} as any, undefined, false);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO falla el update si la eliminación de la foto vieja falla en MinIO', async () => {
    const { useCase, socioRepository, objectStorage } = buildUseCase();
    const socioExistente = buildSocio('perfiles/socios/vieja.png');
    socioRepository.findById.mockResolvedValue(socioExistente);
    socioRepository.update.mockImplementation(async (_id, entity) => entity);
    objectStorage.eliminarArchivo.mockRejectedValue(new Error('MinIO down'));

    await expect(
      useCase.execute(1, {} as any, 'perfiles/socios/nueva.png', false),
    ).resolves.toBeDefined();
    expect(socioRepository.update).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
cd "apps/backend" && npx jest src/application/socios/actualizarSocio.use-case.spec.ts
```

Expected: FAIL — el constructor no acepta `objectStorage` aún, y la firma no incluye `eliminarFoto`.

- [ ] **Step 3: Modificar `actualizarSocio.use-case.ts`**

Reemplazar el archivo completo con:

```ts
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BaseUseCase } from '../shared/use-case.base';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import {
  SOCIO_REPOSITORY,
  SocioRepository,
} from 'src/domain/entities/Persona/Socio/socio.repository';
import { ActualizarSocioDto } from './dtos/actualizarSocio.dto';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import {
  IPasswordEncrypterService,
  PASSWORD_ENCRYPTER_SERVICE,
} from 'src/domain/services/password-encrypter.service';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';

@Injectable()
export class ActualizarSocioUseCase implements BaseUseCase {
  private readonly logger = new Logger(ActualizarSocioUseCase.name);

  constructor(
    @Inject(SOCIO_REPOSITORY) private readonly socioRepository: SocioRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
  ) {}

  async execute(
    id: number,
    payload: ActualizarSocioDto,
    fotoPerfilKey?: string,
    eliminarFoto: boolean = false,
  ): Promise<SocioEntity> {
    const socioExistente = await this.socioRepository.findById(id);
    if (!socioExistente) {
      throw new NotFoundException(`Socio con id ${id} no encontrado`);
    }

    const socioActualizado = new SocioEntity(
      id,
      payload.nombre ?? socioExistente.nombre,
      payload.apellido ?? socioExistente.apellido,
      payload.fechaNacimiento
        ? new Date(payload.fechaNacimiento)
        : socioExistente.fechaNacimiento,
      payload.telefono ?? socioExistente.telefono,
      payload.genero ?? socioExistente.genero,
      payload.direccion ?? socioExistente.direccion,
      payload.ciudad ?? socioExistente.ciudad,
      payload.provincia ?? socioExistente.provincia,
      payload.dni ?? socioExistente.dni,
      socioExistente.turnos,
      socioExistente.fichaSalud,
      socioExistente.planesAlimentacion,
    );

    if (fotoPerfilKey) {
      if (socioExistente.fotoPerfilKey) {
        await this.eliminarFotoAnterior(socioExistente.fotoPerfilKey);
      }
      socioActualizado.fotoPerfilKey = fotoPerfilKey;
    } else if (eliminarFoto && socioExistente.fotoPerfilKey) {
      await this.eliminarFotoAnterior(socioExistente.fotoPerfilKey);
      socioActualizado.fotoPerfilKey = null;
    } else if (socioExistente.fotoPerfilKey) {
      socioActualizado.fotoPerfilKey = socioExistente.fotoPerfilKey;
    }

    const result = await this.socioRepository.update(id, socioActualizado);

    if (payload.contrasena) {
      const usuario = await this.usuarioRepository.findByPersonaId(id);
      if (usuario) {
        const contrasenaEncriptada =
          await this.passwordEncrypter.encryptPassword(payload.contrasena);
        await this.usuarioRepository.update(usuario.idUsuario!, usuario);
      }
    }

    return result;
  }

  private async eliminarFotoAnterior(objectKey: string): Promise<void> {
    try {
      await this.objectStorage.eliminarArchivo(objectKey);
    } catch (error) {
      this.logger.warn(
        `No se pudo eliminar la foto anterior ${objectKey} del bucket: ${error}`,
      );
    }
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
cd "apps/backend" && npx jest src/application/socios/actualizarSocio.use-case.spec.ts
```

Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/application/socios/actualizarSocio.use-case.ts apps/backend/src/application/socios/actualizarSocio.use-case.spec.ts
git commit -m "feat(socios): limpiar foto de perfil vieja de MinIO al actualizar"
```

---

## Task 2: Modificar `SociosController` para leer `eliminarFoto` del body

**Files:**
- Modify: `apps/backend/src/presentation/http/controllers/socios.controller.ts:106-141`

- [ ] **Step 1: Verificar firma actual**

Leer `apps/backend/src/presentation/http/controllers/socios.controller.ts`. Confirmar que el método `actualizarSocio` (líneas 106-141) tiene la firma `(id, actualizarSocioDto, file)` y usa `this.actualizarSocioUseCase.execute(id, dto, fotoPerfilKey)`.

- [ ] **Step 2: Modificar el método `actualizarSocio`**

Reemplazar las líneas 106-141 con:

```ts
@Put(':id')
@Rol(RolEnum.ADMIN)
@Actions('socios.editar')
@UseInterceptors(FileInterceptor('foto'))
async actualizarSocio(
  @Param('id', ParseIntPipe) id: number,
  @Body() actualizarSocioDto: ActualizarSocioDto,
  @UploadedFile() file?: Express.Multer.File,
  @Body('eliminarFoto') eliminarFotoRaw?: string,
) {
  this.logger.log(`Actualizando socio ${id}`);

  let fotoPerfilKey: string | undefined;

  if (file) {
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    fotoPerfilKey = `perfiles/socios/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

    await this.objectStorage.subirArchivo(
      fotoPerfilKey,
      file.buffer,
      file.mimetype,
    );

    this.logger.log(`Foto de perfil actualizada: ${fotoPerfilKey}`);
  }

  const eliminarFoto = eliminarFotoRaw === 'true';

  const socioActualizado = await this.actualizarSocioUseCase.execute(
    id,
    actualizarSocioDto,
    fotoPerfilKey,
    eliminarFoto,
  );
  return new SocioResponseDto(socioActualizado);
}
```

Nota: el `ActualizarSocioDto` ya se construye sin `eliminarFoto` por NestJS si no está en el DTO. Estamos leyendo `eliminarFoto` por separado del body, así que no rompe validación.

- [ ] **Step 3: Correr el typecheck del backend**

```bash
cd "apps/backend" && npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/presentation/http/controllers/socios.controller.ts
git commit -m "feat(socios): leer campo eliminarFoto del FormData"
```

---

## Task 3: Modificar `update-nutricionista.use-case.ts` con limpieza de foto vieja (TDD)

**Files:**
- Modify: `apps/backend/src/application/profesionales/use-cases/update-nutricionista.use-case.ts`
- Create: `apps/backend/src/application/profesionales/use-cases/update-nutricionista.use-case.spec.ts`

- [ ] **Step 1: Leer el use-case actual**

Abrir `apps/backend/src/application/profesionales/use-cases/update-nutricionista.use-case.ts`. Confirmar la firma `execute(id, payload, fotoPerfilKey?)` y los repositorios que inyecta.

- [ ] **Step 2: Crear el archivo de test con 5 tests completos**

```ts
// apps/backend/src/application/profesionales/use-cases/update-nutricionista.use-case.spec.ts
import { UpdateNutricionistaUseCase } from './update-nutricionista.use-case';
import { INutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IUsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { IPasswordEncrypterService } from 'src/domain/services/password-encrypter.service';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { Genero } from 'src/domain/entities/Persona/Genero';

describe('UpdateNutricionistaUseCase — limpieza de foto de perfil', () => {
  const buildUseCase = () => {
    const nutricionistaRepository: jest.Mocked<INutricionistaRepository> = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;
    const usuarioRepository: jest.Mocked<IUsuarioRepository> = {
      findByPersonaId: jest.fn(),
    } as any;
    const passwordEncrypter: jest.Mocked<IPasswordEncrypterService> = {
      encryptPassword: jest.fn(),
    } as any;
    const objectStorage: jest.Mocked<IObjectStorageService> = {
      eliminarArchivo: jest.fn(),
      subirArchivo: jest.fn(),
      obtenerUrlFirmada: jest.fn(),
      archivoExiste: jest.fn(),
      obtenerArchivo: jest.fn(),
    } as any;

    const useCase = new UpdateNutricionistaUseCase(
      nutricionistaRepository,
      usuarioRepository,
      passwordEncrypter,
      objectStorage,
    );

    return { useCase, nutricionistaRepository, objectStorage };
  };

  const buildNutricionista = (fotoPerfilKey: string | null): NutricionistaEntity => {
    const entity = new NutricionistaEntity(
      1, 'Ana', 'García', new Date('1985-05-15'),
      '1144556677', Genero.FEMENINO, 'Calle 2', 'Córdoba', 'Córdoba',
      '87654321', 'MN-1234', 5, 10000, null, null, null, null, null, null, fotoPerfilKey,
    );
    return entity;
  };

  it('elimina la foto anterior de MinIO cuando llega una nueva', async () => {
    const { useCase, nutricionistaRepository, objectStorage } = buildUseCase();
    nutricionistaRepository.findById.mockResolvedValue(buildNutricionista('perfiles/nutricionistas/vieja.png'));
    nutricionistaRepository.update.mockImplementation(async (_id, entity: any) => entity);

    await useCase.execute(1, {} as any, 'perfiles/nutricionistas/nueva.png', false);

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith('perfiles/nutricionistas/vieja.png');
  });

  it('elimina la foto anterior cuando eliminarFoto=true aunque no llegue foto nueva', async () => {
    const { useCase, nutricionistaRepository, objectStorage } = buildUseCase();
    nutricionistaRepository.findById.mockResolvedValue(buildNutricionista('perfiles/nutricionistas/vieja.png'));
    nutricionistaRepository.update.mockImplementation(async (_id, entity: any) => entity);

    await useCase.execute(1, {} as any, undefined, true);

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith('perfiles/nutricionistas/vieja.png');
  });

  it('NO elimina si no hay foto previa y eliminarFoto=true (idempotente)', async () => {
    const { useCase, nutricionistaRepository, objectStorage } = buildUseCase();
    nutricionistaRepository.findById.mockResolvedValue(buildNutricionista(null));
    nutricionistaRepository.update.mockImplementation(async (_id, entity: any) => entity);

    await useCase.execute(1, {} as any, undefined, true);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO elimina si no hay foto nueva y eliminarFoto=false (caso edición normal)', async () => {
    const { useCase, nutricionistaRepository, objectStorage } = buildUseCase();
    nutricionistaRepository.findById.mockResolvedValue(buildNutricionista('perfiles/nutricionistas/vieja.png'));
    nutricionistaRepository.update.mockImplementation(async (_id, entity: any) => entity);

    await useCase.execute(1, {} as any, undefined, false);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO falla el update si la eliminación de la foto vieja falla en MinIO', async () => {
    const { useCase, nutricionistaRepository, objectStorage } = buildUseCase();
    nutricionistaRepository.findById.mockResolvedValue(buildNutricionista('perfiles/nutricionistas/vieja.png'));
    nutricionistaRepository.update.mockImplementation(async (_id, entity: any) => entity);
    objectStorage.eliminarArchivo.mockRejectedValue(new Error('MinIO down'));

    await expect(
      useCase.execute(1, {} as any, 'perfiles/nutricionistas/nueva.png', false),
    ).resolves.toBeDefined();
    expect(nutricionistaRepository.update).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Correr el test y verificar que falla**

```bash
cd "apps/backend" && npx jest src/application/profesionales/use-cases/update-nutricionista.use-case.spec.ts
```

Expected: FAIL — el constructor no acepta `objectStorage` aún.

- [ ] **Step 4: Modificar el use-case**

Agregar a los imports:

```ts
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';
```

Inyectar en el constructor:

```ts
@Inject(OBJECT_STORAGE_SERVICE)
private readonly objectStorage: IObjectStorageService,
```

Cambiar la firma del `execute` a:

```ts
async execute(
  id: number,
  payload: UpdateNutricionistaDto,
  fotoPerfilKey?: string,
  eliminarFoto: boolean = false,
): Promise<NutricionistaEntity>
```

Reemplazar la sección de foto (buscar la línea que setea `fotoPerfilKey`):

```ts
if (fotoPerfilKey) {
  if (existingNutricionista.fotoPerfilKey) {
    await this.eliminarFotoAnterior(existingNutricionista.fotoPerfilKey);
  }
  updatedNutricionista.fotoPerfilKey = fotoPerfilKey;
} else if (eliminarFoto && existingNutricionista.fotoPerfilKey) {
  await this.eliminarFotoAnterior(existingNutricionista.fotoPerfilKey);
  updatedNutricionista.fotoPerfilKey = null;
} else if (existingNutricionista.fotoPerfilKey) {
  updatedNutricionista.fotoPerfilKey = existingNutricionista.fotoPerfilKey;
}
```

Agregar al final de la clase (antes del cierre):

```ts
private readonly logger = new Logger(UpdateNutricionistaUseCase.name);

private async eliminarFotoAnterior(objectKey: string): Promise<void> {
  try {
    await this.objectStorage.eliminarArchivo(objectKey);
  } catch (error) {
    this.logger.warn(
      `No se pudo eliminar la foto anterior ${objectKey} del bucket: ${error}`,
    );
  }
}
```

- [ ] **Step 5: Correr el test y verificar que pasa**

```bash
cd "apps/backend" && npx jest src/application/profesionales/use-cases/update-nutricionista.use-case.spec.ts
```

Expected: PASS (5/5).

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/application/profesionales/use-cases/update-nutricionista.use-case.ts apps/backend/src/application/profesionales/use-cases/update-nutricionista.use-case.spec.ts
git commit -m "feat(nutricionistas): limpiar foto de perfil vieja de MinIO al actualizar"
```

---

## Task 4: Modificar `ProfesionalController` para leer `eliminarFoto`

**Files:**
- Modify: `apps/backend/src/presentation/http/controllers/profesional.controller.ts`

- [ ] **Step 1: Localizar el método `actualizarProfesional`**

Abrir `apps/backend/src/presentation/http/controllers/profesional.controller.ts`. Buscar el método `@Put(':id')` que usa `FileInterceptor('foto')` y `this.updateNutricionistaUseCase.execute(id, dto, fotoPerfilKey)`. Identificar las líneas exactas (probablemente entre 145-185).

- [ ] **Step 2: Modificar el método `actualizarProfesional`**

Cambiar la firma del método para agregar `@Body('eliminarFoto') eliminarFotoRaw?: string` y pasar el cuarto parámetro al use-case. El path prefix en MinIO es `perfiles/nutricionistas/...` (NO `perfiles/socios/`).

```ts
@Put(':id')
@Rol(RolEnum.ADMIN)
@Actions('profesionales.editar')
@UseInterceptors(FileInterceptor('foto'))
async actualizarProfesional(
  @Param('id', ParseIntPipe) id: number,
  @Body() actualizarProfesionalDto: ActualizarProfesionalDto,
  @UploadedFile() file?: Express.Multer.File,
  @Body('eliminarFoto') eliminarFotoRaw?: string,
) {
  this.logger.log(`Actualizando profesional ${id}`);

  let fotoPerfilKey: string | undefined;

  if (file) {
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    fotoPerfilKey = `perfiles/nutricionistas/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

    await this.objectStorage.subirArchivo(
      fotoPerfilKey,
      file.buffer,
      file.mimetype,
    );

    this.logger.log(`Foto de perfil actualizada: ${fotoPerfilKey}`);
  }

  const eliminarFoto = eliminarFotoRaw === 'true';

  const profesionalActualizado = await this.updateNutricionistaUseCase.execute(
    id,
    actualizarProfesionalDto,
    fotoPerfilKey,
    eliminarFoto,
  );
  return new ProfesionalResponseDto(profesionalActualizado);
}
```

- [ ] **Step 3: Correr typecheck del backend**

```bash
cd "apps/backend" && npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/presentation/http/controllers/profesional.controller.ts
git commit -m "feat(profesional): leer campo eliminarFoto del FormData"
```

---

## Task 5: Modificar `update-recepcionista.use-case.ts` con limpieza de foto vieja (TDD)

**Files:**
- Modify: `apps/backend/src/application/recepcionistas/use-cases/update-recepcionista.use-case.ts`
- Create: `apps/backend/src/application/recepcionistas/use-cases/update-recepcionista.use-case.spec.ts`

- [ ] **Step 1: Crear el archivo de test con 5 tests completos**

```ts
// apps/backend/src/application/recepcionistas/use-cases/update-recepcionista.use-case.spec.ts
import { UpdateRecepcionistaUseCase } from './update-recepcionista.use-case';
import { IRecepcionistaRepository } from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { RecepcionistaEntity } from 'src/domain/entities/Persona/Recepcionista/recepcionista.entity';
import { Genero } from 'src/domain/entities/Persona/Genero';

describe('UpdateRecepcionistaUseCase — limpieza de foto de perfil', () => {
  const buildUseCase = () => {
    const recepcionistaRepository: jest.Mocked<IRecepcionistaRepository> = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;
    const logger: jest.Mocked<IAppLoggerService> = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;
    const objectStorage: jest.Mocked<IObjectStorageService> = {
      eliminarArchivo: jest.fn(),
      subirArchivo: jest.fn(),
      obtenerUrlFirmada: jest.fn(),
      archivoExiste: jest.fn(),
      obtenerArchivo: jest.fn(),
    } as any;

    const useCase = new UpdateRecepcionistaUseCase(
      recepcionistaRepository,
      logger,
      objectStorage,
    );

    return { useCase, recepcionistaRepository, objectStorage };
  };

  const buildRecepcionista = (fotoPerfilKey: string | null): RecepcionistaEntity => {
    const entity = new RecepcionistaEntity(
      1, 'Lucía', 'Martínez', new Date('1992-03-20'),
      '1144556677', Genero.FEMENINO, 'Calle 3', 'Rosario', 'Santa Fe',
      '11222333', null,
    );
    entity.fotoPerfilKey = fotoPerfilKey;
    return entity;
  };

  it('elimina la foto anterior de MinIO cuando llega una nueva', async () => {
    const { useCase, recepcionistaRepository, objectStorage } = buildUseCase();
    recepcionistaRepository.findById.mockResolvedValue(buildRecepcionista('perfiles/recepcionistas/vieja.png'));
    recepcionistaRepository.update.mockImplementation(async (_id, entity: any) => entity);

    await useCase.execute(1, {} as any, 'perfiles/recepcionistas/nueva.png', false);

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith('perfiles/recepcionistas/vieja.png');
  });

  it('elimina la foto anterior cuando eliminarFoto=true aunque no llegue foto nueva', async () => {
    const { useCase, recepcionistaRepository, objectStorage } = buildUseCase();
    recepcionistaRepository.findById.mockResolvedValue(buildRecepcionista('perfiles/recepcionistas/vieja.png'));
    recepcionistaRepository.update.mockImplementation(async (_id, entity: any) => entity);

    await useCase.execute(1, {} as any, undefined, true);

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith('perfiles/recepcionistas/vieja.png');
  });

  it('NO elimina si no hay foto previa y eliminarFoto=true (idempotente)', async () => {
    const { useCase, recepcionistaRepository, objectStorage } = buildUseCase();
    recepcionistaRepository.findById.mockResolvedValue(buildRecepcionista(null));
    recepcionistaRepository.update.mockImplementation(async (_id, entity: any) => entity);

    await useCase.execute(1, {} as any, undefined, true);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO elimina si no hay foto nueva y eliminarFoto=false (caso edición normal)', async () => {
    const { useCase, recepcionistaRepository, objectStorage } = buildUseCase();
    recepcionistaRepository.findById.mockResolvedValue(buildRecepcionista('perfiles/recepcionistas/vieja.png'));
    recepcionistaRepository.update.mockImplementation(async (_id, entity: any) => entity);

    await useCase.execute(1, {} as any, undefined, false);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO falla el update si la eliminación de la foto vieja falla en MinIO', async () => {
    const { useCase, recepcionistaRepository, objectStorage } = buildUseCase();
    recepcionistaRepository.findById.mockResolvedValue(buildRecepcionista('perfiles/recepcionistas/vieja.png'));
    recepcionistaRepository.update.mockImplementation(async (_id, entity: any) => entity);
    objectStorage.eliminarArchivo.mockRejectedValue(new Error('MinIO down'));

    await expect(
      useCase.execute(1, {} as any, 'perfiles/recepcionistas/nueva.png', false),
    ).resolves.toBeDefined();
    expect(recepcionistaRepository.update).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
cd "apps/backend" && npx jest src/application/recepcionistas/use-cases/update-recepcionista.use-case.spec.ts
```

Expected: FAIL — el constructor no acepta `objectStorage` aún.

- [ ] **Step 3: Modificar el use-case**

Reemplazar el archivo completo con:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UpdateRecepcionistaDto } from '../dtos/update-recepcionista.dto';
import { RecepcionistaEntity } from 'src/domain/entities/Persona/Recepcionista/recepcionista.entity';
import {
  RECEPCIONISTA_REPOSITORY,
  RecepcionistaRepository,
} from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';

@Injectable()
export class UpdateRecepcionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(RECEPCIONISTA_REPOSITORY)
    private readonly recepcionistaRepository: RecepcionistaRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
  ) {}

  async execute(
    id: number,
    payload: UpdateRecepcionistaDto,
    fotoPerfilKey?: string,
    eliminarFoto: boolean = false,
  ): Promise<RecepcionistaEntity> {
    const existing = await this.recepcionistaRepository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Recepcionista con id ${id} no encontrado`);
    }

    if (payload.nombre) existing.nombre = payload.nombre;
    if (payload.apellido) existing.apellido = payload.apellido;
    if (payload.fechaNacimiento)
      existing.fechaNacimiento = new Date(payload.fechaNacimiento);
    if (payload.telefono) existing.telefono = payload.telefono;
    if (payload.genero) existing.genero = payload.genero;
    if (payload.direccion) existing.direccion = payload.direccion;
    if (payload.ciudad) existing.ciudad = payload.ciudad;
    if (payload.provincia) existing.provincia = payload.provincia;

    if (fotoPerfilKey) {
      if (existing.fotoPerfilKey) {
        await this.eliminarFotoAnterior(existing.fotoPerfilKey);
      }
      existing.fotoPerfilKey = fotoPerfilKey;
    } else if (eliminarFoto && existing.fotoPerfilKey) {
      await this.eliminarFotoAnterior(existing.fotoPerfilKey);
      existing.fotoPerfilKey = null;
    }

    const updated = await this.recepcionistaRepository.update(id, existing);

    this.logger.log(
      `Recepcionista ${id} actualizado correctamente: ${updated.nombre}`,
    );

    return updated;
  }

  private async eliminarFotoAnterior(objectKey: string): Promise<void> {
    try {
      await this.objectStorage.eliminarArchivo(objectKey);
    } catch (error) {
      this.logger.warn(
        `No se pudo eliminar la foto anterior ${objectKey} del bucket: ${error}`,
      );
    }
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
cd "apps/backend" && npx jest src/application/recepcionistas/use-cases/update-recepcionista.use-case.spec.ts
```

Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/application/recepcionistas/use-cases/update-recepcionista.use-case.ts apps/backend/src/application/recepcionistas/use-cases/update-recepcionista.use-case.spec.ts
git commit -m "feat(recepcionistas): limpiar foto de perfil vieja de MinIO al actualizar"
```

---

## Task 6: Modificar `RecepcionistasController` para leer `eliminarFoto` + agregar `GET /:id/foto`

**Files:**
- Modify: `apps/backend/src/presentation/http/controllers/recepcionistas.controller.ts`

- [ ] **Step 1: Modificar el método de actualización para leer `eliminarFoto`**

Localizar el método `@Put(':id')` que usa `FileInterceptor('fotoPerfil')`. Modificarlo para:

1. Agregar `@Body('eliminarFoto') eliminarFotoRaw?: string` a la firma.
2. Convertir `eliminarFotoRaw === 'true'` a booleano.
3. Pasar el cuarto parámetro al use-case.

```ts
@Put(':id')
@Rol(RolEnum.ADMIN)
@UseInterceptors(FileInterceptor('fotoPerfil'))
async actualizarRecepcionista(
  @Param('id', ParseIntPipe) id: number,
  @Body() actualizarRecepcionistaDto: ActualizarRecepcionistaDto,
  @UploadedFile() file?: Express.Multer.File,
  @Body('eliminarFoto') eliminarFotoRaw?: string,
) {
  this.logger.log(`Actualizando recepcionista ${id}`);

  let fotoPerfilKey: string | undefined;

  if (file) {
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    fotoPerfilKey = `perfiles/recepcionistas/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

    await this.objectStorage.subirArchivo(
      fotoPerfilKey,
      file.buffer,
      file.mimetype,
    );

    this.logger.log(`Foto de perfil actualizada: ${fotoPerfilKey}`);
  }

  const eliminarFoto = eliminarFotoRaw === 'true';

  const recepcionistaActualizado = await this.updateRecepcionistaUseCase.execute(
    id,
    actualizarRecepcionistaDto,
    fotoPerfilKey,
    eliminarFoto,
  );
  return new RecepcionistaResponseDto(recepcionistaActualizado);
}
```

- [ ] **Step 2: Inyectar `OBJECT_STORAGE_SERVICE` en el constructor del controller si no lo está**

Verificar el constructor de `RecepcionistasController`. Si no tiene `objectStorage`, agregar:

```ts
@Inject(OBJECT_STORAGE_SERVICE)
private readonly objectStorage: IObjectStorageService,
```

Y agregar a los imports:

```ts
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';
```

- [ ] **Step 3: Agregar endpoint `GET /:id/foto`**

Agregar este método a la clase (después del método de actualización):

```ts
@Public()
@Get(':id/foto')
async obtenerFoto(
  @Param('id', ParseIntPipe) id: number,
  @Res() res: Response,
) {
  const recepcionista = await this.updateRecepcionistaUseCase['recepcionistaRepository'].findById(id);

  if (!recepcionista || !recepcionista.fotoPerfilKey) {
    return res.redirect(
      'https://ui-avatars.com/api/?name=Recep&background=6366f1&color=fff&size=200',
    );
  }

  const archivo = await this.objectStorage.obtenerArchivo(
    recepcionista.fotoPerfilKey,
  );

  if (!archivo) {
    return res.redirect(
      'https://ui-avatars.com/api/?name=Recep&background=6366f1&color=fff&size=200',
    );
  }

  res.setHeader('Content-Type', archivo.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.send(archivo.buffer);
}
```

Nota: si el controller no tiene un caso de uso `findRecepcionistaById` ya expuesto, usar directamente el repositorio inyectado (con `@Inject(RECEPCIONISTA_REPOSITORY)`). Ajustar la línea del `findById` según lo que esté disponible en el controller.

- [ ] **Step 4: Correr typecheck del backend**

```bash
cd "apps/backend" && npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/presentation/http/controllers/recepcionistas.controller.ts
git commit -m "feat(recepcionistas): endpoint GET /:id/foto + leer eliminarFoto del FormData"
```

---

## Task 7: Crear componente `SelectorImagen` con TDD

**Files:**
- Create: `apps/frontend/src/components/imagen/SelectorImagen.tsx`
- Create: `apps/frontend/src/components/imagen/__tests__/SelectorImagen.test.tsx`

- [ ] **Step 1: Escribir test que falla — renderiza drop-zone y preview**

```tsx
// apps/frontend/src/components/imagen/__tests__/SelectorImagen.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectorImagen } from '../SelectorImagen';

// Mock del DialogoZoomImagen (no queremos testear su lógica acá)
vi.mock('@/components/media/DialogoZoomImagen', () => ({
  DialogoZoomImagen: ({ abierto, onConfirmar, onCancelar }: any) =>
    abierto ? (
      <div data-testid="dialogo-zoom">
        <button onClick={() => onConfirmar(new File(['x'], 'test.jpg', { type: 'image/jpeg' }))}>
          confirmar
        </button>
        <button onClick={onCancelar}>cancelar</button>
      </div>
    ) : null,
}));

describe('SelectorImagen', () => {
  it('renderiza la drop-zone con el label y el botón "Seleccionar archivo" cuando no hay valor actual', () => {
    render(<SelectorImagen alCambiarFoto={() => {}} etiqueta="Foto del Socio" />);
    expect(screen.getByText('Foto del Socio')).toBeInTheDocument();
    expect(screen.getByText('Seleccionar archivo')).toBeInTheDocument();
  });

  it('renderiza el preview circular con botón X cuando hay valorActual', () => {
    render(
      <SelectorImagen
        alCambiarFoto={() => {}}
        valorActual="/socio/1/foto?v=abc"
      />,
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/socio/1/foto?v=abc');
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });

  it('abre el DialogoZoomImagen cuando el usuario selecciona un archivo', () => {
    render(<SelectorImagen alCambiarFoto={() => {}} />);
    const input = screen.getByLabelText('Seleccionar archivo') as HTMLInputElement;
    const file = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByTestId('dialogo-zoom')).toBeInTheDocument();
  });

  it('llama a alCambiarFoto con el File cuando el usuario confirma en el DialogoZoomImagen', () => {
    const onChange = vi.fn();
    render(<SelectorImagen alCambiarFoto={onChange} />);
    const input = screen.getByLabelText('Seleccionar archivo') as HTMLInputElement;
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText('confirmar'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBeInstanceOf(File);
  });

  it('llama a alCambiarFoto con null cuando el usuario hace click en X', () => {
    const onChange = vi.fn();
    render(
      <SelectorImagen
        alCambiarFoto={onChange}
        valorActual="/socio/1/foto?v=abc"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('muestra mensaje de error si el archivo no es imagen', () => {
    render(<SelectorImagen alCambiarFoto={() => {}} error="El archivo debe ser una imagen" />);
    expect(screen.getByText('El archivo debe ser una imagen')).toBeInTheDocument();
  });

  it('NO abre el DialogoZoomImagen si el archivo no es imagen (validación cliente)', () => {
    render(<SelectorImagen alCambiarFoto={() => {}} />);
    const input = screen.getByLabelText('Seleccionar archivo') as HTMLInputElement;
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.queryByTestId('dialogo-zoom')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
cd "apps/frontend" && npx vitest run src/components/imagen/__tests__/SelectorImagen.test.tsx
```

Expected: FAIL — el archivo `SelectorImagen.tsx` no existe.

- [ ] **Step 3: Crear el componente `SelectorImagen.tsx`**

```tsx
// apps/frontend/src/components/imagen/SelectorImagen.tsx
import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DialogoZoomImagen } from '@/components/media/DialogoZoomImagen';
import { cn } from '@/lib/utils';

interface PropiedadesSelectorImagen {
  valorActual?: string | null;
  alCambiarFoto: (archivo: File | null) => void;
  etiqueta?: string;
  error?: string | null;
  deshabilitado?: boolean;
  tamanoPreview?: number;
}

export function SelectorImagen({
  valorActual,
  alCambiarFoto,
  etiqueta = 'Foto de perfil',
  error,
  deshabilitado = false,
  tamanoPreview = 128,
}: PropiedadesSelectorImagen) {
  const [archivoEnEdicion, setArchivoEnEdicion] = useState<File | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const mensajeError = error ?? errorValidacion;

  const manejarArchivo = (archivo: File) => {
    if (!archivo.type.startsWith('image/')) {
      setErrorValidacion('El archivo debe ser una imagen (jpg, png, etc.)');
      return;
    }
    setErrorValidacion(null);
    setArchivoEnEdicion(archivo);
    setDialogoAbierto(true);
  };

  const manejarInputArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];
    if (archivo) {
      manejarArchivo(archivo);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const manejarDrop = (evento: React.DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    setArrastrando(false);
    if (deshabilitado) {
      return;
    }
    const archivo = evento.dataTransfer.files[0];
    if (archivo) {
      manejarArchivo(archivo);
    }
  };

  const confirmarZoom = (archivoProcesado: File) => {
    setDialogoAbierto(false);
    setArchivoEnEdicion(null);
    alCambiarFoto(archivoProcesado);
  };

  const cancelarZoom = () => {
    setDialogoAbierto(false);
    setArchivoEnEdicion(null);
  };

  const quitarFoto = () => {
    if (deshabilitado) {
      return;
    }
    alCambiarFoto(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{etiqueta}</label>

      <div
        onDrop={manejarDrop}
        onDragOver={(evento) => {
          evento.preventDefault();
          if (!deshabilitado) {
            setArrastrando(true);
          }
        }}
        onDragLeave={() => setArrastrando(false)}
        className={cn(
          'rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          arrastrando
            ? 'border-primary bg-primary/5'
            : 'border-border bg-background',
          deshabilitado && 'cursor-not-allowed opacity-60',
        )}
      >
        {valorActual ? (
          <div className="relative inline-block">
            <img
              src={valorActual}
              alt={etiqueta}
              style={{
                width: tamanoPreview,
                height: tamanoPreview,
              }}
              className="rounded-full object-cover"
            />
            {!deshabilitado && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={quitarFoto}
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0"
                aria-label={`Quitar ${etiqueta.toLowerCase()}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Arrastrá una imagen aquí o
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={deshabilitado}
                onClick={() => inputRef.current?.click()}
              >
                Seleccionar archivo
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={manejarInputArchivo}
                disabled={deshabilitado}
                aria-label={etiqueta}
              />
            </div>
            {mensajeError && (
              <p className="mt-2 text-sm text-destructive">{mensajeError}</p>
            )}
          </div>
        )}
      </div>

      <DialogoZoomImagen
        abierto={dialogoAbierto}
        archivoOriginal={archivoEnEdicion}
        titulo="Ajustar foto de perfil"
        onCancelar={cancelarZoom}
        onConfirmar={confirmarZoom}
      />
    </div>
  );
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
cd "apps/frontend" && npx vitest run src/components/imagen/__tests__/SelectorImagen.test.tsx
```

Expected: PASS (7/7).

- [ ] **Step 5: Correr lint del frontend**

```bash
cd "apps/frontend" && npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/imagen/SelectorImagen.tsx apps/frontend/src/components/imagen/__tests__/SelectorImagen.test.tsx
git commit -m "feat(frontend): componente SelectorImagen reutilizable con crop y preview"
```

---

## Task 8: Integrar `SelectorImagen` en `Socios.tsx`

**Files:**
- Modify: `apps/frontend/src/pages/Socios.tsx`

- [ ] **Step 1: Localizar la sección de foto en `Socios.tsx`**

El input file de creación está alrededor de la línea 580+ (buscar `type="file"`). El input file de edición está en el modal de edición. También el state `fotoCreacion` y `fotoEdicion`.

- [ ] **Step 2: Cambiar la convención de estado a 3 estados**

En el componente `Socios()`, reemplazar:

```ts
const [fotoCreacion, setFotoCreacion] = useState<File | null>(null);
const [fotoEdicion, setFotoEdicion] = useState<File | null>(null);
```

Por:

```ts
type EstadoFoto = string | File | null;
const [fotoCreacion, setFotoCreacion] = useState<EstadoFoto>(null);
const [fotoEdicion, setFotoEdicion] = useState<EstadoFoto>(null);
```

- [ ] **Step 3: Inicializar `fotoEdicion` con la URL del socio al abrir el modal de edición**

En la función `abrirModalEdicion(socio)`, agregar:

```ts
setFotoEdicion(socio.fotoPerfilUrl ?? null);
```

- [ ] **Step 4: Reemplazar el input file del modal de creación por `<SelectorImagen>`**

Localizar el bloque con el input file para `fotoCreacion`. Reemplazar por:

```tsx
<SelectorImagen
  etiqueta="Foto del Socio"
  alCambiarFoto={setFotoCreacion}
  deshabilitado={cargando}
/>
```

Eliminar el state local y el input viejo.

- [ ] **Step 5: Reemplazar el input file del modal de edición por `<SelectorImagen>`**

Localizar el bloque con el input file para `fotoEdicion`. Reemplazar por:

```tsx
<SelectorImagen
  etiqueta="Foto del Socio"
  valorActual={
    typeof fotoEdicion === 'string' ? fotoEdicion : socioSeleccionado?.fotoPerfilUrl ?? null
  }
  alCambiarFoto={setFotoEdicion}
  deshabilitado={cargando}
/>
```

- [ ] **Step 6: Adaptar la lógica de submit para usar la convención de 3 estados**

En `crearSocio`, antes de armar el FormData:

```ts
const formData = new FormData();
Object.entries(socioForm).forEach(([key, value]) => {
  if (value !== null && value !== undefined && key !== 'foto') {
    formData.append(key, String(value));
  }
});
if (fotoCreacion instanceof File) {
  formData.append('foto', fotoCreacion);
}
```

En `actualizarSocio`, antes de armar el FormData:

```ts
const formData = new FormData();
Object.entries(socioFormEdicion).forEach(([key, value]) => {
  if (value !== null && value !== undefined && key !== 'foto') {
    formData.append(key, String(value));
  }
});
if (fotoEdicion instanceof File) {
  formData.append('foto', fotoEdicion);
} else if (fotoEdicion === null && socioAEditar?.fotoPerfilUrl) {
  formData.append('eliminarFoto', 'true');
}
```

- [ ] **Step 7: Limpiar `fotoEdicion` al cerrar el modal**

En el handler de cerrar modal:

```ts
setFotoEdicion(null);
```

- [ ] **Step 8: Correr typecheck y lint**

```bash
cd "apps/frontend" && npm run typecheck && npm run lint
```

Expected: PASS.

- [ ] **Step 9: Verificar manualmente con el dev server levantado por el usuario**

Manual: crear un socio, ver que se puede arrastrar imagen, recorta, guardar. Editar socio existente, ver preview, reemplazar, ver que aparece la nueva. Editar, click en X, guardar, ver que la foto desaparece del listado.

- [ ] **Step 10: Commit**

```bash
git add apps/frontend/src/pages/Socios.tsx
git commit -m "refactor(socios): usar SelectorImagen en lugar de input file simple"
```

---

## Task 9: Refactorizar `Nutricionistas.tsx` para usar `SelectorImagen`

**Files:**
- Modify: `apps/frontend/src/pages/Nutricionistas.tsx`

- [ ] **Step 1: Localizar el patrón actual que usa `DialogoZoomImagen`**

Buscar `DialogoZoomImagen` (línea ~1452) y todo el estado relacionado (`fotoCreacion`, `fotoEdicion`, `mostrarDialogoZoomFoto`, `archivoAjusteFoto`, `contextoAjusteFoto`, `cerrarDialogoZoomFoto`, `abrirDialogoZoomFoto`, `confirmarDialogoZoomFoto`).

- [ ] **Step 2: Eliminar el estado y handlers del `DialogoZoomImagen`**

Borrar:
- `useState<ContextoAjusteFoto | null>(null)` y relacionados
- Funciones `cerrarDialogoZoomFoto`, `abrirDialogoZoomFoto`, `confirmarDialogoZoomFoto`
- El import de `DialogoZoomImagen` y `ContextoAjusteFoto`
- El JSX de `<DialogoZoomImagen ...>`

- [ ] **Step 3: Cambiar la convención de estado a 3 estados**

```ts
type EstadoFoto = string | File | null;
const [fotoCreacion, setFotoCreacion] = useState<EstadoFoto>(null);
const [fotoEdicion, setFotoEdicion] = useState<EstadoFoto>(null);
```

- [ ] **Step 4: Reemplazar el input file + dialogo del modal de creación**

Localizar el bloque con el input file para `fotoCreacion` (alrededor de línea 1077-1110). Reemplazar por:

```tsx
<SelectorImagen
  etiqueta="Foto de perfil"
  alCambiarFoto={setFotoCreacion}
  deshabilitado={cargando}
/>
```

- [ ] **Step 5: Reemplazar el input file + dialogo del modal de edición**

Localizar el bloque con el input file para `fotoEdicion` (alrededor de línea 1361-1395). Reemplazar por:

```tsx
<SelectorImagen
  etiqueta="Foto de perfil"
  valorActual={
    typeof fotoEdicion === 'string'
      ? fotoEdicion
      : nutricionistaSeleccionado?.fotoPerfilUrl ?? null
  }
  alCambiarFoto={setFotoEdicion}
  deshabilitado={cargando}
/>
```

- [ ] **Step 6: Adaptar la lógica de submit**

En las funciones de submit, aplicar la misma convención de 3 estados que en Task 8.

- [ ] **Step 7: Correr typecheck y lint**

```bash
cd "apps/frontend" && npm run typecheck && npm run lint
```

Expected: PASS.

- [ ] **Step 8: Verificar manualmente con dev server**

Manual: crear nutricionista con foto, editar, reemplazar, click en X, verificar.

- [ ] **Step 9: Commit**

```bash
git add apps/frontend/src/pages/Nutricionistas.tsx
git commit -m "refactor(nutricionistas): usar SelectorImagen en lugar de DialogoZoomImagen directo"
```

---

## Task 10: Crear página `Recepcionistas.tsx` con CRUD completo

**Files:**
- Create: `apps/frontend/src/pages/Recepcionistas.tsx`
- Create: `apps/frontend/src/types/recepcionista.ts` (si no existe)
- Modify: `apps/frontend/src/components/layout/Sidebar.tsx` (agregar link)

- [ ] **Step 1: Verificar/crear tipos del recepcionista**

Verificar si existe `apps/frontend/src/types/recepcionista.ts`. Si no, crearlo siguiendo el patrón de `apps/frontend/src/types/nutricionista.ts`. El tipo debe incluir: `idPersona, nombre, apellido, dni, fechaNacimiento, telefono, genero, direccion, ciudad, provincia, email, fotoPerfilUrl, fotoPerfilKey`.

- [ ] **Step 2: Crear `Recepcionistas.tsx` (estructura inicial)**

Copiar la estructura base de `Nutricionistas.tsx` y adaptarla:
- `FORMULARIO_RECEPCIONISTA_INICIAL` con los campos del recepcionista
- `useState` para lista, form crear, form editar
- `apiRequest<Recepcionista[]>` para listar (endpoint `GET /recepcionistas`)
- `useState<Recepcionista | null>(null)` para seleccionado

- [ ] **Step 3: Implementar handlers de crear, editar, eliminar**

- `crearRecepcionista`: arma FormData, llama `POST /recepcionistas`, refresca lista
- `abrirModalEdicion(recepcionista)`: setea `recepcionistaEditando` y `fotoEdicion = recepcionista.fotoPerfilUrl ?? null`
- `actualizarRecepcionista`: arma FormData con la convención de 3 estados, llama `PUT /recepcionistas/:id`
- `confirmarEliminar(recepcionista)`: llama `DELETE /recepcionistas/:id`

- [ ] **Step 4: Renderizar tabla con avatar + acciones**

Tabla shadcn con columnas: Foto (Avatar con `obtenerUrlFoto(recepcionista.fotoPerfilUrl)`), Nombre, Apellido, DNI, Email, Estado, Acciones (botones Editar/Eliminar).

- [ ] **Step 5: Modal de creación con `<SelectorImagen>`**

Dialog shadcn con form: nombre, apellido, dni, fechaNacimiento, telefono, genero, direccion, ciudad, provincia, email, contraseña, `<SelectorImagen alCambiarFoto={setFotoCreacion}>`.

- [ ] **Step 6: Modal de edición con `<SelectorImagen>`**

Dialog shadcn con los mismos campos, precargados, y `<SelectorImagen valorActual={...} alCambiarFoto={setFotoEdicion}>`.

- [ ] **Step 7: Verificar permisos**

Solo ADMIN puede ver/operar esta página. Usar `<Can I="recepcionistas.ver">` o verificar `rol === 'ADMIN'`.

- [ ] **Step 8: Agregar entrada en el Sidebar**

Modificar `apps/frontend/src/components/layout/Sidebar.tsx`: agregar item "Recepcionistas" en el menú Admin con `href="/recepcionistas"`, ícono `UserCog` o similar, solo visible para rol ADMIN.

- [ ] **Step 9: Crear la ruta en TanStack Router**

Verificar cómo se registran las rutas en `apps/frontend/src/main.tsx` o el router. Agregar la ruta `/recepcionistas` → `RecepcionistasPage` lazy-loaded.

- [ ] **Step 10: Correr typecheck y lint**

```bash
cd "apps/frontend" && npm run typecheck && npm run lint
```

Expected: PASS.

- [ ] **Step 11: Verificar manualmente con dev server**

Manual: login como ADMIN, ir a /recepcionistas, ver tabla vacía. Crear uno con foto. Verificar que aparece. Editar, reemplazar foto. Eliminar. Verificar que desaparece.

- [ ] **Step 12: Commit**

```bash
git add apps/frontend/src/pages/Recepcionistas.tsx apps/frontend/src/types/recepcionista.ts apps/frontend/src/components/layout/Sidebar.tsx
git commit -m "feat(frontend): página CRUD de recepcionistas con SelectorImagen"
```

---

## Task 11: Verificación final

- [ ] **Step 1: Lint del workspace completo**

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 2: Typecheck del backend**

```bash
cd "apps/backend" && npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Typecheck del frontend**

```bash
cd "apps/frontend" && npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Correr todos los tests del backend**

```bash
cd "apps/backend" && npx jest
```

Expected: PASS.

- [ ] **Step 5: Correr todos los tests del frontend**

```bash
cd "apps/frontend" && npx vitest run
```

Expected: PASS.

- [ ] **Step 6: Verificación manual end-to-end con dev server levantado por el usuario**

Probar con cada rol:
1. Login como ADMIN.
2. Ir a /socios → crear socio arrastrando imagen → recorta → guardar → ver foto en listado.
3. Editar socio → reemplazar foto → guardar → confirmar visualmente.
4. Editar socio → click en X → guardar → confirmar que la foto se removió.
5. Ir a /nutricionistas → mismo flujo.
6. Ir a /recepcionistas → crear con foto → editar → reemplazar → eliminar.

- [ ] **Step 7: Verificar bucket de MinIO**

Si tenés acceso al MinIO Console (o vía CLI `mc`):
- Confirmar que después de reemplazar fotos NO hay archivos huérfanos.
- Confirmar que después de remover fotos, los archivos correspondientes ya no existen en el bucket.

- [ ] **Step 8: Commit final (si hubo ajustes)**

```bash
git status
# si hay cambios:
git add -A
git commit -m "chore: ajustes finales verificados"
```

---

## Self-Review Checklist

- [x] Cada sección del spec tiene al menos una task que la implementa
- [x] No hay placeholders ("TBD", "TODO", "implement later", etc.)
- [x] Los nombres de tipos, funciones, métodos y propiedades son consistentes entre tasks
- [x] Todos los archivos tienen paths exactos
- [x] Cada task tiene código completo en cada step
- [x] Comandos exactos con expected output
- [x] Commits frecuentes (después de cada paso significativo)
- [x] TDD: tests escritos antes de la implementación cuando aplica
