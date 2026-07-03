import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ComparadorMediciones } from './ComparadorMediciones';
import type { MedicionHistorial } from './types';

const mediciones: MedicionHistorial[] = [
  {
    idMedicion: 1,
    fecha: '2026-01-10T10:00:00.000Z',
    peso: 92,
    altura: 190,
    imc: 25.5,
    perimetroCintura: 96,
    perimetroCadera: 108,
    perimetroBrazo: 33,
    perimetroMuslo: 60,
    perimetroPecho: 100,
    pliegueTriceps: 16,
    pliegueAbdominal: 20,
    pliegueMuslo: 22,
    porcentajeGrasa: 28,
    masaMagra: 66.2,
    frecuenciaCardiaca: 74,
    tensionSistolica: 122,
    tensionDiastolica: 80,
    notasMedicion: null,
    profesional: null,
  },
  {
    idMedicion: 2,
    fecha: '2026-06-15T10:00:00.000Z',
    peso: 81,
    altura: 190,
    imc: 22.4,
    perimetroCintura: 86,
    perimetroCadera: 99,
    perimetroBrazo: 31,
    perimetroMuslo: 56,
    perimetroPecho: 96,
    pliegueTriceps: 14,
    pliegueAbdominal: 18,
    pliegueMuslo: 18,
    porcentajeGrasa: 23,
    masaMagra: 62.4,
    frecuenciaCardiaca: 68,
    tensionSistolica: 116,
    tensionDiastolica: 76,
    notasMedicion: 'Manteniendo adherencia',
    profesional: { id: 5, nombre: 'Nutri', apellido: 'Central' },
  },
];

describe('ComparadorMediciones', () => {
  it('compara medicion inicial contra medicion actual', () => {
    render(<ComparadorMediciones mediciones={mediciones} />);

    expect(screen.getByText('Comparador de mediciones')).toBeInTheDocument();
    expect(screen.getAllByText(/Medicion inicial/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Medicion actual/i).length).toBeGreaterThan(0);
    expect(screen.getByText('-11 kg')).toBeInTheDocument();
    expect(screen.getByText('-10 cm')).toBeInTheDocument();
  });

  it('muestra estado vacio cuando faltan mediciones para comparar', () => {
    render(<ComparadorMediciones mediciones={mediciones.slice(0, 1)} />);

    expect(screen.getByText(/Necesitas al menos dos mediciones/i)).toBeInTheDocument();
  });
});
