import { Router } from 'express';

import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

export const dashboardRoutes =
  Router();

dashboardRoutes.use(authenticate);

dashboardRoutes.get(
  '/',
  dashboardController.getDashboard,
);