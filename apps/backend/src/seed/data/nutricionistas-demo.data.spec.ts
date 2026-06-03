import {
  generarNutricionistasDemo,
  NutricionistaDemo,
} from './nutricionistas-demo.data';

describe('generarNutricionistasDemo', () => {
  let lista: NutricionistaDemo[];
  beforeEach(() => {
    lista = generarNutricionistasDemo();
  });

  it('devuelve exactamente 15 nutricionistas', () => {
    expect(lista).toHaveLength(15);
  });

  it('distribuye 5 nutricionistas por cada gimnasio', () => {
    const conteo: Record<string, number> = {};
    for (const n of lista) {
      conteo[n.gimnasioNombre] = (conteo[n.gimnasioNombre] ?? 0) + 1;
    }
    expect(conteo['Gym Central']).toBe(5);
    expect(conteo['Gym Norte']).toBe(5);
    expect(conteo['Gym Sur']).toBe(5);
  });

  it('todos los emails son únicos', () => {
    const emails = lista.map((n) => n.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it('todas las matrículas son únicas', () => {
    const matriculas = lista.map((n) => n.matricula);
    expect(new Set(matriculas).size).toBe(matriculas.length);
  });

  it('todos los DNI son únicos', () => {
    const dnis = lista.map((n) => n.dni);
    expect(new Set(dnis).size).toBe(dnis.length);
  });

  it('todos tienen al menos 1 título de formación académica', () => {
    for (const n of lista) {
      expect(n.formacionAcademica.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('todos tienen al menos 2 bloques de agenda', () => {
    for (const n of lista) {
      expect(n.agenda.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('la duración de cada bloque es válida (30, 45 o 60 min)', () => {
    for (const n of lista) {
      for (const bloque of n.agenda) {
        expect([30, 45, 60]).toContain(bloque.duracionTurno);
      }
    }
  });

  it('horaFin es posterior a horaInicio en todos los bloques', () => {
    const toMinutes = (h: string) => {
      const [hh, mm, ss] = h.split(':').map(Number);
      return hh * 60 + mm + ss / 60;
    };
    for (const n of lista) {
      for (const bloque of n.agenda) {
        expect(toMinutes(bloque.horaFin)).toBeGreaterThan(
          toMinutes(bloque.horaInicio),
        );
      }
    }
  });

  it('la tarifa está en el rango $8.000-$25.000', () => {
    for (const n of lista) {
      expect(n.tarifaSesion).toBeGreaterThanOrEqual(8000);
      expect(n.tarifaSesion).toBeLessThanOrEqual(25000);
    }
  });

  it('los años de experiencia están entre 2 y 20', () => {
    for (const n of lista) {
      expect(n.aniosExperiencia).toBeGreaterThanOrEqual(2);
      expect(n.aniosExperiencia).toBeLessThanOrEqual(20);
    }
  });

  it('la provincia corresponde al gimnasio del nutri', () => {
    const provinciasPorGimnasio: Record<string, string[]> = {
      'Gym Central': ['CABA', 'Buenos Aires'],
      'Gym Norte': ['Córdoba', 'Mendoza', 'Tucumán'],
      'Gym Sur': ['Santa Fe', 'Neuquén', 'Río Negro'],
    };
    for (const n of lista) {
      expect(provinciasPorGimnasio[n.gimnasioNombre]).toContain(n.provincia);
    }
  });

  it('el formato de email es válido (termina en @nutrifit.com)', () => {
    for (const n of lista) {
      expect(n.email).toMatch(/^[\w.]+@nutrifit\.com$/);
    }
  });

  it('el formato de matrícula es MN-3XXX', () => {
    for (const n of lista) {
      expect(n.matricula).toMatch(/^MN-3\d{3}$/);
    }
  });

  it('los nombres+apellidos no se repiten', () => {
    const nombresCompletos = lista.map((n) => `${n.nombre} ${n.apellido}`);
    expect(new Set(nombresCompletos).size).toBe(nombresCompletos.length);
  });
});
