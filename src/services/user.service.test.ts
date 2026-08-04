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
  UserService,
  UserConflictError,
  UserNotFoundError,
} = await import('./user.service.js');

describe('UserService', () => {
  const service = new UserService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista apenas funcionários', async () => {
    prismaMock.user.findMany.mockResolvedValue(
      [],
    );

    await service.listEmployees();

    expect(
      prismaMock.user.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: 'FUNCIONARIO',
        },
      }),
    );
  });

  it('cria funcionário quando o e-mail está livre', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      null,
    );

    const created = {
      id: 'emp-1',
      name: 'Maria',
      email: 'maria@loja.com',
      role: 'FUNCIONARIO',
      active: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.user.create.mockResolvedValue(
      created,
    );

    const result =
      await service.createEmployee({
        name: 'Maria',
        email: 'maria@loja.com',
        password: 'senha1234',
      });

    expect(result).toEqual(created);
    expect(
      prismaMock.user.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Maria',
          email: 'maria@loja.com',
          role: 'FUNCIONARIO',
          active: true,
          passwordHash:
            expect.any(String),
        }),
      }),
    );
  });

  it('lança conflito quando o e-mail já existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      {
        id: 'emp-1',
      },
    );

    await expect(
      service.createEmployee({
        name: 'Maria',
        email: 'maria@loja.com',
        password: 'senha1234',
      }),
    ).rejects.toBeInstanceOf(
      UserConflictError,
    );
  });

  it('atualiza status de funcionário existente', async () => {
    prismaMock.user.findFirst.mockResolvedValue(
      {
        id: 'emp-1',
      },
    );

    const updated = {
      id: 'emp-1',
      name: 'Maria',
      email: 'maria@loja.com',
      role: 'FUNCIONARIO',
      active: false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.user.update.mockResolvedValue(
      updated,
    );

    await expect(
      service.updateEmployeeStatus(
        'emp-1',
        {
          active: false,
        },
      ),
    ).resolves.toEqual(updated);
  });

  it('lança 404 ao atualizar funcionário inexistente', async () => {
    prismaMock.user.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.updateEmployeeStatus(
        'emp-404',
        {
          active: false,
        },
      ),
    ).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it('redefine senha de funcionário existente', async () => {
    prismaMock.user.findFirst.mockResolvedValue(
      {
        id: 'emp-1',
      },
    );
    prismaMock.user.update.mockResolvedValue(
      {
        id: 'emp-1',
      },
    );

    await service.resetEmployeePassword(
      'emp-1',
      {
        password: 'novasenha1',
      },
    );

    expect(
      prismaMock.user.update,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'emp-1',
        },
        data: {
          passwordHash:
            expect.any(String),
        },
      }),
    );
  });
});
