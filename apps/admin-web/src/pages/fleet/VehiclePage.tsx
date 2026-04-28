import { Car, Radio } from 'lucide-react';

export function VehiclePage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--emerald">
        <Car size={48} />
      </div>
      <h1 className="placeholder-page__title">Vehicle Management</h1>
      <p className="placeholder-page__desc">
        Manage vehicle records, device bindings, speed limits, and insurance status.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 5
      </div>
    </div>
  );
}
