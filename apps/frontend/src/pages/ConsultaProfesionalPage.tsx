import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  FileWarning,
  User,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Ruler,
  Activity,
  Heart,
  Scale,
  Utensils,
  Edit,
} from 'lucide-react';

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

interface FichaSalud {
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

interface DatosTurno {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  socio: {
    idPersona: number;
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    telefono: string | null;
  };
  fichaSalud: FichaSalud | null;
}

interface FormularioMediciones {
  // Datos básicos
  peso: string;
  altura: string;
  // Perímetros
  perimetroCintura: string;
  perimetroCadera: string;
  perimetroBrazo: string;
  perimetroMuslo: string;
  perimetroPecho: string;
  // Pliegues cutáneos
  pliegueTriceps: string;
  pliegueAbdominal: string;
  pliegueMuslo: string;
  // Composición corporal
  porcentajeGrasa: string;
  // Signos vitales
  frecuenciaCardiaca: string;
  tensionSistolica: string;
  tensionDiastolica: string;
  // Notas
  notasMedicion: string;
}

const FORMULARIO_INICIAL: FormularioMediciones = {
  peso: '',
  altura: '',
  perimetroCintura: '',
  perimetroCadera: '',
  perimetroBrazo: '',
  perimetroMuslo: '',
  perimetroPecho: '',
  pliegueTriceps: '',
  pliegueAbdominal: '',
  pliegueMuslo: '',
  porcentajeGrasa: '',
  frecuenciaCardiaca: '',
  tensionSistolica: '',
  tensionDiastolica: '',
  notasMedicion: '',
};

// Componente para secciones colapsables
function SeccionColapsable({
  titulo,
  icono: Icono,
  expandida,
  onToggle,
  children,
}: {
  titulo: string;
  icono: React.ElementType;
  expandida: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Icono className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{titulo}</span>
          <span className="text-xs text-gray-400">(opcional)</span>
        </div>
        {expandida ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {expandida && <div className="border-t p-4">{children}</div>}
    </div>
  );
}

export function ConsultaProfesionalPage() {
  const { token, rol } = useAuth();
  const { turnoId } = useParams({ from: '/auth/profesional/consulta/$turnoId' });
  const navigate = useNavigate();

  const [datosTurno, setDatosTurno] = useState<DatosTurno | null>(null);
  const [formulario, setFormulario] = useState<FormularioMediciones>(FORMULARIO_INICIAL);
  const [cargando, setCargando] = useState(true);
  const [guardandoMediciones, setGuardandoMediciones] = useState(false);
  const [finalizandoConsulta, setFinalizandoConsulta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estado para secciones colapsables
  const [secciones, setSecciones] = useState({
    perimetros: false,
    pliegues: false,
    composicion: false,
    signosVitales: false,
  });

  const toggleSeccion = (seccion: keyof typeof secciones) => {
    setSecciones((prev) => ({ ...prev, [seccion]: !prev[seccion] }));
  };

  const esNutricionista = rol === 'NUTRICIONISTA';

  const cargarDatosTurno = useCallback(async () => {
    if (!token || !turnoId) {
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const response = await apiRequest<ApiResponse<DatosTurno>>(
        `/turnos/${turnoId}`,
        { token },
      );

      setDatosTurno(response.data);

      // Pre-cargar altura desde ficha de salud si existe
      if (response.data.fichaSalud) {
        setFormulario((prev) => ({
          ...prev,
          altura: String(response.data.fichaSalud?.altura ?? ''),
        }));
      }
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo cargar los datos del turno.';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  }, [token, turnoId]);

  useEffect(() => {
    void cargarDatosTurno();
  }, [cargarDatosTurno]);

  const imc = useMemo(() => {
    const pesoNum = Number(formulario.peso);
    const alturaNum = Number(formulario.altura);

    if (
      !Number.isFinite(pesoNum) ||
      !Number.isFinite(alturaNum) ||
      pesoNum <= 0 ||
      alturaNum <= 0
    ) {
      return null;
    }

    const alturaMts = alturaNum / 100;
    const imcCalculado = pesoNum / (alturaMts * alturaMts);
    return imcCalculado.toFixed(2);
  }, [formulario.peso, formulario.altura]);

  const masaMagra = useMemo(() => {
    const pesoNum = Number(formulario.peso);
    const grasaNum = Number(formulario.porcentajeGrasa);

    if (
      !Number.isFinite(pesoNum) ||
      !Number.isFinite(grasaNum) ||
      pesoNum <= 0 ||
      grasaNum <= 0 ||
      grasaNum >= 100
    ) {
      return null;
    }

    return (pesoNum * (1 - grasaNum / 100)).toFixed(1);
  }, [formulario.peso, formulario.porcentajeGrasa]);

  const iniciarConsulta = useCallback(async () => {
    if (!token || !turnoId) {
      return;
    }

    try {
      await apiRequest(`/turnos/${turnoId}/iniciar-consulta`, {
        method: 'POST',
        token,
      });
      toast.success('Consulta iniciada');
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'Error al iniciar consulta';
      toast.error(mensaje);
    }
  }, [token, turnoId]);

  const guardarMediciones = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !turnoId) {
      return;
    }

    try {
      setGuardandoMediciones(true);
      setError(null);
      setMensajeExito(null);

      const payload = {
        peso: Number(formulario.peso),
        altura: formulario.altura ? Number(formulario.altura) : undefined,
        perimetroCintura: formulario.perimetroCintura
          ? Number(formulario.perimetroCintura)
          : undefined,
        perimetroCadera: formulario.perimetroCadera
          ? Number(formulario.perimetroCadera)
          : undefined,
        perimetroBrazo: formulario.perimetroBrazo
          ? Number(formulario.perimetroBrazo)
          : undefined,
        perimetroMuslo: formulario.perimetroMuslo
          ? Number(formulario.perimetroMuslo)
          : undefined,
        perimetroPecho: formulario.perimetroPecho
          ? Number(formulario.perimetroPecho)
          : undefined,
        pliegueTriceps: formulario.pliegueTriceps
          ? Number(formulario.pliegueTriceps)
          : undefined,
        pliegueAbdominal: formulario.pliegueAbdominal
          ? Number(formulario.pliegueAbdominal)
          : undefined,
        pliegueMuslo: formulario.pliegueMuslo
          ? Number(formulario.pliegueMuslo)
          : undefined,
        porcentajeGrasa: formulario.porcentajeGrasa
          ? Number(formulario.porcentajeGrasa)
          : undefined,
        frecuenciaCardiaca: formulario.frecuenciaCardiaca
          ? Number(formulario.frecuenciaCardiaca)
          : undefined,
        tensionSistolica: formulario.tensionSistolica
          ? Number(formulario.tensionSistolica)
          : undefined,
        tensionDiastolica: formulario.tensionDiastolica
          ? Number(formulario.tensionDiastolica)
          : undefined,
        notasMedicion: formulario.notasMedicion.trim() || undefined,
      };

      await apiRequest(`/turnos/${turnoId}/mediciones`, {
        method: 'POST',
        token,
        body: payload,
      });

      setMensajeExito('Mediciones guardadas correctamente');
      toast.success('Mediciones guardadas');
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron guardar las mediciones.';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setGuardandoMediciones(false);
    }
  };

  const finalizarConsulta = async () => {
    if (!token || !turnoId) {
      return;
    }

    try {
      setFinalizandoConsulta(true);

      await apiRequest(`/turnos/${turnoId}/finalizar-consulta`, {
        method: 'POST',
        token,
      });

      toast.success('Consulta finalizada exitosamente');
      navigate({ to: '/turnos-profesional' });
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'Error al finalizar consulta';
      toast.error(mensaje);
    } finally {
      setFinalizandoConsulta(false);
    }
  };

  useEffect(() => {
    void iniciarConsulta();
  }, [iniciarConsulta]);

  if (!esNutricionista) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
        </CardHeader>
        <CardContent>
          Solo nutricionistas pueden acceder a esta pantalla.
        </CardContent>
      </Card>
    );
  }

  if (cargando) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground">Cargando datos de la consulta...</p>
        </CardContent>
      </Card>
    );
  }

  if (!datosTurno) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turno no encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            No se encontraron datos para este turno.
          </p>
          <Button asChild variant="outline">
            <Link to="/turnos-profesional">
              <ArrowLeft className="h-4 w-4" />
              Volver a turnos
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { socio, fichaSalud } = datosTurno;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <User className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                Consulta Profesional
              </h1>
            </div>
            <p className="text-muted-foreground">
              Turno del {datosTurno.fechaTurno} - {datosTurno.horaTurno}
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/turnos-profesional">
              <ArrowLeft className="h-4 w-4" />
              Volver a turnos
            </Link>
          </Button>
        </div>
      </div>

      {/* Datos del Socio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Datos del Socio</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = `/profesional/paciente/${socio.idPersona}/progreso`;
            }}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Ver progreso
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre completo</p>
              <p className="text-base">
                {socio.nombre} {socio.apellido}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">DNI</p>
              <p className="text-base">{socio.dni}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{socio.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
              <p className="text-base">{socio.telefono ?? 'No registrado'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ficha de Salud (readonly) */}
      {fichaSalud ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ficha de Salud (Lectura)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Altura</p>
                <p className="text-base">{fichaSalud.altura} cm</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Peso ref.</p>
                <p className="text-base">{fichaSalud.peso} kg</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nivel actividad</p>
                <p className="text-base">{fichaSalud.nivelActividadFisica}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Objetivo</p>
                <p className="text-base">{fichaSalud.objetivoPersonal}</p>
              </div>
            </div>

            {(fichaSalud.alergias.length > 0 || fichaSalud.patologias.length > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {fichaSalud.alergias.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-700">Alergias</p>
                    <p className="text-sm text-red-600">{fichaSalud.alergias.join(', ')}</p>
                  </div>
                )}
                {fichaSalud.patologias.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-700">Patologías</p>
                    <p className="text-sm text-amber-600">{fichaSalud.patologias.join(', ')}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-800">
              El socio no tiene ficha de salud registrada.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Formulario de Mediciones */}
      <form onSubmit={guardarMediciones}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Mediciones de la Consulta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Datos básicos - siempre visible */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4">
              <h4 className="mb-3 font-medium text-blue-800">Datos básicos</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="peso" required>
                    Peso (kg) *
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
                    placeholder="Ej: 75.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="altura">Altura (cm)</Label>
                  <Input
                    id="altura"
                    type="number"
                    min={100}
                    max={250}
                    value={formulario.altura}
                    onChange={(event) =>
                      setFormulario((previo) => ({ ...previo, altura: event.target.value }))
                    }
                    placeholder="Pre-cargado de ficha"
                  />
                  <p className="text-xs text-gray-400">Se usa la última altura registrada</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imc">IMC (calculado)</Label>
                  <Input
                    id="imc"
                    type="text"
                    value={imc ?? '-'}
                    disabled
                    className="bg-gray-100"
                  />
                  {imc && (
                    <p className="text-xs text-gray-500">
                      {Number(imc) < 18.5 && 'Bajo peso'}
                      {Number(imc) >= 18.5 && Number(imc) < 25 && 'Normal'}
                      {Number(imc) >= 25 && Number(imc) < 30 && 'Sobrepeso'}
                      {Number(imc) >= 30 && 'Obesidad'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Secciones colapsables */}
            <div className="space-y-2">
              {/* Perímetros */}
              <SeccionColapsable
                titulo="Perímetros corporales"
                icono={Ruler}
                expandida={secciones.perimetros}
                onToggle={() => toggleSeccion('perimetros')}
              >
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                  <div className="space-y-2">
                    <Label>Cintura (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={300}
                      step="0.1"
                      value={formulario.perimetroCintura}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, perimetroCintura: e.target.value }))
                      }
                      placeholder="Ej: 85"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cadera (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={300}
                      step="0.1"
                      value={formulario.perimetroCadera}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, perimetroCadera: e.target.value }))
                      }
                      placeholder="Ej: 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Brazo (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={formulario.perimetroBrazo}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, perimetroBrazo: e.target.value }))
                      }
                      placeholder="Ej: 32"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Muslo (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={150}
                      step="0.1"
                      value={formulario.perimetroMuslo}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, perimetroMuslo: e.target.value }))
                      }
                      placeholder="Ej: 55"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pecho (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={200}
                      step="0.1"
                      value={formulario.perimetroPecho}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, perimetroPecho: e.target.value }))
                      }
                      placeholder="Ej: 95"
                    />
                  </div>
                </div>
              </SeccionColapsable>

              {/* Pliegues cutáneos */}
              <SeccionColapsable
                titulo="Pliegues cutáneos"
                icono={Activity}
                expandida={secciones.pliegues}
                onToggle={() => toggleSeccion('pliegues')}
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Tríceps (mm)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={formulario.pliegueTriceps}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, pliegueTriceps: e.target.value }))
                      }
                      placeholder="Ej: 15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Abdominal (mm)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={formulario.pliegueAbdominal}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, pliegueAbdominal: e.target.value }))
                      }
                      placeholder="Ej: 20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Muslo (mm)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={formulario.pliegueMuslo}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, pliegueMuslo: e.target.value }))
                      }
                      placeholder="Ej: 18"
                    />
                  </div>
                </div>
              </SeccionColapsable>

              {/* Composición corporal */}
              <SeccionColapsable
                titulo="Composición corporal"
                icono={Scale}
                expandida={secciones.composicion}
                onToggle={() => toggleSeccion('composicion')}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>% Grasa corporal</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={formulario.porcentajeGrasa}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, porcentajeGrasa: e.target.value }))
                      }
                      placeholder="Ej: 22.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Masa magra (calculada)</Label>
                    <Input
                      type="text"
                      value={masaMagra ? `${masaMagra} kg` : '-'}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-400">
                      Se calcula automáticamente: peso × (1 - % grasa)
                    </p>
                  </div>
                </div>
              </SeccionColapsable>

              {/* Signos vitales */}
              <SeccionColapsable
                titulo="Signos vitales"
                icono={Heart}
                expandida={secciones.signosVitales}
                onToggle={() => toggleSeccion('signosVitales')}
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Frecuencia cardíaca (lpm)</Label>
                    <Input
                      type="number"
                      min={30}
                      max={220}
                      value={formulario.frecuenciaCardiaca}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, frecuenciaCardiaca: e.target.value }))
                      }
                      placeholder="Ej: 72"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tensión sistólica (mmHg)</Label>
                    <Input
                      type="number"
                      min={60}
                      max={250}
                      value={formulario.tensionSistolica}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, tensionSistolica: e.target.value }))
                      }
                      placeholder="Ej: 120"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tensión diastólica (mmHg)</Label>
                    <Input
                      type="number"
                      min={40}
                      max={150}
                      value={formulario.tensionDiastolica}
                      onChange={(e) =>
                        setFormulario((p) => ({ ...p, tensionDiastolica: e.target.value }))
                      }
                      placeholder="Ej: 80"
                    />
                  </div>
                </div>
              </SeccionColapsable>
            </div>

            {/* Notas de medición */}
            <div className="space-y-2">
              <Label htmlFor="notasMedicion">Notas de la medición</Label>
              <Textarea
                id="notasMedicion"
                value={formulario.notasMedicion}
                onChange={(event) =>
                  setFormulario((previo) => ({
                    ...previo,
                    notasMedicion: event.target.value,
                  }))
                }
                placeholder="Observaciones relevantes sobre las mediciones tomadas..."
                rows={3}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {mensajeExito && (
              <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{mensajeExito}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button
                type="submit"
                variant="secondary"
                disabled={guardandoMediciones || finalizandoConsulta}
              >
                {guardandoMediciones ? 'Guardando...' : 'Guardar mediciones'}
              </Button>
              <Button
                type="button"
                onClick={finalizarConsulta}
                disabled={guardandoMediciones || finalizandoConsulta}
              >
                {finalizandoConsulta ? 'Finalizando...' : 'Finalizar consulta'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Sección de Plan de Alimentación */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Plan de Alimentación
          </CardTitle>
          <Link
            to="/profesional/plan/$socioId/editar"
            params={{ socioId: socio.idPersona.toString() }}
          >
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Gestionar plan
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Plan de Alimentación</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Accede al editor de planes para crear o modificar el plan de alimentación
              de {socio.nombre} {socio.apellido}.
            </p>
            <div className="flex gap-2">
              <Link
                to="/profesional/plan/$socioId/editar"
                params={{ socioId: socio.idPersona.toString() }}
              >
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Crear/Editar plan
                </Button>
              </Link>
              <Link
                to="/profesional/paciente/$socioId/progreso"
                params={{ socioId: socio.idPersona.toString() }}
              >
                <Button variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Ver progreso
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
