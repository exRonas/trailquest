import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOrigins, isProd } from './config/env';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(isProd ? 'combined' : 'dev'));

  app.use('/api', apiRouter);

  // 404 for anything unmatched, then the centralised error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
