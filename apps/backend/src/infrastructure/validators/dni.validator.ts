import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidDni', async: false })
export class IsValidDniConstraint implements ValidatorConstraintInterface {
  validate(dni: string): boolean {
    if (!dni || typeof dni !== 'string') {
      return false;
    }

    // Eliminar espacios y guiones
    const dniLimpio = dni.trim().replace(/[-\s]/g, '');

    // Verificar que solo contenga dígitos
    if (!/^\d+$/.test(dniLimpio)) {
      return false;
    }

    // El DNI argentino debe tener exactamente 8 dígitos
    return dniLimpio.length === 8;
  }

  defaultMessage(): string {
    return 'El DNI debe tener exactamente 8 dígitos';
  }
}

export function IsValidDni(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDniConstraint,
    });
  };
}
