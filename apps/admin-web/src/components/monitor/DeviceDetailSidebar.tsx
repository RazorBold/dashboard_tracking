import { useState } from 'react';
import { X, Loader2, MapPin, Zap } from 'lucide-react';
import type { Device, DeviceStatus } from '../../types/device';

interface Props {
  device: Device | undefined;
  onClose: () => void;
  address?: string;
  addressLoading?: boolean;
}

type CoordFormat = 'decimal' | 'dms';
type Tab = 'live' | 'device';

const STATUS_CLASS: Record<DeviceStatus, string> = {
  online: 'detail-badge detail-badge--green',
  offline: 'detail-badge detail-badge--gray',
  inactive: 'detail-badge detail-badge--yellow',
  expired: 'detail-badge detail-badge--red',
};

function toDMS(deg: number, isLat: boolean): string {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d) * 60 - m) * 60;
  const dir = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
  return `${d}° ${m}' ${s.toFixed(2)}" ${dir}`;
}

export function DeviceDetailSidebar({ device, onClose, address, addressLoading }: Props) {
  const [coordFormat, setCoordFormat] = useState<CoordFormat>('decimal');
  const [activeTab, setActiveTab] = useState<Tab>('live');

  if (!device) return null;

  const hasLocation = device.lat != null && device.lng != null;

  return (
    <div className="detail-sidebar" role="complementary" aria-label="Device detail">
      {/* Header */}
      <div className="detail-sidebar__header">
        <div className="detail-sidebar__title-group">
          <h2 className="detail-sidebar__name">{device.name}</h2>
          <span className="detail-sidebar__imei">{device.imei}</span>
          {device.model && (
            <span className="detail-sidebar__model">{device.model}</span>
          )}
        </div>
        <button
          aria-label="Close sidebar"
          className="detail-sidebar__close"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      {/* Status */}
      <div className="detail-sidebar__section">
        <span className={STATUS_CLASS[device.status]}>{device.status}</span>
      </div>

      {/* Tab bar */}
      <div className="detail-sidebar__tabs">
        {(['live', 'device'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`detail-sidebar__tab${activeTab === tab ? ' detail-sidebar__tab--active' : ''}`}
            aria-label={tab.charAt(0).toUpperCase() + tab.slice(1)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="detail-sidebar__body">
        {activeTab === 'live' && (
          <>
            {/* Address */}
            <div className="detail-sidebar__row">
              <MapPin size={14} className="detail-sidebar__icon" />
              <div className="detail-sidebar__row-content">
                <span className="detail-sidebar__label">Address</span>
                {addressLoading ? (
                  <span className="detail-sidebar__loading">
                    <Loader2 size={12} className="animate-spin" />
                    Loading address…
                  </span>
                ) : address ? (
                  <span className="detail-sidebar__value">{address}</span>
                ) : (
                  <span className="detail-sidebar__muted">—</span>
                )}
              </div>
            </div>

            {/* Coordinates */}
            {hasLocation ? (
              <div className="detail-sidebar__row">
                <MapPin size={14} className="detail-sidebar__icon" />
                <div className="detail-sidebar__row-content" data-testid="coordinates">
                  <div className="detail-sidebar__label-row">
                    <span className="detail-sidebar__label">Coordinates</span>
                    {coordFormat === 'decimal' ? (
                      <button
                        className="detail-sidebar__fmt-btn"
                        aria-label="DMS format"
                        onClick={() => setCoordFormat('dms')}
                      >
                        DMS
                      </button>
                    ) : (
                      <button
                        className="detail-sidebar__fmt-btn"
                        aria-label="Decimal format"
                        onClick={() => setCoordFormat('decimal')}
                      >
                        Decimal
                      </button>
                    )}
                  </div>
                  {coordFormat === 'decimal' ? (
                    <div className="detail-sidebar__coords">
                      <span>{device.lat}</span>
                      <span>{device.lng}</span>
                    </div>
                  ) : (
                    <div className="detail-sidebar__coords">
                      <span>{toDMS(device.lat!, true)}</span>
                      <span>{toDMS(device.lng!, false)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="detail-sidebar__no-location">
                <MapPin size={14} />
                No location data available
              </div>
            )}

            {/* Speed */}
            <div className="detail-sidebar__row">
              <Zap size={14} className="detail-sidebar__icon" />
              <div className="detail-sidebar__row-content">
                <span className="detail-sidebar__label">Speed</span>
                <span className="detail-sidebar__value">
                  {device.speed ?? 0} km/h
                </span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'device' && (
          <>
            <div className="detail-sidebar__info-grid">
              <div className="detail-sidebar__info-item">
                <span className="detail-sidebar__label">Name</span>
                <span className="detail-sidebar__value">{device.name}</span>
              </div>
              <div className="detail-sidebar__info-item">
                <span className="detail-sidebar__label">IMEI</span>
                <span className="detail-sidebar__value detail-sidebar__value--mono">
                  {device.imei}
                </span>
              </div>
              <div className="detail-sidebar__info-item">
                <span className="detail-sidebar__label">Model</span>
                <span className="detail-sidebar__value">{device.model ?? '—'}</span>
              </div>
              <div className="detail-sidebar__info-item">
                <span className="detail-sidebar__label">Status</span>
                <span className={STATUS_CLASS[device.status]}>{device.status}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
