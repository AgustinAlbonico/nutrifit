import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GaleriaFotos } from './GaleriaFotos';
import type { GaleriaFotos as TipoGaleriaFotos } from './types';

const crearGaleria = (fotos: TipoGaleriaFotos['fotos'] = []): TipoGaleriaFotos => ({
  fotos,
  sesiones: [],
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

    expect(screen.getByText('Sin foto de frente')).toBeInTheDocument();
    expect(screen.getByText('Sin foto de perfil')).toBeInTheDocument();
    expect(screen.getByText('Sin foto de espalda')).toBeInTheDocument();
    expect(screen.getByText('Sin foto de otro')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Cargar foto de frente' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar foto de perfil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar foto de espalda' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar foto de otro' })).toBeInTheDocument();
  });

  it('mantiene los bloques vacios visibles aunque solo exista un tipo cargado', () => {
    render(
      <GaleriaFotos
        socioId={9}
        galeria={crearGaleria([
          {
            tipoFoto: 'frente',
            fotos: [
              {
                idFoto: 1,
                socioId: 9,
                turnoId: 101,
                tipoFoto: 'frente',
                objectKey: 'fotos/frente.jpg',
                mimeType: 'image/jpeg',
                notas: null,
                fecha: '2026-06-19T10:00:00.000Z',
                urlFirmada: 'https://example.com/frente.jpg',
              },
            ],
          },
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

    expect(screen.getByAltText('Foto frente')).toBeInTheDocument();
    expect(screen.getByText('Sin foto de perfil')).toBeInTheDocument();
    expect(screen.getByText('Sin foto de espalda')).toBeInTheDocument();
    expect(screen.getByText('Sin foto de otro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar otra foto de frente' })).toBeInTheDocument();
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
