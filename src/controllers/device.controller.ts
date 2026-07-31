import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import {
  createDeviceSchema,
  deviceParamsSchema,
  listDevicesQuerySchema,
  updateDeviceSchema,
} from '../dtos/device.dto.js';
import { deviceService } from '../services/device.service.js';

class DeviceController {
  create = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const validation =
        createDeviceSchema.safeParse(
          request.body,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'Os dados enviados são inválidos.',

          errors:
            validation.error
              .flatten()
              .fieldErrors,
        });
      }

      const device =
        await deviceService.create(
          validation.data,
        );

      return response.status(201).json({
        message:
          'Dispositivo cadastrado com sucesso.',

        data: device,
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
        listDevicesQuerySchema.safeParse(
          request.query,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'Os filtros enviados são inválidos.',

          errors:
            validation.error
              .flatten()
              .fieldErrors,
        });
      }

      const result =
        await deviceService.list(
          validation.data,
        );

      /*
       * O service já devolve data,
       * paginação e filtros aplicados.
       */
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
        deviceParamsSchema.safeParse(
          request.params,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'O identificador enviado é inválido.',

          errors:
            validation.error
              .flatten()
              .fieldErrors,
        });
      }

      const device =
        await deviceService.findById(
          validation.data.id,
        );

      return response.status(200).json({
        data: device,
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const paramsValidation =
        deviceParamsSchema.safeParse(
          request.params,
        );

      if (!paramsValidation.success) {
        return response.status(400).json({
          message:
            'O identificador enviado é inválido.',

          errors:
            paramsValidation.error
              .flatten()
              .fieldErrors,
        });
      }

      const bodyValidation =
        updateDeviceSchema.safeParse(
          request.body,
        );

      if (!bodyValidation.success) {
        return response.status(400).json({
          message:
            'Os dados enviados são inválidos.',

          errors:
            bodyValidation.error
              .flatten()
              .fieldErrors,

          formErrors:
            bodyValidation.error
              .flatten()
              .formErrors,
        });
      }

      const device =
        await deviceService.update(
          paramsValidation.data.id,
          bodyValidation.data,
        );

      return response.status(200).json({
        message:
          'Dispositivo atualizado com sucesso.',

        data: device,
      });
    } catch (error) {
      return next(error);
    }
  };

  delete = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const validation =
        deviceParamsSchema.safeParse(
          request.params,
        );

      if (!validation.success) {
        return response.status(400).json({
          message:
            'O identificador enviado é inválido.',

          errors:
            validation.error
              .flatten()
              .fieldErrors,
        });
      }

      await deviceService.delete(
        validation.data.id,
      );

      return response
        .status(204)
        .send();
    } catch (error) {
      return next(error);
    }
  };
}

export const deviceController =
  new DeviceController();