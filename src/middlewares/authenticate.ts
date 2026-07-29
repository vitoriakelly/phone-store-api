import type {
  NextFunction,
  Request,
  Response,
} from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

import { UserRole } from '../generated/prisma/client.js';

interface AuthenticationTokenPayload
  extends JwtPayload {
  role?: UserRole;
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

function isValidRole(
  role: unknown,
): role is UserRole {
  return (
    role === UserRole.MASTER ||
    role === UserRole.FUNCIONARIO
  );
}

export function authenticate(
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
      !isValidRole(decodedToken.role)
    ) {
      return response.status(401).json({
        message:
          'Token de autenticação inválido.',
      });
    }

    request.user = {
      id: decodedToken.sub,
      role: decodedToken.role,
    };

    return next();
  } catch {
    return response.status(401).json({
      message:
        'Sua sessão expirou ou é inválida. Faça login novamente.',
    });
  }
}