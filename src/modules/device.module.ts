import { Router } from 'express';

import { deviceRoutes } from '../routes/device.routes.js';

const deviceModule = Router();

deviceModule.use('/devices', deviceRoutes);

export { deviceModule };
