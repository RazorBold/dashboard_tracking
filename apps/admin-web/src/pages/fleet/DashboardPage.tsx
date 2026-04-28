import { LayoutDashboard, Radio } from 'lucide-react';

export function FleetDashboardPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--emerald">
        <LayoutDashboard size={48} />
      </div>
      <h1 className="placeholder-page__title">Fleet Dashboard</h1>
      <p className="placeholder-page__desc">
        Overview statistics of your fleet — drivers, vehicles, mileage, fuel consumption, and alerts.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 5
      </div>
    </div>
  );
}
