import { Users, Radio } from 'lucide-react';

export function DriverPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--emerald">
        <Users size={48} />
      </div>
      <h1 className="placeholder-page__title">Driver Management</h1>
      <p className="placeholder-page__desc">
        Manage driver records, licenses, RFID assignments, and fleet associations.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 5
      </div>
    </div>
  );
}
