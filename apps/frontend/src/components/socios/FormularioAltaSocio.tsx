import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { format as formatearFechaIso } from 'date-fns';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { REGEX_DNI, REGEX_TELEFONO, REGEX_EMAIL } from '@/lib/validaciones';
import type {
  CrearSocioDto,
  CrearSocioResponseDto,
  Genero,
} from '@/types/socio';
import { ModalContrasenaProvisional } from '@/components/ui/ModalContrasenaProvisional';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
import { SelectorImagen } from '@/components/imagen/SelectorImagen';
import type { ApiResponse } from '@/types/api';

type Campo = keyof CrearSocioDto;
type Errores = Partial<Record<Campo, string>>;

const FORMULARIO_INICIAL: CrearSocioDto = {
  nombre: '',
  apellido: '',
  dni: '',
  fechaNacimiento: '',
  telefono: '',
  genero: 'MASCULINO',
  direccion: '',
  ciudad: '',
  provincia: '',
  email: '',
  observaciones: '',
  estado: 'ACTIVO',
};

type EstadoFoto = string | File | null;

const parsearFechaInput = (fecha: string): Date | undefined => {
  if (!fecha) return undefined;
  const fechaParseada = new Date(`${fecha}T00:00:00`);
  return Number.isNaN(fechaParseada.getTime()) ? undefined : fechaParseada;
};

const formatearFechaParaInput = (fecha: Date | undefined): string => {
  if (!fecha) return '';
  return formatearFechaIso(fecha, 'yyyy-MM-dd');
};

const validar = (datos: CrearSocioDto): Errores => {
  const errores: Errores = {};
  if (!datos.nombre.trim()) errores.nombre = 'Ingresá el nombre.';
  if (!datos.apellido.trim()) errores.apellido = 'Ingresá el apellido.';
  if (!REGEX_DNI.test(datos.dni.trim()))
    errores.dni = 'El DNI debe tener exactamente 8 dígitos.';
  if (!datos.fechaNacimiento)
    errores.fechaNacimiento = 'Seleccioná la fecha de nacimiento.';
  if (!REGEX_TELEFONO.test(datos.telefono.trim()))
    errores.telefono = 'Ingresá un teléfono válido (8 a 20 caracteres).';
  if (!datos.direccion.trim()) errores.direccion = 'Ingresá la dirección.';
  if (!datos.ciudad.trim()) errores.ciudad = 'Ingresá la ciudad.';
  if (!datos.provincia.trim()) errores.provincia = 'Ingresá la provincia.';
  if (!REGEX_EMAIL.test(datos.email.trim()))
    errores.email = 'Ingresá un email válido.';
  return errores;
};

export interface FormularioAltaSocioProps {
  /**
   * Callback ejecutado al crear el socio correctamente. Si se omite, la
   * página navega a `/socios?exito=<id>`.
   */
  onCreated?: (resultado: CrearSocioResponseDto) => void;
  /**
   * Callback al cancelar. Si se omite, la página vuelve a `/socios`.
   */
  onCancel?: () => void;
}

export function FormularioAltaSocio({
  onCreated,
  onCancel,
}: FormularioAltaSocioProps) {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<CrearSocioDto>(FORMULARIO_INICIAL);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [foto, setFoto] = useState<EstadoFoto>(null);
  const [contrasenaProvisional, setContrasenaProvisional] = useState<
    string | null
  >(null);

  const actualizarCampo = useCallback(
    <K extends Campo>(campo: K, valor: CrearSocioDto[K]) => {
      const nuevoForm = { ...form, [campo]: valor };
      setForm(nuevoForm);
      setErrorGeneral(null);
      const erroresCompletos = validar(nuevoForm);
      setErrores((prev) => {
        const resultado: Errores = {};
        for (const key of Object.keys(prev) as Campo[]) {
          if (erroresCompletos[key]) resultado[key] = erroresCompletos[key];
        }
        if (erroresCompletos[campo]) resultado[campo] = erroresCompletos[campo];
        return resultado;
      });
    },
    [form],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || enviando) return;

    const nuevosErrores = validar(form);
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      setErrorGeneral('Revisá los campos marcados antes de continuar.');
      return;
    }

    setEnviando(true);
    try {
      const body = { ...form };
      if (!body.observaciones) delete body.observaciones;
      if (body.estado === 'ACTIVO') delete body.estado;

      let responseData: ApiResponse<CrearSocioResponseDto>;
      if (foto instanceof File) {
        const formData = new FormData();
        formData.append('foto', foto);
        Object.entries(body).forEach(([key, value]) => {
          if (value !== undefined) formData.append(key, String(value));
        });
        responseData = await apiRequest<ApiResponse<CrearSocioResponseDto>>(
          '/socio',
          { method: 'POST', token, formData },
        );
      } else {
        responseData = await apiRequest<ApiResponse<CrearSocioResponseDto>>(
          '/socio',
          { method: 'POST', token, body },
        );
      }

      const resultado = responseData.data;
      toast.success('Socio registrado exitosamente');
      setContrasenaProvisional(resultado.contrasenaProvisional);
      if (onCreated) {
        onCreated(resultado);
      } else {
        navigate({ to: '/socios', search: { exito: resultado.socio.idPersona } });
      }
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'No se pudo crear el socio';
      setErrorGeneral(mensaje);
      toast.error(mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
      {errorGeneral && (
        <Alert
          variant="destructive"
          className="border-destructive/30 bg-destructive/5"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo crear el socio</AlertTitle>
          <AlertDescription>{errorGeneral}</AlertDescription>
        </Alert>
      )}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Datos personales
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="crear-nombre" required>
              Nombre
            </Label>
            <Input
              id="crear-nombre"
              value={form.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              aria-invalid={Boolean(errores.nombre)}
              required
            />
            {errores.nombre && (
              <p className="text-xs font-medium text-destructive">
                {errores.nombre}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="crear-apellido" required>
              Apellido
            </Label>
            <Input
              id="crear-apellido"
              value={form.apellido}
              onChange={(e) => actualizarCampo('apellido', e.target.value)}
              aria-invalid={Boolean(errores.apellido)}
              required
            />
            {errores.apellido && (
              <p className="text-xs font-medium text-destructive">
                {errores.apellido}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="crear-dni" required>
              DNI
            </Label>
            <Input
              id="crear-dni"
              inputMode="numeric"
              maxLength={8}
              value={form.dni}
              onChange={(e) => actualizarCampo('dni', e.target.value)}
              aria-invalid={Boolean(errores.dni)}
              required
            />
            {errores.dni && (
              <p className="text-xs font-medium text-destructive">
                {errores.dni}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label required>Fecha de nacimiento</Label>
            <DatePicker
              date={parsearFechaInput(form.fechaNacimiento)}
              setDate={(fecha) =>
                actualizarCampo(
                  'fechaNacimiento',
                  formatearFechaParaInput(fecha),
                )
              }
              placeholder="Seleccionar fecha"
              className="w-full"
            />
            {errores.fechaNacimiento && (
              <p className="text-xs font-medium text-destructive">
                {errores.fechaNacimiento}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="crear-genero" required>
              Género
            </Label>
            <select
              id="crear-genero"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.genero}
              onChange={(e) =>
                actualizarCampo('genero', e.target.value as Genero)
              }
              required
            >
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="crear-telefono" required>
              Teléfono
            </Label>
            <Input
              id="crear-telefono"
              value={form.telefono}
              onChange={(e) => actualizarCampo('telefono', e.target.value)}
              aria-invalid={Boolean(errores.telefono)}
              required
            />
            {errores.telefono && (
              <p className="text-xs font-medium text-destructive">
                {errores.telefono}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Foto de perfil</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <SelectorImagen
              etiqueta="Foto del Socio"
              alCambiarFoto={setFoto}
              deshabilitado={false}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Contacto y ubicación
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="crear-direccion" required>
              Dirección
            </Label>
            <Input
              id="crear-direccion"
              value={form.direccion}
              onChange={(e) => actualizarCampo('direccion', e.target.value)}
              aria-invalid={Boolean(errores.direccion)}
              required
            />
            {errores.direccion && (
              <p className="text-xs font-medium text-destructive">
                {errores.direccion}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="crear-ciudad" required>
              Ciudad
            </Label>
            <Input
              id="crear-ciudad"
              value={form.ciudad}
              onChange={(e) => actualizarCampo('ciudad', e.target.value)}
              aria-invalid={Boolean(errores.ciudad)}
              required
            />
            {errores.ciudad && (
              <p className="text-xs font-medium text-destructive">
                {errores.ciudad}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="crear-provincia" required>
              Provincia
            </Label>
            <Input
              id="crear-provincia"
              value={form.provincia}
              onChange={(e) => actualizarCampo('provincia', e.target.value)}
              aria-invalid={Boolean(errores.provincia)}
              required
            />
            {errores.provincia && (
              <p className="text-xs font-medium text-destructive">
                {errores.provincia}
              </p>
            )}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="crear-email" required>
              Email
            </Label>
            <Input
              id="crear-email"
              type="email"
              autoComplete="off"
              value={form.email}
              onChange={(e) => actualizarCampo('email', e.target.value)}
              aria-invalid={Boolean(errores.email)}
              required
            />
            {errores.email && (
              <p className="text-xs font-medium text-destructive">
                {errores.email}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Estado y observaciones
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="crear-estado">Estado inicial</Label>
            <select
              id="crear-estado"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.estado ?? 'ACTIVO'}
              onChange={(e) =>
                actualizarCampo(
                  'estado',
                  e.target.value as 'ACTIVO' | 'INACTIVO',
                )
              }
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Si seleccionás "Inactivo" el socio se creará con fecha de baja
              inmediata.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="crear-observaciones">Observaciones</Label>
            <Textarea
              id="crear-observaciones"
              value={form.observaciones ?? ''}
              onChange={(e) =>
                actualizarCampo('observaciones', e.target.value)
              }
              placeholder="Notas internas sobre el socio (opcional)"
              maxLength={2000}
              rows={3}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t bg-background px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : navigate({ to: '/socios' }))}
          disabled={enviando}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={Object.keys(errores).length > 0 || enviando}>
          {enviando ? 'Creando…' : 'Crear socio'}
        </Button>
      </div>

      <ModalContrasenaProvisional
        abierto={contrasenaProvisional !== null}
        alCerrar={() => setContrasenaProvisional(null)}
        contrasena={contrasenaProvisional ?? ''}
        nombreRol="SOCIO"
      />
    </form>
  );
}
