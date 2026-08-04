import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AppError } from '../errors/app-error.js';
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from '../test/mocks.js';
import { errorHandler } from './error-handler.js';

describe('errorHandler', () => {
  it('responde com o status do AppError', () => {
    const request =
      createMockRequest();
    const response =
      createMockResponse();
    const next = createMockNext();

    errorHandler(
      new AppError(
        'Dispositivo não encontrado.',
        404,
      ),
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).toHaveBeenCalledWith(404);
    expect(
      response.json,
    ).toHaveBeenCalledWith({
      message:
        'Dispositivo não encontrado.',
    });
  });

  it('responde 500 para erros inesperados', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const request =
      createMockRequest();
    const response =
      createMockResponse();
    const next = createMockNext();

    errorHandler(
      new Error('falha interna'),
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).toHaveBeenCalledWith(500);
    expect(
      response.json,
    ).toHaveBeenCalledWith({
      message:
        'Ocorreu um erro interno no servidor.',
    });
    expect(
      consoleError,
    ).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
