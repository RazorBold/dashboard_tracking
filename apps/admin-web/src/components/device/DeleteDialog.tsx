import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  deviceName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteDialog({ open, deviceName, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal modal--sm">
        <div className="modal__icon modal__icon--danger">
          <AlertTriangle size={28} />
        </div>
        <h2 className="modal__title">Delete Device</h2>
        <p className="modal__desc">
          Are you sure you want to delete <strong>{deviceName}</strong>? This action cannot be
          undone.
        </p>
        <div className="modal__footer modal__footer--center">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn--danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
