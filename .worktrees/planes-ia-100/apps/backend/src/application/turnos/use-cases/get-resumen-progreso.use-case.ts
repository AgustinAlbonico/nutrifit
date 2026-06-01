import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';

export type Tendencia = 'subiendo' | 'bajando' | 'estable';
export type CategoriaIMC = 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad';
export type RiesgoCardiovascular = 'bajo' | 'moderado' | 'alto';

export interface ProgresoMetrica {
  inicial: number | null;
  actual: number | null;
  diferencia: number | null;
  tendencia: Tendencia | null;
}

export interface ResumenProgresoResponse {
  peso: {
    inicial: number | null;
    actual: number | null;
    diferencia: number | null;
    tendencia: Tendencia | null;
  };
  imc: {
    inicial: number | null;
    actual: number | null;
    diferencia: number | null;
    categoriaActual: CategoriaIMC | null;
  };
  perimetros: {
    cintura: ProgresoMetrica;
    cadera: ProgresoMetrica;
    brazo: ProgresoMetrica;
    muslo: ProgresoMetrica;
  };
  relacionCinturaCadera: {
    inicial: number | null;
    actual: number | null;
    riesgoCardiovascular: RiesgoCardiovascular | null;
  };
  rangoSaludable: {
    pesoMinimo: number | null;
    pesoMaximo: number | null;
  };
  totalMediciones: number;
  primeraMedicion: Date | null;
  ultimaMedicion: Date | null;
}

@Injectable()
export class GetResumenProgresoUseCase {
  constructor(
    @InjectRepository(MedicionOrmEntity)
    private readonly medicionRepository: Repository<MedicionOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
  ) {}

  async execute(socioId: number): Promise<ResumenProgresoResponse> {
    // Verificar que el socio existe
    const socio = await this.socioRepository.findOne({
      where: { idPersona: socioId },
      relations: ['fichaSalud'],
    });

    if (!socio) {
      throw new NotFoundError('Socio no encontrado');
    }

    // Obtener todas las mediciones del socio ordenadas por fecha
    const mediciones = await this.medicionRepository
      .createQueryBuilder('medicion')
      .innerJoin('medicion.turno', 'turno')
      .innerJoin('turno.socio', 'socio')
      .where('socio.idPersona = :socioId', { socioId })
      .orderBy('medicion.createdAt', 'ASC')
      .getMany();

    // Obtener altura (de la última medición o ficha de salud)
    let altura = socio.fichaSalud?.altura ?? null;
    if (mediciones.length > 0) {
      const ultimaMedicionConAltura = [...mediciones]
        .reverse()
        .find((m) => m.altura > 0);
      if (ultimaMedicionConAltura) {
        altura = ultimaMedicionConAltura.altura;
      }
    }

    // Valores por defecto
    const respuestaVacia: ResumenProgresoResponse = {
      peso: { inicial: null, actual: null, diferencia: null, tendencia: null },
      imc: {
        inicial: null,
        actual: null,
        diferencia: null,
        categoriaActual: null,
      },
      perimetros: {
        cintura: {
          inicial: null,
          actual: null,
          diferencia: null,
          tendencia: null,
        },
        cadera: {
          inicial: null,
          actual: null,
          diferencia: null,
          tendencia: null,
        },
        brazo: {
          inicial: null,
          actual: null,
          diferencia: null,
          tendencia: null,
        },
        muslo: {
          inicial: null,
          actual: null,
          diferencia: null,
          tendencia: null,
        },
      },
      relacionCinturaCadera: {
        inicial: null,
        actual: null,
        riesgoCardiovascular: null,
      },
      rangoSaludable: {
        pesoMinimo: altura ? this.calcularPesoPorIMC(altura, 18.5) : null,
        pesoMaximo: altura ? this.calcularPesoPorIMC(altura, 24.9) : null,
      },
      totalMediciones: mediciones.length,
      primeraMedicion: mediciones.length > 0 ? mediciones[0].createdAt : null,
      ultimaMedicion:
        mediciones.length > 0
          ? mediciones[mediciones.length - 1].createdAt
          : null,
    };

    if (mediciones.length === 0) {
      return respuestaVacia;
    }

    const primeraMedicion = mediciones[0];
    const ultimaMedicion = mediciones[mediciones.length - 1];

    // Calcular progreso de peso
    const pesoInicial = Number(primeraMedicion.peso);
    const pesoActual = Number(ultimaMedicion.peso);
    const tendenciaPeso = this.calcularTendencia(
      mediciones.slice(-5).map((m) => Number(m.peso)),
    );

    // Calcular progreso de IMC
    const imcInicial = Number(primeraMedicion.imc);
    const imcActual = Number(ultimaMedicion.imc);
    const categoriaIMC = this.categorizarIMC(imcActual);

    // Calcular progreso de perímetros
    const progresoCintura = this.calcularProgresoMetrica(
      mediciones.map((m) =>
        m.perimetroCintura ? Number(m.perimetroCintura) : null,
      ),
    );
    const progresoCadera = this.calcularProgresoMetrica(
      mediciones.map((m) =>
        m.perimetroCadera ? Number(m.perimetroCadera) : null,
      ),
    );
    const progresoBrazo = this.calcularProgresoMetrica(
      mediciones.map((m) =>
        m.perimetroBrazo ? Number(m.perimetroBrazo) : null,
      ),
    );
    const progresoMuslo = this.calcularProgresoMetrica(
      mediciones.map((m) =>
        m.perimetroMuslo ? Number(m.perimetroMuslo) : null,
      ),
    );

    // Calcular relación cintura/cadera
    const relacionInicial = this.calcularRelacionCinturaCadera(
      primeraMedicion.perimetroCintura
        ? Number(primeraMedicion.perimetroCintura)
        : null,
      primeraMedicion.perimetroCadera
        ? Number(primeraMedicion.perimetroCadera)
        : null,
    );
    const relacionActual = this.calcularRelacionCinturaCadera(
      ultimaMedicion.perimetroCintura
        ? Number(ultimaMedicion.perimetroCintura)
        : null,
      ultimaMedicion.perimetroCadera
        ? Number(ultimaMedicion.perimetroCadera)
        : null,
    );
    const riesgoCardiovascular = relacionActual
      ? this.evaluarRiesgoCardiovascular(relacionActual)
      : null;

    return {
      peso: {
        inicial: pesoInicial,
        actual: pesoActual,
        diferencia: parseFloat((pesoActual - pesoInicial).toFixed(2)),
        tendencia: tendenciaPeso,
      },
      imc: {
        inicial: imcInicial,
        actual: imcActual,
        diferencia: parseFloat((imcActual - imcInicial).toFixed(2)),
        categoriaActual: categoriaIMC,
      },
      perimetros: {
        cintura: progresoCintura,
        cadera: progresoCadera,
        brazo: progresoBrazo,
        muslo: progresoMuslo,
      },
      relacionCinturaCadera: {
        inicial: relacionInicial,
        actual: relacionActual,
        riesgoCardiovascular: riesgoCardiovascular,
      },
      rangoSaludable: {
        pesoMinimo: altura ? this.calcularPesoPorIMC(altura, 18.5) : null,
        pesoMaximo: altura ? this.calcularPesoPorIMC(altura, 24.9) : null,
      },
      totalMediciones: mediciones.length,
      primeraMedicion: primeraMedicion.createdAt,
      ultimaMedicion: ultimaMedicion.createdAt,
    };
  }

  private calcularTendencia(valores: number[]): Tendencia {
    if (valores.length < 2) return 'estable';

    // Calcular pendiente simple de regresión lineal
    const n = valores.length;
    const sumaX = (n * (n - 1)) / 2;
    const sumaY = valores.reduce((a, b) => a + b, 0);
    const sumaXY = valores.reduce((sum, y, x) => sum + x * y, 0);
    const sumaX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const pendiente =
      (n * sumaXY - sumaX * sumaY) / (n * sumaX2 - sumaX * sumaX);

    // Considerar estable si el cambio es menor a 0.1 por medición
    if (Math.abs(pendiente) < 0.1) return 'estable';
    return pendiente > 0 ? 'subiendo' : 'bajando';
  }

  private categorizarIMC(imc: number): CategoriaIMC {
    if (imc < 18.5) return 'bajo_peso';
    if (imc < 25) return 'normal';
    if (imc < 30) return 'sobrepeso';
    return 'obesidad';
  }

  private calcularProgresoMetrica(valores: (number | null)[]): ProgresoMetrica {
    const valoresValidos = valores.filter((v) => v !== null);
    if (valoresValidos.length === 0) {
      return { inicial: null, actual: null, diferencia: null, tendencia: null };
    }

    const inicial = valoresValidos[0];
    const actual = valoresValidos[valoresValidos.length - 1];
    const tendencia = this.calcularTendencia(valoresValidos);

    return {
      inicial,
      actual,
      diferencia: parseFloat((actual - inicial).toFixed(2)),
      tendencia,
    };
  }

  private calcularRelacionCinturaCadera(
    cintura: number | null,
    cadera: number | null,
  ): number | null {
    if (!cintura || !cadera || cadera === 0) return null;
    return parseFloat((cintura / cadera).toFixed(3));
  }

  private evaluarRiesgoCardiovascular(relacion: number): RiesgoCardiovascular {
    // Valores generales (deberían ajustarse por género en una implementación real)
    if (relacion < 0.85) return 'bajo';
    if (relacion < 0.9) return 'moderado';
    return 'alto';
  }

  private calcularPesoPorIMC(alturaCm: number, imc: number): number {
    const alturaM = alturaCm / 100;
    return parseFloat((imc * alturaM * alturaM).toFixed(2));
  }
}
