"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOrmConfigModule = void 0;
const common_1 = require("@nestjs/common");
const environment_config_service_1 = require("../environment-config/environment-config.service");
const environment_config_module_1 = require("../environment-config/environment-config.module");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_config_1 = require("./typeorm.config");
let TypeOrmConfigModule = class TypeOrmConfigModule {
};
exports.TypeOrmConfigModule = TypeOrmConfigModule;
exports.TypeOrmConfigModule = TypeOrmConfigModule = __decorate([
    (0, common_1.Module)({
        imports: [
            environment_config_module_1.EnvironmentConfigModule,
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [environment_config_module_1.EnvironmentConfigModule],
                inject: [environment_config_service_1.EnvironmentConfigService],
                useFactory: typeorm_config_1.AppDataSource,
            }),
        ],
    })
], TypeOrmConfigModule);
//# sourceMappingURL=typeorm.module.js.map