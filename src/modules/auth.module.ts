import { Router } from 'express';

import { authRoutes } from '../routes/auth.routes.js';

const authModule = Router();

authModule.use('/auth', authRoutes);

export { authModule };