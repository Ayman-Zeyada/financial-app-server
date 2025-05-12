import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import routes from './routes';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { sequelize } from './models';
import logger from './utils/logger';

const app: Application = express();

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
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
