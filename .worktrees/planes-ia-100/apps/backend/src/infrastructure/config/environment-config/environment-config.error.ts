export class EnvironmentConfigurationError extends Error {
  constructor(variableName: string) {
    const message = `Environment variable '${variableName}' is required`;
    super(message);

    this.name = 'EnvironmentConfigurationError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnvironmentConfigurationError);
    }
  }
}
