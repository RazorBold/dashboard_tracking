import { Router } from 'express';
import { authRouter } from './auth.routes';
import { deviceRouter } from './device.routes';
import { vehicleRouter } from './vehicle.routes';
import { deviceGroupRouter } from './device-group.routes';
import alertRouter from './alert.routes';
import { usersRouter } from './users.routes';
import { driverRouter } from './driver.routes';
import { reportTemplatesRouter } from './report-templates.routes';
import { autoReportsRouter } from './auto-reports.routes';

export const apiRouter = Router();

// ─── Mount sub-routers ────────────────────────────────
apiRouter.use('/auth', authRouter);
apiRouter.use('/devices', deviceRouter);
apiRouter.use('/vehicles', vehicleRouter);
apiRouter.use('/device-groups', deviceGroupRouter);
apiRouter.use('/alerts', alertRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/drivers', driverRouter);
apiRouter.use('/report-templates', reportTemplatesRouter);
apiRouter.use('/auto-reports', autoReportsRouter);

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, message: 'IoT Platform API is running 🚀', timestamp: new Date() });
});
