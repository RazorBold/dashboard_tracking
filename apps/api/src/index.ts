import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env, logger, swaggerSpec } from './config';
import { apiRouter } from './routes';
import { notFoundHandler, errorHandler } from './middleware';

// ─── App Instance ─────────────────────────────────────
const app = express();

// ─── Security & Compression ───────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production',
  }),
);
app.use(compression());

// ─── CORS ─────────────────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Request Parsing ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));

// ─── HTTP Logger (Morgan → Pino) ──────────────────────
app.use(
  morgan('combined', {
    stream: {
      write: (msg) => logger.info(msg.trim()),
    },
    skip: (_req, res) => env.NODE_ENV === 'test' || res.statusCode < 400,
  }),
);

// ─── Swagger UI ───────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { background-color: #0f172a; }',
    customSiteTitle: 'IoT Platform API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
  }),
);

// Serve raw swagger spec (for external tools)
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── API Routes ───────────────────────────────────────
app.use('/api', apiRouter);

// ─── 404 & Error Handlers ─────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 API server running on http://localhost:${env.PORT}`);
  logger.info(`📖 Swagger UI available at http://localhost:${env.PORT}/api/docs`);
  logger.info(`🌿 Environment: ${env.NODE_ENV}`);
});

// ─── Graceful Shutdown ────────────────────────────────
const shutdown = (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

export default app;
