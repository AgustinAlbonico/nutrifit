import { Global, Module } from '@nestjs/common';
import { EnvironmentConfigService } from './environment-config.service';
// import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    // ConfigModule.forRoot({
    //   isGlobal: true, // Hace que esté disponible en toda la app
    //   envFilePath: ['.env'], // Podés cambiarlo por .env.dev, etc.
    // }),
  ],
  providers: [EnvironmentConfigService],
  exports: [EnvironmentConfigService],
})
export class EnvironmentConfigModule {}
