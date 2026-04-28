import { Layers, Radio } from 'lucide-react';

export function MonitorMultiTrackPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--purple">
        <Layers size={48} />
      </div>
      <h1 className="placeholder-page__title">Multi-track</h1>
      <p className="placeholder-page__desc">
        Compare tracks from multiple devices simultaneously on a single map view.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 3
      </div>
    </div>
  );
}
