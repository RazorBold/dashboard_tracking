import { vi } from 'vitest';

// Mock the db module globally so no real DB connection is made
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {},
  },
  default: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Silence pino logger in tests
vi.mock('../config/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock WebSocket — no real WS server in tests
vi.mock('../config/websocket', () => ({
  initWebSocket: vi.fn(),
  broadcastLocation: vi.fn(),
  broadcastAlert: vi.fn(),
}));

// Mock RabbitMQ — no real broker in tests
vi.mock('../config/rabbitmq', () => ({
  connectRabbitMQ: vi.fn().mockResolvedValue(undefined),
  publishCommand: vi.fn().mockResolvedValue(undefined),
}));

// Mock auth middleware so route tests don't need real JWTs
// Some routes import from barrel '../middleware', others from '../middleware/auth.middleware' directly
vi.mock('../middleware/auth.middleware', () => ({
  verifyToken: (req: any, _res: any, next: any) => {
    req.user = { sub: 'test-user-id', email: 'test@example.com', role: 'admin', orgId: 'test-org-id' };
    next();
  },
  requireRole: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../middleware')>();
  return {
    ...actual,
    verifyToken: (req: any, _res: any, next: any) => {
      req.user = { sub: 'test-user-id', email: 'test@example.com', role: 'admin', orgId: 'test-org-id' };
      next();
    },
    requireRole: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
    // validate is NOT overridden — real Zod validation runs in route tests
  };
});
