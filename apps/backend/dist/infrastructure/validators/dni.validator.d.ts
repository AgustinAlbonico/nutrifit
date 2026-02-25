import { ValidationOptions, ValidatorConstraintInterface } from 'class-validator';
export declare class IsValidDniConstraint implements ValidatorConstraintInterface {
    validate(dni: string): boolean;
    defaultMessage(): string;
}
export declare function IsValidDni(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
