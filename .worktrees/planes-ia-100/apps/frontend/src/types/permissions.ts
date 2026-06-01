export interface ActionDto {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
}

export interface GroupDto {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
  acciones: ActionDto[];
  hijos: Array<Pick<GroupDto, 'id' | 'clave' | 'nombre'>>;
}
