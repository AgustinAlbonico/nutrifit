import { CreadoPor } from '../../../domain/entities/Turno/creado-por.enum';
import { baseTemplate } from './base.template';
import {
  boton,
  destacadoTurno,
  filaDetalle,
  parrafo,
} from './componentes.template';

export interface NuevoTurnoNutriTemplateData {
  nombreNutricionista: string;
  nombreSocio: string;
  dniSocio?: string | null;
  fecha: string;
  hora: string;
  creadoPor: CreadoPor;
  agendaUrl?: string;
}

function mapearCreadoPor(creadoPor: CreadoPor): string {
  const mapa: Record<CreadoPor, string> = {
    [CreadoPor.RECEPCION]: 'Recepci&oacute;n',
    [CreadoPor.ADMIN]: 'Administraci&oacute;n',
    [CreadoPor.NUTRICIONISTA]: 'el mismo profesional',
    [CreadoPor.SOCIO]: 'el socio',
  };
  return mapa[creadoPor] ?? 'Staff del gimnasio';
}

export function nuevoTurnoNutriTemplate(
  data: NuevoTurnoNutriTemplateData,
): string {
  const agendaUrl = data.agendaUrl ?? 'http://localhost:5173/agenda';
  const dniExtra = data.dniSocio ? `(DNI ${data.dniSocio})` : undefined;

  return baseTemplate({
    titulo: 'Nuevo turno asignado',
    nombreDestinatario: data.nombreNutricionista,
    contenido: `
      ${parrafo(
        'Ten&eacute;s un nuevo turno agendado en tu agenda. Revis&aacute; los detalles del paciente.',
      )}
      ${destacadoTurno({
        etiqueta: 'Nuevo turno en tu agenda',
        fecha: data.fecha,
        hora: data.hora,
      })}
      ${filaDetalle({
        icono: '&#x1F464;',
        etiqueta: 'Paciente',
        valor: data.nombreSocio,
        extra: dniExtra,
      })}
      ${filaDetalle({
        icono: '&#x1F4CB;',
        etiqueta: 'Agendado por',
        valor: mapearCreadoPor(data.creadoPor),
      })}
      ${boton(agendaUrl, 'Ver en mi agenda')}`,
  });
}
