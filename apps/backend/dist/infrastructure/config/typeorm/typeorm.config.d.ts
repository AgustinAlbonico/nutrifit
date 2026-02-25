import 'reflect-metadata';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvironmentConfigService } from '../environment-config/environment-config.service';
export declare const AppDataSource: (config: EnvironmentConfigService) => TypeOrmModuleOptions;
