import { Router } from 'express';

import { reportController } from '../controllers/report.controller.js';
import { UserRole } from '../generated/prisma/client.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

export const reportRoutes = Router();

reportRoutes.use(
  authenticate,
  authorize(UserRole.MASTER),
);

reportRoutes.get(
  '/sales',
  reportController.getSalesReport,
);

reportRoutes.get(
  '/devices',
  reportController.getDevicesReport,
);

reportRoutes.get(
  '/commissions',
  reportController.getCommissionsReport,
);