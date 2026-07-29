import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import type { UserRole } from '../generated/prisma/client.js';

export function authorize(
  ...allowedRoles: UserRole[]
) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    if (!request.user) {
      return response.status(401).json({
        message:
          'Autenticação necessária.',
      });
    }

    if (
      !allowedRoles.includes(
        request.user.role,
      )
    ) {
      return response.status(403).json({
        message:
          'Você não possui permissão para realizar esta operação.',
      });
    }

    return next();
  };
}