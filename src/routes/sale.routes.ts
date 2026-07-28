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

saleRoutes.get(
  '/:id',
  saleController.findById,
);

export { saleRoutes };