import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import routes from './routes';
import { errorHandler, notFound } from './middlewares/errorHandler';

const app: Application = express();

dotenv.config();

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
