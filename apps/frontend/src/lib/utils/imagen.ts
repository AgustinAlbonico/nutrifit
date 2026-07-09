import heic2any from 'heic2any';

const TAMANIO_MAXIMO_MB = 10;
const TAMANIO_MAXIMO_BYTES = TAMANIO_MAXIMO_MB * 1024 * 1024;

const FORMATOS_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

interface ResultadoValidacion {
  valido: boolean;
  error?: string;
}

export function validarArchivo(archivo: File): ResultadoValidacion {
  if (archivo.size > TAMANIO_MAXIMO_BYTES) {
    return {
      valido: false,
      error: `El archivo excede el tamaño máximo de ${TAMANIO_MAXIMO_MB}MB`,
    };
  }

  const esHeic = archivo.type === 'image/heic' || archivo.type === 'image/heif' ||
    archivo.name.toLowerCase().endsWith('.heic') ||
    archivo.name.toLowerCase().endsWith('.heif');

  if (!FORMATOS_PERMITIDOS.includes(archivo.type) && !esHeic) {
    return {
      valido: false,
      error: 'Formato de archivo no permitido. Usá JPG, PNG, WebP, GIF o HEIC',
    };
  }

  return { valido: true };
}

function esArchivoHeic(archivo: File): boolean {
  return (
    archivo.type === 'image/heic' ||
    archivo.type === 'image/heif' ||
    archivo.name.toLowerCase().endsWith('.heic') ||
    archivo.name.toLowerCase().endsWith('.heif')
  );
}

async function convertirHeicAJpeg(archivo: File): Promise<File> {
  try {
    const blob = await heic2any({
      blob: archivo,
      toType: 'image/jpeg',
      quality: 0.9,
    }) as Blob;
    const nuevoNombre = archivo.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([blob], nuevoNombre, { type: 'image/jpeg' });
  } catch {
    throw new Error('No se pudo convertir la imagen HEIC. Intentá con otro formato.');
  }
}

export async function prepararArchivoParaSubida(archivo: File): Promise<File> {
  if (esArchivoHeic(archivo)) {
    return convertirHeicAJpeg(archivo);
  }
  return archivo;
}

export function obtenerUrlPreview(archivo: File): string {
  return URL.createObjectURL(archivo);
}

export function liberarUrlPreview(url: string): void {
  URL.revokeObjectURL(url);
}

export function formatearTamanio(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
