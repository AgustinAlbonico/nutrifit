import { Suspense, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  BarChart3,
  History,
  TrendingUp,
  Camera,
  Target,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

// Progreso components
import { TarjetasResumenProgreso } from '@/components/progreso/TarjetasResumenProgreso';
import { useProgresoData } from '@/components/progreso/useProgresoData';
import { GraficoEvolucionPeso } from '@/components/progreso/GraficoEvolucionPeso';
import { GraficoEvolucionIMC } from '@/components/progreso/GraficoEvolucionIMC';
import { GraficoPerimetros } from '@/components/progreso/GraficoPerimetros';
import { GraficoComposicionCorporal } from '@/components/progreso/GraficoComposicionCorporal';
import { GraficoSignosVitales } from '@/components/progreso/GraficoSignosVitales';
import { TablaHistorialMediciones } from '@/components/progreso/TablaHistorialMediciones';
import { RangoSaludableBadge } from '@/components/progreso/IndicadoresProgreso';

// PDF Export
import { ExportProgresoPDFButton } from '@/components/progreso/ExportProgresoPDFButton';

// Photo components
import { GaleriaFotos } from '@/components/progreso/GaleriaFotos';
import { FotoUploader } from '@/components/progreso/FotoUploader';
import { ComparacionFotos } from '@/components/progreso/ComparacionFotos';
import { useFotosProgreso, useSubirFoto, useEliminarFoto } from '@/components/progreso/useFotosProgreso';

// Goal components
import { TarjetaObjetivo } from '@/components/progreso/TarjetaObjetivo';
import { WizardCrearObjetivo } from '@/components/progreso/WizardCrearObjetivo';
import {
  useObjetivos,
  useCrearObjetivo,
  useActualizarObjetivo,
  useMarcarObjetivo,
} from '@/components/progreso/useObjetivos';

type TabActivo = 'resumen' | 'fotos' | 'objetivos' | 'graficos' | 'historial';

interface PropiedadesDashboardProgreso {
  socioId: number;
  nutricionistaId?: number;
  esVistaNutricionista?: boolean;
  nombrePaciente?: string;
}
export function DashboardProgreso({
  socioId,
  nutricionistaId,
  esVistaNutricionista = false,
  nombrePaciente,
}: PropiedadesDashboardProgreso) {
  const { token, rol } = useAuth();
  const [tabActivo, setTabActivo] = useState<TabActivo>('resumen');
  const [subirFotoAbierto, establecerSubirFotoAbierto] = useState(false);
  const [crearObjetivoAbierto, establecerCrearObjetivoAbierto] = useState(false);

  // Datos de mediciones
  const { historial, resumen, isLoading, isError } = useProgresoData({
    socioId,
    nutricionistaId,
    token,
  });

  // Datos de fotos
  const {
    data: galeriaFotos,
    isLoading: cargandoFotos,
  } = useFotosProgreso(socioId, token);
  const subirFoto = useSubirFoto(socioId, token);
  const eliminarFoto = useEliminarFoto(socioId, token);

  // Datos de objetivos
  const {
    data: listaObjetivos,
    isLoading: cargandoObjetivos,
    refetch: recargarObjetivos,
  } = useObjetivos(socioId, token);
  const crearObjetivo = useCrearObjetivo(socioId, token);
  const actualizarObjetivo = useActualizarObjetivo(socioId, token);
  const marcarObjetivo = useMarcarObjetivo(socioId, token);

  const puedeEditar = rol === 'SOCIO' || rol === 'NUTRICIONISTA';

  if (isError) {
    return (
      <div className="space-y-6">
        {esVistaNutricionista && (
          <Link to="/turnos-profesional">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a turnos
            </Button>
          </Link>
        )}
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">
            Error al cargar los datos de progreso. Por favor, intenta nuevamente.
          </p>
        </div>
      </div>
    );
  }

  // Construir nombre del paciente para el título
  const nombrePacienteMostrar = nombrePaciente 
    || (historial ? `${historial.nombreSocio || ''} ${historial.apellidoSocio || ''}`.trim() : null)
    || 'Paciente';

  const titulo = esVistaNutricionista
    ? `Progreso de ${nombrePacienteMostrar}`
    : 'Mi Progreso';
  const subtitulo = esVistaNutricionista
    ? `${resumen?.totalMediciones ?? 0} mediciones registradas`
    : 'Seguí tu evolución sesión a sesión';
  const manejarSubirFoto = async (archivo: File, tipoFoto: 'frente' | 'perfil' | 'espalda' | 'otro', notas?: string) => {
    await subirFoto.mutateAsync({
      archivo,
      tipoFoto,
      notas,
    });
  };

  const manejarEliminarFoto = async (fotoId: number) => {
    await eliminarFoto.mutateAsync(fotoId);
  };

  const manejarCrearObjetivo = async (dto: { tipoMetrica: 'PESO' | 'CINTURA' | 'CADERA' | 'BRAZO' | 'MUSLO' | 'PECHO'; valorInicial: number; valorObjetivo: number; fechaObjetivo?: string }) => {
    await crearObjetivo.mutateAsync(dto);
    recargarObjetivos();
  };

  const manejarActualizarObjetivo = async (objetivoId: number, valorActual: number) => {
    await actualizarObjetivo.mutateAsync({
      objetivoId,
      dto: { valorActual },
    });
    recargarObjetivos();
  };

  const manejarMarcarObjetivo = async (objetivoId: number, estado: 'ACTIVO' | 'COMPLETADO' | 'ABANDONADO') => {
    await marcarObjetivo.mutateAsync({ objetivoId, estado });
    recargarObjetivos();
  };

  const tabs = [
    { id: 'resumen' as TabActivo, label: 'Resumen', icon: TrendingUp },
    { id: 'fotos' as TabActivo, label: 'Fotos', icon: Camera },
    { id: 'objetivos' as TabActivo, label: 'Objetivos', icon: Target },
    { id: 'graficos' as TabActivo, label: 'Gráficos', icon: BarChart3 },
    { id: 'historial' as TabActivo, label: 'Historial', icon: History },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {esVistaNutricionista && (
              <Link to="/turnos-profesional">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                {titulo}
              </h1>
              <p className="mt-2 text-muted-foreground max-w-2xl text-base">
                {subtitulo}
                {resumen?.primeraMedicion && (
                  <span>
                    {' '}
                    desde {new Date(resumen.primeraMedicion).toLocaleDateString('es-AR')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {resumen?.imc.categoriaActual && (
              <RangoSaludableBadge categoria={resumen.imc.categoriaActual} />
            )}
            <ExportProgresoPDFButton
              resumen={resumen}
              mediciones={historial?.mediciones ?? []}
              objetivos={listaObjetivos?.activos ?? []}
              galeria={galeriaFotos}
              nombreSocio={esVistaNutricionista ? (nombrePaciente || 'Paciente') : `${historial?.nombreSocio || ''} ${historial?.apellidoSocio || ''}`.trim() || 'Yo'}
              socioId={socioId}
            />
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      {/* Mensaje motivacional */}
      {!esVistaNutricionista && resumen?.peso.tendencia === 'bajando' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-green-700">
            ¡Excelente! Vas muy bien, continuá así con tu progreso.
          </p>
        </div>
      )}

      {/* Info del paciente (solo para nutricionista) */}
      {esVistaNutricionista && historial && (
        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-gray-50 p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Altura</p>
            <p className="font-semibold">{historial.altura} cm</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Peso actual</p>
            <p className="font-semibold">
              {resumen?.peso.actual ? `${resumen.peso.actual} kg` : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">IMC actual</p>
            <p className="font-semibold">
              {resumen?.imc.actual ? resumen.imc.actual.toFixed(1) : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Rango saludable</p>
            <p className="font-semibold text-sm">
              {resumen?.rangoSaludable.pesoMinimo
                ? `${resumen.rangoSaludable.pesoMinimo}-${resumen.rangoSaludable.pesoMaximo} kg`
                : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActivo(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                tabActivo === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de tabs */}
      {tabActivo === 'resumen' && (
        <div className="space-y-6">
          <TarjetasResumenProgreso resumen={resumen} isLoading={isLoading} />

          {/* Gráfico principal */}
          <Suspense fallback={<Skeleton className="h-80" />}>
            <GraficoEvolucionPeso historial={historial} resumen={resumen} />
          </Suspense>

          {/* Resumen de objetivos activos */}
          {listaObjetivos?.activos && listaObjetivos.activos.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Objetivos activos</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {listaObjetivos.activos.slice(0, 3).map((objetivo) => (
                  <TarjetaObjetivo
                    key={objetivo.idObjetivo}
                    objetivo={objetivo}
                    puedeEditar={puedeEditar && !esVistaNutricionista}
                    onActualizar={manejarActualizarObjetivo}
                    onMarcar={manejarMarcarObjetivo}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tabActivo === 'fotos' && (
        <div className="space-y-6">
          <GaleriaFotos
            socioId={socioId}
            galeria={galeriaFotos}
            cargando={cargandoFotos}
            puedeEditar={puedeEditar && !esVistaNutricionista}
            onEliminarFoto={manejarEliminarFoto}
            fotoEliminando={eliminarFoto.isPending ? 1 : null}
            onSubirFoto={() => establecerSubirFotoAbierto(true)}
          />

          <ComparacionFotos galeria={galeriaFotos} cargando={cargandoFotos} />

          <FotoUploader
            abierto={subirFotoAbierto}
            onCerrar={() => establecerSubirFotoAbierto(false)}
            onSubir={manejarSubirFoto}
            cargando={subirFoto.isPending}
          />
        </div>
      )}

      {tabActivo === 'objetivos' && (
        <div className="space-y-6">
          {puedeEditar && !esVistaNutricionista && (
            <div className="flex justify-end">
              <Button onClick={() => establecerCrearObjetivoAbierto(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo objetivo
              </Button>
            </div>
          )}

          {cargandoObjetivos ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <>
              {listaObjetivos?.activos && listaObjetivos.activos.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Objetivos activos</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {listaObjetivos.activos.map((objetivo) => (
                      <TarjetaObjetivo
                        key={objetivo.idObjetivo}
                        objetivo={objetivo}
                        puedeEditar={puedeEditar && !esVistaNutricionista}
                        onActualizar={manejarActualizarObjetivo}
                        onMarcar={manejarMarcarObjetivo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {listaObjetivos?.completados && listaObjetivos.completados.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Objetivos completados</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {listaObjetivos.completados.map((objetivo) => (
                      <TarjetaObjetivo
                        key={objetivo.idObjetivo}
                        objetivo={objetivo}
                        puedeEditar={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!listaObjetivos?.activos?.length && !listaObjetivos?.completados?.length && (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No hay objetivos registrados
                  </p>
                  {puedeEditar && !esVistaNutricionista && (
                    <Button onClick={() => establecerCrearObjetivoAbierto(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primer objetivo
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          <WizardCrearObjetivo
            abierto={crearObjetivoAbierto}
            onCerrar={() => establecerCrearObjetivoAbierto(false)}
            onCrear={manejarCrearObjetivo}
            cargando={crearObjetivo.isPending}
          />
        </div>
      )}

      {tabActivo === 'graficos' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<Skeleton className="h-80" />}>
            <GraficoEvolucionIMC historial={historial} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-80" />}>
            <GraficoPerimetros historial={historial} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-80" />}>
            <GraficoComposicionCorporal historial={historial} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-80" />}>
            <GraficoSignosVitales historial={historial} />
          </Suspense>
        </div>
      )}

      {tabActivo === 'historial' && (
        <TablaHistorialMediciones historial={historial} isLoading={isLoading} />
      )}
    </div>
  );
}
