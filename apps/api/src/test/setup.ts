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

// Mock WebSocket broadcast functions — no real WS server in tests
vi.mock('../config/websocket', () => ({
  broadcastLocation: vi.fn(),
  broadcastAlert: vi.fn(),
}));
