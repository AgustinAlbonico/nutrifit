import { create } from 'zustand';
import type { TipoMetrica } from '@/components/progreso/types';

interface EstadoWizardObjetivo {
  pasoActual: number;
  tipoMetrica: TipoMetrica | null;
  valorInicial: number | null;
  valorObjetivo: number | null;
  fechaObjetivo: string | null;
  error: string | null;
}

interface AccionesWizardObjetivo {
  establecerPaso: (paso: number) => void;
  siguientePaso: () => void;
  pasoAnterior: () => void;
  establecerTipoMetrica: (tipo: TipoMetrica) => void;
  establecerValorInicial: (valor: number) => void;
  establecerValorObjetivo: (valor: number) => void;
  establecerFechaObjetivo: (fecha: string | null) => void;
  establecerError: (error: string | null) => void;
  reiniciar: () => void;
  puedeAvanzar: () => boolean;
}

const estadoInicial: EstadoWizardObjetivo = {
  pasoActual: 1,
  tipoMetrica: null,
  valorInicial: null,
  valorObjetivo: null,
  fechaObjetivo: null,
  error: null,
};

export const useWizardObjetivo = create<EstadoWizardObjetivo & AccionesWizardObjetivo>((set, get) => ({
  ...estadoInicial,

  establecerPaso: (paso) => set({ pasoActual: paso }),

  siguientePaso: () => {
    const { pasoActual } = get();
    if (pasoActual < 3) {
      set({ pasoActual: pasoActual + 1, error: null });
    }
  },

  pasoAnterior: () => {
    const { pasoActual } = get();
    if (pasoActual > 1) {
      set({ pasoActual: pasoActual - 1, error: null });
    }
  },

  establecerTipoMetrica: (tipo) => set({ tipoMetrica: tipo }),
  establecerValorInicial: (valor) => set({ valorInicial: valor }),
  establecerValorObjetivo: (valor) => set({ valorObjetivo: valor }),
  establecerFechaObjetivo: (fecha) => set({ fechaObjetivo: fecha }),
  establecerError: (error) => set({ error }),

  reiniciar: () => set(estadoInicial),

  puedeAvanzar: () => {
    const { pasoActual, tipoMetrica } = get();

    if (pasoActual === 1) {
      return tipoMetrica !== null;
    }

    if (pasoActual === 2) {
      // Step 2 validation happens in manejarSiguiente onClick
      return true;
    }

    return true;
  },
}));
