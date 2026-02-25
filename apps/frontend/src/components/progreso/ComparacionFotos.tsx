import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ReactCompareSlider } from 'react-compare-slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageIcon } from 'lucide-react';
import type { TipoFoto, GaleriaFotos } from './types';

interface PropiedadesComparacionFotos {
  galeria?: GaleriaFotos;
  cargando?: boolean;
}

const ETIQUETAS_TIPO: Record<string, string> = {
  frente: 'Frente',
  perfil: 'Perfil',
  espalda: 'Espalda',
  otro: 'Otro',
};

export function ComparacionFotos({ galeria, cargando = false }: PropiedadesComparacionFotos) {
  const [tipoSeleccionado, establecerTipoSeleccionado] = useState<TipoFoto>('frente');
  const [fotoAntesId, establecerFotoAntesId] = useState<number | null>(null);
  const [fotoDespuesId, establecerFotoDespuesId] = useState<number | null>(null);

  const fotosFiltradas = useMemo(() => {
    if (!galeria?.fotos) return [];
    const grupo = galeria.fotos.find((g) => g.tipoFoto === tipoSeleccionado);
    return grupo?.fotos.sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    ) || [];
  }, [galeria, tipoSeleccionado]);

  const fotoAntes = useMemo(
    () => fotosFiltradas.find((f) => f.idFoto === fotoAntesId),
    [fotosFiltradas, fotoAntesId]
  );

  const fotoDespues = useMemo(
    () => fotosFiltradas.find((f) => f.idFoto === fotoDespuesId),
    [fotosFiltradas, fotoDespuesId]
  );

  const seleccionarAutomaticamente = () => {
    if (fotosFiltradas.length >= 2) {
      establecerFotoAntesId(fotosFiltradas[0].idFoto);
      establecerFotoDespuesId(fotosFiltradas[fotosFiltradas.length - 1].idFoto);
    }
  };

  if (cargando) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparación antes/después</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const tiposDisponibles = galeria?.fotos
    ?.filter((g) => g.fotos.length >= 2)
    .map((g) => g.tipoFoto) || [];

  if (tiposDisponibles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparación antes/después</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Necesitás al menos 2 fotos del mismo tipo para comparar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparación antes/después</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Tipo de foto</Label>
            <Select
              value={tipoSeleccionado}
              onValueChange={(valor) => {
                establecerTipoSeleccionado(valor as TipoFoto);
                establecerFotoAntesId(null);
                establecerFotoDespuesId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposDisponibles.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {ETIQUETAS_TIPO[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Foto "Antes"</Label>
            <Select
              value={fotoAntesId?.toString() || ''}
              onValueChange={(valor) => establecerFotoAntesId(Number(valor))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {fotosFiltradas
                  .filter((f) => f.idFoto !== fotoDespuesId)
                  .map((foto) => (
                    <SelectItem key={foto.idFoto} value={foto.idFoto.toString()}>
                      {format(new Date(foto.fecha), "d 'de' MMM yyyy", { locale: es })}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Foto "Después"</Label>
            <Select
              value={fotoDespuesId?.toString() || ''}
              onValueChange={(valor) => establecerFotoDespuesId(Number(valor))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {fotosFiltradas
                  .filter((f) => f.idFoto !== fotoAntesId)
                  .map((foto) => (
                    <SelectItem key={foto.idFoto} value={foto.idFoto.toString()}>
                      {format(new Date(foto.fecha), "d 'de' MMM yyyy", { locale: es })}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={seleccionarAutomaticamente}
              disabled={fotosFiltradas.length < 2}
            >
              Primera vs Última
            </Button>
          </div>
        </div>

        {fotoAntes && fotoDespues ? (
          <div className="space-y-4">
            <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
              <ReactCompareSlider
                itemOne={
                  <div className="relative w-full h-full">
                    <img
                      src={fotoAntes.urlFirmada}
                      alt="Antes"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                      Antes: {format(new Date(fotoAntes.fecha), "d 'de' MMM yyyy", { locale: es })}
                    </div>
                  </div>
                }
                itemTwo={
                  <div className="relative w-full h-full">
                    <img
                      src={fotoDespues.urlFirmada}
                      alt="Despues"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                      Despues: {format(new Date(fotoDespues.fecha), "d 'de' MMM yyyy", { locale: es })}
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">
              Seleccioná las fotos "Antes" y "Después" para comparar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
