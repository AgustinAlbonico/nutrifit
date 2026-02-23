import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ComidaEnPlan, AlimentoEnComida } from '@/components/plan/WeeklyPlanGrid';

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const;
const TIPOS_COMIDA = ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION'] as const;

const estilos = StyleSheet.create({
  pagina: {
    padding: 20,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  titulo: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  subtitulo: {
    fontSize: 10,
    marginBottom: 15,
    color: '#666',
  },
  tabla: {
    flexDirection: 'column',
    marginTop: 10,
  },
  filaEncabezado: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 5,
  },
  celdaEncabezado: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  celdaDia: {
    width: 80,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fila: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    paddingVertical: 3,
  },
  celdaComida: {
    width: 80,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  celda: {
    flex: 1,
    paddingHorizontal: 2,
  },
  alimento: {
    fontSize: 7,
    marginBottom: 1,
  },
  totales: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 2,
  },
  totalesDia: {
    fontSize: 7,
    color: '#888',
    marginTop: 1,
  },
});

interface PropsDocumentoPlan {
  objetivoNutricional: string;
  comidas: ComidaEnPlan[];
  nombreSocio?: string;
}

function calcularTotalesComida(alimentos: AlimentoEnComida[]) {
  return alimentos.reduce(
    (acc, item) => {
      const mult = item.cantidad / (item.alimento.cantidad || 1);
      acc.calorias += (item.alimento.calorias ?? 0) * mult;
      acc.proteinas += (item.alimento.proteinas ?? 0) * mult;
      acc.carbohidratos += (item.alimento.carbohidratos ?? 0) * mult;
      acc.grasas += (item.alimento.grasas ?? 0) * mult;
      return acc;
    },
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
  );
}

function formatearTipoComida(tipo: string): string {
  const mapa: Record<string, string> = {
    DESAYUNO: 'Desayuno',
    ALMUERZO: 'Almuerzo',
    MERIENDA: 'Merienda',
    CENA: 'Cena',
    COLACION: 'Colación',
  };
  return mapa[tipo] || tipo;
}

function formatearDia(dia: string): string {
  const mapa: Record<string, string> = {
    LUNES: 'Lunes',
    MARTES: 'Martes',
    MIERCOLES: 'Miércoles',
    JUEVES: 'Jueves',
    VIERNES: 'Viernes',
    SABADO: 'Sábado',
    DOMINGO: 'Domingo',
  };
  return mapa[dia] || dia;
}

export function DocumentoPlan({ objetivoNutricional, comidas, nombreSocio }: PropsDocumentoPlan) {
  const obtenerComida = (dia: string, tipo: string): AlimentoEnComida[] => {
    return comidas.find(c => c.dia === dia && c.tipoComida === tipo)?.alimentos ?? [];
  };

  const calcularTotalesDia = (dia: string) => {
    const total = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };
    TIPOS_COMIDA.forEach(tipo => {
      const alimentos = obtenerComida(dia, tipo);
      const totales = calcularTotalesComida(alimentos);
      total.calorias += totales.calorias;
      total.proteinas += totales.proteinas;
      total.carbohidratos += totales.carbohidratos;
      total.grasas += totales.grasas;
    });
    return total;
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={estilos.pagina}>
        <Text style={estilos.titulo}>Plan de Alimentación</Text>
        {nombreSocio && <Text style={estilos.subtitulo}>Socio: {nombreSocio}</Text>}
        {objetivoNutricional && (
          <Text style={estilos.subtitulo}>Objetivo: {objetivoNutricional}</Text>
        )}

        <View style={estilos.tabla}>
          <View style={estilos.filaEncabezado}>
            <Text style={estilos.celdaComida}>Comida</Text>
            {DIAS_SEMANA.map(dia => (
              <Text key={dia} style={estilos.celdaEncabezado}>
                {formatearDia(dia)}
              </Text>
            ))}
          </View>

          {TIPOS_COMIDA.map(tipo => (
            <View key={tipo} style={estilos.fila}>
              <Text style={estilos.celdaComida}>{formatearTipoComida(tipo)}</Text>
              {DIAS_SEMANA.map(dia => {
                const alimentos = obtenerComida(dia, tipo);
                const totales = calcularTotalesComida(alimentos);
                return (
                  <View key={`${dia}-${tipo}`} style={estilos.celda}>
                    {alimentos.map((item, idx) => (
                      <Text key={idx} style={estilos.alimento}>
                        • {item.alimento.nombre} ({item.cantidad}{item.alimento.unidadMedida})
                      </Text>
                    ))}
                    {alimentos.length > 0 && (
                      <Text style={estilos.totalesDia}>
                        {Math.round(totales.calorias)} kcal
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          <View style={[estilos.fila, { marginTop: 5, backgroundColor: '#f5f5f5' }]}>
            <Text style={[estilos.celdaComida, { fontWeight: 'bold' }]}>TOTALES</Text>
            {DIAS_SEMANA.map(dia => {
              const totales = calcularTotalesDia(dia);
              return (
                <View key={`total-${dia}`} style={estilos.celda}>
                  <Text style={estilos.totales}>
                    {Math.round(totales.calorias)} kcal
                  </Text>
                  <Text style={estilos.totalesDia}>
                    P:{Math.round(totales.proteinas)}g C:{Math.round(totales.carbohidratos)}g G:{Math.round(totales.grasas)}g
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Page>
    </Document>
  );
}
