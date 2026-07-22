import { baseTemplate } from './base.template';
import {
  botonera,
  destacadoTurno,
  filaDetalle,
  parrafo,
} from './componentes.template';

export interface RecordatorioTemplateData {
  nombreSocio: string;
  nombreProfesional: string;
  fecha: string;
  hora: string;
  enlaceConfirmacion: string;
  enlaceCancelacion: string;
}

export function recordatorioTemplate(data: RecordatorioTemplateData): string {
  return baseTemplate({
    titulo: 'Recordatorio de turno',
    nombreDestinatario: data.nombreSocio,
    contenido: `
      ${parrafo(
        'Record&aacute;moste tu pr&oacute;ximo turno con nutrici&oacute;n. Te esperamos en el gimnasio.',
      )}
      ${destacadoTurno({
        etiqueta: 'Turno programado',
        fecha: data.fecha,
        hora: data.hora,
      })}
      ${filaDetalle({
        icono: '&#x1F468;&#x200D;&#x2695;&#xFE0F;',
        etiqueta: 'Profesional',
        valor: `Nut. ${data.nombreProfesional}`,
      })}
      ${botonera(
        { href: data.enlaceConfirmacion, texto: 'Confirmar asistencia' },
        { href: data.enlaceCancelacion, texto: 'Cancelar turno' },
      )}`,
  });
}
