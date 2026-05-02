import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Calendar, Loader2, Mail } from 'lucide-react';
import { useAutoReports } from '../../hooks/useAutoReports';
import { useAutoReportMutations } from '../../hooks/useAutoReportMutations';
import { useDevices } from '../../hooks/useDevices';
import type { AutoReport, ReportType, ReportFrequency } from '../../types/report';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  reportType: z.enum(['daily_activity', 'track_details']),
  deviceId: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  executionTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  email: z.string().email('Invalid email'),
});

type FormValues = z.infer<typeof schema>;

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  daily_activity: 'Daily Activity',
  track_details: 'Track Details',
};

const REPORT_BADGE: Record<ReportType, string> = {
  daily_activity: 'badge--green',
  track_details: 'badge--blue',
};

const FREQ_BADGE: Record<ReportFrequency, string> = {
  daily: 'badge--blue',
  weekly: 'badge--yellow',
  monthly: 'badge--purple',
};

export function AutoReportPage() {
  const [creating, setCreating] = useState(false);

  const { data: reports = [], isLoading } = useAutoReports();
  const { create, toggle, remove } = useAutoReportMutations();
  const { data: devicesData } = useDevices(1, 500);
  const devices = devicesData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reportType: 'daily_activity', frequency: 'daily', executionTime: '08:00' },
  });

  const handleCreate = (values: FormValues) => {
    create.mutate(
      {
        name: values.name,
        reportType: values.reportType,
        deviceId: values.deviceId || null,
        frequency: values.frequency,
        executionTime: values.executionTime,
        email: values.email,
      },
      {
        onSuccess: () => {
          reset();
          setCreating(false);
        },
      },
    );
  };

  return (
    <div className="device-page">
      <div className="device-page__header">
        <div>
          <h1 className="device-page__title">Auto Report</h1>
          <p className="device-page__subtitle">{reports.length} scheduled report{reports.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setCreating(true)}>
          <Plus size={15} /> New Schedule
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Report list */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-12">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : reports.length === 0 && !creating ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
              <Calendar size={40} className="opacity-30" />
              <p className="text-sm">No scheduled reports yet.</p>
              <p className="text-xs">Click "New Schedule" to set one up.</p>
            </div>
          ) : (
            reports.map((r) => (
              <AutoReportCard
                key={r.id}
                report={r}
                devices={devices}
                reportTypeBadge={REPORT_BADGE[r.reportType]}
                reportTypeLabel={REPORT_TYPE_LABEL[r.reportType]}
                freqBadge={FREQ_BADGE[r.frequency]}
                onToggle={() => toggle.mutate(r.id)}
                onDelete={() => remove.mutate(r.id)}
              />
            ))
          )}
        </div>

        {/* Create form panel */}
        {creating && (
          <aside className="w-80 flex-shrink-0 rounded-xl border border-slate-200 bg-white overflow-y-auto">
            <div className="p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">New Schedule</h2>
              <form onSubmit={handleSubmit(handleCreate)} noValidate className="flex flex-col gap-3">
                <div className="form-field">
                  <label className="form-label">Report Name <span className="text-red-500">*</span></label>
                  <input
                    className={`form-input${errors.name ? ' form-input--error' : ''}`}
                    placeholder="e.g. Monthly Fleet Summary"
                    {...register('name')}
                  />
                  {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>

                <div className="form-field">
                  <label className="form-label">Report Type <span className="text-red-500">*</span></label>
                  <select className="form-input" {...register('reportType')}>
                    <option value="daily_activity">Daily Activity</option>
                    <option value="track_details">Track Details</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Device <span className="text-slate-400 font-normal">(optional)</span></label>
                  <select className="form-input" {...register('deviceId')}>
                    <option value="">All Devices</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.imei})</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Frequency <span className="text-red-500">*</span></label>
                  <select className="form-input" {...register('frequency')}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Execution Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    className={`form-input${errors.executionTime ? ' form-input--error' : ''}`}
                    {...register('executionTime')}
                  />
                  {errors.executionTime && <p className="form-error">{errors.executionTime.message}</p>}
                </div>

                <div className="form-field">
                  <label className="form-label">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    className={`form-input${errors.email ? ' form-input--error' : ''}`}
                    placeholder="report@example.com"
                    {...register('email')}
                  />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>

                <div className="mt-1 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  Email delivery is in stub mode — schedules are saved but emails will not be sent until the email service is configured.
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    className="btn btn--ghost flex-1"
                    onClick={() => { setCreating(false); reset(); }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary flex-1" disabled={create.isPending}>
                    {create.isPending ? 'Saving…' : 'Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

interface CardProps {
  report: AutoReport;
  devices: { id: string; name: string; imei: string }[];
  reportTypeBadge: string;
  reportTypeLabel: string;
  freqBadge: string;
  onToggle: () => void;
  onDelete: () => void;
}

function AutoReportCard({ report, devices, reportTypeBadge, reportTypeLabel, freqBadge, onToggle, onDelete }: CardProps) {
  const deviceName = report.deviceId
    ? (devices.find((d) => d.id === report.deviceId)?.name ?? report.deviceId)
    : 'All Devices';

  return (
    <div className={`rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-4 transition-opacity ${report.isActive ? '' : 'opacity-60'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="text-sm font-semibold text-slate-800">{report.name}</p>
          <span className={`badge ${reportTypeBadge}`}>{reportTypeLabel}</span>
          <span className={`badge ${freqBadge} capitalize`}>{report.frequency}</span>
          {!report.isActive && <span className="badge badge--gray text-[10px]">Paused</span>}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          <span>Device: {deviceName}</span>
          <span>Time: {report.executionTime}</span>
          <span className="flex items-center gap-1"><Mail size={10} />{report.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onToggle}
          title={report.isActive ? 'Pause' : 'Resume'}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${report.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${report.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
