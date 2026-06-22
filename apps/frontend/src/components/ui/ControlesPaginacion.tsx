import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ControlesPaginacionProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  limite: number;
  opcionesLimite?: number[];
  cargando?: boolean;
  onCambiarPagina: (page: number) => void;
  onCambiarLimite: (limit: number) => void;
}

export function ControlesPaginacion({
  pagina,
  totalPaginas,
  total,
  limite,
  opcionesLimite = [10, 25, 50, 100],
  cargando = false,
  onCambiarPagina,
  onCambiarLimite,
}: ControlesPaginacionProps) {
  if (total === 0) return null;

  const desde = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const hasta = Math.min(pagina * limite, total);

  function generarPaginas(): (number | 'ellipsis')[] {
    const paginas: (number | 'ellipsis')[] = [];
    if (totalPaginas <= 7) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
      return paginas;
    }
    paginas.push(1);
    if (pagina > 3) paginas.push('ellipsis');
    const start = Math.max(2, pagina - 1);
    const end = Math.min(totalPaginas - 1, pagina + 1);
    for (let i = start; i <= end; i++) paginas.push(i);
    if (pagina < totalPaginas - 2) paginas.push('ellipsis');
    paginas.push(totalPaginas);
    return paginas;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
      <p className="text-sm text-muted-foreground">
        Mostrando {desde}-{hasta} de {total} resultados
      </p>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground mr-1">Por página:</span>
          <Select
            value={String(limite)}
            onValueChange={(v) => onCambiarLimite(Number(v))}
            disabled={cargando}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opcionesLimite.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={pagina <= 1 || cargando}
            onClick={() => onCambiarPagina(pagina - 1)}
            aria-label="Página anterior"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          {generarPaginas().map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">...</span>
            ) : (
              <Button
                key={p}
                variant={p === pagina ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                disabled={cargando}
                onClick={() => onCambiarPagina(p)}
                aria-label={`Ir a página ${p}`}
                aria-current={p === pagina ? 'page' : undefined}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={pagina >= totalPaginas || cargando}
            onClick={() => onCambiarPagina(pagina + 1)}
            aria-label="Página siguiente"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
