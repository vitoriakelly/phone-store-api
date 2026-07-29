import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import { prisma } from '../config/prisma.js';
import type { LoginInput } from '../dtos/auth.dto.js';

export class AuthenticationError extends Error {
  readonly statusCode = 401;

  constructor(
    message = 'E-mail ou senha inválidos.',
  ) {
    super(message);

    this.name = 'AuthenticationError';
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'A variável JWT_SECRET não foi configurada.',
    );
  }

  return secret;
}

function getJwtExpiresIn(): SignOptions['expiresIn'] {
  return (
    process.env.JWT_EXPIRES_IN ?? '8h'
  ) as SignOptions['expiresIn'];
}

const authenticatedUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class AuthService {
  async login(input: LoginInput) {
    const user =
      await prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });

    if (!user) {
      throw new AuthenticationError();
    }

    if (!user.active) {
      throw new AuthenticationError(
        'Este usuário está desativado.',
      );
    }

    const passwordMatches =
      await compare(
        input.password,
        user.passwordHash,
      );

    if (!passwordMatches) {
      throw new AuthenticationError();
    }

    const token = jwt.sign(
      {
        role: user.role,
      },
      getJwtSecret(),
      {
        algorithm: 'HS256',
        subject: user.id,
        issuer: 'phone-store-api',
        audience: 'phone-store-web',
        expiresIn: getJwtExpiresIn(),
      },
    );

    const authenticatedUser =
      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          lastLoginAt: new Date(),
        },

        select: authenticatedUserSelect,
      });

    return {
      token,
      user: authenticatedUser,
    };
  }

  async getCurrentUser(userId: string) {
    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: authenticatedUserSelect,
      });

    if (!user) {
      throw new AuthenticationError(
        'Usuário não encontrado.',
      );
    }

    if (!user.active) {
      throw new AuthenticationError(
        'Este usuário está desativado.',
      );
    }

    return user;
  }
}

export const authService =
  new AuthService();