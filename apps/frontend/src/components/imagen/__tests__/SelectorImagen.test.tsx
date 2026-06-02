import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectorImagen } from '@/components/imagen/SelectorImagen';

vi.mock('@/components/media/DialogoZoomImagen', () => ({
  DialogoZoomImagen: ({
    abierto,
    archivoOriginal,
    onConfirmar,
    onCancelar,
  }: {
    abierto: boolean;
    archivoOriginal: File | null;
    onConfirmar: (archivo: File) => void;
    onCancelar: () => void;
  }) => {
    if (!abierto) return null;
    return (
      <div data-testid="dialogo-zoom">
        <button
          data-testid="dialogo-confirmar"
          onClick={() => {
            if (archivoOriginal) {
              onConfirmar(archivoOriginal);
            }
          }}
        >
          Confirmar
        </button>
        <button data-testid="dialogo-cancelar" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    );
  },
}));

const crearArchivoMock = (tipo: string, nombre = 'test.jpg'): File => {
  const buffer = new ArrayBuffer(1);
  return new File([buffer], nombre, { type: tipo });
};

describe('SelectorImagen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderiza la drop-zone con el label y el botón "Seleccionar archivo" cuando no hay valor actual', () => {
    it('debe mostrar el label "Foto de perfil" por defecto', () => {
      const alCambiarFoto = vi.fn();
      render(<SelectorImagen alCambiarFoto={alCambiarFoto} />);

      expect(screen.getByText('Foto de perfil')).toBeTruthy();
    });

    it('debe mostrar el botón "Seleccionar archivo"', () => {
      const alCambiarFoto = vi.fn();
      render(<SelectorImagen alCambiarFoto={alCambiarFoto} />);

      expect(screen.getByText('Seleccionar archivo')).toBeTruthy();
    });

    it('debe mostrar el ícono de upload', () => {
      const alCambiarFoto = vi.fn();
      render(<SelectorImagen alCambiarFoto={alCambiarFoto} />);

      expect(screen.getByTestId('upload-icon')).toBeTruthy();
    });

    it('debe permitir customizar la etiqueta', () => {
      const alCambiarFoto = vi.fn();
      render(<SelectorImagen alCambiarFoto={alCambiarFoto} etiqueta="Avatar" />);

      expect(screen.getByText('Avatar')).toBeTruthy();
    });
  });

  describe('renderiza el preview circular con botón X cuando hay valorActual', () => {
    it('debe mostrar la imagen cuando valorActual tiene una URL', () => {
      const alCambiarFoto = vi.fn();
      render(
        <SelectorImagen
          alCambiarFoto={alCambiarFoto}
          valorActual="https://example.com/foto.jpg"
        />,
      );

      const imagen = screen.getByAltText('Foto de perfil');
      expect(imagen).toBeTruthy();
      expect(imagen.getAttribute('src')).toBe('https://example.com/foto.jpg');
    });

    it('debe mostrar el botón X para quitar la foto', () => {
      const alCambiarFoto = vi.fn();
      render(
        <SelectorImagen
          alCambiarFoto={alCambiarFoto}
          valorActual="https://example.com/foto.jpg"
        />,
      );

      expect(screen.getByRole('button', { name: /quitar foto/i })).toBeTruthy();
    });

    it('debe llamar a alCambiarFoto con null al hacer click en X', () => {
      const alCambiarFoto = vi.fn();
      render(
        <SelectorImagen
          alCambiarFoto={alCambiarFoto}
          valorActual="https://example.com/foto.jpg"
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /quitar foto/i }));
      expect(alCambiarFoto).toHaveBeenCalledWith(null);
    });

    it('debe ocultar el botón X cuando deshabilitado', () => {
      const alCambiarFoto = vi.fn();
      render(
        <SelectorImagen
          alCambiarFoto={alCambiarFoto}
          valorActual="https://example.com/foto.jpg"
          deshabilitado
        />,
      );

      expect(screen.queryByRole('button', { name: /quitar foto/i })).toBeNull();
    });
  });

  describe('abre el DialogoZoomImagen cuando el usuario selecciona un archivo', () => {
    it('debe abrir el dialogo al seleccionar un archivo de imagen', () => {
      const alCambiarFoto = vi.fn();
      render(<SelectorImagen alCambiarFoto={alCambiarFoto} />);

      const input = screen.getByLabelText('Foto de perfil');
      const archivo = crearArchivoMock('image/jpeg');

      fireEvent.change(input, { target: { files: [archivo] } });

      expect(screen.getByTestId('dialogo-zoom')).toBeTruthy();
    });

    it('debe mostrar error si el archivo no es una imagen', () => {
      const alCambiarFoto = vi.fn();
      render(<SelectorImagen alCambiarFoto={alCambiarFoto} />);

      const input = screen.getByLabelText('Foto de perfil');
      const archivo = crearArchivoMock('application/pdf', 'documento.pdf');

      fireEvent.change(input, { target: { files: [archivo] } });

      expect(
        screen.getByText('El archivo debe ser una imagen (jpg, png, etc.)'),
      ).toBeTruthy();
    });

    it('debe NO abrir el DialogoZoomImagen si el archivo no es imagen', () => {
      const alCambiarFoto = vi.fn();
      render(<SelectorImagen alCambiarFoto={alCambiarFoto} />);

      const input = screen.getByLabelText('Foto de perfil');
      const archivo = crearArchivoMock('application/pdf', 'documento.pdf');

      fireEvent.change(input, { target: { files: [archivo] } });

      expect(screen.queryByTestId('dialogo-zoom')).toBeNull();
    });
  });

  describe('llama a alCambiarFoto con el File cuando el usuario confirma en el DialogoZoomImagen', () => {
    it('debe llamar a alCambiarFoto con el archivo confirmado', () => {
      const alCambiarFoto = vi.fn();
      render(<SelectorImagen alCambiarFoto={alCambiarFoto} />);

      const input = screen.getByLabelText('Foto de perfil');
      const archivo = crearArchivoMock('image/jpeg');

      fireEvent.change(input, { target: { files: [archivo] } });

      fireEvent.click(screen.getByTestId('dialogo-confirmar'));

      expect(alCambiarFoto).toHaveBeenCalledWith(archivo);
    });

    it('debe cerrar el dialogo después de confirmar', () => {
      const alCambiarFoto = vi.fn();
      render(<SelectorImagen alCambiarFoto={alCambiarFoto} />);

      const input = screen.getByLabelText('Foto de perfil');
      const archivo = crearArchivoMock('image/jpeg');

      fireEvent.change(input, { target: { files: [archivo] } });
      expect(screen.getByTestId('dialogo-zoom')).toBeTruthy();

      fireEvent.click(screen.getByTestId('dialogo-confirmar'));
      expect(screen.queryByTestId('dialogo-zoom')).toBeNull();
    });
  });

  describe('llama a alCambiarFoto con null cuando el usuario hace click en X', () => {
    it('debe llamar a alCambiarFoto con null y cerrar el dialogo', () => {
      const alCambiarFoto = vi.fn();
      render(<SelectorImagen alCambiarFoto={alCambiarFoto} />);

      const input = screen.getByLabelText('Foto de perfil');
      const archivo = crearArchivoMock('image/jpeg');

      fireEvent.change(input, { target: { files: [archivo] } });
      expect(screen.getByTestId('dialogo-zoom')).toBeTruthy();

      fireEvent.click(screen.getByTestId('dialogo-cancelar'));
      expect(screen.queryByTestId('dialogo-zoom')).toBeNull();
      expect(alCambiarFoto).not.toHaveBeenCalled();
    });
  });

  describe('soporte drag and drop', () => {
    it('debe abrir el dialogo al hacer drop de una imagen', () => {
      const alCambiarFoto = vi.fn();
      render(<SelectorImagen alCambiarFoto={alCambiarFoto} />);

      const dropzone = screen.getByTestId('drop-zone');
      const archivo = crearArchivoMock('image/jpeg');

      fireEvent.drop(dropzone, {
        dataTransfer: { files: [archivo] },
      });

      expect(screen.getByTestId('dialogo-zoom')).toBeTruthy();
    });
  });

  describe('manejo de error desde props', () => {
    it('debe mostrar el error pasado como prop', () => {
      const alCambiarFoto = vi.fn();
      render(
        <SelectorImagen alCambiarFoto={alCambiarFoto} error="Error del servidor" />,
      );

      expect(screen.getByText('Error del servidor')).toBeTruthy();
    });
  });
});