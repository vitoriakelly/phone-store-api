import { Router } from 'express';

import { reportController } from '../controllers/report.controller.js';

export const reportRoutes = Router();

reportRoutes.get(
  '/sales',
  reportController.getSalesReport,
);

reportRoutes.get(
  '/devices',
  reportController.getDevicesReport,
);