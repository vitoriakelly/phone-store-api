import { Router } from 'express';

import { dashboardRoutes } from '../routes/dashboard.routes.js';

export const dashboardModule =
  Router();

dashboardModule.use(
  '/dashboard',
  dashboardRoutes,
);