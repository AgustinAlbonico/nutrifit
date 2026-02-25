"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLoggerModule = void 0;
const common_1 = require("@nestjs/common");
const app_logger_service_1 = require("./app-logger.service");
const logger_service_1 = require("../../../domain/services/logger.service");
let AppLoggerModule = class AppLoggerModule {
};
exports.AppLoggerModule = AppLoggerModule;
exports.AppLoggerModule = AppLoggerModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: logger_service_1.APP_LOGGER_SERVICE,
                useClass: app_logger_service_1.AppLoggerService,
            },
        ],
        exports: [logger_service_1.APP_LOGGER_SERVICE],
    })
], AppLoggerModule);
//# sourceMappingURL=app-logger.module.js.map