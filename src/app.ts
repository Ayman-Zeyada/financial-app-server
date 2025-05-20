import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import http from 'http';

import routes from './routes';
import { errorHandler, notFound } from './middlewares/error-handler.middleware';
import { sequelize } from './models';
import logger from './utils/logger';
import { financialScheduler } from './services/financial-scheduler.service';
import socketService from './services/socket.service';
import { rateLimiter } from './middlewares/rate-limiter.middleware';
import { paginationMiddleware } from './middlewares/pagination.middleware';
import { simpleCacheMiddleware } from './middlewares/cache.middleware';

const app: Application = express();
const server = http.createServer(app);

dotenv.config();

sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connection has been established successfully.');
  })
  .catch((err) => {
    logger.error('Unable to connect to the database:', err);
  });

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const rateLimitMiddleware = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(rateLimitMiddleware);

const paginationMw = paginationMiddleware({
  defaultLimit: 10,
  maxLimit: 100,
});
app.use(paginationMw);

const cacheMw = simpleCacheMiddleware({
  ttl: 300, // 5 minutes
});
app.use(cacheMw);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

socketService.initialize(server);

if (process.env.NODE_ENV === 'production') {
  financialScheduler.start();
  logger.info('Financial scheduler started in production mode');
}

export { server };
export default app;
