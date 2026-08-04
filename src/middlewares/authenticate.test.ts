import jwt from 'jsonwebtoken';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  createPrismaMock,
} from '../test/mocks.js';

const prismaMock = createPrismaMock();

vi.mock('../config/prisma.js', () => ({
  prisma: prismaMock,
}));

const { authenticate } = await import(
  './authenticate.js'
);

describe('authenticate', () => {
  beforeEach(() => {
    process.env.JWT_SECRET =
      'test-secret';
    process.env.AUTH_COOKIE_NAME =
      'phone_store_token';
    vi.clearAllMocks();
  });

  it('retorna 401 quando o cookie de autenticação não existe', async () => {
    const request =
      createMockRequest({
        cookies: {},
      });
    const response =
      createMockResponse();
    const next = createMockNext();

    await authenticate(
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
  });

  it('retorna 401 para token inválido', async () => {
    const request =
      createMockRequest({
        cookies: {
          phone_store_token:
            'token-invalido',
        },
      });
    const response =
      createMockResponse();
    const next = createMockNext();

    await authenticate(
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
        'Sua sessão expirou ou é inválida. Faça login novamente.',
    });
  });

  it('anexa o usuário e chama next com token válido', async () => {
    const token = jwt.sign(
      {
        tokenVersion: 1,
      },
      'test-secret',
      {
        algorithm: 'HS256',
        subject: 'user-1',
        issuer: 'phone-store-api',
        audience: 'phone-store-web',
        expiresIn: '1h',
      },
    );

    prismaMock.user.findUnique.mockResolvedValue(
      {
        id: 'user-1',
        role: 'MASTER',
        active: true,
        tokenVersion: 1,
      },
    );

    const request =
      createMockRequest({
        cookies: {
          phone_store_token: token,
        },
      });
    const response =
      createMockResponse();
    const next = createMockNext();

    await authenticate(
      request,
      response,
      next,
    );

    expect(request.user).toEqual({
      id: 'user-1',
      role: 'MASTER',
    });
    expect(next).toHaveBeenCalledOnce();
  });

  it('retorna 401 quando a versão do token não coincide', async () => {
    const token = jwt.sign(
      {
        tokenVersion: 1,
      },
      'test-secret',
      {
        algorithm: 'HS256',
        subject: 'user-1',
        issuer: 'phone-store-api',
        audience: 'phone-store-web',
        expiresIn: '1h',
      },
    );

    prismaMock.user.findUnique.mockResolvedValue(
      {
        id: 'user-1',
        role: 'MASTER',
        active: true,
        tokenVersion: 2,
      },
    );

    const request =
      createMockRequest({
        cookies: {
          phone_store_token: token,
        },
      });
    const response =
      createMockResponse();
    const next = createMockNext();

    await authenticate(
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
        'Sua sessão foi encerrada. Faça login novamente.',
    });
  });
});
