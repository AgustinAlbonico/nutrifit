import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ExportProgresoCSVButton } from './ExportProgresoCSVButton';
import type { MedicionHistorial } from './types';

const mediciones: MedicionHistorial[] = [
  {
    idMedicion: 1,
    idTurno: 1,
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

describe('ExportProgresoCSVButton', () => {
  it('genera un archivo CSV descargable con mediciones', () => {
    const createObjectURL = vi.fn(() => 'blob:nutrifit-csv');
    const revokeObjectURL = vi.fn();
    const click = vi.fn();

    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    render(<ExportProgresoCSVButton mediciones={mediciones} socioId={9} />);

    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement);

    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:nutrifit-csv');

    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('queda deshabilitado si no hay mediciones', () => {
    render(<ExportProgresoCSVButton mediciones={[]} socioId={9} />);

    expect(screen.getByRole('button', { name: /Sin datos CSV/i })).toBeDisabled();
  });
});

