import { Video, Radio } from 'lucide-react';

export function VideoPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--purple">
        <Video size={48} />
      </div>
      <h1 className="placeholder-page__title">Video</h1>
      <p className="placeholder-page__desc">
        Live video streaming from DVR devices connected to your fleet vehicles.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 7
      </div>
    </div>
  );
}
