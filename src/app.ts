import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { prisma } from './config/prisma.js';
import { swaggerDocument } from './config/swagger.js';
import { errorHandler } from './middlewares/error-handler.js';
import { authModule } from './modules/auth.module.js';
import { deviceModule } from './modules/device.module.js';
import { reportModule } from './modules/report.module.js';
import { saleModule } from './modules/sale.module.js';
import { userModule } from './modules/user.module.js';

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ??
      'http://localhost:5173',

    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle:
      'Phone Store API Docs',

    customCss: `
      .swagger-ui .topbar {
        display: none;
      }

      .swagger-ui .info {
        margin: 35px 0;
      }
    `,

    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  }),
);

app.get(
  '/api-docs.json',
  (_request, response) => {
    return response
      .status(200)
      .json(swaggerDocument);
  },
);

app.get(
  '/health',
  (_request, response) => {
    return response.status(200).json({
      status: 'ok',

      message:
        'Phone Store API está funcionando.',

      timestamp:
        new Date().toISOString(),
    });
  },
);

app.get(
  '/health/database',
  async (_request, response) => {
    try {
      const [
        devicesCount,
        salesCount,
        usersCount,
      ] = await Promise.all([
        prisma.device.count(),
        prisma.sale.count(),
        prisma.user.count(),
      ]);

      return response.status(200).json({
        status: 'ok',

        message:
          'Conexão com o PostgreSQL realizada com sucesso.',

        database: {
          devices: devicesCount,
          sales: salesCount,
          users: usersCount,
        },

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        'Erro ao acessar o banco de dados:',
        error,
      );

      return response.status(503).json({
        status: 'error',

        message:
          'Não foi possível acessar o PostgreSQL.',
      });
    }
  },
);

app.use(authModule);
app.use(deviceModule);
app.use(saleModule);
app.use(reportModule);
app.use(userModule);

app.use((_request, response) => {
  return response.status(404).json({
    message: 'Rota não encontrada.',
  });
});

app.use(errorHandler);

export { app };