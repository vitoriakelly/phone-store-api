import { Router } from 'express';

import { saleRoutes } from '../routes/sale.routes.js';

const saleModule = Router();

saleModule.use('/sales', saleRoutes);

export { saleModule };