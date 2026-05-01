import { useState } from 'react';
import { Layers, Calendar, Search, RefreshCw, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
import type { Device } from '../../types/device';
import type { DeviceTrack } from '../../hooks/useMultiTracks';
import { TRACK_COLORS } from './MultiTrackMapView';

interface Props {
  devices: Device[];
  devicesLoading: boolean;
  selectedIds: string[];
  from: string;
  to: string;
  tracks: DeviceTrack[];
  anyLoading: boolean;
  visibleIds: Set<string>;
  minSatellites: number;
  onToggleDevice: (id: string) => void;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onSearch: () => void;
  onToggleVisible: (id: string) => void;
  onMinSatellitesChange: (v: number) => void;
}

export function MultiTrackFilterPanel({
  devices, devicesLoading, selectedIds, from, to, tracks, anyLoading,
  visibleIds, minSatellites,
  onToggleDevice, onFromChange, onToChange, onSearch, onToggleVisible, onMinSatellitesChange,
}: Props) {
  const [search, setSearch] = useState('');

  const filteredDevices = devices.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.imei.toLowerCase().includes(q);
  });

  const canSearch = selectedIds.length > 0 && !!from && !!to && !anyLoading;

  const loadedTracks = tracks.filter((t) => t.positions.length > 0);
  const totalDistance = loadedTracks.reduce((sum, t) => sum + (t.summary?.totalDistanceKm ?? 0), 0);
  const totalPoints = loadedTracks.reduce((sum, t) => sum + t.positions.length, 0);

  return (
    <div className="flex flex-col flex-1 bg-white border-r border-slate-200 overflow-hidden">

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-5">

        {/* Title */}
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-primary-500" />
          <span className="font-semibold text-slate-800 text-sm">Multi-track</span>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Date Range</label>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={11} className="text-slate-400" />
              <span className="text-[10px] text-slate-500">From</span>
            </div>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-primary-400 focus:outline-none transition"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={11} className="text-slate-400" />
              <span className="text-[10px] text-slate-500">To</span>
            </div>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => onToChange(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-primary-400 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Accuracy Filter */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Min Satellites</label>
            <span className="text-[11px] font-semibold text-slate-600">{minSatellites === 0 ? 'Off' : `≥ ${minSatellites}`}</span>
          </div>
          <input
            type="range"
            min={0}
            max={12}
            value={minSatellites}
            onChange={(e) => onMinSatellitesChange(Number(e.target.value))}
            className="w-full h-1.5 accent-primary-500"
          />
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>Off</span><span>4</span><span>8</span><span>12</span>
          </div>
        </div>

        {/* Device List */}
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-2">
            Devices
            {selectedIds.length > 0 && (
              <span className="ml-1.5 bg-primary-100 text-primary-700 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                {selectedIds.length}
              </span>
            )}
          </label>

          <div className="relative mb-2">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search devices…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-primary-400 focus:outline-none transition"
            />
          </div>

          {devicesLoading ? (
            <div className="text-xs text-slate-400 py-4 text-center">Loading devices…</div>
          ) : (
            <ul className="space-y-0.5 max-h-52 overflow-y-auto">
              {filteredDevices.map((d) => {
                const checked = selectedIds.includes(d.id);
                const colorIdx = devices.findIndex((dev) => dev.id === d.id) % TRACK_COLORS.length;
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => onToggleDevice(d.id)}
                      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors ${
                        checked ? 'bg-primary-50 border border-primary-200' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      {checked
                        ? <CheckSquare size={14} className="text-primary-600 flex-shrink-0" />
                        : <Square size={14} className="text-slate-300 flex-shrink-0" />}
                      {checked && (
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: TRACK_COLORS[colorIdx] }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-700 truncate">{d.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{d.imei}</div>
                      </div>
                    </button>
                  </li>
                );
              })}
              {filteredDevices.length === 0 && (
                <li className="text-xs text-slate-400 py-4 text-center">No devices found</li>
              )}
            </ul>
          )}
        </div>

        {/* Loaded track legend */}
        {loadedTracks.length > 0 && (
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-2">Tracks</label>
            <ul className="space-y-1">
              {tracks.map((track) => {
                if (track.positions.length === 0 && !track.isLoading) return null;
                const device = devices.find((d) => d.id === track.deviceId);
                const colorIdx = devices.findIndex((d) => d.id === track.deviceId) % TRACK_COLORS.length;
                const color = TRACK_COLORS[colorIdx];
                const visible = visibleIds.has(track.deviceId);

                return (
                  <li
                    key={track.deviceId}
                    className="flex items-start gap-2 px-2 py-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 truncate">
                        {device?.name ?? track.deviceId}
                      </div>
                      {track.isLoading ? (
                        <div className="text-[10px] text-slate-400">Loading…</div>
                      ) : track.summary ? (
                        <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                          <span>{track.summary.totalDistanceKm} km</span>
                          <span className="mx-1">·</span>
                          <span>{track.summary.avgSpeedKmh} km/h avg</span>
                          <span className="mx-1">·</span>
                          <span>{track.positions.length} pts</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">No data</div>
                      )}
                    </div>
                    <button
                      onClick={() => onToggleVisible(track.deviceId)}
                      className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                      title={visible ? 'Hide track' : 'Show track'}
                    >
                      {visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Combined summary */}
            {loadedTracks.length > 1 && (
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <div className="bg-primary-50 rounded-lg p-2 border border-primary-100 col-span-2">
                  <div className="text-[9px] text-primary-400 uppercase tracking-wide">Total Combined</div>
                  <div className="text-xs font-semibold text-primary-700 mt-0.5">
                    {totalDistance.toFixed(1)} km · {totalPoints} pts · {loadedTracks.length} devices
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Show Tracks button */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-100 bg-white">
        <button
          onClick={onSearch}
          disabled={!canSearch}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        >
          {anyLoading
            ? <><RefreshCw size={14} className="animate-spin" /> Loading…</>
            : <><Layers size={14} /> Show Tracks ({selectedIds.length})</>}
        </button>
      </div>
    </div>
  );
}
