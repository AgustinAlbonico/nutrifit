export interface PreparacionItemResponseDto {
  idPreparacionItem: number;
  alimentoId: number;
  alimentoNombre: string;
  cantidadDefault: number;
  unidadDefault: string;
  // Macros calculados para la cantidadDefault
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export interface PreparacionResponseDto {
  idPreparacion: number;
  nombre: string;
  gimnasioId: number;
  creadoPorId: number;
  items: PreparacionItemResponseDto[];
  // Totales agregados
  totalCalorias: number;
  totalProteinas: number;
  totalCarbohidratos: number;
  totalGrasas: number;
}
