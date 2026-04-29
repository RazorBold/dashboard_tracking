import { Router } from 'express';
import { authRouter } from './auth.routes';
import { deviceRouter } from './device.routes';
import { vehicleRouter } from './vehicle.routes';
import { deviceGroupRouter } from './device-group.routes';
import alertRouter from './alert.routes';

export const apiRouter = Router();

// ─── Mount sub-routers ────────────────────────────────
apiRouter.use('/auth', authRouter);
apiRouter.use('/devices', deviceRouter);
apiRouter.use('/vehicles', vehicleRouter);
apiRouter.use('/device-groups', deviceGroupRouter);
apiRouter.use('/alerts', alertRouter);

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, message: 'IoT Platform API is running 🚀', timestamp: new Date() });
});
