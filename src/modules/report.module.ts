import { Router } from 'express';

import { reportRoutes } from '../routes/report.routes.js';

const reportModule = Router();

reportModule.use('/reports', reportRoutes);

export { reportModule };