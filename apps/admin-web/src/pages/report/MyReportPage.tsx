import { FileBarChart, Radio } from 'lucide-react';

export function MyReportPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--teal">
        <FileBarChart size={48} />
      </div>
      <h1 className="placeholder-page__title">My Report</h1>
      <p className="placeholder-page__desc">
        Create and manage custom reports with flexible filtering and data export.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 6
      </div>
    </div>
  );
}
