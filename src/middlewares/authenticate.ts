import type {
  NextFunction,
  Request,
  Response,
} from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

import { prisma } from '../config/prisma.js';

interface AuthenticationTokenPayload
  extends JwtPayload {
  tokenVersion?: number;
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

function getAuthCookieName() {
  return (
    process.env.AUTH_COOKIE_NAME ??
    'phone_store_token'
  );
}

function isValidTokenVersion(
  tokenVersion: unknown,
): tokenVersion is number {
  return (
    typeof tokenVersion === 'number' &&
    Number.isInteger(tokenVersion) &&
    tokenVersion >= 0
  );
}

export async function authenticate(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const token =
    request.cookies?.[
      getAuthCookieName()
    ];

  if (
    typeof token !== 'string' ||
    !token
  ) {
    return response.status(401).json({
      message:
        'Autenticação necessária.',
    });
  }

  try {
    const decodedToken = jwt.verify(
      token,
      getJwtSecret(),
      {
        algorithms: ['HS256'],
        issuer: 'phone-store-api',
        audience: 'phone-store-web',
      },
    ) as AuthenticationTokenPayload;

    if (
      !decodedToken.sub ||
      !isValidTokenVersion(
        decodedToken.tokenVersion,
      )
    ) {
      return response.status(401).json({
        message:
          'Token de autenticação inválido.',
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: decodedToken.sub,
        },

        select: {
          id: true,
          role: true,
          active: true,
          tokenVersion: true,
        },
      });

    if (!user || !user.active) {
      return response.status(401).json({
        message:
          'Sua sessão não é mais válida. Faça login novamente.',
      });
    }

    if (
      user.tokenVersion !==
      decodedToken.tokenVersion
    ) {
      return response.status(401).json({
        message:
          'Sua sessão foi encerrada. Faça login novamente.',
      });
    }

    request.user = {
      id: user.id,
      role: user.role,
    };

    return next();
  } catch (error) {
    if (
      error instanceof
        jwt.JsonWebTokenError ||
      error instanceof
        jwt.TokenExpiredError
    ) {
      return response.status(401).json({
        message:
          'Sua sessão expirou ou é inválida. Faça login novamente.',
      });
    }

    return next(error);
  }
}