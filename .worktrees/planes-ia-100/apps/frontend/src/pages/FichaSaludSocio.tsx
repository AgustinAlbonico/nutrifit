import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Calendar, CheckCircle2, FileWarning } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

type NivelActividadFisica = 'Sedentario' | 'Moderado' | 'Intenso';
type FrecuenciaComidas = '1-2 comidas' | '3 comidas' | '4-5 comidas' | '6 o más comidas';
type ConsumoAlcohol = 'Nunca' | 'Ocasional' | 'Moderado' | 'Frecuente';

interface FichaSaludSocio {
  socioId: number;
  fichaSaludId: number;
  altura: number;
  peso: number;
  nivelActividadFisica: NivelActividadFisica;
  alergias: string[];
  patologias: string[];
  objetivoPersonal: string;
  medicacionActual: string | null;
  suplementosActuales: string | null;
  cirugiasPrevias: string | null;
  antecedentesFamiliares: string | null;
  frecuenciaComidas: FrecuenciaComidas | null;
  consumoAguaDiario: number | null;
  restriccionesAlimentarias: string | null;
  consumoAlcohol: ConsumoAlcohol | null;
  fumaTabaco: boolean;
  horasSueno: number | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
}

interface FormularioFichaSalud {
  altura: string;
  peso: string;
  nivelActividadFisica: NivelActividadFisica;
  alergias: string;
  patologias: string;
  objetivoPersonal: string;
  medicacionActual: string;
  suplementosActuales: string;
  cirugiasPrevias: string;
  antecedentesFamiliares: string;
  frecuenciaComidas: FrecuenciaComidas | '';
  consumoAguaDiario: string;
  restriccionesAlimentarias: string;
  consumoAlcohol: ConsumoAlcohol | '';
  fumaTabaco: boolean;
  horasSueno: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
}

const FORMULARIO_INICIAL: FormularioFichaSalud = {
  altura: '',
  peso: '',
  nivelActividadFisica: 'Moderado',
  alergias: '',
  patologias: '',
  objetivoPersonal: '',
  medicacionActual: '',
  suplementosActuales: '',
  cirugiasPrevias: '',
  antecedentesFamiliares: '',
  frecuenciaComidas: '',
  consumoAguaDiario: '',
  restriccionesAlimentarias: '',
  consumoAlcohol: '',
  fumaTabaco: false,
  horasSueno: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: '',
};

const separarLista = (valor: string): string[] => {
  return Array.from(
    new Set(
      valor
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
};

const unirLista = (items: string[]): string => items.join(', ');

export function FichaSaludSocio() {
  const { token, rol } = useAuth();

  const [formulario, setFormulario] =
    useState<FormularioFichaSalud>(FORMULARIO_INICIAL);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [fichaExistente, setFichaExistente] = useState(false);

  const cargarFichaSalud = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const response = await apiRequest<ApiResponse<FichaSaludSocio | null>>(
        '/turnos/socio/ficha-salud',
        { token },
      );

      const ficha = response.data;

      if (!ficha) {
        setFichaExistente(false);
        setFormulario(FORMULARIO_INICIAL);
        return;
      }

      setFichaExistente(true);
      setFormulario({
        altura: String(ficha.altura),
        peso: String(ficha.peso),
        nivelActividadFisica: ficha.nivelActividadFisica,
        alergias: unirLista(ficha.alergias),
        patologias: unirLista(ficha.patologias),
        objetivoPersonal: ficha.objetivoPersonal,
        medicacionActual: ficha.medicacionActual ?? '',
        suplementosActuales: ficha.suplementosActuales ?? '',
        cirugiasPrevias: ficha.cirugiasPrevias ?? '',
        antecedentesFamiliares: ficha.antecedentesFamiliares ?? '',
        frecuenciaComidas: ficha.frecuenciaComidas ?? '',
        consumoAguaDiario: ficha.consumoAguaDiario ? String(ficha.consumoAguaDiario) : '',
        restriccionesAlimentarias: ficha.restriccionesAlimentarias ?? '',
        consumoAlcohol: ficha.consumoAlcohol ?? '',
        fumaTabaco: ficha.fumaTabaco ?? false,
        horasSueno: ficha.horasSueno ? String(ficha.horasSueno) : '',
        contactoEmergenciaNombre: ficha.contactoEmergenciaNombre ?? '',
        contactoEmergenciaTelefono: ficha.contactoEmergenciaTelefono ?? '',
      });
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo cargar tu ficha de salud.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || rol !== 'SOCIO') {
      setCargando(false);
      return;
    }

    void cargarFichaSalud();
  }, [cargarFichaSalud, rol, token]);

  const formularioValido = useMemo(() => {
    const altura = Number(formulario.altura);
    const peso = Number(formulario.peso);

    return (
      Number.isFinite(altura) &&
      altura >= 100 &&
      altura <= 250 &&
      Number.isFinite(peso) &&
      peso >= 20 &&
      peso <= 500 &&
      formulario.objetivoPersonal.trim().length > 0
    );
  }, [formulario]);

  const manejarEnvio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      setMensajeExito(null);

      const payload = {
        altura: Number(formulario.altura),
        peso: Number(formulario.peso),
        nivelActividadFisica: formulario.nivelActividadFisica,
        alergias: separarLista(formulario.alergias),
        patologias: separarLista(formulario.patologias),
        objetivoPersonal: formulario.objetivoPersonal.trim(),
        medicacionActual: formulario.medicacionActual.trim() || null,
        suplementosActuales: formulario.suplementosActuales.trim() || null,
        cirugiasPrevias: formulario.cirugiasPrevias.trim() || null,
        antecedentesFamiliares: formulario.antecedentesFamiliares.trim() || null,
        frecuenciaComidas: formulario.frecuenciaComidas || null,
        consumoAguaDiario: formulario.consumoAguaDiario ? Number(formulario.consumoAguaDiario) : null,
        restriccionesAlimentarias: formulario.restriccionesAlimentarias.trim() || null,
        consumoAlcohol: formulario.consumoAlcohol || null,
        fumaTabaco: formulario.fumaTabaco,
        horasSueno: formulario.horasSueno ? Number(formulario.horasSueno) : null,
        contactoEmergenciaNombre: formulario.contactoEmergenciaNombre.trim() || null,
        contactoEmergenciaTelefono: formulario.contactoEmergenciaTelefono.trim() || null,
      };

      await apiRequest<ApiResponse<FichaSaludSocio>>('/turnos/socio/ficha-salud', {
        method: 'PUT',
        token,
        body: payload,
      });

      setFichaExistente(true);
      setMensajeExito('Ficha de salud guardada correctamente. Ya podés reservar turnos.');
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo guardar la ficha de salud.';
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  if (rol !== 'SOCIO') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
        </CardHeader>
        <CardContent>Esta pantalla solo esta disponible para socios.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                Mi ficha de salud
              </h1>
            </div>
            <p className="text-muted-foreground">
              Debes completar esta ficha para poder reservar turnos con nutricionistas.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/turnos/agendar">
              <ArrowLeft className="h-4 w-4" />
              Volver a agendar
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="pt-4">
          <p className="text-sm text-amber-800">
            {fichaExistente
              ? 'Tu ficha ya está cargada. Puedes actualizarla cuando lo necesites.'
              : 'Todavía no tenés ficha cargada. Completala para habilitar la reserva de turnos.'}
          </p>
        </CardContent>
      </Card>

      {cargando ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">Cargando ficha de salud...</p>
          </CardContent>
        </Card>
      ) : (
        <form className="space-y-6" onSubmit={manejarEnvio}>
          {/* Sección: Datos físicos básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos físicos básicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="altura" required>
                    Altura (cm)
                  </Label>
                  <Input
                    id="altura"
                    type="number"
                    min={100}
                    max={250}
                    value={formulario.altura}
                    onChange={(event) =>
                      setFormulario((previo) => ({ ...previo, altura: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso" required>
                    Peso (kg)
                  </Label>
                  <Input
                    id="peso"
                    type="number"
                    min={20}
                    max={500}
                    step="0.1"
                    value={formulario.peso}
                    onChange={(event) =>
                      setFormulario((previo) => ({ ...previo, peso: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nivel-actividad" required>
                    Nivel de actividad física
                  </Label>
                  <select
                    id="nivel-actividad"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formulario.nivelActividadFisica}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        nivelActividadFisica: event.target.value as NivelActividadFisica,
                      }))
                    }
                    required
                  >
                    <option value="Sedentario">Sedentario</option>
                    <option value="Moderado">Moderado</option>
                    <option value="Intenso">Intenso</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objetivo" required>
                    Objetivo personal
                  </Label>
                  <Input
                    id="objetivo"
                    value={formulario.objetivoPersonal}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        objetivoPersonal: event.target.value,
                      }))
                    }
                    placeholder="Ej: bajar grasa, mejorar rendimiento..."
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Alergias y patologías */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alergias y patologías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="alergias">Alergias</Label>
                  <Input
                    id="alergias"
                    value={formulario.alergias}
                    onChange={(event) =>
                      setFormulario((previo) => ({ ...previo, alergias: event.target.value }))
                    }
                    placeholder="Separar por coma. Ej: maní, lactosa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patologias">Patologías</Label>
                  <Input
                    id="patologias"
                    value={formulario.patologias}
                    onChange={(event) =>
                      setFormulario((previo) => ({ ...previo, patologias: event.target.value }))
                    }
                    placeholder="Separar por coma. Ej: diabetes, hipertensión"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Medicación y suplementos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medicación y suplementos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="medicacion">Medicación actual</Label>
                  <Textarea
                    id="medicacion"
                    value={formulario.medicacionActual}
                    onChange={(event) =>
                      setFormulario((previo) => ({ ...previo, medicacionActual: event.target.value }))
                    }
                    placeholder="Listá los medicamentos que tomás actualmente"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suplementos">Suplementos actuales</Label>
                  <Textarea
                    id="suplementos"
                    value={formulario.suplementosActuales}
                    onChange={(event) =>
                      setFormulario((previo) => ({ ...previo, suplementosActuales: event.target.value }))
                    }
                    placeholder="Vitaminas, proteínas, etc."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Historial médico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historial médico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cirugias">Cirugías previas</Label>
                  <Textarea
                    id="cirugias"
                    value={formulario.cirugiasPrevias}
                    onChange={(event) =>
                      setFormulario((previo) => ({ ...previo, cirugiasPrevias: event.target.value }))
                    }
                    placeholder="Indicá si tuviste cirugías relevantes"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="antecedentes">Antecedentes familiares</Label>
                  <Textarea
                    id="antecedentes"
                    value={formulario.antecedentesFamiliares}
                    onChange={(event) =>
                      setFormulario((previo) => ({ ...previo, antecedentesFamiliares: event.target.value }))
                    }
                    placeholder="Enfermedades en tu familia (diabetes, hipertensión, etc.)"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Hábitos alimentarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hábitos alimentarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="frecuencia-comidas">Comidas por día</Label>
                  <select
                    id="frecuencia-comidas"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formulario.frecuenciaComidas}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        frecuenciaComidas: event.target.value as FrecuenciaComidas | '',
                      }))
                    }
                  >
                    <option value="">Seleccionar...</option>
                    <option value="1-2 comidas">1-2 comidas</option>
                    <option value="3 comidas">3 comidas</option>
                    <option value="4-5 comidas">4-5 comidas</option>
                    <option value="6 o más comidas">6 o más comidas</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agua">Agua diaria (litros)</Label>
                  <Input
                    id="agua"
                    type="number"
                    min={0}
                    max={10}
                    step="0.5"
                    value={formulario.consumoAguaDiario}
                    onChange={(event) =>
                      setFormulario((previo) => ({ ...previo, consumoAguaDiario: event.target.value }))
                    }
                    placeholder="Ej: 2"
                  />
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="restricciones">Restricciones alimentarias</Label>
                  <Input
                    id="restricciones"
                    value={formulario.restriccionesAlimentarias}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        restriccionesAlimentarias: event.target.value,
                      }))
                    }
                    placeholder="Ej: vegetariano, kosher, halal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Hábitos de vida */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hábitos de vida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="alcohol">Consumo de alcohol</Label>
                  <select
                    id="alcohol"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formulario.consumoAlcohol}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        consumoAlcohol: event.target.value as ConsumoAlcohol | '',
                      }))
                    }
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Nunca">Nunca</option>
                    <option value="Ocasional">Ocasional</option>
                    <option value="Moderado">Moderado</option>
                    <option value="Frecuente">Frecuente</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tabaco">¿Fumás tabaco?</Label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tabaco"
                        checked={formulario.fumaTabaco === true}
                        onChange={() => setFormulario((previo) => ({ ...previo, fumaTabaco: true }))}
                      />
                      <span className="text-sm">Sí</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tabaco"
                        checked={formulario.fumaTabaco === false}
                        onChange={() => setFormulario((previo) => ({ ...previo, fumaTabaco: false }))}
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sueno">Horas de sueño (promedio)</Label>
                  <Input
                    id="sueno"
                    type="number"
                    min={0}
                    max={24}
                    value={formulario.horasSueno}
                    onChange={(event) =>
                      setFormulario((previo) => ({ ...previo, horasSueno: event.target.value }))
                    }
                    placeholder="Ej: 7"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Contacto de emergencia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contacto de emergencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contacto-nombre">Nombre completo</Label>
                  <Input
                    id="contacto-nombre"
                    value={formulario.contactoEmergenciaNombre}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        contactoEmergenciaNombre: event.target.value,
                      }))
                    }
                    placeholder="Nombre del contacto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contacto-telefono">Teléfono</Label>
                  <Input
                    id="contacto-telefono"
                    type="tel"
                    value={formulario.contactoEmergenciaTelefono}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        contactoEmergenciaTelefono: event.target.value,
                      }))
                    }
                    placeholder="Ej: +54 11 1234-5678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mensajes de error/éxito y botones */}
          <Card>
            <CardContent className="pt-6">
              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {mensajeExito && (
                <div className="mb-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{mensajeExito}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link to="/turnos/agendar">Ir a agendar turno</Link>
                </Button>
                <Button type="submit" disabled={!formularioValido || guardando}>
                  {guardando ? 'Guardando...' : fichaExistente ? 'Actualizar ficha' : 'Guardar ficha'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
