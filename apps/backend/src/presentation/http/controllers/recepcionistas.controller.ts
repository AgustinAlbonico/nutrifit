import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { CreateRecepcionistaDto } from 'src/application/recepcionistas/dtos/create-recepcionista.dto';
import { UpdateRecepcionistaDto } from 'src/application/recepcionistas/dtos/update-recepcionista.dto';
import { CreateRecepcionistaUseCase } from 'src/application/recepcionistas/use-cases/create-recepcionista.use-case';
import { ListRecepcionistasUseCase } from 'src/application/recepcionistas/use-cases/list-recepcionistas.use-case';
import { GetRecepcionistaUseCase } from 'src/application/recepcionistas/use-cases/get-recepcionista.use-case';
import { UpdateRecepcionistaUseCase } from 'src/application/recepcionistas/use-cases/update-recepcionista.use-case';
import { DeleteRecepcionistaUseCase } from 'src/application/recepcionistas/use-cases/delete-recepcionista.use-case';
import { ReactivarRecepcionistaUseCase } from 'src/application/recepcionistas/use-cases/reactivar-recepcionista.use-case';
import { FileInterceptor } from '@nestjs/platform-express';
import { Inject } from '@nestjs/common';
import {
  OBJECT_STORAGE_SERVICE,
  IObjectStorageService,
} from 'src/domain/services/object-storage.service';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { UseGuards } from '@nestjs/common';

@Controller('recepcionistas')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class RecepcionistasController {
  constructor(
    private readonly createRecepcionistaUseCase: CreateRecepcionistaUseCase,
    private readonly listRecepcionistasUseCase: ListRecepcionistasUseCase,
    private readonly getRecepcionistaUseCase: GetRecepcionistaUseCase,
    private readonly updateRecepcionistaUseCase: UpdateRecepcionistaUseCase,
    private readonly deleteRecepcionistaUseCase: DeleteRecepcionistaUseCase,
    private readonly reactivarRecepcionistaUseCase: ReactivarRecepcionistaUseCase,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
  ) {}

  @Post()
  @Rol(RolEnum.ADMIN)
  @Actions('recepcionistas.crear')
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  async create(
    @Body() dto: CreateRecepcionistaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let fotoPerfilKey: string | undefined;

    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('El archivo debe ser una imagen');
      }
      const timestamp = Date.now();
      const extension = file.originalname.split('.').pop();
      fotoPerfilKey = `perfiles/recepcionistas/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

      await this.objectStorage.subirArchivo(
        fotoPerfilKey,
        file.buffer,
        file.mimetype,
      );
    }

    const result = await this.createRecepcionistaUseCase.execute(
      dto,
      fotoPerfilKey,
    );
    return {
      message: 'Recepcionista creado exitosamente',
      id: result.idPersona,
    };
  }

  @Get()
  async findAll() {
    return this.listRecepcionistasUseCase.execute();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.getRecepcionistaUseCase.execute(+id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecepcionistaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let fotoPerfilKey: string | undefined;

    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('El archivo debe ser una imagen');
      }
      const timestamp = Date.now();
      const extension = file.originalname.split('.').pop();
      fotoPerfilKey = `perfiles/recepcionistas/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

      await this.objectStorage.subirArchivo(
        fotoPerfilKey,
        file.buffer,
        file.mimetype,
      );
    }

    const result = await this.updateRecepcionistaUseCase.execute(
      +id,
      dto,
      fotoPerfilKey,
    );
    return {
      message: 'Recepcionista actualizado exitosamente',
      id: result.idPersona,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.deleteRecepcionistaUseCase.execute(+id);
    return {
      message: 'Recepcionista dado de baja exitosamente',
    };
  }

  @Patch(':id/reactivar')
  async reactivate(@Param('id') id: string) {
    await this.reactivarRecepcionistaUseCase.execute(+id);
    return {
      message: 'Recepcionista reactivado exitosamente',
    };
  }
}
