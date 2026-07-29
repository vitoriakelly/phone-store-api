import { Router } from 'express';

import { userController } from '../controllers/user.controller.js';
import { UserRole } from '../generated/prisma/client.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

export const userRoutes = Router();

userRoutes.use(
  authenticate,
  authorize(UserRole.MASTER),
);

userRoutes.get(
  '/',
  userController.listEmployees,
);

userRoutes.post(
  '/',
  userController.createEmployee,
);

userRoutes.patch(
  '/:id/status',
  userController.updateEmployeeStatus,
);

userRoutes.patch(
  '/:id/password',
  userController.resetEmployeePassword,
);