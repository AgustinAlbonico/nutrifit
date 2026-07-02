export interface AlimentoNuevoDto {
  nombre: string;
  categoriaNombre: string;
  cantidadBase: number;
  unidadBase: string;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
}
