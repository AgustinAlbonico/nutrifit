import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Check, X, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BarraProgreso } from './BarraProgreso';
import type { Objetivo, EstadoObjetivo } from './types';

interface PropiedadesTarjetaObjetivo {
  objetivo: Objetivo;
  puedeEditar?: boolean;
  onActualizar?: (objetivoId: number, valorActual: number) => void;
  onMarcar?: (objetivoId: number, estado: EstadoObjetivo) => void;
}

const ETIQUETAS_METRICA: Record<string, string> = {
  PESO: 'Peso',
  CINTURA: 'Cintura',
  CADERA: 'Cadera',
  BRAZO: 'Brazo',
  MUSLO: 'Muslo',
  PECHO: 'Pecho',
};

const UNIDADES_METRICA: Record<string, string> = {
  PESO: 'kg',
  CINTURA: 'cm',
  CADERA: 'cm',
  BRAZO: 'cm',
  MUSLO: 'cm',
  PECHO: 'cm',
};

export function TarjetaObjetivo({
  objetivo,
  puedeEditar = false,
  onActualizar,
  onMarcar,
}: PropiedadesTarjetaObjetivo) {
  const [mostrarInput, setMostrarInput] = useState(false);
  const [nuevoValor, setNuevoValor] = useState(objetivo.valorActual.toString());

  const diasRestantes = objetivo.fechaObjetivo
    ? differenceInDays(new Date(objetivo.fechaObjetivo), new Date())
    : null;

  const unidad = UNIDADES_METRICA[objetivo.tipoMetrica] || '';
  const etiquetaMetrica = ETIQUETAS_METRICA[objetivo.tipoMetrica] || objetivo.tipoMetrica;

  const manejarActualizar = () => {
    const valor = parseFloat(nuevoValor);
    if (!isNaN(valor) && onActualizar) {
      onActualizar(objetivo.idObjetivo, valor);
      setMostrarInput(false);
    }
  };

  const obtenerColorEstado = (estado: EstadoObjetivo) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800';
      case 'ABANDONADO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const obtenerEtiquetaEstado = (estado: EstadoObjetivo) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'Completado';
      case 'ABANDONADO':
        return 'Abandonado';
      default:
        return 'Activo';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {etiquetaMetrica}
          </CardTitle>
          <Badge className={obtenerColorEstado(objetivo.estado)}>
            {obtenerEtiquetaEstado(objetivo.estado)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">De</span>
          <span className="font-medium">
            {objetivo.valorInicial} {unidad}
          </span>
          <span className="text-muted-foreground">a</span>
          <span className="font-medium">
            {objetivo.valorObjetivo} {unidad}
          </span>
        </div>

        <BarraProgreso progreso={objetivo.progreso} />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Actual:</span>
          <span className="font-medium flex items-center gap-1">
            {objetivo.valorActual} {unidad}
            {objetivo.valorActual !== objetivo.valorInicial && (
              <TrendingUp
                className={`h-4 w-4 ${
                  objetivo.valorActual < objetivo.valorInicial
                    ? 'text-green-500 rotate-180'
                    : 'text-red-500'
                }`}
              />
            )}
          </span>
        </div>

        {diasRestantes !== null && objetivo.estado === 'ACTIVO' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {diasRestantes > 0
                ? `${diasRestantes} días restantes`
                : diasRestantes === 0
                  ? 'Vence hoy'
                  : `${Math.abs(diasRestantes)} días vencido`}
            </span>
          </div>
        )}

        {puedeEditar && objetivo.estado === 'ACTIVO' && (
          <div className="flex gap-2 pt-2">
            {mostrarInput ? (
              <div className="flex gap-2 w-full">
                <input
                  type="number"
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                  className="flex-1 px-3 py-1 border rounded text-sm"
                  step="0.1"
                />
                <Button size="sm" onClick={manejarActualizar}>
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMostrarInput(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMostrarInput(true)}
                >
                  Actualizar progreso
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      Marcar como...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => onMarcar?.(objetivo.idObjetivo, 'COMPLETADO')}
                    >
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      Completado
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onMarcar?.(objetivo.idObjetivo, 'ABANDONADO')}
                    >
                      <X className="h-4 w-4 mr-2 text-gray-500" />
                      Abandonado
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Iniciado el {format(new Date(objetivo.fechaInicio), 'd MMM yyyy', { locale: es })}
        </div>
      </CardContent>
    </Card>
  );
}
