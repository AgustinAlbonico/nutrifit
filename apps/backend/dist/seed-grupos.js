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
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: '.env' });
const GRUPOS_ALIMENTICIOS = [
    'Lácteos',
    'Carnes',
    'Vegetales',
    'Frutas',
    'Cereales y derivados',
    'Legumbres',
    'Aceites y grasas',
    'Azúcares y dulces',
    'Bebidas',
    'Otros',
];
async function main() {
    const dataSource = new typeorm_1.DataSource({
        type: 'mysql',
        host: process.env.DATABASE_HOST || 'localhost',
        port: Number(process.env.DATABASE_PORT) || 3306,
        username: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || 'root',
        database: process.env.DATABASE_NAME || 'nutrifit_supervisor',
        synchronize: false,
    });
    await dataSource.initialize();
    console.log('Conexión a la base de datos establecida');
    for (const descripcion of GRUPOS_ALIMENTICIOS) {
        await dataSource.query(`INSERT IGNORE INTO grupo_alimenticio (descripcion) VALUES (?)`, [descripcion]);
        console.log(`Grupo insertado: ${descripcion}`);
    }
    const grupos = await dataSource.query('SELECT * FROM grupo_alimenticio ORDER BY descripcion');
    console.log(`\nTotal grupos en la base de datos: ${grupos.length}`);
    console.log(grupos);
    await dataSource.destroy();
}
main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
//# sourceMappingURL=seed-grupos.js.map