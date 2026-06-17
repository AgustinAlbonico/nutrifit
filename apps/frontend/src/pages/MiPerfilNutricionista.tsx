import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  User,
  CheckCircle2,
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, obtenerUrlFoto } from '@/lib/api';
import { agregarValorAFormData } from '@/lib/formData';
import { formatearFechaArgentinaParaInput } from '@/lib/fechasArgentina';
import { EditorTrayectoriaProfesional } from '@/components/profesionales/EditorTrayectoriaProfesional';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SelectorImagen } from '@/components/imagen/SelectorImagen';
import { GaleriaDiplomas } from '@/components/diplomas/GaleriaDiplomas';
import type {
  CertificacionDto,
  DiplomaDto,
  FormacionAcademicaDto,
  Genero,
  Nutricionista,
} from '@/types/nutricionista';
import type { ApiResponse } from '@/types/api';

interface FormularioMiPerfil {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  telefono: string;
  genero: Genero;
  direccion: string;
  ciudad: string;
  provincia: string;
  email: string;
  matricula: string;
  aniosExperiencia: number;
  tarifaSesion: number;
  presentacion: string;
  contrasena: string;
}

const FORMULARIO_INICIAL: FormularioMiPerfil = {
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
  matricula: '',
  aniosExperiencia: 0,
  tarifaSesion: 0,
  presentacion: '',
  contrasena: '',
};

export function MiPerfilNutricionista() {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Partial<Record<keyof FormularioMiPerfil, string>>>({});
  const [formulario, setFormulario] = useState<FormularioMiPerfil>(FORMULARIO_INICIAL);
  const [idPersona, setIdPersona] = useState<number | null>(null);

  const [fotoPerfilUrlActual, setFotoPerfilUrlActual] = useState<string | null>(null);
  const [fotoPerfilArchivo, setFotoPerfilArchivo] = useState<File | null>(null);
  const [quitarFoto, setQuitarFoto] = useState(false);

  const [diplomas, setDiplomas] = useState<DiplomaDto[]>([]);
  const [certificaciones, setCertificaciones] = useState<CertificacionDto[]>([]);
  const [formacionAcademica, setFormacionAcademica] = useState<FormacionAcademicaDto[]>([]);
  const [subiendoDiploma, setSubiendoDiploma] = useState(false);
  const [eliminandoDiplomas, setEliminandoDiplomas] = useState<Set<number>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputDiplomaRef = useRef<HTMLInputElement | null>(null);

  const cargarPerfil = useCallback(async () => {
    if (!token) return;
    try {
      setCargando(true);
      const response = await apiRequest<ApiResponse<Nutricionista>>(
        '/profesional/mi-perfil',
        { token },
      );
      const n = response.data;
      setIdPersona(n.idPersona);
      setFotoPerfilUrlActual(n.fotoPerfilUrl);
      setDiplomas(n.diplomas ?? []);
      setCertificaciones(n.certificaciones ?? []);
      setFormacionAcademica(n.formacionAcademica ?? []);
      setFotoPerfilArchivo(null);
      setQuitarFoto(false);
      setFormulario({
        nombre: n.nombre,
        apellido: n.apellido,
        dni: n.dni,
        fechaNacimiento: n.fechaNacimiento
          ? formatearFechaArgentinaParaInput(n.fechaNacimiento)
          : '',
        telefono: n.telefono,
        genero: n.genero,
        direccion: n.direccion,
        ciudad: n.ciudad,
        provincia: n.provincia,
        email: n.email,
        matricula: n.matricula,
        aniosExperiencia: n.aniosExperiencia,
        tarifaSesion: n.tarifaSesion,
        presentacion: n.presentacion ?? '',
        contrasena: '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar tu perfil';
      toast.error(message);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    void cargarPerfil();
  }, [cargarPerfil]);

  const validar = (): boolean => {
    const nuevosErrores: Partial<Record<keyof FormularioMiPerfil, string>> = {};
    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'Ingresá tu nombre.';
    if (!formulario.apellido.trim()) nuevosErrores.apellido = 'Ingresá tu apellido.';
    if (!formulario.dni.trim()) nuevosErrores.dni = 'Ingresá tu DNI.';
    if (!formulario.fechaNacimiento)
      nuevosErrores.fechaNacimiento = 'Ingresá tu fecha de nacimiento.';
    if (!formulario.telefono.trim()) nuevosErrores.telefono = 'Ingresá tu teléfono.';
    if (!formulario.direccion.trim()) nuevosErrores.direccion = 'Ingresá tu dirección.';
    if (!formulario.ciudad.trim()) nuevosErrores.ciudad = 'Ingresá tu ciudad.';
    if (!formulario.provincia.trim()) nuevosErrores.provincia = 'Ingresá tu provincia.';
    if (!formulario.email.trim()) nuevosErrores.email = 'Ingresá tu email.';
    if (!formulario.matricula.trim()) nuevosErrores.matricula = 'Ingresá tu matrícula.';
    if (formulario.aniosExperiencia < 0)
      nuevosErrores.aniosExperiencia = 'Los años de experiencia no pueden ser negativos.';
    if (formulario.tarifaSesion <= 0)
      nuevosErrores.tarifaSesion = 'La tarifa debe ser mayor a 0.';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarSubirDiploma = async (archivo: File) => {
    if (!token || idPersona === null) return;
    try {
      setSubiendoDiploma(true);
      const formData = new FormData();
      formData.append('diploma', archivo);
      const response = await apiRequest<ApiResponse<DiplomaDto>>(
        `/profesional/${idPersona}/diplomas`,
        {
          method: 'POST',
          token,
          formData,
        },
      );
      setDiplomas((prev) => [...prev, response.data]);
      toast.success('Diploma subido correctamente.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir diploma';
      toast.error(msg);
    } finally {
      setSubiendoDiploma(false);
    }
  };

  const manejarEliminarDiploma = async (diplomaId: number) => {
    if (!token || idPersona === null) return;
    try {
      setEliminandoDiplomas((prev) => new Set(prev).add(diplomaId));
      await apiRequest(`/profesional/${idPersona}/diplomas/${diplomaId}`, {
        method: 'DELETE',
        token,
      });
      setDiplomas((prev) => prev.filter((d) => d.idDiploma !== diplomaId));
      toast.success('Diploma eliminado.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar diploma';
      toast.error(msg);
    } finally {
      setEliminandoDiplomas((prev) => {
        const next = new Set(prev);
        next.delete(diplomaId);
        return next;
      });
    }
  };

  const guardarCambios = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || idPersona === null) return;
    if (!validar()) {
      toast.error('Revisá los campos marcados antes de guardar.');
      return;
    }

    try {
      setEnviando(true);

      const payload = {
        ...formulario,
        formacionAcademica,
        certificaciones,
      };
      if (!payload.contrasena) {
        delete (payload as Partial<typeof payload>).contrasena;
      }

      const hayFotoNueva = fotoPerfilArchivo instanceof File;
      const hayQueEliminarFoto = quitarFoto && fotoPerfilUrlActual;

      if (hayFotoNueva || hayQueEliminarFoto) {
        const formData = new FormData();
        if (hayFotoNueva) {
          formData.append('foto', fotoPerfilArchivo);
        }
        if (hayQueEliminarFoto && !hayFotoNueva) {
          formData.append('eliminarFoto', 'true');
        }
        Object.entries(payload).forEach(([key, value]) => {
          agregarValorAFormData(formData, key, value);
        });
        await apiRequest(`/profesional/${idPersona}`, {
          method: 'PUT',
          token,
          formData,
        });
      } else {
        await apiRequest(`/profesional/${idPersona}`, {
          method: 'PUT',
          token,
          body: payload,
        });
      }

      toast.success('Perfil actualizado correctamente.');
      setFormulario((prev) => ({ ...prev, contrasena: '' }));
      setFotoPerfilArchivo(null);
      setQuitarFoto(false);
      await cargarPerfil();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar tu perfil';
      toast.error(message);
    } finally {
      setEnviando(false);
      setSubiendoDiploma(false);
    }
  };

  if (cargando) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Cargando tu perfil...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
              <User className="h-8 w-8 text-orange-500" />
              Mi Perfil
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl text-base">
              Mantené tus datos profesionales actualizados. Los cambios quedan registrados
              en la auditoría del sistema.
            </p>
          </div>
          {idPersona && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Sesión iniciada como #{idPersona}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={guardarCambios} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="miperfil-nombre" required>
                Nombre
              </Label>
              <Input
                id="miperfil-nombre"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                required
              />
              {errores.nombre && <p className="text-xs text-destructive">{errores.nombre}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="miperfil-apellido" required>
                Apellido
              </Label>
              <Input
                id="miperfil-apellido"
                value={formulario.apellido}
                onChange={(e) => setFormulario({ ...formulario, apellido: e.target.value })}
                required
              />
              {errores.apellido && <p className="text-xs text-destructive">{errores.apellido}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="miperfil-dni" required>
                DNI
              </Label>
              <Input
                id="miperfil-dni"
                value={formulario.dni}
                onChange={(e) => setFormulario({ ...formulario, dni: e.target.value })}
                required
              />
              {errores.dni && <p className="text-xs text-destructive">{errores.dni}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="miperfil-fecha" required>
                Fecha de nacimiento
              </Label>
              <Input
                id="miperfil-fecha"
                type="date"
                value={formulario.fechaNacimiento}
                onChange={(e) => setFormulario({ ...formulario, fechaNacimiento: e.target.value })}
                required
              />
              {errores.fechaNacimiento && (
                <p className="text-xs text-destructive">{errores.fechaNacimiento}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="miperfil-telefono" required>
                Teléfono
              </Label>
              <Input
                id="miperfil-telefono"
                value={formulario.telefono}
                onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
                required
              />
              {errores.telefono && <p className="text-xs text-destructive">{errores.telefono}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="miperfil-email" required>
                Email
              </Label>
              <Input
                id="miperfil-email"
                type="email"
                value={formulario.email}
                onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
                required
              />
              {errores.email && <p className="text-xs text-destructive">{errores.email}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="miperfil-direccion" required>
                Dirección
              </Label>
              <Input
                id="miperfil-direccion"
                value={formulario.direccion}
                onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
                required
              />
              {errores.direccion && <p className="text-xs text-destructive">{errores.direccion}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="miperfil-ciudad" required>
                Ciudad
              </Label>
              <Input
                id="miperfil-ciudad"
                value={formulario.ciudad}
                onChange={(e) => setFormulario({ ...formulario, ciudad: e.target.value })}
                required
              />
              {errores.ciudad && <p className="text-xs text-destructive">{errores.ciudad}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="miperfil-provincia" required>
                Provincia
              </Label>
              <Input
                id="miperfil-provincia"
                value={formulario.provincia}
                onChange={(e) => setFormulario({ ...formulario, provincia: e.target.value })}
                required
              />
              {errores.provincia && <p className="text-xs text-destructive">{errores.provincia}</p>}
            </div>
            <div className="md:col-span-2">
              <SelectorImagen
                valorActual={quitarFoto ? null : obtenerUrlFoto(fotoPerfilUrlActual)}
                alCambiarFoto={(archivo) => {
                  setFotoPerfilArchivo(archivo);
                  setQuitarFoto(archivo === null && !!fotoPerfilUrlActual);
                }}
                etiqueta="Foto de perfil"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trayectoria profesional</CardTitle>
          </CardHeader>
          <CardContent>
            <EditorTrayectoriaProfesional
              formacionAcademica={formacionAcademica}
              certificaciones={certificaciones}
              alCambiarFormacionAcademica={setFormacionAcademica}
              alCambiarCertificaciones={setCertificaciones}
              deshabilitado={enviando}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos profesionales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="miperfil-matricula" required>
                Matrícula
              </Label>
              <Input
                id="miperfil-matricula"
                value={formulario.matricula}
                onChange={(e) => setFormulario({ ...formulario, matricula: e.target.value })}
                required
              />
              {errores.matricula && <p className="text-xs text-destructive">{errores.matricula}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="miperfil-anios" required>
                Años de experiencia
              </Label>
              <Input
                id="miperfil-anios"
                type="number"
                min={0}
                value={formulario.aniosExperiencia}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    aniosExperiencia: parseInt(e.target.value, 10) || 0,
                  })
                }
                required
              />
              {errores.aniosExperiencia && (
                <p className="text-xs text-destructive">{errores.aniosExperiencia}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="miperfil-tarifa" required>
                Tarifa por sesión
              </Label>
              <Input
                id="miperfil-tarifa"
                type="number"
                min={0}
                step="0.01"
                value={formulario.tarifaSesion}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    tarifaSesion: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
              {errores.tarifaSesion && (
                <p className="text-xs text-destructive">{errores.tarifaSesion}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="miperfil-presentacion">Presentación</Label>
              <Textarea
                id="miperfil-presentacion"
                value={formulario.presentacion}
                onChange={(e) => setFormulario({ ...formulario, presentacion: e.target.value })}
                placeholder="Contale a los socios tu enfoque profesional, áreas de especialidad, etc."
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="miperfil-password">Cambiar contraseña (opcional)</Label>
              <Input
                id="miperfil-password"
                type="password"
                autoComplete="new-password"
                value={formulario.contrasena}
                onChange={(e) => setFormulario({ ...formulario, contrasena: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diplomas / Matrícula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diplomas.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {diplomas.map((d, index) => {
                  const extensionEsImagen = d.nombreOriginal
                    ? /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(d.nombreOriginal)
                    : false;
                  const esImagen =
                    d.mimeType?.startsWith('image/') ?? extensionEsImagen;
                  const eliminando = eliminandoDiplomas.has(d.idDiploma);
                  return (
                    <div
                      key={d.idDiploma}
                      role="button"
                      tabIndex={0}
                      onClick={() => setLightboxIndex(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setLightboxIndex(index);
                        }
                      }}
                      className="group relative cursor-pointer overflow-hidden rounded-lg border bg-card transition hover:border-orange-500/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      data-testid="diploma-card"
                    >
                      <div className="aspect-[4/3] flex items-center justify-center bg-muted/30">
                        {esImagen ? (
                          <img
                            src={obtenerUrlFoto(d.url) ?? ''}
                            alt={d.nombreOriginal ?? 'Diploma'}
                            className="h-full w-full object-contain p-2 transition group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground transition group-hover:scale-105">
                            <FileText className="h-12 w-12" />
                            <span className="text-xs">PDF</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 p-3">
                        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {d.nombreOriginal ?? `Diploma #${d.idDiploma}`}
                        </p>
                        <div className="flex shrink-0 gap-1">
                          <a
                            href={obtenerUrlFoto(d.url) ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={eliminando}
                            onClick={(e) => {
                              e.stopPropagation();
                              void manejarEliminarDiploma(d.idDiploma);
                            }}
                          >
                            {eliminando ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Todavía no subiste ningún diploma.</p>
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={subiendoDiploma}
                onClick={() => inputDiplomaRef.current?.click()}
              >
                {subiendoDiploma ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Agregar diploma
                  </>
                )}
              </Button>
              <input
                ref={inputDiplomaRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void manejarSubirDiploma(file);
                  }
                  if (inputDiplomaRef.current) {
                    inputDiplomaRef.current.value = '';
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={enviando || subiendoDiploma}>
            {enviando || subiendoDiploma ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      {lightboxIndex !== null && diplomas[lightboxIndex] && (
        <GaleriaDiplomas
          diplomas={diplomas}
          indiceInicial={lightboxIndex}
          onCerrar={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
