import { Pencil, Trash2 } from 'lucide-react';
import type { Device, DeviceStatus } from '../../types/device';

interface Props {
  devices: Device[];
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
}

const STATUS_CLASS: Record<DeviceStatus, string> = {
  online:   'device-badge device-badge--green',
  offline:  'device-badge device-badge--gray',
  inactive: 'device-badge device-badge--yellow',
  expired:  'device-badge device-badge--red',
};

export function DeviceTable({ devices, onEdit, onDelete }: Props) {
  if (devices.length === 0) {
    return <div className="device-table__empty">No devices found.</div>;
  }

  return (
    <div className="device-table-wrapper">
      <table className="device-table">
        <thead>
          <tr>
            <th style={{ width: '35%' }}>Device</th>
            <th>Model</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id} className="device-table__row">
              <td className="device-table__name">
                {device.name}
                <small>{device.imei}</small>
              </td>
              <td className="device-table__model">{device.model ?? '—'}</td>
              <td>
                <span className={STATUS_CLASS[device.status]}>{device.status}</span>
              </td>
              <td>
                <div className="device-table__actions" style={{ justifyContent: 'flex-end' }}>
                  <button
                    aria-label="Edit device"
                    className="device-table__btn device-table__btn--edit"
                    onClick={() => onEdit(device)}
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    aria-label="Delete device"
                    className="device-table__btn device-table__btn--delete"
                    onClick={() => onDelete(device)}
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
