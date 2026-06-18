import { useMemo, useState } from 'react';
import { ReactCompareSlider } from 'react-compare-slider';
import { Camera } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FotoProgreso, FotosSesion, TipoFoto } from './types';

interface PropiedadesComparadorFotosSesion {
  sesiones?: FotosSesion[];
}

const etiquetasTipo: Record<TipoFoto, string> = {
  frente: 'Frente',
  perfil: 'Perfil',
  espalda: 'Espalda',
  otro: 'Otra',
};

export function ComparadorFotosSesion({
  sesiones = [],
}: PropiedadesComparadorFotosSesion) {
  const sesionesConFotos = useMemo(
    () => sesiones.filter((sesion) => sesion.fotos.some((grupo) => grupo.fotos.length > 0)),
    [sesiones],
  );
  const [tipoFoto, setTipoFoto] = useState<TipoFoto>('frente');
  const [turnoAntesId, setTurnoAntesId] = useState<string>('');
  const [turnoDespuesId, setTurnoDespuesId] = useState<string>('');

  const fotoAntes = obtenerFotoSesion(sesionesConFotos, turnoAntesId, tipoFoto);
  const fotoDespues = obtenerFotoSesion(sesionesConFotos, turnoDespuesId, tipoFoto);

  const tiposDisponibles = useMemo(() => {
    const tipos = new Set<TipoFoto>();
    sesionesConFotos.forEach((sesion) => {
      sesion.fotos.forEach((grupo) => {
        if (grupo.fotos.length > 0) tipos.add(grupo.tipoFoto);
      });
    });
    return Array.from(tipos);
  }, [sesionesConFotos]);

  if (sesionesConFotos.length < 2) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
          <Camera className="mb-3 h-10 w-10" />
          <p>Necesitás fotos en al menos dos sesiones para comparar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-primary" />
          Comparador por sesión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Tipo de toma</Label>
            <Select value={tipoFoto} onValueChange={(valor) => setTipoFoto(valor as TipoFoto)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposDisponibles.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {etiquetasTipo[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SelectorSesion
            etiqueta="Sesión anterior"
            sesiones={sesionesConFotos}
            valor={turnoAntesId}
            onCambiar={setTurnoAntesId}
          />
          <SelectorSesion
            etiqueta="Sesión posterior"
            sesiones={sesionesConFotos}
            valor={turnoDespuesId}
            onCambiar={setTurnoDespuesId}
          />
        </div>

        {fotoAntes && fotoDespues ? (
          <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
            <ReactCompareSlider
              itemOne={<ImagenComparacion foto={fotoAntes} etiqueta="Antes" />}
              itemTwo={<ImagenComparacion foto={fotoDespues} etiqueta="Después" />}
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed bg-muted/20 text-center text-sm text-muted-foreground">
            Elegí dos sesiones con foto de {etiquetasTipo[tipoFoto].toLowerCase()}.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SelectorSesion({
  etiqueta,
  sesiones,
  valor,
  onCambiar,
}: {
  etiqueta: string;
  sesiones: FotosSesion[];
  valor: string;
  onCambiar: (valor: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{etiqueta}</Label>
      <Select value={valor} onValueChange={onCambiar}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar sesión" />
        </SelectTrigger>
        <SelectContent>
          {sesiones.map((sesion) => (
            <SelectItem key={sesion.turnoId ?? 'sin-turno'} value={String(sesion.turnoId)}>
              {sesion.fechaTurno ?? 'Sin fecha'} {sesion.horaTurno ? `- ${sesion.horaTurno}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ImagenComparacion({ foto, etiqueta }: { foto: FotoProgreso; etiqueta: string }) {
  return (
    <div className="relative h-full w-full">
      <img
        src={foto.urlFirmada}
        alt={`${etiqueta}: foto de progreso`}
        className="h-full w-full object-cover"
      />
      <span className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-sm font-medium text-white">
        {etiqueta}
      </span>
    </div>
  );
}

function obtenerFotoSesion(
  sesiones: FotosSesion[],
  turnoId: string,
  tipoFoto: TipoFoto,
): FotoProgreso | null {
  const sesion = sesiones.find((item) => String(item.turnoId) === turnoId);
  return sesion?.fotos.find((grupo) => grupo.tipoFoto === tipoFoto)?.fotos.at(0) ?? null;
}
