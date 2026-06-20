import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GaleriaFotos } from './GaleriaFotos';
import type { FotoProgreso, GaleriaFotos as TipoGaleriaFotos } from './types';

vi.mock('react-compare-slider', () => ({
  ReactCompareSlider: ({ itemOne, itemTwo }: { itemOne: React.ReactNode; itemTwo: React.ReactNode }) => (
    <div>
      {itemOne}
      {itemTwo}
    </div>
  ),
}));

const crearGaleria = (fotos: TipoGaleriaFotos['fotos'] = []): TipoGaleriaFotos => ({
  fotos,
  sesiones: [],
});

const crearFoto = (
  idFoto: number,
  tipoFoto: FotoProgreso['tipoFoto'],
  fecha: string,
): FotoProgreso => ({
  idFoto,
  socioId: 9,
  turnoId: 100 + idFoto,
  tipoFoto,
  objectKey: `fotos/${tipoFoto}-${idFoto}.jpg`,
  mimeType: 'image/jpeg',
  notas: `Foto ${tipoFoto} ${idFoto}`,
  fecha,
  urlFirmada: `https://example.com/${tipoFoto}-${idFoto}.jpg`,
});

describe('GaleriaFotos', () => {
  it('muestra siempre la estructura completa por tipo aunque no haya imagenes', () => {
    render(
      <GaleriaFotos
        socioId={9}
        galeria={crearGaleria()}
        puedeEditar
        onSubirFoto={vi.fn()}
        onSubirFotoTipo={vi.fn()}
      />,
    );

    expect(screen.getByText('Frente (0)')).toBeInTheDocument();
    expect(screen.getByText('Perfil (0)')).toBeInTheDocument();
    expect(screen.getByText('Espalda (0)')).toBeInTheDocument();
    expect(screen.getByText('Otro (0)')).toBeInTheDocument();

    expect(
      screen.getAllByText('Empezá por cargar al menos una foto para este ángulo.'),
    ).toHaveLength(4);

    expect(screen.getByRole('button', { name: 'Cargar foto de frente' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar foto de perfil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar foto de espalda' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar foto de otro' })).toBeInTheDocument();
  });

  it('mantiene el indice visible aunque solo exista un tipo cargado', () => {
    render(
      <GaleriaFotos
        socioId={9}
        galeria={crearGaleria([
          { tipoFoto: 'frente', fotos: [crearFoto(1, 'frente', '2026-06-19T10:00:00.000Z')] },
        ])}
        puedeEditar
        onSubirFoto={vi.fn()}
        onSubirFotoTipo={vi.fn()}
      />,
    );

    expect(screen.getByText('Frente (1)')).toBeInTheDocument();
    expect(screen.getByText('Perfil (0)')).toBeInTheDocument();
    expect(screen.getByText('Espalda (0)')).toBeInTheDocument();
    expect(screen.getByText('Otro (0)')).toBeInTheDocument();

    expect(screen.getByAltText('Preview de frente')).toBeInTheDocument();
    expect(
      screen.getAllByText('Empezá por cargar al menos una foto para este ángulo.'),
    ).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Abrir historial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar foto' })).toBeInTheDocument();
  });

  it('usa por defecto la primera foto como antes y la ultima como despues', () => {
    render(
      <GaleriaFotos
        socioId={9}
        galeria={crearGaleria([
          {
            tipoFoto: 'perfil',
            fotos: [
              crearFoto(11, 'perfil', '2026-01-10T10:00:00.000Z'),
              crearFoto(12, 'perfil', '2026-03-10T10:00:00.000Z'),
              crearFoto(13, 'perfil', '2026-06-10T10:00:00.000Z'),
            ],
          },
        ])}
      />,
    );

    expect(screen.getByRole('button', { name: 'Abrir comparación' })).toBeInTheDocument();
  });

  it('usa por defecto la primera foto como antes y la ultima como despues dentro del modal', async () => {
    const usuario = userEvent.setup();

    render(
      <GaleriaFotos
        socioId={9}
        galeria={crearGaleria([
          {
            tipoFoto: 'perfil',
            fotos: [
              crearFoto(11, 'perfil', '2026-01-10T10:00:00.000Z'),
              crearFoto(12, 'perfil', '2026-03-10T10:00:00.000Z'),
              crearFoto(13, 'perfil', '2026-06-10T10:00:00.000Z'),
            ],
          },
        ])}
      />,
    );

    await usuario.click(screen.getByRole('button', { name: 'Abrir comparación' }));

    expect(screen.getAllByText('10 de ene 2026').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10 de jun 2026').length).toBeGreaterThan(0);
    expect(screen.getByAltText('Antes: 10 de ene 2026')).toBeInTheDocument();
    expect(screen.getByAltText('Después: 10 de jun 2026')).toBeInTheDocument();
  });

  it('permite cambiar manualmente la foto antes desde las miniaturas del modal', async () => {
    const usuario = userEvent.setup();

    render(
      <GaleriaFotos
        socioId={9}
        galeria={crearGaleria([
          {
            tipoFoto: 'perfil',
            fotos: [
              crearFoto(21, 'perfil', '2026-01-10T10:00:00.000Z'),
              crearFoto(22, 'perfil', '2026-03-10T10:00:00.000Z'),
              crearFoto(23, 'perfil', '2026-06-10T10:00:00.000Z'),
            ],
          },
        ])}
      />,
    );

    await usuario.click(screen.getByRole('button', { name: 'Abrir comparación' }));

    await usuario.click(
      screen.getByRole('button', {
        name: 'Usar 10 de mar 2026 como antes en Perfil',
      }),
    );

    expect(screen.getAllByText('10 de mar 2026').length).toBeGreaterThan(0);
    expect(screen.getByAltText('Antes: 10 de mar 2026')).toBeInTheDocument();
    expect(screen.getAllByText('10 de jun 2026').length).toBeGreaterThan(0);
  });

  it('dispara la accion contextual con el tipo correcto', async () => {
    const usuario = userEvent.setup();
    const onSubirFotoTipo = vi.fn();

    render(
      <GaleriaFotos
        socioId={9}
        galeria={crearGaleria()}
        puedeEditar
        onSubirFoto={vi.fn()}
        onSubirFotoTipo={onSubirFotoTipo}
      />,
    );

    await usuario.click(screen.getByRole('button', { name: 'Cargar foto de perfil' }));

    expect(onSubirFotoTipo).toHaveBeenCalledWith('perfil');
  });
});
