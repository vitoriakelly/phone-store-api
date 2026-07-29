import { Router } from 'express';

import { userRoutes } from '../routes/user.routes.js';

const userModule = Router();

userModule.use(
  '/users/employees',
  userRoutes,
);

export { userModule };