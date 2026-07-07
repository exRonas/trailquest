import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOrigins, isProd } from './config/env';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';

export function createApp(): Application {
  const app = express();

  // Behind Render's proxy so req.protocol/host reflect the public https URL
  // (used to build absolute image URLs in image.controller).
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );
  // Raised from 1mb: base64-encoded compressed images (client caps ~1-1.5MB
  // pre-encode) need headroom over the raw JSON body limit.
  app.use(express.json({ limit: '4mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(isProd ? 'combined' : 'dev'));

  app.use('/api', apiRouter);

  // 404 for anything unmatched, then the centralised error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
