import { pgTable, uuid, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const reportTypeEnum = pgEnum('report_type', ['daily_activity', 'track_details']);
export const reportFrequencyEnum = pgEnum('report_frequency', ['daily', 'weekly', 'monthly']);

export const reportTemplates = pgTable('report_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  userId: uuid('user_id'),
  name: text('name').notNull(),
  reportType: reportTypeEnum('report_type').notNull(),
  deviceId: uuid('device_id'),
  dateFrom: timestamp('date_from', { withTimezone: true }),
  dateTo: timestamp('date_to', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const autoReports = pgTable('auto_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  userId: uuid('user_id'),
  name: text('name').notNull(),
  reportType: reportTypeEnum('report_type').notNull(),
  deviceId: uuid('device_id'),
  frequency: reportFrequencyEnum('frequency').notNull(),
  executionTime: text('execution_time').notNull(),
  email: text('email').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type NewReportTemplate = typeof reportTemplates.$inferInsert;
export type AutoReport = typeof autoReports.$inferSelect;
export type NewAutoReport = typeof autoReports.$inferInsert;
