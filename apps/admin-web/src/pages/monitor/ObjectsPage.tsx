import { LayoutGrid, Radio } from 'lucide-react';

export function MonitorObjectsPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon">
        <LayoutGrid size={48} />
      </div>
      <h1 className="placeholder-page__title">Objects</h1>
      <p className="placeholder-page__desc">
        Real-time monitoring of all tracked devices and vehicles on the map.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 2
      </div>
    </div>
  );
}
