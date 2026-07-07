import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Eye,
  EyeOff,
  Loader2,
  Power,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Wifi,
} from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  useConfiguracionesIa,
  useEliminarConfiguracionIa,
  useGuardarConfiguracionIa,
  useProbarConexionIa,
  useSolicitarReinicioIa,
} from '@/hooks/useIaConfiguracion';
import { cn } from '@/lib/utils';
import {
  PROVEEDORES_IA,
  type ConfiguracionIa,
  type GuardarConfiguracionIaDto,
  type ProveedorIa,
} from '@/types/iaConfiguracion';

interface FormStatePorProvider {
  [proveedorId: string]: {
    apiKey: string;
    model: string;
    baseUrl: string;
    maxTokens: string;
    temperature: string;
    timeoutMs: string;
    habilitado: boolean;
    orden: string;
  };
}

function formVacio(): FormStatePorProvider[string] {
  return {
    apiKey: '',
    model: '',
    baseUrl: '',
    maxTokens: '',
    temperature: '',
    timeoutMs: '',
    habilitado: true,
    orden: '0',
  };
}

function estadoInicialDesdeConfig(
  config: ConfiguracionIa,
): FormStatePorProvider[string] {
  return {
    apiKey: '',
    model: config.model ?? '',
    baseUrl: config.baseUrl ?? '',
    maxTokens: config.maxTokens?.toString() ?? '',
    temperature: config.temperature?.toString() ?? '',
    timeoutMs: config.timeoutMs?.toString() ?? '',
    habilitado: config.habilitado,
    orden: config.orden?.toString() ?? '0',
  };
}

function formAEsquema(
  form: FormStatePorProvider[string],
  mantenerKey: boolean,
): GuardarConfiguracionIaDto {
  const dto: GuardarConfiguracionIaDto = {
    model: form.model.trim() || undefined,
    baseUrl: form.baseUrl.trim() || undefined,
    habilitado: form.habilitado,
  };

  if (!mantenerKey && form.apiKey.trim()) {
    dto.apiKey = form.apiKey.trim();
  }

  if (form.maxTokens.trim()) {
    const parsed = Number(form.maxTokens);
    if (Number.isFinite(parsed)) dto.maxTokens = parsed;
  }
  if (form.temperature.trim()) {
    const parsed = Number(form.temperature);
    if (Number.isFinite(parsed)) dto.temperature = parsed;
  }
  if (form.timeoutMs.trim()) {
    const parsed = Number(form.timeoutMs);
    if (Number.isFinite(parsed)) dto.timeoutMs = parsed;
  }
  if (form.orden.trim()) {
    const parsed = Number(form.orden);
    if (Number.isFinite(parsed)) dto.orden = parsed;
  }

  return dto;
}

function esFormularioLimpio(
  form: FormStatePorProvider[string],
  original: FormStatePorProvider[string],
): boolean {
  return JSON.stringify(form) === JSON.stringify(original);
}

export function SuperAdminIaConfigPage() {
  const { data: configuraciones = [], isLoading } = useConfiguracionesIa();
  const guardarMut = useGuardarConfiguracionIa();
  const eliminarMut = useEliminarConfiguracionIa();
  const probarMut = useProbarConexionIa();
  const reiniciarMut = useSolicitarReinicioIa();

  const [forms, setForms] = useState<FormStatePorProvider>({});
  const [originales, setOriginales] = useState<FormStatePorProvider>({});
  const [providerAEliminar, setProviderAEliminar] =
    useState<ConfiguracionIa | null>(null);
  const [providerProbando, setProviderProbando] = useState<ProveedorIa | null>(
    null,
  );
  const [mostrarReinicio, setMostrarReinicio] = useState(false);

  useEffect(() => {
    if (configuraciones.length === 0) return;
    const siguienteForms: FormStatePorProvider = {};
    const siguienteOriginales: FormStatePorProvider = {};
    for (const config of configuraciones) {
      const inicial = estadoInicialDesdeConfig(config);
      siguienteForms[config.provider] = inicial;
      siguienteOriginales[config.provider] = inicial;
    }
    setForms(siguienteForms);
    setOriginales(siguienteOriginales);
  }, [configuraciones]);

  const providersConCambios = useMemo(() => {
    return PROVEEDORES_IA.filter((meta) => {
      const form = forms[meta.id];
      const original = originales[meta.id];
      if (!form || !original) return false;
      return !esFormularioLimpio(form, original);
    }).map((meta) => meta.id);
  }, [forms, originales]);

  function actualizarCampo(
    provider: ProveedorIa,
    campo: keyof FormStatePorProvider[string],
    valor: string | boolean,
  ): void {
    setForms((prev) => ({
      ...prev,
      [provider]: {
        ...(prev[provider] ?? formVacio()),
        [campo]: valor,
      },
    }));
  }

  async function guardarProvider(
    provider: ProveedorIa,
    mantenerKey: boolean,
  ): Promise<void> {
    const form = forms[provider];
    if (!form) return;

    const dto = formAEsquema(form, mantenerKey);
    if (Object.keys(dto).length === 0 && !mantenerKey) {
      toast.info('No hay cambios para guardar.');
      return;
    }

    try {
      await guardarMut.mutateAsync({ provider, dto });
      toast.success(`${etiquetaProveedor(provider)} guardado correctamente.`);
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'No se pudo guardar la configuración.';
      toast.error('Error al guardar', { description: mensaje });
    }
  }

  async function guardarTodos(): Promise<void> {
    const providers = providersConCambios;
    if (providers.length === 0) {
      toast.info('No hay cambios pendientes para guardar.');
      return;
    }

    let errores = 0;
    for (const provider of providers) {
      const form = forms[provider];
      if (!form) continue;
      const dto = formAEsquema(form, false);
      try {
        await guardarMut.mutateAsync({ provider, dto });
      } catch {
        errores += 1;
      }
    }

    if (errores === 0) {
      setMostrarReinicio(true);
      toast.success(
        `Configuración guardada (${providers.length} proveedor${providers.length === 1 ? '' : 'es'}).`,
      );
    } else {
      toast.error(
        `No se pudo guardar ${errores} de ${providers.length} configuraciones.`,
      );
    }
  }

  async function probarConexion(provider: ProveedorIa): Promise<void> {
    const form = forms[provider];
    if (!form) return;

    setProviderProbando(provider);
    try {
      const dto = formAEsquema(form, false);
      const resultado = await probarMut.mutateAsync({
        provider,
        dto: Object.keys(dto).length > 0 ? dto : undefined,
      });
      if (resultado.ok) {
        toast.success('Conexión OK', { description: resultado.mensaje });
      } else {
        toast.error('Falló la conexión', { description: resultado.mensaje });
      }
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'No se pudo probar la conexión.';
      toast.error('Error al probar', { description: mensaje });
    } finally {
      setProviderProbando(null);
    }
  }

  async function confirmarEliminar(): Promise<void> {
    if (!providerAEliminar) return;
    try {
      await eliminarMut.mutateAsync(providerAEliminar.provider);
      toast.success(
        `${etiquetaProveedor(providerAEliminar.provider)} eliminado.`,
      );
      setProviderAEliminar(null);
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'No se pudo eliminar.';
      toast.error('Error al eliminar', { description: mensaje });
    }
  }

  async function mostrarInstruccionReinicio(): Promise<void> {
    try {
      await reiniciarMut.mutateAsync();
    } catch {
      // El endpoint puede no estar disponible en este entorno;
      // igual queremos mostrar la instrucción.
    }
    setMostrarReinicio(true);
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-transparent p-8 border border-violet-500/20 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-violet-500" />
            Configuración IA
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-base">
            Configurá los proveedores de IA. Los cambios se aplican al reiniciar
            el backend.
          </p>
        </div>
      </div>

      <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle>Recordá reiniciar el backend</AlertTitle>
        <AlertDescription>
          Cada vez que guardes cambios en esta pantalla, tenés que reiniciar
          el backend manualmente para que los proveedores tomen la nueva
          configuración. Desde la raíz del proyecto:{' '}
          <code className="rounded bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 text-xs">
            Ctrl+C
          </code>{' '}
          y luego{' '}
          <code className="rounded bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 text-xs">
            npm run dev:backend
          </code>
          .
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {PROVEEDORES_IA.map((meta) => (
            <Card key={meta.id}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {PROVEEDORES_IA.map((meta) => {
            const config = configuraciones.find(
              (c) => c.provider === meta.id,
            );
            const form = forms[meta.id] ?? formVacio();
            const original = originales[meta.id] ?? formVacio();
            const dirty = !esFormularioLimpio(form, original);
            const guardando =
              guardarMut.isPending && guardarMut.variables?.provider === meta.id;
            const probando = providerProbando === meta.id;
            const tieneKey = config?.apiKeyConfigurada ?? false;

            return (
              <Card
                key={meta.id}
                className={cn(
                  'transition-colors',
                  dirty && 'border-amber-400 ring-1 ring-amber-300',
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        {meta.etiqueta}
                        {dirty && (
                          <span
                            className="ml-1 inline-block h-2 w-2 rounded-full bg-amber-500"
                            aria-label="Cambios sin guardar"
                          />
                        )}
                      </CardTitle>
                      <CardDescription>{meta.descripcion}</CardDescription>
                    </div>
                    <EstadoBadge habilitada={form.habilitado} tieneKey={tieneKey} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CampoApiKey
                    provider={meta.id}
                    tieneKey={tieneKey}
                    valor={form.apiKey}
                    onChange={(valor) => actualizarCampo(meta.id, 'apiKey', valor)}
                  />
                  <CampoForm
                    id={`${meta.id}-model`}
                    label="Modelo"
                    placeholder="ej: gpt-4, llama-3.3-70b-versatile"
                    valor={form.model}
                    onChange={(valor) => actualizarCampo(meta.id, 'model', valor)}
                  />
                  <CampoForm
                    id={`${meta.id}-base-url`}
                    label="Base URL"
                    placeholder="https://api.example.com/v1"
                    valor={form.baseUrl}
                    onChange={(valor) => actualizarCampo(meta.id, 'baseUrl', valor)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <CampoForm
                      id={`${meta.id}-max-tokens`}
                      label="Max tokens"
                      type="number"
                      min={256}
                      max={32768}
                      placeholder="ej: 8192"
                      valor={form.maxTokens}
                      onChange={(valor) =>
                        actualizarCampo(meta.id, 'maxTokens', valor)
                      }
                    />
                    <CampoForm
                      id={`${meta.id}-temperature`}
                      label="Temperature"
                      type="number"
                      min={0}
                      max={2}
                      step="0.1"
                      placeholder="ej: 0.7"
                      valor={form.temperature}
                      onChange={(valor) =>
                        actualizarCampo(meta.id, 'temperature', valor)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <CampoForm
                      id={`${meta.id}-timeout`}
                      label="Timeout (ms)"
                      type="number"
                      min={1000}
                      max={600000}
                      placeholder="ej: 120000"
                      valor={form.timeoutMs}
                      onChange={(valor) =>
                        actualizarCampo(meta.id, 'timeoutMs', valor)
                      }
                    />
                    <CampoForm
                      id={`${meta.id}-orden`}
                      label="Orden en cadena"
                      type="number"
                      min={0}
                      max={100}
                      placeholder="ej: 0"
                      valor={form.orden}
                      onChange={(valor) =>
                        actualizarCampo(meta.id, 'orden', valor)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label
                        htmlFor={`${meta.id}-habilitado`}
                        className="text-sm font-medium"
                      >
                        Habilitado
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Si está apagado, este proveedor no se usa.
                      </p>
                    </div>
                    <Switch
                      id={`${meta.id}-habilitado`}
                      checked={form.habilitado}
                      onCheckedChange={(checked) =>
                        actualizarCampo(meta.id, 'habilitado', checked)
                      }
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="button"
                      onClick={() => guardarProvider(meta.id, tieneKey)}
                      disabled={guardando || !dirty}
                      size="sm"
                    >
                      {guardando ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-4 w-4" />
                      )}
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => probarConexion(meta.id)}
                      disabled={probando}
                    >
                      {probando ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Wifi className="mr-1.5 h-4 w-4" />
                      )}
                      Probar conexión
                    </Button>
                    {tieneKey && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setProviderAEliminar(config ?? null)
                        }
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 p-4">
        <div className="text-sm text-muted-foreground">
          {providersConCambios.length === 0
            ? 'Sin cambios pendientes.'
            : `${providersConCambios.length} proveedor${providersConCambios.length === 1 ? '' : 'es'} con cambios sin guardar.`}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={mostrarInstruccionReinicio}
            disabled={providersConCambios.length === 0}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Guardar todos y ver instrucciones
          </Button>
          <Button
            type="button"
            onClick={guardarTodos}
            disabled={
              providersConCambios.length === 0 || guardarMut.isPending
            }
          >
            {guardarMut.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Guardar cambios pendientes
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(providerAEliminar)}
        onOpenChange={(open) => !open && setProviderAEliminar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar configuración</DialogTitle>
            <DialogDescription>
              ¿Eliminar la configuración de{' '}
              <strong>
                {providerAEliminar
                  ? etiquetaProveedor(providerAEliminar.provider)
                  : ''}
              </strong>
              ? El backend pasará a usar la variable de entorno correspondiente,
              si existe.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setProviderAEliminar(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmarEliminar}
              disabled={eliminarMut.isPending}
            >
              {eliminarMut.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-4 w-4" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarReinicio} onOpenChange={setMostrarReinicio}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración guardada</DialogTitle>
            <DialogDescription>
              Cambios persistidos. Para que el backend tome la nueva
              configuración de los proveedores, reinicialo manualmente.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">
            <div>cd apps/backend</div>
            <div>npm run dev:backend</div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setMostrarReinicio(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function etiquetaProveedor(provider: ProveedorIa): string {
  return PROVEEDORES_IA.find((p) => p.id === provider)?.etiqueta ?? provider;
}

interface CampoFormProps {
  id: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
  step?: string;
  valor: string;
  onChange: (valor: string) => void;
}

function CampoForm({
  id,
  label,
  placeholder,
  type = 'text',
  min,
  max,
  step,
  valor,
  onChange,
}: CampoFormProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={valor}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

interface CampoApiKeyProps {
  provider: ProveedorIa;
  tieneKey: boolean;
  valor: string;
  onChange: (valor: string) => void;
}

function CampoApiKey({ provider, tieneKey, valor, onChange }: CampoApiKeyProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`${provider}-api-key`}>API Key</Label>
      <div className="relative">
        <Input
          id={`${provider}-api-key`}
          type={visible ? 'text' : 'password'}
          autoComplete="off"
          spellCheck={false}
          placeholder={
            tieneKey
              ? 'Dejá vacío para mantener la key actual'
              : 'Pegá tu API key'
          }
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar API key' : 'Mostrar API key'}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {tieneKey
          ? 'Ya hay una API key guardada (cifrada). Pegá una nueva solo si querés reemplazarla.'
          : 'La key se guarda cifrada en la base de datos.'}
      </p>
    </div>
  );
}

function EstadoBadge({
  habilitada,
  tieneKey,
}: {
  habilitada: boolean;
  tieneKey: boolean;
}) {
  if (!habilitada) {
    return (
      <Badge variant="secondary" className="shrink-0">
        <Power className="mr-1 h-3 w-3" />
        Deshabilitada
      </Badge>
    );
  }
  if (!tieneKey) {
    return (
      <Badge variant="outline" className="shrink-0">
        Sin configurar
      </Badge>
    );
  }
  return (
    <Badge className="shrink-0 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
      Configurada
    </Badge>
  );
}