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
  Inject,
  UseGuards,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateRecepcionistaDto } from 'src/application/recepcionistas/dtos/create-recepcionista.dto';
import { UpdateRecepcionistaDto } from 'src/application/recepcionistas/dtos/update-recepcionista.dto';
import { RecepcionistaResponseDto } from 'src/application/recepcionistas/dtos/recepcionista-response.dto';
import { CreateRecepcionistaUseCase } from 'src/application/recepcionistas/use-cases/create-recepcionista.use-case';
import { ListRecepcionistasUseCase } from 'src/application/recepcionistas/use-cases/list-recepcionistas.use-case';
import { GetRecepcionistaUseCase } from 'src/application/recepcionistas/use-cases/get-recepcionista.use-case';
import { UpdateRecepcionistaUseCase } from 'src/application/recepcionistas/use-cases/update-recepcionista.use-case';
import { DeleteRecepcionistaUseCase } from 'src/application/recepcionistas/use-cases/delete-recepcionista.use-case';
import { ReactivarRecepcionistaUseCase } from 'src/application/recepcionistas/use-cases/reactivar-recepcionista.use-case';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  OBJECT_STORAGE_SERVICE,
  IObjectStorageService,
} from 'src/domain/services/object-storage.service';
import { Public } from 'src/infrastructure/auth/decorators/public.decorator';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';

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
    const entity = await this.getRecepcionistaUseCase.execute(+id);
    return RecepcionistaResponseDto.fromEntity(entity);
  }

  @Public()
  @Get(':id/foto')
  async obtenerFoto(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const recepcionista = await this.getRecepcionistaUseCase.execute(id);

    if (!recepcionista || !recepcionista.fotoPerfilKey) {
      return res.redirect(
        'https://ui-avatars.com/api/?name=Recepcionista&background=f59e0b&color=fff&size=200',
      );
    }

    const archivo = await this.objectStorage.obtenerArchivo(
      recepcionista.fotoPerfilKey,
    );

    if (!archivo) {
      return res.redirect(
        'https://ui-avatars.com/api/?name=Recepcionista&background=f59e0b&color=fff&size=200',
      );
    }

    res.setHeader('Content-Type', archivo.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(archivo.buffer);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecepcionistaDto,
    @UploadedFile() file?: Express.Multer.File,
    @Body('eliminarFoto') eliminarFotoRaw?: string,
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

    const eliminarFoto = eliminarFotoRaw === 'true';

    const result = await this.updateRecepcionistaUseCase.execute(
      +id,
      dto,
      fotoPerfilKey,
      eliminarFoto,
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
