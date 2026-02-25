"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordEncrypterModule = void 0;
const common_1 = require("@nestjs/common");
const password_encrypter_service_1 = require("../../../domain/services/password-encrypter.service");
const bcrypt_service_1 = require("./bcrypt.service");
let PasswordEncrypterModule = class PasswordEncrypterModule {
};
exports.PasswordEncrypterModule = PasswordEncrypterModule;
exports.PasswordEncrypterModule = PasswordEncrypterModule = __decorate([
    (0, common_1.Module)({
        providers: [
            { provide: password_encrypter_service_1.PASSWORD_ENCRYPTER_SERVICE, useClass: bcrypt_service_1.PasswordEncrypterService },
        ],
        exports: [password_encrypter_service_1.PASSWORD_ENCRYPTER_SERVICE],
    })
], PasswordEncrypterModule);
//# sourceMappingURL=bcrypt.module.js.map