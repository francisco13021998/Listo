export class AppError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Error de red', cause?: unknown) {
    super(message, cause);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos inválidos', cause?: unknown) {
    super(message, cause);
    this.name = 'ValidationError';
  }
}
