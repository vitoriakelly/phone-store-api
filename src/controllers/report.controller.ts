import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import {
  commissionsReportQuerySchema,
  devicesReportQuerySchema,
  salesReportQuerySchema,
} from '../dtos/report.dto.js';
import { reportService } from '../services/report.service.js';

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

export class ReportController {
  getSalesReport = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const validation =
        salesReportQuerySchema.safeParse(
          request.query,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'Os filtros informados são inválidos.',
          errors: formatValidationErrors(
            validation.error.issues,
          ),
        });
      }

      const report =
        await reportService.getSalesReport(
          validation.data,
        );

      return response.status(200).json(report);
    } catch (error) {
      return next(error);
    }
  };

  getDevicesReport = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const validation =
        devicesReportQuerySchema.safeParse(
          request.query,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'Os filtros informados são inválidos.',
          errors: formatValidationErrors(
            validation.error.issues,
          ),
        });
      }

      const report =
        await reportService.getDevicesReport(
          validation.data,
        );

      return response.status(200).json(report);
    } catch (error) {
      return next(error);
    }
  };

  getCommissionsReport = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const validation =
        commissionsReportQuerySchema.safeParse(
          request.query,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'Os filtros informados são inválidos.',
          errors: formatValidationErrors(
            validation.error.issues,
          ),
        });
      }

      const report =
        await reportService.getCommissionsReport(
          validation.data,
        );

      return response.status(200).json(report);
    } catch (error) {
      return next(error);
    }
  };
}

export const reportController =
  new ReportController();