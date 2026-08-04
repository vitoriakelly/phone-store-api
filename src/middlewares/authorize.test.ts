import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { UserRole } from '../generated/prisma/client.js';
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from '../test/mocks.js';
import { authorize } from './authorize.js';

describe('authorize', () => {
  beforeEach(() => {
    process.env.JWT_SECRET =
      'test-secret';
  });

  it('retorna 401 quando não há usuário autenticado', () => {
    const middleware = authorize(
      UserRole.MASTER,
    );
    const request =
      createMockRequest();
    const response =
      createMockResponse();
    const next = createMockNext();

    middleware(
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).toHaveBeenCalledWith(401);
    expect(
      response.json,
    ).toHaveBeenCalledWith({
      message:
        'Autenticação necessária.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 403 quando o papel não é permitido', () => {
    const middleware = authorize(
      UserRole.MASTER,
    );
    const request = createMockRequest({
      user: {
        id: 'user-1',
        role: UserRole.FUNCIONARIO,
      },
    });
    const response =
      createMockResponse();
    const next = createMockNext();

    middleware(
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).toHaveBeenCalledWith(403);
    expect(
      response.json,
    ).toHaveBeenCalledWith({
      message:
        'Você não possui permissão para realizar esta operação.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('chama next quando o papel é permitido', () => {
    const middleware = authorize(
      UserRole.MASTER,
      UserRole.FUNCIONARIO,
    );
    const request = createMockRequest({
      user: {
        id: 'user-1',
        role: UserRole.FUNCIONARIO,
      },
    });
    const response =
      createMockResponse();
    const next = createMockNext();

    middleware(
      request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(
      response.status,
    ).not.toHaveBeenCalled();
  });
});
