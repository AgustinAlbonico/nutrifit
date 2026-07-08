import { Module } from '@nestjs/common';
import type { StringValue } from 'ms';

import { PasswordEncrypterService } from 'src/infrastructure/services/bcrypt/bcrypt.service';
import { LoginUseCase } from './login.use-case';
import { CambiarContrasenaUseCase } from './cambiar-contrasena.use-case';
import { EstablecerContrasenaUseCase } from './establecer-contrasena.use-case';
import { SolicitarRecuperacionContrasenaUseCase } from './solicitar-recuperacion-contrasena.use-case';
import { ConfirmarRecuperacionContrasenaUseCase } from './confirmar-recuperacion-contrasena.use-case';
import { ResetearContrasenaUsuarioUseCase } from './resetear-contrasena-usuario.use-case';
import { PASSWORD_ENCRYPTER_SERVICE } from 'src/domain/services/password-encrypter.service';
import { JWT_SERVICE } from 'src/domain/services/jwt.service';
import { JwtServiceImpl } from 'src/infrastructure/services/jwt/jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { LoginAuditOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/login-audit.entity';
import { USUARIO_REPOSITORY } from 'src/domain/entities/Usuario/usuario.repository';
import { UsuarioRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories';
import { EnvironmentConfigModule } from 'src/infrastructure/config/environment-config/environment-config.module';
import { EnvironmentConfigService } from 'src/infrastructure/config/environment-config/environment-config.service';
import { EmailModule } from 'src/application/email/email.module';
import { LoginAuditService } from 'src/infrastructure/services/auditoria/login-audit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioOrmEntity, LoginAuditOrmEntity]),
    JwtModule.registerAsync({
      imports: [EnvironmentConfigModule],
      inject: [EnvironmentConfigService],
      useFactory: (configService: EnvironmentConfigService) => ({
        secret: configService.getJwtSecret(),
        signOptions: {
          expiresIn: configService.getJwtExpirationTime() as StringValue,
        },
      }),
    }),
    AppLoggerModule,
    EmailModule,
  ],
  providers: [
    {
      provide: PASSWORD_ENCRYPTER_SERVICE,
      useClass: PasswordEncrypterService,
    },
    {
      provide: JWT_SERVICE,
      useClass: JwtServiceImpl,
    },
    { provide: USUARIO_REPOSITORY, useClass: UsuarioRepositoryImplementation },
    LoginUseCase,
    LoginAuditService,
    CambiarContrasenaUseCase,
    EstablecerContrasenaUseCase,
    SolicitarRecuperacionContrasenaUseCase,
    ConfirmarRecuperacionContrasenaUseCase,
    ResetearContrasenaUsuarioUseCase,
  ],
  exports: [
    LoginUseCase,
    CambiarContrasenaUseCase,
    EstablecerContrasenaUseCase,
    SolicitarRecuperacionContrasenaUseCase,
    ConfirmarRecuperacionContrasenaUseCase,
    ResetearContrasenaUsuarioUseCase,
    JwtModule,
    JWT_SERVICE,
    USUARIO_REPOSITORY,
  ],
})
export class AuthModule {}
