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
  onSubirFotoTipo?: (tipo: TipoFoto) => void;
}

const ORDEN_TIPOS: TipoFoto[] = ['frente', 'perfil', 'espalda', 'otro'];

const ETIQUETAS_TIPO: Record<string, string> = {
  frente: 'Frente',
  perfil: 'Perfil',
  espalda: 'Espalda',
  otro: 'Otro',
};

const DESCRIPCIONES_TIPO: Record<TipoFoto, string> = {
  frente: 'Vista frontal para comparar postura y composicion.',
  perfil: 'Vista lateral para seguir abdomen y alineacion.',
  espalda: 'Vista posterior para cambios de composicion.',
  otro: 'Toma complementaria o detalle clinico adicional.',
};

export function GaleriaFotos({
  galeria,
  cargando = false,
  puedeEditar = false,
  onEliminarFoto,
  fotoEliminando,
  onSubirFoto,
  onSubirFotoTipo,
}: PropiedadesGaleriaFotos) {
  const fotosPorTipo = ORDEN_TIPOS.reduce((acc, tipo) => {
    acc[tipo] = [];
    return acc;
  }, {} as Record<TipoFoto, FotoProgreso[]>);

  galeria?.fotos?.forEach((grupo) => {
    const tipo = grupo.tipoFoto as TipoFoto;
    if (fotosPorTipo[tipo]) {
      fotosPorTipo[tipo] = grupo.fotos.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      );
    }
  });

  const hayAlgunaFoto = ORDEN_TIPOS.some((tipo) => fotosPorTipo[tipo].length > 0);

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

  return (
    <div className="space-y-6">
      {puedeEditar && onSubirFoto && (
        <div className="flex justify-end">
          <Button onClick={onSubirFoto}>
            <Plus className="h-4 w-4 mr-2" />
            {hayAlgunaFoto ? 'Subir foto' : 'Subir primera foto'}
          </Button>
        </div>
      )}

      {!hayAlgunaFoto && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium text-foreground">Todavia no hay fotos de progreso</p>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Cuando cargues imagenes, vas a poder organizarlas por frente, perfil, espalda u otra toma complementaria.
            </p>
          </CardContent>
        </Card>
      )}

      {ORDEN_TIPOS.map((tipo) => {
        const fotos = fotosPorTipo[tipo];

        return (
          <Card key={tipo}>
            <CardHeader>
              <CardTitle className="text-lg">
                {ETIQUETAS_TIPO[tipo]} ({fotos.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">{DESCRIPCIONES_TIPO[tipo]}</p>
            </CardHeader>
            <CardContent>
              {fotos.length > 0 ? (
                <div className="space-y-4">
                  {puedeEditar && onSubirFotoTipo && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => onSubirFotoTipo(tipo)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar otra foto de {ETIQUETAS_TIPO[tipo].toLowerCase()}
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 px-6 py-8 text-center">
                    <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      Sin foto de {ETIQUETAS_TIPO[tipo].toLowerCase()}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Cargala para mantener la comparacion visual completa en tu seguimiento.
                    </p>
                  </div>
                  {puedeEditar && onSubirFotoTipo && (
                    <div className="flex justify-center">
                      <Button onClick={() => onSubirFotoTipo(tipo)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Cargar foto de {ETIQUETAS_TIPO[tipo].toLowerCase()}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
