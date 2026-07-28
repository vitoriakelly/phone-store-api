import { Router } from 'express';

import { deviceController } from '../controllers/device.controller.js';

const deviceRoutes = Router();

deviceRoutes.get(
  '/',
  deviceController.list,
);

deviceRoutes.post(
  '/',
  deviceController.create,
);

deviceRoutes.get(
  '/:id',
  deviceController.findById,
);

deviceRoutes.patch(
  '/:id',
  deviceController.update,
);

deviceRoutes.delete(
  '/:id',
  deviceController.delete,
);

export { deviceRoutes };