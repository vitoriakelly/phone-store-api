import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import { dashboardQuerySchema } from '../dtos/dashboard.dto.js';
import { dashboardService } from '../services/dashboard.service.js';


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

class DashboardController {
  getDashboard = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const validation =
        dashboardQuerySchema.safeParse(
          request.query,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'Os filtros informados são inválidos.',

          errors:
            formatValidationErrors(
              validation.error.issues,
            ),
        });
      }

      const dashboard =
        await dashboardService.getDashboard(
          validation.data,
        );

      return response
        .status(200)
        .json(dashboard);
    } catch (error) {
      return next(error);
    }
  };
}

export const dashboardController =
  new DashboardController();