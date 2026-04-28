import { AlertTriangle, Radio } from 'lucide-react';

export function MonitorAlertsPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--warning">
        <AlertTriangle size={48} />
      </div>
      <h1 className="placeholder-page__title">Alerts</h1>
      <p className="placeholder-page__desc">
        View and manage device alerts including overspeed, geo-fence violations, and driving behavior.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 3
      </div>
    </div>
  );
}
