import { useState } from 'react';
import {
  X, Loader2, MapPin, Activity, Battery, Satellite, Signal,
  Calendar, Car, Hash, User, Phone, Shield, Navigation, Play,
  Terminal, Settings, Share2
} from 'lucide-react';
import type { Device, DeviceStatus } from '../../types/device';
import { DeviceCommandPanel } from './DeviceCommandPanel';

interface Props {
  device: Device | undefined;
  onClose: () => void;
  address?: string;
  addressLoading?: boolean;
}

type CoordFormat = 'decimal' | 'dms';
type Tab = 'live' | 'tracks' | 'device' | 'command' | 'configure' | 'share';

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
  
  // Compute descriptive status
  let descriptiveStatus = device.status.charAt(0).toUpperCase() + device.status.slice(1);
  if (device.status === 'online') {
    if (device.accStatus) {
      descriptiveStatus = `Moving (${device.speed ?? 0} km/h)`;
    } else {
      descriptiveStatus = `Parked (ACC: OFF) ${device.parkedDuration ? `- ${device.parkedDuration}` : ''}`;
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'live', label: 'Live', icon: <Navigation size={14} /> },
    { id: 'tracks', label: 'Tracks', icon: <Play size={14} /> },
    { id: 'device', label: 'Device', icon: <Car size={14} /> },
    { id: 'command', label: 'Command', icon: <Terminal size={14} /> },
    { id: 'configure', label: 'Configure', icon: <Settings size={14} /> },
    { id: 'share', label: 'Share', icon: <Share2 size={14} /> },
  ];

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
      <div className="detail-sidebar__section detail-sidebar__section--padded">
        <span className={STATUS_CLASS[device.status]}>{descriptiveStatus}</span>
      </div>

      {/* Tab bar */}
      <div className="detail-sidebar__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`detail-sidebar__tab${activeTab === tab.id ? ' detail-sidebar__tab--active' : ''}`}
            aria-label={tab.label}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="detail-sidebar__body">
        {activeTab === 'live' && (
          <div className="detail-sidebar__live-tab">
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
                <MapPin size={14} className="detail-sidebar__icon detail-sidebar__icon--blue" />
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

            {/* Last Update */}
            {device.lastOnline && (
              <div className="detail-sidebar__row">
                <Calendar size={14} className="detail-sidebar__icon" />
                <div className="detail-sidebar__row-content">
                  <span className="detail-sidebar__label">Last Update</span>
                  <span className="detail-sidebar__value">
                    {new Date(device.lastOnline).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Today's Activity Grid */}
            <div className="detail-sidebar__grid-section">
              <h3 className="detail-sidebar__section-title">Today's Activity</h3>
              <div className="detail-sidebar__grid">
                <div className="detail-sidebar__grid-card">
                  <Activity size={16} className="detail-sidebar__grid-icon" />
                  <div>
                    <span className="detail-sidebar__grid-label">Mileage</span>
                    <span className="detail-sidebar__grid-value">{device.todayMileage ?? 0} km</span>
                  </div>
                </div>
                <div className="detail-sidebar__grid-card">
                  <Battery size={16} className="detail-sidebar__grid-icon" />
                  <div>
                    <span className="detail-sidebar__grid-label">Battery</span>
                    <span className="detail-sidebar__grid-value">
                      {device.batteryVoltage ?? '—'}
                      {device.batteryLevel != null ? ` (${device.batteryLevel}%)` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'device' && (
          <div className="detail-sidebar__device-tab">
            {/* Device Info */}
            <div className="detail-sidebar__info-section">
              <h3 className="detail-sidebar__section-title">Telemetry & Network</h3>
              <div className="detail-sidebar__info-grid">
                <div className="detail-sidebar__info-item">
                  <span className="detail-sidebar__label"><Satellite size={12} /> GNSS Type</span>
                  <span className="detail-sidebar__value">{device.gnssType ?? '—'}</span>
                </div>
                <div className="detail-sidebar__info-item">
                  <span className="detail-sidebar__label"><MapPin size={12} /> Satellites</span>
                  <span className="detail-sidebar__value">{device.satellites ?? 0}</span>
                </div>
                <div className="detail-sidebar__info-item">
                  <span className="detail-sidebar__label"><Signal size={12} /> GSM Signal</span>
                  <span className="detail-sidebar__value">{device.gsmSignalLabel ?? '—'}</span>
                </div>
                <div className="detail-sidebar__info-item">
                  <span className="detail-sidebar__label"><Calendar size={12} /> Last Online</span>
                  <span className="detail-sidebar__value">
                    {device.lastOnline
                      ? new Date(device.lastOnline).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : '—'}
                  </span>
                </div>
                <div className="detail-sidebar__info-item">
                  <span className="detail-sidebar__label"><Calendar size={12} /> Last GPS Fix</span>
                  <span className="detail-sidebar__value">
                    {device.positionTimestamp
                      ? new Date(device.positionTimestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="detail-sidebar__info-section">
              <h3 className="detail-sidebar__section-title">Linked Vehicle</h3>
              {device.vehicle ? (
                <div className="detail-sidebar__info-grid">
                  <div className="detail-sidebar__info-item detail-sidebar__info-item--full">
                    <span className="detail-sidebar__label"><Car size={12} /> License Plate</span>
                    <span className="detail-sidebar__value detail-sidebar__value--lg">{device.vehicle.plateNo}</span>
                  </div>
                  <div className="detail-sidebar__info-item">
                    <span className="detail-sidebar__label"><Hash size={12} /> Make & Model</span>
                    <span className="detail-sidebar__value">{device.vehicle.make} {device.vehicle.model}</span>
                  </div>
                  <div className="detail-sidebar__info-item">
                    <span className="detail-sidebar__label"><Shield size={12} /> VIN</span>
                    <span className="detail-sidebar__value detail-sidebar__value--mono">{device.vehicle.vin}</span>
                  </div>
                  <div className="detail-sidebar__info-item">
                    <span className="detail-sidebar__label"><User size={12} /> Owner</span>
                    <span className="detail-sidebar__value">{device.vehicle.ownerName}</span>
                  </div>
                  <div className="detail-sidebar__info-item">
                    <span className="detail-sidebar__label"><Phone size={12} /> Phone</span>
                    <span className="detail-sidebar__value">{device.vehicle.phone}</span>
                  </div>
                </div>
              ) : (
                <div className="detail-sidebar__muted detail-sidebar__muted--box">
                  No vehicle linked to this device.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'command' && (
          <DeviceCommandPanel deviceId={device.id} />
        )}

        {(['tracks', 'configure', 'share'] as Tab[]).includes(activeTab) && (
          <div className="detail-sidebar__placeholder">
            <div className="detail-sidebar__placeholder-icon">
              {TABS.find(t => t.id === activeTab)?.icon}
            </div>
            <h3>{TABS.find(t => t.id === activeTab)?.label} Module</h3>
            <p>This module will be implemented in subsequent phases.</p>
          </div>
        )}
      </div>
    </div>
  );
}
