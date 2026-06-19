import { Suspense, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
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
import {
  GraficoPrincipalEvolucion,
  type ModoGraficoPrincipal,
} from '@/components/progreso/GraficoPrincipalEvolucion';
import { PanelComposicionCorporal } from '@/components/progreso/PanelComposicionCorporal';
import { PanelPlieguesEvolucion } from '@/components/progreso/PanelPlieguesEvolucion';
import { PanelResumenEvolucion } from '@/components/progreso/PanelResumenEvolucion';
import { TablaEvolucionPaciente } from '@/components/progreso/TablaEvolucionPaciente';
import { TimelineEvolucionClinica } from '@/components/progreso/TimelineEvolucionClinica';
import { useProgresoData } from '@/components/progreso/useProgresoData';
import { derivarSeriesEvolucion } from '@/components/progreso/useSeriesEvolucion';
import { RangoSaludableBadge } from '@/components/progreso/IndicadoresProgreso';

// PDF Export
import { ExportProgresoPDFButton } from '@/components/progreso/ExportProgresoPDFButton';

// Photo components
import { GaleriaFotos } from '@/components/progreso/GaleriaFotos';
import { FotoUploader } from '@/components/progreso/FotoUploader';
import { ComparacionFotos } from '@/components/progreso/ComparacionFotos';
import { ComparadorFotosSesion } from '@/components/progreso/ComparadorFotosSesion';
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
import type { RangoTemporalEvolucion } from '@/components/progreso/types';

type TabActivo = 'resumen' | 'fotos' | 'objetivos' | 'historial';

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
  const [rangoTemporal, setRangoTemporal] = useState<RangoTemporalEvolucion>('todo');
  const [modoGraficoPrincipal, setModoGraficoPrincipal] = useState<ModoGraficoPrincipal>('peso');
  const [subirFotoAbierto, establecerSubirFotoAbierto] = useState(false);
  const [crearObjetivoAbierto, establecerCrearObjetivoAbierto] = useState(false);

  // Datos de mediciones
  const { historial, resumen, isError } = useProgresoData({
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
  const seriesEvolucion = derivarSeriesEvolucion(historial, rangoTemporal);
  const historialFiltrado = historial
    ? { ...historial, mediciones: seriesEvolucion.mediciones }
    : undefined;
  const eventosTimeline = [
    ...seriesEvolucion.mediciones.map((medicion) => ({
      id: `medicion-${medicion.idMedicion}`,
      fecha: new Date(medicion.fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      titulo: `Medicion registrada: ${medicion.peso} kg`,
      descripcion: medicion.notasMedicion ?? 'Sin notas adicionales para esta sesion.',
      orden: new Date(medicion.fecha).getTime(),
    })),
    ...(listaObjetivos?.activos ?? []).map((objetivo) => ({
      id: `objetivo-activo-${objetivo.idObjetivo}`,
      fecha: new Date(objetivo.fechaInicio).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      titulo: `Objetivo activo: ${objetivo.tipoMetrica}`,
      descripcion: `Meta ${objetivo.valorObjetivo} con progreso actual ${objetivo.progreso}%.`,
      orden: new Date(objetivo.fechaInicio).getTime(),
    })),
    ...(galeriaFotos?.sesiones ?? []).map((sesion, indice) => ({
      id: `fotos-sesion-${sesion.turnoId ?? indice}`,
      fecha: sesion.fechaTurno
        ? new Date(sesion.fechaTurno).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : 'Sesion sin fecha',
      titulo: 'Sesion con fotos de progreso',
      descripcion: `${sesion.fotos.reduce((total, grupo) => total + grupo.fotos.length, 0)} imagenes registradas para comparacion visual.`,
      orden: sesion.fechaTurno ? new Date(sesion.fechaTurno).getTime() : 0,
    })),
  ]
    .sort((a, b) => b.orden - a.orden)
    .map((evento) => ({
      id: evento.id,
      fecha: evento.fecha,
      titulo: evento.titulo,
      descripcion: evento.descripcion,
    }));

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
    ? `${resumen?.totalMediciones ?? 0} mediciones registradas${resumen?.primeraMedicion ? ` desde ${new Date(resumen.primeraMedicion).toLocaleDateString('es-AR')}` : ''}`
    : `Segui tu evolucion sesion a sesion${resumen?.primeraMedicion ? ` desde ${new Date(resumen.primeraMedicion).toLocaleDateString('es-AR')}` : ''}`;
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
    { id: 'historial' as TabActivo, label: 'Historial', icon: History },
    { id: 'fotos' as TabActivo, label: 'Fotos', icon: Camera },
    { id: 'objetivos' as TabActivo, label: 'Objetivos', icon: Target },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <PanelResumenEvolucion
        titulo={titulo}
        subtitulo={subtitulo}
        rangoTemporal={rangoTemporal}
        onCambiarRango={setRangoTemporal}
        kpis={seriesEvolucion.kpis}
        riesgoCardiovascular={{
          relacion: resumen?.relacionCinturaCadera.actual ?? null,
          categoria: resumen?.relacionCinturaCadera.riesgoCardiovascular ?? null,
        }}
        acciones={
          <>
            {esVistaNutricionista && (
              <Link to="/turnos-profesional">
                <Button variant="ghost" size="sm" className="rounded-full bg-white/70">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
              </Link>
            )}
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
          </>
        }
      />

      {/* Mensaje motivacional */}
      {!esVistaNutricionista && resumen?.peso.tendencia === 'bajando' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-green-700">
            ¡Excelente! Vas muy bien, continuá así con tu progreso.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              type="button"
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
          <Suspense fallback={<Skeleton className="h-80" />}>
            <GraficoPrincipalEvolucion
              modo={modoGraficoPrincipal}
              onCambiarModo={setModoGraficoPrincipal}
              historial={historialFiltrado}
              resumen={resumen}
            />
          </Suspense>

          <PanelComposicionCorporal
            grasaCorporal={seriesEvolucion.kpis.grasaCorporalActual}
            masaMagra={seriesEvolucion.kpis.masaMagraActual}
          />

          <PanelPlieguesEvolucion historial={historialFiltrado ?? undefined} />

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

          <TimelineEvolucionClinica eventos={eventosTimeline} />
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
          <ComparadorFotosSesion sesiones={galeriaFotos?.sesiones ?? []} />

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

      {tabActivo === 'historial' && (
        <TablaEvolucionPaciente
          filas={seriesEvolucion.mediciones.map((medicion, indice) => ({
            id: medicion.idMedicion,
            fecha: new Date(medicion.fecha).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            peso: `${medicion.peso} kg`,
            imc: medicion.imc.toFixed(1),
            cintura: medicion.perimetroCintura ? `${medicion.perimetroCintura} cm` : '-',
            pecho: medicion.perimetroPecho ? `${medicion.perimetroPecho} cm` : '-',
            deltaPeso:
              indice === 0
                ? '-'
                : `${Number((medicion.peso - seriesEvolucion.mediciones[0].peso).toFixed(1))} kg`,
            detalle: medicion.notasMedicion ?? 'Sin notas de medicion',
          }))}
        />
      )}
    </div>
  );
}
