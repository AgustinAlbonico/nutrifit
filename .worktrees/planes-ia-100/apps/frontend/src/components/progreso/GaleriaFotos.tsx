import { Plus, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TarjetaFoto } from './TarjetaFoto';
import type { GaleriaFotos, FotoProgreso, TipoFoto } from './types';

interface PropiedadesGaleriaFotos {
  socioId: number;
  galeria?: GaleriaFotos;
  cargando?: boolean;
  puedeEditar?: boolean;
  onEliminarFoto?: (fotoId: number) => void;
  fotoEliminando?: number | null;
  onSubirFoto?: () => void;
}

const ORDEN_TIPOS: TipoFoto[] = ['frente', 'perfil', 'espalda', 'otro'];

const ETIQUETAS_TIPO: Record<string, string> = {
  frente: 'Frente',
  perfil: 'Perfil',
  espalda: 'Espalda',
  otro: 'Otro',
};

export function GaleriaFotos({
  galeria,
  cargando = false,
  puedeEditar = false,
  onEliminarFoto,
  fotoEliminando,
  onSubirFoto,
}: PropiedadesGaleriaFotos) {
  if (cargando) {
    return (
      <div className="space-y-6">
        {ORDEN_TIPOS.map((tipo) => (
          <Card key={tipo}>
            <CardHeader>
              <CardTitle className="text-lg">{ETIQUETAS_TIPO[tipo]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!galeria?.fotos || galeria.fotos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            No hay fotos de progreso registradas
          </p>
          {puedeEditar && onSubirFoto && (
            <Button onClick={onSubirFoto}>
              <Plus className="h-4 w-4 mr-2" />
              Subir primera foto
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const fotosPorTipo = ORDEN_TIPOS.reduce((acc, tipo) => {
    acc[tipo] = [];
    return acc;
  }, {} as Record<TipoFoto, FotoProgreso[]>);

  galeria.fotos.forEach((grupo) => {
    const tipo = grupo.tipoFoto as TipoFoto;
    if (fotosPorTipo[tipo]) {
      fotosPorTipo[tipo] = grupo.fotos.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    }
  });

  return (
    <div className="space-y-6">
      {puedeEditar && onSubirFoto && (
        <div className="flex justify-end">
          <Button onClick={onSubirFoto}>
            <Plus className="h-4 w-4 mr-2" />
            Subir foto
          </Button>
        </div>
      )}

      {ORDEN_TIPOS.map((tipo) => {
        const fotos = fotosPorTipo[tipo];
        if (fotos.length === 0) return null;

        return (
          <Card key={tipo}>
            <CardHeader>
              <CardTitle className="text-lg">
                {ETIQUETAS_TIPO[tipo]} ({fotos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {fotos.map((foto) => (
                  <TarjetaFoto
                    key={foto.idFoto}
                    foto={foto}
                    puedeEliminar={puedeEditar}
                    onDelete={() => onEliminarFoto?.(foto.idFoto)}
                    eliminando={fotoEliminando === foto.idFoto}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
