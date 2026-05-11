import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// ─── Database Connection ─────────────────────────────
const connectionString = process.env.DATABASE_URL || 'postgres://iot_admin:iot_secret@localhost:5432/iot_platform';

// For query purposes (connection pool)
const queryClient = postgres(connectionString);

// Create drizzle instance with schema
export const db = drizzle(queryClient, { schema });

export default db;
