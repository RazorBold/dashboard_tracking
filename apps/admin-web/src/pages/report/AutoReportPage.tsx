import { CalendarClock, Radio } from 'lucide-react';

export function AutoReportPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--teal">
        <CalendarClock size={48} />
      </div>
      <h1 className="placeholder-page__title">Auto Report</h1>
      <p className="placeholder-page__desc">
        Schedule automated reports with custom frequency and email delivery.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 6
      </div>
    </div>
  );
}
