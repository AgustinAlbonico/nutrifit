import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { FotoUploader } from './FotoUploader';

vi.mock('@/lib/utils/imagen', () => ({
  validarArchivo: () => ({ valido: true }),
  prepararArchivoParaSubida: vi.fn(async (file: File) => file),
  obtenerUrlPreview: vi.fn(() => 'blob:test'),
  liberarUrlPreview: vi.fn(),
  formatearTamanio: vi.fn(() => '10 KB'),
}));

describe('FotoUploader', () => {
  it('abre con el tipo inicial preseleccionado', () => {
    render(
      <FotoUploader
        abierto
        onCerrar={vi.fn()}
        onSubir={vi.fn(async () => {})}
        tipoFotoInicial="perfil"
      />,
    );

    expect(screen.getByText('Subir foto de progreso')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('Perfil');
  });
});
