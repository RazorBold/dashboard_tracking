import { ListChecks, Radio } from 'lucide-react';

export function TaskCenterPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon placeholder-page__icon--teal">
        <ListChecks size={48} />
      </div>
      <h1 className="placeholder-page__title">Task Center</h1>
      <p className="placeholder-page__desc">
        Manage report generation tasks and monitor processing status.
      </p>
      <div className="placeholder-page__badge">
        <Radio size={14} className="placeholder-page__pulse" />
        Coming in Phase 6
      </div>
    </div>
  );
}
