import { CreateNutricionistaDto } from './create-nutricionista.dto';
declare const UpdateNutricionistaDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateNutricionistaDto>>;
export declare class UpdateNutricionistaDto extends UpdateNutricionistaDto_base {
    idPersona?: number;
}
export {};
