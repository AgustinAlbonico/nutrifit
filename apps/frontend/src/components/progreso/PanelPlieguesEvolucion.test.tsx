import { render, screen } from '@testing-library/react';

import { PanelPlieguesEvolucion } from './PanelPlieguesEvolucion';

describe('PanelPlieguesEvolucion', () => {
  it('indica cuantos pliegues se usaron para la suma cuando hay parciales', () => {
    render(
      <PanelPlieguesEvolucion
        historial={{
          socioId: 1,
          nombreSocio: 'Socio',
          apellidoSocio: 'Test',
          altura: 170,
          mediciones: [
            {
              idMedicion: 1,
              fecha: '2026-01-10T10:00:00.000Z',
              peso: 80,
              altura: 170,
              imc: 27.7,
              perimetroCintura: null,
              perimetroCadera: null,
              perimetroBrazo: null,
              perimetroMuslo: null,
              perimetroPecho: null,
              pliegueTriceps: 22,
              pliegueAbdominal: 28,
              pliegueMuslo: null,
              porcentajeGrasa: 30,
              masaMagra: 56,
              frecuenciaCardiaca: null,
              tensionSistolica: null,
              tensionDiastolica: null,
              notasMedicion: null,
              profesional: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('2 de 3 pliegues')).toBeInTheDocument();
  });

  it('muestra el total cuando estan los 3 pliegues cargados', () => {
    render(
      <PanelPlieguesEvolucion
        historial={{
          socioId: 1,
          nombreSocio: 'Socio',
          apellidoSocio: 'Test',
          altura: 170,
          mediciones: [
            {
              idMedicion: 1,
              fecha: '2026-01-10T10:00:00.000Z',
              peso: 80,
              altura: 170,
              imc: 27.7,
              perimetroCintura: null,
              perimetroCadera: null,
              perimetroBrazo: null,
              perimetroMuslo: null,
              perimetroPecho: null,
              pliegueTriceps: 22,
              pliegueAbdominal: 28,
              pliegueMuslo: 26,
              porcentajeGrasa: 30,
              masaMagra: 56,
              frecuenciaCardiaca: null,
              tensionSistolica: null,
              tensionDiastolica: null,
              notasMedicion: null,
              profesional: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('3 de 3 pliegues')).toBeInTheDocument();
  });
});
