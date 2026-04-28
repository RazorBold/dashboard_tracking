import { BarChart3, Radio } from 'lucide-react';

export function ReportOverviewPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--teal">
        <BarChart3 size={48} />
      </div>
      <h1 className="placeholder-page__title">Report Overview</h1>
      <p className="placeholder-page__desc">
        Overview of device status, motion statistics, and alert summaries across your fleet.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 6
      </div>
    </div>
  );
}
