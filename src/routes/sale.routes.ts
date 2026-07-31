import { Router } from 'express';

import { saleController } from '../controllers/sale.controller.js';

const saleRoutes = Router();

saleRoutes.get(
  '/',
  saleController.list,
);

saleRoutes.post(
  '/',
  saleController.create,
);

saleRoutes.patch(
  '/:id/commission-status',
  saleController.updateCommissionPaymentStatus,
);

saleRoutes.get(
  '/:id',
  saleController.findById,
);

export { saleRoutes };