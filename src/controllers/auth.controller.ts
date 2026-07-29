import type {
  CookieOptions,
  NextFunction,
  Request,
  Response,
} from 'express';

import { loginSchema } from '../dtos/auth.dto.js';
import {
  AuthenticationError,
  authService,
} from '../services/auth.service.js';

function getAuthCookieName() {
  return (
    process.env.AUTH_COOKIE_NAME ??
    'phone_store_token'
  );
}

function getCookieMaxAge() {
  const configuredMaxAge = Number(
    process.env.AUTH_COOKIE_MAX_AGE_MS,
  );

  if (
    Number.isFinite(configuredMaxAge) &&
    configuredMaxAge > 0
  ) {
    return configuredMaxAge;
  }

  return 8 * 60 * 60 * 1000;
}

function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,

    secure:
      process.env.NODE_ENV ===
      'production',

    sameSite: 'lax',
    path: '/',
    maxAge: getCookieMaxAge(),
  };
}

function getClearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,

    secure:
      process.env.NODE_ENV ===
      'production',

    sameSite: 'lax',
    path: '/',
  };
}

function formatValidationErrors(
  errors: {
    path: PropertyKey[];
    message: string;
  }[],
) {
  return errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
  }));
}

export class AuthController {
  login = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const validation =
        loginSchema.safeParse(
          request.body,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'Os dados de login são inválidos.',

          errors: formatValidationErrors(
            validation.error.issues,
          ),
        });
      }

      const { token, user } =
        await authService.login(
          validation.data,
        );

      response.cookie(
        getAuthCookieName(),
        token,
        getAuthCookieOptions(),
      );

      return response.status(200).json({
        message:
          'Login realizado com sucesso.',

        data: {
          user,
        },
      });
    } catch (error) {
      if (
        error instanceof
        AuthenticationError
      ) {
        return response
          .status(error.statusCode)
          .json({
            message: error.message,
          });
      }

      return next(error);
    }
  };

  me = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      if (!request.user) {
        return response.status(401).json({
          message:
            'Autenticação necessária.',
        });
      }

      const user =
        await authService.getCurrentUser(
          request.user.id,
        );

      return response.status(200).json({
        data: {
          user,
        },
      });
    } catch (error) {
      if (
        error instanceof
        AuthenticationError
      ) {
        response.clearCookie(
          getAuthCookieName(),
          getClearCookieOptions(),
        );

        return response
          .status(error.statusCode)
          .json({
            message: error.message,
          });
      }

      return next(error);
    }
  };

  logout = async (
    _request: Request,
    response: Response,
  ) => {
    response.clearCookie(
      getAuthCookieName(),
      getClearCookieOptions(),
    );

    return response.status(200).json({
      message:
        'Logout realizado com sucesso.',
    });
  };
}

export const authController =
  new AuthController();