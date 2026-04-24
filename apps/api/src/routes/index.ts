import { Router } from 'express';
import { authRouter } from './auth.routes';

export const apiRouter = Router();

// ─── Mount sub-routers ────────────────────────────────
apiRouter.use('/auth', authRouter);

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, message: 'IoT Platform API is running 🚀', timestamp: new Date() });
});
