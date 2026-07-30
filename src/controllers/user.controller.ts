import type {
  Request,
  Response,
} from 'express';

import {
  createEmployeeSchema,
  employeeIdParamsSchema,
  resetEmployeePasswordSchema,
  updateEmployeeStatusSchema,
} from '../dtos/user.dto.js';

import { userService } from '../services/user.service.js';

class UserController {
  async listEmployees(
    _request: Request,
    response: Response,
  ) {
    const employees =
      await userService.listEmployees();

    return response.status(200).json({
      data: {
        employees,
      },
    });
  }
  async listSellers(
    _request: Request,
    response: Response,
  ) {
    const sellers =
      await userService.listSellers();

    return response.status(200).json({
      data: {
        sellers,
      },
    });
  }
  async createEmployee(
    request: Request,
    response: Response,
  ) {
    const input =
      createEmployeeSchema.parse(
        request.body,
      );

    const employee =
      await userService.createEmployee(
        input,
      );

    return response.status(201).json({
      message:
        'Funcionário cadastrado com sucesso.',

      data: {
        employee,
      },
    });
  }

  async updateEmployeeStatus(
    request: Request,
    response: Response,
  ) {
    const { id } =
      employeeIdParamsSchema.parse(
        request.params,
      );

    const input =
      updateEmployeeStatusSchema.parse(
        request.body,
      );

    const employee =
      await userService.updateEmployeeStatus(
        id,
        input,
      );

    return response.status(200).json({
      message: input.active
        ? 'Funcionário ativado com sucesso.'
        : 'Funcionário desativado com sucesso.',

      data: {
        employee,
      },
    });
  }

  async resetEmployeePassword(
    request: Request,
    response: Response,
  ) {
    const { id } =
      employeeIdParamsSchema.parse(
        request.params,
      );

    const input =
      resetEmployeePasswordSchema.parse(
        request.body,
      );

    const employee =
      await userService.resetEmployeePassword(
        id,
        input,
      );

    return response.status(200).json({
      message:
        'Senha do funcionário redefinida com sucesso.',

      data: {
        employee,
      },
    });
  }
}

export const userController =
  new UserController();