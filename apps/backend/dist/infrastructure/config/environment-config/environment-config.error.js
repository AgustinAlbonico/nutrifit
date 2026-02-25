"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentConfigurationError = void 0;
class EnvironmentConfigurationError extends Error {
    constructor(variableName) {
        const message = `Environment variable '${variableName}' is required`;
        super(message);
        this.name = 'EnvironmentConfigurationError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, EnvironmentConfigurationError);
        }
    }
}
exports.EnvironmentConfigurationError = EnvironmentConfigurationError;
//# sourceMappingURL=environment-config.error.js.map