export type ReportType = 'daily_activity' | 'track_details';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

export interface ReportTemplate {
  id: string;
  organizationId: string | null;
  userId: string | null;
  name: string;
  reportType: ReportType;
  deviceId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  createdAt: string;
}

export interface ReportTemplateFormValues {
  name: string;
  reportType: ReportType;
  deviceId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface AutoReport {
  id: string;
  organizationId: string | null;
  userId: string | null;
  name: string;
  reportType: ReportType;
  deviceId: string | null;
  frequency: ReportFrequency;
  executionTime: string;
  email: string;
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
}

export interface AutoReportFormValues {
  name: string;
  reportType: ReportType;
  deviceId?: string | null;
  frequency: ReportFrequency;
  executionTime: string;
  email: string;
}
