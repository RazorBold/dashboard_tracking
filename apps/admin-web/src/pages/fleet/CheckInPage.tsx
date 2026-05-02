import { MapPin, Radio } from 'lucide-react';

export function CheckInPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--emerald">
        <MapPin size={48} />
      </div>
      <h1 className="placeholder-page__title">Check-in</h1>
      <p className="placeholder-page__desc">
        Manage check-in points and monitor driver attendance at designated locations.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 7
      </div>
    </div>
  );
}
