import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarPacienteProps {
  /** URL de la foto de perfil (puede ser relativa o absoluta) */
  fotoUrl?: string | null;
  /** Nombre completo del paciente para generar iniciales */
  nombreCompleto: string;
  /** Tamaño del avatar */
  size?: 'sm' | 'md' | 'lg';
  /** Clases adicionales */
  className?: string;
}

/**
 * Genera las iniciales a partir de un nombre completo.
 * Ej: "Juan Pérez" -> "JP", "María José García" -> "MJ"
 */
function obtenerIniciales(nombreCompleto: string): string {
  const nombres = nombreCompleto.trim().split(/\s+/);
  if (nombres.length === 0) return '??';
  if (nombres.length === 1) {
    return nombres[0].substring(0, 2).toUpperCase();
  }
  // Tomar la primera letra del primer y último nombre
  const inicialPrimero = nombres[0].charAt(0).toUpperCase();
  const inicialUltimo = nombres[nombres.length - 1].charAt(0).toUpperCase();
  return `${inicialPrimero}${inicialUltimo}`;
}

/**
 * Construye la URL completa de la foto si es relativa.
 */
function construirUrlFoto(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  // Si es relativa, agregar la base URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}${url}`;
}

const tamaños = {
  sm: 'size-8 text-xs',
  md: 'size-12 text-sm',
  lg: 'size-16 text-base',
};

export function AvatarPaciente({
  fotoUrl,
  nombreCompleto,
  size = 'md',
  className,
}: AvatarPacienteProps) {
  const iniciales = obtenerIniciales(nombreCompleto);
  const urlFoto = construirUrlFoto(fotoUrl);

  return (
    <Avatar
      size="default"
      className={cn(
        tamaños[size],
        'bg-gradient-to-br from-orange-400 to-rose-500',
        className
      )}
    >
      {urlFoto && <AvatarImage src={urlFoto} alt={nombreCompleto} />}
      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-rose-500 text-white font-semibold">
        {iniciales}
      </AvatarFallback>
    </Avatar>
  );
}
