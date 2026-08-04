import { describe, expect, it } from 'vitest';

import { AppError } from './app-error.js';

describe('AppError', () => {
  it('usa status 400 por padrão', () => {
    const error = new AppError(
      'Mensagem de erro',
    );

    expect(error).toBeInstanceOf(
      Error,
    );
    expect(error.name).toBe(
      'AppError',
    );
    expect(error.message).toBe(
      'Mensagem de erro',
    );
    expect(error.statusCode).toBe(
      400,
    );
  });

  it('aceita status code customizado', () => {
    const error = new AppError(
      'Não encontrado',
      404,
    );

    expect(error.statusCode).toBe(
      404,
    );
  });
});
