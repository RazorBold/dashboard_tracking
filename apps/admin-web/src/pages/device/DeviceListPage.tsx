import { Cpu, Radio } from 'lucide-react';

export function DeviceListPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--cyan">
        <Cpu size={48} />
      </div>
      <h1 className="placeholder-page__title">Device List</h1>
      <p className="placeholder-page__desc">
        Manage GPS/IoT devices — import, configure, send commands, and monitor status.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 4
      </div>
    </div>
  );
}
