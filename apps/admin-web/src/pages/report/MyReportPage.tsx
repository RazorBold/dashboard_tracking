import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Download, FileBarChart, Loader2 } from 'lucide-react';
import { useReportTemplates, downloadReportCsv } from '../../hooks/useReportTemplates';
import { useReportMutations } from '../../hooks/useReportMutations';
import { useDevices } from '../../hooks/useDevices';
import type { ReportTemplate, ReportType } from '../../types/report';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  reportType: z.enum(['daily_activity', 'track_details']),
  deviceId: z.string().optional(),
  dateFrom: z.string().min(1, 'Date From is required'),
  dateTo: z.string().min(1, 'Date To is required'),
});

type FormValues = z.infer<typeof schema>;

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  daily_activity: 'Daily Activity',
  track_details: 'Track Details',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function MyReportPage() {
  const [selected, setSelected] = useState<ReportTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: templates = [], isLoading } = useReportTemplates();
  const { create, remove } = useReportMutations();
  const { data: devicesData } = useDevices(1, 500);
  const devices = devicesData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reportType: 'daily_activity' },
  });

  const handleCreate = (values: FormValues) => {
    create.mutate(
      {
        name: values.name,
        reportType: values.reportType,
        deviceId: values.deviceId || null,
        dateFrom: values.dateFrom ? new Date(values.dateFrom).toISOString() : null,
        dateTo: values.dateTo ? new Date(values.dateTo).toISOString() : null,
      },
      {
        onSuccess: () => {
          reset();
          setCreating(false);
        },
      },
    );
  };

  const handleDownload = async (t: ReportTemplate) => {
    setDownloading(true);
    await downloadReportCsv(t.id, t.name);
    setDownloading(false);
  };

  const handleDelete = (t: ReportTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    remove.mutate(t.id, {
      onSuccess: () => {
        if (selected?.id === t.id) setSelected(null);
      },
    });
  };

  return (
    <div className="device-page">
      {/* Header */}
      <div className="device-page__header">
        <div>
          <h1 className="device-page__title">My Report</h1>
          <p className="device-page__subtitle">{templates.length} saved report{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => { setCreating(true); setSelected(null); }}
        >
          <Plus size={15} /> New Report
        </button>
      </div>

      {/* 2-panel layout */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Sidebar list */}
        <aside className="w-72 flex-shrink-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-slate-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : templates.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm p-4 text-center">
              <FileBarChart size={28} className="opacity-40" />
              <p>No saved reports yet.</p>
              <p className="text-xs">Click "New Report" to create one.</p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {templates.map((t) => (
                <li
                  key={t.id}
                  onClick={() => { setSelected(t); setCreating(false); }}
                  className={`group px-3 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${selected?.id === t.id ? 'bg-primary-50 border-l-2 border-primary-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{t.name}</p>
                      <span className="badge badge--blue text-[10px] mt-0.5">{REPORT_TYPE_LABEL[t.reportType]}</span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {fmtDate(t.dateFrom)} → {fmtDate(t.dateTo)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(t, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main panel */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white overflow-y-auto">
          {creating ? (
            <div className="p-6 max-w-lg">
              <h2 className="text-base font-semibold text-slate-800 mb-4">New Report</h2>
              <form onSubmit={handleSubmit(handleCreate)} noValidate className="flex flex-col gap-4">
                <div className="form-field">
                  <label className="form-label">Report Name <span className="text-red-500">*</span></label>
                  <input className={`form-input${errors.name ? ' form-input--error' : ''}`} placeholder="e.g. Weekly Vehicle Activity" {...register('name')} />
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
                  <label className="form-label">Device <span className="text-slate-400 font-normal">(optional — leave blank for all)</span></label>
                  <select className="form-input" {...register('deviceId')}>
                    <option value="">All Devices</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.imei})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-field">
                    <label className="form-label">Date From <span className="text-red-500">*</span></label>
                    <input type="datetime-local" className={`form-input${errors.dateFrom ? ' form-input--error' : ''}`} {...register('dateFrom')} />
                    {errors.dateFrom && <p className="form-error">{errors.dateFrom.message}</p>}
                  </div>
                  <div className="form-field">
                    <label className="form-label">Date To <span className="text-red-500">*</span></label>
                    <input type="datetime-local" className={`form-input${errors.dateTo ? ' form-input--error' : ''}`} {...register('dateTo')} />
                    {errors.dateTo && <p className="form-error">{errors.dateTo.message}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button type="button" className="btn btn--ghost" onClick={() => { setCreating(false); reset(); }}>Cancel</button>
                  <button type="submit" className="btn btn--primary" disabled={create.isPending}>
                    {create.isPending ? 'Saving…' : 'Save Report'}
                  </button>
                </div>
              </form>
            </div>
          ) : selected ? (
            <div className="p-6 max-w-lg">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">{selected.name}</h2>
                  <span className="badge badge--blue mt-1">{REPORT_TYPE_LABEL[selected.reportType]}</span>
                </div>
                <button
                  className="btn btn--primary flex items-center gap-1.5"
                  onClick={() => handleDownload(selected)}
                  disabled={downloading}
                >
                  {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {downloading ? 'Downloading…' : 'Download CSV'}
                </button>
              </div>

              <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Device</dt>
                  <dd className="text-slate-800">
                    {selected.deviceId
                      ? (devices.find((d) => d.id === selected.deviceId)?.name ?? selected.deviceId)
                      : <span className="text-slate-400 italic">All Devices</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Created</dt>
                  <dd className="text-slate-800">{fmtDate(selected.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Date From</dt>
                  <dd className="text-slate-800">{fmtDate(selected.dateFrom)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Date To</dt>
                  <dd className="text-slate-800">{fmtDate(selected.dateTo)}</dd>
                </div>
              </dl>

              <p className="text-xs text-slate-400 mt-8">
                Click "Download CSV" to generate and download the report data.
              </p>
            </div>
          ) : (
            <div className="flex-1 h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <FileBarChart size={40} className="opacity-30" />
              <p className="text-sm">Select a report from the list, or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
