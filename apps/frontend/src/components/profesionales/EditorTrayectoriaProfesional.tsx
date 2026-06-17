import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  CertificacionDto,
  FormacionAcademicaDto,
  NivelFormacion,
} from '@/types/nutricionista';

interface PropiedadesEditorTrayectoriaProfesional {
  formacionAcademica: FormacionAcademicaDto[];
  certificaciones: CertificacionDto[];
  alCambiarFormacionAcademica: (valor: FormacionAcademicaDto[]) => void;
  alCambiarCertificaciones: (valor: CertificacionDto[]) => void;
  deshabilitado?: boolean;
}

const OPCIONES_NIVEL: Array<{ valor: NivelFormacion; etiqueta: string }> = [
  { valor: 'GRADO', etiqueta: 'Grado' },
  { valor: 'POSGRADO', etiqueta: 'Posgrado' },
  { valor: 'MAESTRIA', etiqueta: 'Maestría' },
  { valor: 'DOCTORADO', etiqueta: 'Doctorado' },
  { valor: 'ESPECIALIZACION', etiqueta: 'Especialización' },
  { valor: 'DIPLOMATURA', etiqueta: 'Diplomatura' },
  { valor: 'CURSO', etiqueta: 'Curso' },
];

function crearFormacionVacia(): FormacionAcademicaDto {
  const anioActual = new Date().getFullYear();

  return {
    idFormacionAcademica: null,
    titulo: '',
    institucion: '',
    anioInicio: anioActual,
    anioFin: anioActual,
    nivel: 'GRADO',
    enCurso: false,
  };
}

function crearCertificacionVacia(): CertificacionDto {
  return {
    idCertificacion: null,
    nombre: '',
    entidad: '',
    anio: null,
    cargaHoraria: null,
    nivel: null,
  };
}

export function EditorTrayectoriaProfesional({
  formacionAcademica,
  certificaciones,
  alCambiarFormacionAcademica,
  alCambiarCertificaciones,
  deshabilitado = false,
}: PropiedadesEditorTrayectoriaProfesional) {
  const actualizarFormacion = (
    indice: number,
    cambios: Partial<FormacionAcademicaDto>,
  ) => {
    alCambiarFormacionAcademica(
      formacionAcademica.map((item, itemIndice) => {
        if (itemIndice !== indice) return item;

        const proximo = { ...item, ...cambios };
        if (cambios.enCurso === true) {
          proximo.anioFin = null;
        }
        if (cambios.enCurso === false && proximo.anioFin === null) {
          proximo.anioFin = proximo.anioInicio;
        }

        return proximo;
      }),
    );
  };

  const actualizarCertificacion = (
    indice: number,
    cambios: Partial<CertificacionDto>,
  ) => {
    alCambiarCertificaciones(
      certificaciones.map((item, itemIndice) =>
        itemIndice === indice ? { ...item, ...cambios } : item,
      ),
    );
  };

  return (
    <div className="space-y-6" data-testid="editor-trayectoria-profesional">
      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Formación académica
            </h3>
            <p className="text-xs text-muted-foreground">
              Títulos, posgrados y estudios en curso.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={deshabilitado}
            onClick={() =>
              alCambiarFormacionAcademica([...formacionAcademica, crearFormacionVacia()])
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar formación
          </Button>
        </div>

        <div className="space-y-4">
          {formacionAcademica.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no cargaste formación académica.
            </p>
          ) : (
            formacionAcademica.map((formacion, indice) => (
              <div
                key={`${formacion.idFormacionAcademica ?? 'nueva'}-${indice}`}
                className="rounded-md border bg-muted/20 p-4"
                data-testid="item-formacion-academica"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Formación {indice + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={deshabilitado}
                    onClick={() =>
                      alCambiarFormacionAcademica(
                        formacionAcademica.filter((_, itemIndice) => itemIndice !== indice),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Título</Label>
                    <Input
                      value={formacion.titulo}
                      disabled={deshabilitado}
                      onChange={(e) =>
                        actualizarFormacion(indice, { titulo: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Institución</Label>
                    <Input
                      value={formacion.institucion}
                      disabled={deshabilitado}
                      onChange={(e) =>
                        actualizarFormacion(indice, { institucion: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nivel</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formacion.nivel}
                      disabled={deshabilitado}
                      onChange={(e) =>
                        actualizarFormacion(indice, {
                          nivel: e.target.value as NivelFormacion,
                        })
                      }
                    >
                      {OPCIONES_NIVEL.map((opcion) => (
                        <option key={opcion.valor} value={opcion.valor}>
                          {opcion.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Año de inicio</Label>
                    <Input
                      type="number"
                      value={formacion.anioInicio}
                      disabled={deshabilitado}
                      onChange={(e) =>
                        actualizarFormacion(indice, {
                          anioInicio: parseInt(e.target.value, 10) || new Date().getFullYear(),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Año de fin</Label>
                    <Input
                      type="number"
                      value={formacion.anioFin ?? ''}
                      disabled={deshabilitado || formacion.enCurso}
                      onChange={(e) =>
                        actualizarFormacion(indice, {
                          anioFin: parseInt(e.target.value, 10) || null,
                        })
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={formacion.enCurso}
                      disabled={deshabilitado}
                      onChange={(e) =>
                        actualizarFormacion(indice, { enCurso: e.target.checked })
                      }
                    />
                    En curso
                  </label>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Certificaciones
            </h3>
            <p className="text-xs text-muted-foreground">
              Cursos, acreditaciones y certificados complementarios.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={deshabilitado}
            onClick={() =>
              alCambiarCertificaciones([...certificaciones, crearCertificacionVacia()])
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar certificación
          </Button>
        </div>

        <div className="space-y-4">
          {certificaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no cargaste certificaciones.
            </p>
          ) : (
            certificaciones.map((certificacion, indice) => (
              <div
                key={`${certificacion.idCertificacion ?? 'nueva'}-${indice}`}
                className="rounded-md border bg-muted/20 p-4"
                data-testid="item-certificacion"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Certificación {indice + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={deshabilitado}
                    onClick={() =>
                      alCambiarCertificaciones(
                        certificaciones.filter((_, itemIndice) => itemIndice !== indice),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nombre</Label>
                    <Input
                      value={certificacion.nombre}
                      disabled={deshabilitado}
                      onChange={(e) =>
                        actualizarCertificacion(indice, { nombre: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Entidad</Label>
                    <Input
                      value={certificacion.entidad}
                      disabled={deshabilitado}
                      onChange={(e) =>
                        actualizarCertificacion(indice, { entidad: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nivel (opcional)</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={certificacion.nivel ?? ''}
                      disabled={deshabilitado}
                      onChange={(e) =>
                        actualizarCertificacion(indice, {
                          nivel: (e.target.value || null) as NivelFormacion | null,
                        })
                      }
                    >
                      <option value="">Sin especificar</option>
                      {OPCIONES_NIVEL.map((opcion) => (
                        <option key={opcion.valor} value={opcion.valor}>
                          {opcion.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Año</Label>
                    <Input
                      type="number"
                      value={certificacion.anio ?? ''}
                      disabled={deshabilitado}
                      onChange={(e) =>
                        actualizarCertificacion(indice, {
                          anio: parseInt(e.target.value, 10) || null,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Carga horaria</Label>
                    <Input
                      type="number"
                      value={certificacion.cargaHoraria ?? ''}
                      disabled={deshabilitado}
                      onChange={(e) =>
                        actualizarCertificacion(indice, {
                          cargaHoraria: parseInt(e.target.value, 10) || null,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
