import { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { createPrismaMock } from '../test/mocks.js';

const prismaMock = createPrismaMock();

vi.mock('../config/prisma.js', () => ({
  prisma: prismaMock,
}));

const {
  AuthService,
  AuthenticationError,
} = await import('./auth.service.js');

describe('AuthService', () => {
  const service = new AuthService();

  beforeEach(() => {
    process.env.JWT_SECRET =
      'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    vi.clearAllMocks();
  });

  it('realiza login com credenciais válidas', async () => {
    const passwordHash = await hash(
      'senha1234',
      4,
    );

    prismaMock.user.findUnique.mockResolvedValue(
      {
        id: 'user-1',
        name: 'Admin',
        email: 'admin@loja.com',
        passwordHash,
        role: 'MASTER',
        active: true,
        tokenVersion: 0,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    const authenticatedUser = {
      id: 'user-1',
      name: 'Admin',
      email: 'admin@loja.com',
      role: 'MASTER',
      active: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.user.update.mockResolvedValue(
      authenticatedUser,
    );

    const result = await service.login({
      email: 'admin@loja.com',
      password: 'senha1234',
    });

    expect(result.user).toEqual(
      authenticatedUser,
    );
    expect(
      typeof result.token,
    ).toBe('string');

    const decoded = jwt.verify(
      result.token,
      'test-secret',
      {
        algorithms: ['HS256'],
        issuer: 'phone-store-api',
        audience: 'phone-store-web',
      },
    ) as jwt.JwtPayload;

    expect(decoded.sub).toBe('user-1');
    expect(
      decoded.tokenVersion,
    ).toBe(0);
  });

  it('lança erro quando o usuário não existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      null,
    );

    await expect(
      service.login({
        email: 'x@loja.com',
        password: 'senha1234',
      }),
    ).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it('lança erro quando o usuário está desativado', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      {
        id: 'user-1',
        passwordHash: 'hash',
        active: false,
        tokenVersion: 0,
      },
    );

    await expect(
      service.login({
        email: 'admin@loja.com',
        password: 'senha1234',
      }),
    ).rejects.toMatchObject({
      message:
        'Este usuário está desativado.',
      statusCode: 401,
    });
  });

  it('lança erro quando a senha não confere', async () => {
    const passwordHash = await hash(
      'senha-correta',
      4,
    );

    prismaMock.user.findUnique.mockResolvedValue(
      {
        id: 'user-1',
        passwordHash,
        active: true,
        tokenVersion: 0,
      },
    );

    await expect(
      service.login({
        email: 'admin@loja.com',
        password: 'senha-errada',
      }),
    ).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it('retorna o usuário atual ativo', async () => {
    const user = {
      id: 'user-1',
      name: 'Admin',
      email: 'admin@loja.com',
      role: 'MASTER',
      active: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.user.findUnique.mockResolvedValue(
      user,
    );

    await expect(
      service.getCurrentUser('user-1'),
    ).resolves.toEqual(user);
  });

  it('incrementa tokenVersion no logout', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      {
        id: 'user-1',
        active: true,
      },
    );
    prismaMock.user.update.mockResolvedValue(
      {},
    );

    await service.logout('user-1');

    expect(
      prismaMock.user.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
      },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });
  });
});
