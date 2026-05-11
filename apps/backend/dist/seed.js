"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.accionesAdmin = exports.accionesProfesional = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const grupo_permiso_entity_1 = require("./infrastructure/persistence/typeorm/entities/grupo-permiso.entity");
const accion_entity_1 = require("./infrastructure/persistence/typeorm/entities/accion.entity");
const typeorm_config_1 = require("./infrastructure/config/typeorm/typeorm.config");
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: '.env' });
var acciones_constants_1 = require("./catalogos/acciones.constants");
Object.defineProperty(exports, "accionesProfesional", { enumerable: true, get: function () { return acciones_constants_1.accionesProfesional; } });
Object.defineProperty(exports, "accionesAdmin", { enumerable: true, get: function () { return acciones_constants_1.accionesAdmin; } });
const acciones_constants_2 = require("./catalogos/acciones.constants");
async function runSeed() {
    console.log('Iniciando seed de permisos...');
    const options = (0, typeorm_config_1.AppDataSource)({
        getDatabaseHost: () => process.env.DATABASE_HOST,
        getDatabasePort: () => Number(process.env.DATABASE_PORT),
        getDatabaseUser: () => process.env.DATABASE_USER,
        getDatabasePassword: () => process.env.DATABASE_PASSWORD,
        getDatabaseName: () => process.env.DATABASE_NAME,
    });
    const dataSource = new typeorm_1.DataSource(options);
    try {
        await dataSource.initialize();
        const grupoRepository = dataSource.getRepository(grupo_permiso_entity_1.GrupoPermisoOrmEntity);
        const accionRepository = dataSource.getRepository(accion_entity_1.AccionOrmEntity);
        const gruposExistentes = await grupoRepository.count();
        if (gruposExistentes > 0) {
            console.log('✅ Los datos de permisos ya existen. Saltando seed.');
            await dataSource.destroy();
            return;
        }
        console.log('📝 Creando grupo PROFESIONAL...');
        const grupoProfesional = grupoRepository.create({
            clave: 'PROFESIONAL',
            nombre: 'Profesional',
            descripcion: 'Grupo de permisos para nutricionistas',
            acciones: [],
            hijos: [],
        });
        await grupoRepository.save(grupoProfesional);
        console.log('📝 Creando grupo ADMIN...');
        const grupoAdmin = grupoRepository.create({
            clave: 'ADMIN',
            nombre: 'Administrador',
            descripcion: 'Grupo de permisos para administradores',
            acciones: [],
            hijos: [],
        });
        await grupoRepository.save(grupoAdmin);
        console.log('📝 Creando acciones de PROFESIONAL...');
        const accionesProfesionalCreadas = [];
        for (const accion of acciones_constants_2.accionesProfesional) {
            const existeAccion = await accionRepository.findOne({
                where: { clave: accion.clave },
            });
            if (!existeAccion) {
                const accionEntity = accionRepository.create(accion);
                const saved = await accionRepository.save(accionEntity);
                accionesProfesionalCreadas.push(saved);
            }
            else {
                accionesProfesionalCreadas.push(existeAccion);
            }
        }
        console.log('📝 Asignando acciones al grupo PROFESIONAL...');
        grupoProfesional.acciones = accionesProfesionalCreadas;
        await grupoRepository.save(grupoProfesional);
        console.log('📝 Creando acciones de ADMIN...');
        const accionesAdminCreadas = [];
        for (const accion of acciones_constants_2.accionesAdmin) {
            const existeAccion = await accionRepository.findOne({
                where: { clave: accion.clave },
            });
            if (!existeAccion) {
                const accionEntity = accionRepository.create(accion);
                const saved = await accionRepository.save(accionEntity);
                accionesAdminCreadas.push(saved);
            }
            else {
                accionesAdminCreadas.push(existeAccion);
            }
        }
        console.log('📝 Asignando acciones al grupo ADMIN...');
        grupoAdmin.acciones = accionesAdminCreadas;
        await grupoRepository.save(grupoAdmin);
        console.log('✅ Seed de permisos completado exitosamente');
        console.log('');
        console.log('📊 Resumen:');
        console.log(`   - Grupos creados: 2 (PROFESIONAL, ADMIN)`);
        console.log(`   - Acciones PROFESIONAL: ${accionesProfesionalCreadas.length}`);
        console.log(`   - Acciones ADMIN: ${accionesAdminCreadas.length}`);
    }
    catch (error) {
        console.error('❌ Error al ejecutar el seed:', error);
        if (dataSource) {
            await dataSource.destroy();
        }
        process.exit(1);
    }
}
runSeed();
//# sourceMappingURL=seed.js.map