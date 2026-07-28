import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import {
  createSaleSchema,
  listSalesQuerySchema,
  saleParamsSchema,
} from '../dtos/sale.dto.js';
import { saleService } from '../services/sale.service.js';

class SaleController {
  create = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const validation =
        createSaleSchema.safeParse(
          request.body,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'Os dados enviados são inválidos.',

          errors:
            validation.error.flatten()
              .fieldErrors,

          formErrors:
            validation.error.flatten()
              .formErrors,
        });
      }

      const sale = await saleService.create(
        validation.data,
      );

      return response.status(201).json({
        message:
          'Venda registrada com sucesso.',
        data: sale,
      });
    } catch (error) {
      return next(error);
    }
  };

  list = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const validation =
        listSalesQuerySchema.safeParse(
          request.query,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'Os filtros enviados são inválidos.',

          errors:
            validation.error.flatten()
              .fieldErrors,
        });
      }

      const result = await saleService.list(
        validation.data,
      );

      return response
        .status(200)
        .json(result);
    } catch (error) {
      return next(error);
    }
  };

  findById = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const validation =
        saleParamsSchema.safeParse(
          request.params,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'O identificador enviado é inválido.',

          errors:
            validation.error.flatten()
              .fieldErrors,
        });
      }

      const sale =
        await saleService.findById(
          validation.data.id,
        );

      return response.status(200).json({
        data: sale,
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const saleController =
  new SaleController();