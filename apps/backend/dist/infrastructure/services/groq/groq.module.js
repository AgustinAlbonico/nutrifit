"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqModule = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_service_1 = require("../../../domain/services/ai-provider.service");
const groq_service_1 = require("./groq.service");
let GroqModule = class GroqModule {
};
exports.GroqModule = GroqModule;
exports.GroqModule = GroqModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: ai_provider_service_1.AI_PROVIDER_SERVICE,
                useClass: groq_service_1.GroqService,
            },
        ],
        exports: [ai_provider_service_1.AI_PROVIDER_SERVICE],
    })
], GroqModule);
//# sourceMappingURL=groq.module.js.map