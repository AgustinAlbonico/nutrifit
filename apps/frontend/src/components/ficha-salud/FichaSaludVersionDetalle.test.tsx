/**
 * Tests del componente `FichaSaludVersionDetalle`.
 *
 * Cubre:
 * - Renderiza todos los campos con los valores de `datos`.
 * - El fieldset está deshabilitado (read-only).
 * - Banner muestra "Versión N — fecha".
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { FichaSaludVersionDetalle } from './FichaSaludVersionDetalle';

describe('FichaSaludVersionDetalle', () => {
  const datosBase = {
    altura: 175,
    peso: 80,
    nivelActividadFisica: 'MODERADO',
    objetivoPersonal: 'Bajar grasa',
    alergias: ['maní', 'lactosa'],
    patologias: [],
    medicacionActual: 'Ninguna',
    suplementosActuales: null,
    cirugiasPrevias: 'Apendicitis 2010',
    antecedentesFamiliares: 'Diabetes tipo 2 (padre)',
    frecuenciaComidas: '3 comidas',
    consumoAguaDiario: 2,
    restriccionesAlimentarias: 'Vegetariano',
    consumoAlcohol: 'Ocasional',
    fumaTabaco: false,
    horasSueno: 7,
    contactoEmergenciaNombre: 'María Pérez',
    contactoEmergenciaTelefono: '+5491112345678',
  } as const;

  it('VER-1: renderiza todos los campos con los valores de `datos`', () => {
    render(
      <FichaSaludVersionDetalle
        version={3}
        fecha={new Date('2026-05-20T14:30:00.000Z')}
        datos={{ ...datosBase }}
      />,
    );

    // Banner "Versión 3" + fecha
    const banner = screen.getByTestId('detalle-version');
    expect(within(banner).getByText(/^Versión 3$/)).toBeInTheDocument();

    // Verificamos que algunos campos del detalle tienen los valores correctos
    expect(screen.getByDisplayValue('175')).toBeInTheDocument();
    expect(screen.getByDisplayValue('80')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bajar grasa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('maní, lactosa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Apendicitis 2010')).toBeInTheDocument();
    expect(screen.getByDisplayValue('María Pérez')).toBeInTheDocument();
  });

  it('VER-2: el fieldset está deshabilitado (read-only)', () => {
    render(
      <FichaSaludVersionDetalle
        version={1}
        fecha={new Date('2026-05-01T18:00:00.000Z')}
        datos={{ ...datosBase }}
      />,
    );

    const fieldset = screen.getByTestId('detalle-version').querySelector('fieldset');
    expect(fieldset).toBeInTheDocument();
    expect(fieldset).toBeDisabled();
  });

  it('VER-3: el banner muestra "Versión N — DD/MM/YYYY HH:mm"', () => {
    render(
      <FichaSaludVersionDetalle
        version={5}
        fecha={new Date('2026-05-20T14:30:00.000Z')}
        datos={{ ...datosBase }}
      />,
    );

    const banner = screen.getByTestId('detalle-version');
    const textoBanner = banner.textContent ?? '';

    // Contiene "Versión 5"
    expect(textoBanner).toMatch(/Versión 5/);
    // Contiene una fecha con formato DD/MM/YYYY
    expect(textoBanner).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    // Contiene la hora
    expect(textoBanner).toMatch(/\d{2}:\d{2}/);
  });
});
