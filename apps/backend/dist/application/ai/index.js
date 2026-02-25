"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = exports.AnalizarPlanNutricionalUseCase = exports.SugerirSustitucionUseCase = exports.GenerarPlanSemanalUseCase = exports.GenerarRecomendacionComidaUseCase = exports.PrepararContextoPacienteUseCase = void 0;
var preparar_contexto_paciente_use_case_1 = require("./use-cases/preparar-contexto-paciente.use-case");
Object.defineProperty(exports, "PrepararContextoPacienteUseCase", { enumerable: true, get: function () { return preparar_contexto_paciente_use_case_1.PrepararContextoPacienteUseCase; } });
var generar_recomendacion_comida_use_case_1 = require("./use-cases/generar-recomendacion-comida.use-case");
Object.defineProperty(exports, "GenerarRecomendacionComidaUseCase", { enumerable: true, get: function () { return generar_recomendacion_comida_use_case_1.GenerarRecomendacionComidaUseCase; } });
var generar_plan_semanal_use_case_1 = require("./use-cases/generar-plan-semanal.use-case");
Object.defineProperty(exports, "GenerarPlanSemanalUseCase", { enumerable: true, get: function () { return generar_plan_semanal_use_case_1.GenerarPlanSemanalUseCase; } });
var sugerir_sustitucion_use_case_1 = require("./use-cases/sugerir-sustitucion.use-case");
Object.defineProperty(exports, "SugerirSustitucionUseCase", { enumerable: true, get: function () { return sugerir_sustitucion_use_case_1.SugerirSustitucionUseCase; } });
var analizar_plan_nutricional_use_case_1 = require("./use-cases/analizar-plan-nutricional.use-case");
Object.defineProperty(exports, "AnalizarPlanNutricionalUseCase", { enumerable: true, get: function () { return analizar_plan_nutricional_use_case_1.AnalizarPlanNutricionalUseCase; } });
var ai_module_1 = require("./ai.module");
Object.defineProperty(exports, "AiModule", { enumerable: true, get: function () { return ai_module_1.AiModule; } });
//# sourceMappingURL=index.js.map