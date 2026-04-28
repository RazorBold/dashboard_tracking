import { Navigation, Radio } from 'lucide-react';

export function RoutePlanPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--emerald">
        <Navigation size={48} />
      </div>
      <h1 className="placeholder-page__title">Route Planning</h1>
      <p className="placeholder-page__desc">
        Plan optimal routes with waypoints and monitor route compliance.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 7
      </div>
    </div>
  );
}
