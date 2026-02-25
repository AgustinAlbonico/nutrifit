"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsValidDniConstraint = void 0;
exports.IsValidDni = IsValidDni;
const class_validator_1 = require("class-validator");
let IsValidDniConstraint = class IsValidDniConstraint {
    validate(dni) {
        if (!dni || typeof dni !== 'string') {
            return false;
        }
        const dniLimpio = dni.trim().replace(/[-\s]/g, '');
        if (!/^\d+$/.test(dniLimpio)) {
            return false;
        }
        return dniLimpio.length === 8;
    }
    defaultMessage() {
        return 'El DNI debe tener exactamente 8 dígitos';
    }
};
exports.IsValidDniConstraint = IsValidDniConstraint;
exports.IsValidDniConstraint = IsValidDniConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isValidDni', async: false })
], IsValidDniConstraint);
function IsValidDni(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidDniConstraint,
        });
    };
}
//# sourceMappingURL=dni.validator.js.map