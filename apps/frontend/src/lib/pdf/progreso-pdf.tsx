import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type {
  ResumenProgreso,
  MedicionHistorial,
  Objetivo,
  FotoProgreso,
  TipoFoto,
  CategoriaIMC,
} from '@/components/progreso/types';

const estilos = StyleSheet.create({
  pagina: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  titulo: {
    fontSize: 20,
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#ea580c',
  },
  subtitulo: {
    fontSize: 11,
    marginBottom: 20,
    color: '#666',
  },
  seccion: {
    marginBottom: 15,
  },
  tituloSeccion: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  // Tarjetas de resumen
  contenedorTarjetas: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  tarjeta: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#f9fafb',
    borderLeftWidth: 3,
    borderLeftColor: '#ea580c',
  },
  tarjetaTitulo: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  tarjetaValor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tarjetaSubvalor: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  // Tabla
  tabla: {
    flexDirection: 'column',
    marginTop: 8,
  },
  filaEncabezado: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  celdaEncabezado: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 8,
    textAlign: 'center',
    color: '#374151',
  },
  fila: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  celda: {
    flex: 1,
    fontSize: 8,
    textAlign: 'center',
    color: '#4b5563',
  },
  celdaEstrecha: {
    width: 70,
    fontSize: 8,
    textAlign: 'center',
    color: '#4b5563',
  },
  // Progreso
  progresoPositivo: {
    color: '#16a34a',
  },
  progresoNegativo: {
    color: '#dc2626',
  },
  // Fotos
  contenedorFotos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  fotoItem: {
    width: 120,
    alignItems: 'center',
  },
  fotoImagen: {
    width: 100,
    height: 130,
    objectFit: 'cover',
    borderRadius: 4,
  },
  fotoEtiqueta: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 4,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
});

interface PropsDocumentoProgreso {
  resumen: ResumenProgreso | null | undefined;
  mediciones: MedicionHistorial[];
  objetivos: Objetivo[];
  fotos: FotoProgreso[];
  nombreSocio: string;
}

function formatearCategoriaIMC(categoria: CategoriaIMC | null): string {
  if (!categoria) return '-';
  const mapa: Record<CategoriaIMC, string> = {
    bajo_peso: 'Bajo peso',
    normal: 'Normal',
    sobrepeso: 'Sobrepeso',
    obesidad: 'Obesidad',
  };
  return mapa[categoria] || categoria;
}

function formatearTipoMetrica(tipo: string): string {
  const mapa: Record<string, string> = {
    PESO: 'Peso (kg)',
    CINTURA: 'Cintura (cm)',
    CADERA: 'Cadera (cm)',
    BRAZO: 'Brazo (cm)',
    MUSLO: 'Muslo (cm)',
    PECHO: 'Pecho (cm)',
  };
  return mapa[tipo] || tipo;
}

function formatearTipoFoto(tipo: TipoFoto): string {
  const mapa: Record<TipoFoto, string> = {
    frente: 'Frente',
    perfil: 'Perfil',
    espalda: 'Espalda',
    otro: 'Otro',
  };
  return mapa[tipo] || tipo;
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatearDiferencia(valor: number | null, esPeso: boolean = true): string {
  if (valor === null) return '-';
  const signo = valor > 0 ? '+' : '';
  const unidad = esPeso ? ' kg' : ' cm';
  return `${signo}${valor.toFixed(1)}${unidad}`;
}

function obtenerColorDiferencia(valor: number | null): string {
  if (valor === null || valor === 0) return '#6b7280';
  // Para peso, negativo es bueno (bajar)
  // Para perímetros, negativo también suele ser bueno
  return valor < 0 ? '#16a34a' : '#dc2626';
}

export function DocumentoProgreso({
  resumen,
  mediciones,
  objetivos,
  fotos,
  nombreSocio,
}: PropsDocumentoProgreso) {
  const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const rangoFechas = resumen?.primeraMedicion
    ? `${formatearFecha(resumen.primeraMedicion)} - ${resumen.ultimaMedicion ? formatearFecha(resumen.ultimaMedicion) : 'Actual'}`
    : 'Sin mediciones';

  // Últimas 10 mediciones para la tabla
  const ultimasMediciones = mediciones.slice(0, 10);

  // Fotos agrupadas por tipo
  const fotosPorTipo = fotos.reduce((acc, foto) => {
    if (!acc[foto.tipoFoto]) {
      acc[foto.tipoFoto] = [];
    }
    acc[foto.tipoFoto].push(foto);
    return acc;
  }, {} as Record<TipoFoto, FotoProgreso[]>);

  // Obtener la última foto de cada tipo
  const ultimasFotos: FotoProgreso[] = [];
  ['frente', 'perfil', 'espalda'].forEach((tipo) => {
    const fotosTipo = fotosPorTipo[tipo as TipoFoto];
    if (fotosTipo && fotosTipo.length > 0) {
      ultimasFotos.push(fotosTipo[0]); // Ya están ordenadas por fecha descendente
    }
  });

  return (
    <Document>
      <Page size="A4" style={estilos.pagina}>
        {/* Header */}
        <Text style={estilos.titulo}>Reporte de Progreso</Text>
        <Text style={estilos.subtitulo}>
          Socio: {nombreSocio} | Período: {rangoFechas}
        </Text>

        {/* Tarjetas de resumen */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Resumen de Métricas</Text>
          <View style={estilos.contenedorTarjetas}>
            {/* Peso */}
            <View style={estilos.tarjeta}>
              <Text style={estilos.tarjetaTitulo}>Peso</Text>
              <Text style={estilos.tarjetaValor}>
                {resumen?.peso.actual ? `${resumen.peso.actual.toFixed(1)} kg` : '-'}
              </Text>
              <Text style={[estilos.tarjetaSubvalor, { color: obtenerColorDiferencia(resumen?.peso.diferencia ?? null) }]}>
                {formatearDiferencia(resumen?.peso.diferencia ?? null, true)}
              </Text>
            </View>

            {/* IMC */}
            <View style={estilos.tarjeta}>
              <Text style={estilos.tarjetaTitulo}>IMC</Text>
              <Text style={estilos.tarjetaValor}>
                {resumen?.imc.actual ? resumen.imc.actual.toFixed(1) : '-'}
              </Text>
              <Text style={estilos.tarjetaSubvalor}>
                {formatearCategoriaIMC(resumen?.imc.categoriaActual ?? null)}
              </Text>
            </View>

            {/* Cintura */}
            <View style={estilos.tarjeta}>
              <Text style={estilos.tarjetaTitulo}>Cintura</Text>
              <Text style={estilos.tarjetaValor}>
                {resumen?.perimetros.cintura.actual ? `${resumen.perimetros.cintura.actual.toFixed(1)} cm` : '-'}
              </Text>
              <Text style={[estilos.tarjetaSubvalor, { color: obtenerColorDiferencia(resumen?.perimetros.cintura.diferencia ?? null) }]}>
                {formatearDiferencia(resumen?.perimetros.cintura.diferencia ?? null, false)}
              </Text>
            </View>

            {/* Total mediciones */}
            <View style={estilos.tarjeta}>
              <Text style={estilos.tarjetaTitulo}>Mediciones</Text>
              <Text style={estilos.tarjetaValor}>
                {resumen?.totalMediciones ?? 0}
              </Text>
              <Text style={estilos.tarjetaSubvalor}>
                registros
              </Text>
            </View>
          </View>
        </View>

        {/* Objetivos activos */}
        {objetivos.length > 0 && (
          <View style={estilos.seccion}>
            <Text style={estilos.tituloSeccion}>Objetivos Activos</Text>
            <View style={estilos.tabla}>
              <View style={estilos.filaEncabezado}>
                <Text style={estilos.celdaEncabezado}>Métrica</Text>
                <Text style={estilos.celdaEncabezado}>Inicial</Text>
                <Text style={estilos.celdaEncabezado}>Actual</Text>
                <Text style={estilos.celdaEncabezado}>Objetivo</Text>
                <Text style={estilos.celdaEncabezado}>Progreso</Text>
              </View>
              {objetivos.map((objetivo) => (
                <View key={objetivo.idObjetivo} style={estilos.fila}>
                  <Text style={estilos.celda}>{formatearTipoMetrica(objetivo.tipoMetrica)}</Text>
                  <Text style={estilos.celda}>{objetivo.valorInicial.toFixed(1)}</Text>
                  <Text style={estilos.celda}>{objetivo.valorActual.toFixed(1)}</Text>
                  <Text style={estilos.celda}>{objetivo.valorObjetivo.toFixed(1)}</Text>
                  <Text style={[estilos.celda, objetivo.progreso >= 100 ? estilos.progresoPositivo : {}]}>
                    {objetivo.progreso.toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Historial de mediciones */}
        {ultimasMediciones.length > 0 && (
          <View style={estilos.seccion}>
            <Text style={estilos.tituloSeccion}>Historial de Mediciones (últimas 10)</Text>
            <View style={estilos.tabla}>
              <View style={estilos.filaEncabezado}>
                <Text style={[estilos.celdaEncabezado, { flex: 1.2 }]}>Fecha</Text>
                <Text style={estilos.celdaEncabezado}>Peso</Text>
                <Text style={estilos.celdaEncabezado}>IMC</Text>
                <Text style={estilos.celdaEncabezado}>Cintura</Text>
                <Text style={[estilos.celdaEncabezado, { flex: 1.3 }]}>Profesional</Text>
              </View>
              {ultimasMediciones.map((medicion) => (
                <View key={medicion.idMedicion} style={estilos.fila}>
                  <Text style={[estilos.celda, { flex: 1.2 }]}>{formatearFecha(medicion.fecha)}</Text>
                  <Text style={estilos.celda}>{medicion.peso.toFixed(1)} kg</Text>
                  <Text style={estilos.celda}>{medicion.imc.toFixed(1)}</Text>
                  <Text style={estilos.celda}>
                    {medicion.perimetroCintura ? `${medicion.perimetroCintura.toFixed(1)} cm` : '-'}
                  </Text>
                  <Text style={[estilos.celda, { flex: 1.3 }]}>
                    {medicion.profesional
                      ? `${medicion.profesional.nombre} ${medicion.profesional.apellido}`
                      : '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Fotos de progreso */}
        {ultimasFotos.length > 0 && (
          <View style={estilos.seccion}>
            <Text style={estilos.tituloSeccion}>Fotos de Progreso</Text>
            <View style={estilos.contenedorFotos}>
              {ultimasFotos.map((foto) => (
                <View key={foto.idFoto} style={estilos.fotoItem}>
                  <Image
                    style={estilos.fotoImagen}
                    src={foto.urlFirmada}
                  />
                  <Text style={estilos.fotoEtiqueta}>
                    {formatearTipoFoto(foto.tipoFoto)} - {formatearFecha(foto.fecha)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={estilos.footer} fixed>
          <Text>
            Reporte generado el {fechaGeneracion} | Nutrifit Supervisor
          </Text>
        </View>
      </Page>
    </Document>
  );
}
