import { hash } from 'bcryptjs';

import { prisma } from '../config/prisma.js';
import { UserRole } from '../generated/prisma/client.js';

import type {
  CreateEmployeeInput,
  ResetEmployeePasswordInput,
  UpdateEmployeeStatusInput,
} from '../dtos/user.dto.js';

const employeeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;
const sellerSelect = {
  id: true,
  name: true,
  role: true,
} as const;
export class UserNotFoundError extends Error {
  readonly statusCode = 404;

  constructor(
    message = 'Funcionário não encontrado.',
  ) {
    super(message);

    this.name = 'UserNotFoundError';
  }
}

export class UserConflictError extends Error {
  readonly statusCode = 409;

  constructor(
    message = 'Já existe um usuário cadastrado com este e-mail.',
  ) {
    super(message);

    this.name = 'UserConflictError';
  }
}

export class UserService {
  async listEmployees() {
    return prisma.user.findMany({
      where: {
        role: UserRole.FUNCIONARIO,
      },

      orderBy: [
        {
          active: 'desc',
        },
        {
          name: 'asc',
        },
      ],

      select: employeeSelect,
    });
  }
  async listSellers() {
    return prisma.user.findMany({
      where: {
        active: true,

        role: {
          in: [
            UserRole.MASTER,
            UserRole.FUNCIONARIO,
          ],
        },
      },

      orderBy: {
        name: 'asc',
      },

      select: sellerSelect,
    });
  }
  async createEmployee(
    input: CreateEmployeeInput,
  ) {
    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: input.email,
        },

        select: {
          id: true,
        },
      });

    if (existingUser) {
      throw new UserConflictError();
    }

    const passwordHash = await hash(
      input.password,
      12,
    );

    return prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: UserRole.FUNCIONARIO,
        active: true,
      },

      select: employeeSelect,
    });
  }

  async updateEmployeeStatus(
    employeeId: string,
    input: UpdateEmployeeStatusInput,
  ) {
    await this.ensureEmployeeExists(
      employeeId,
    );

    return prisma.user.update({
      where: {
        id: employeeId,
      },

      data: {
        active: input.active,
      },

      select: employeeSelect,
    });
  }

  async resetEmployeePassword(
    employeeId: string,
    input: ResetEmployeePasswordInput,
  ) {
    await this.ensureEmployeeExists(
      employeeId,
    );

    const passwordHash = await hash(
      input.password,
      12,
    );

    return prisma.user.update({
      where: {
        id: employeeId,
      },

      data: {
        passwordHash,
      },

      select: employeeSelect,
    });
  }

  private async ensureEmployeeExists(
    employeeId: string,
  ) {
    const employee =
      await prisma.user.findFirst({
        where: {
          id: employeeId,
          role: UserRole.FUNCIONARIO,
        },

        select: {
          id: true,
        },
      });

    if (!employee) {
      throw new UserNotFoundError();
    }
  }
}

export const userService =
  new UserService();