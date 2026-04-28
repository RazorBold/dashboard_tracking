import { Route, Radio } from 'lucide-react';

export function MonitorTracksPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--info">
        <Route size={48} />
      </div>
      <h1 className="placeholder-page__title">Tracks</h1>
      <p className="placeholder-page__desc">
        History playback of device tracks with speed visualization and trip summaries.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 3
      </div>
    </div>
  );
}
