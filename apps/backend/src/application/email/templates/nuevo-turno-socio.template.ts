import { baseTemplate } from './base.template';
import {
  boton,
  destacadoTurno,
  filaDetalle,
  parrafo,
} from './componentes.template';

export interface NuevoTurnoSocioTemplateData {
  nombreSocio: string;
  nombreNutricionista: string;
  fecha: string;
  hora: string;
  turnosUrl?: string;
}

export function nuevoTurnoSocioTemplate(
  data: NuevoTurnoSocioTemplateData,
): string {
  const turnosUrl = data.turnosUrl ?? 'http://localhost:5173/turnos';

  return baseTemplate({
    titulo: 'Turno confirmado',
    nombreDestinatario: data.nombreSocio,
    contenido: `
      ${parrafo(
        'Tu turno fue confirmado exitosamente. Te esperamos en la fecha indicada.',
      )}
      ${destacadoTurno({
        etiqueta: 'Detalles de tu turno',
        fecha: data.fecha,
        hora: data.hora,
      })}
      ${filaDetalle({
        icono: '&#x1F464;',
        etiqueta: 'Profesional',
        valor: `Nut. ${data.nombreNutricionista}`,
      })}
      ${boton(turnosUrl, 'Ver mis turnos')}`,
  });
}
