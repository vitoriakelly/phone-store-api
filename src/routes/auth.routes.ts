import { Router } from 'express';

import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

export const authRoutes = Router();

authRoutes.post(
  '/login',
  authController.login,
);

authRoutes.get(
  '/me',
  authenticate,
  authController.me,
);

authRoutes.post(
  '/logout',
  authController.logout,
);