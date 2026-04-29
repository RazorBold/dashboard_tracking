import { useState, useEffect } from 'react';
import { Search, Route, Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import type { Device } from '../../types/device';
import type { TripSummary } from '../../types/track';

interface Props {
  devices: Device[];
  isLoading: boolean;
  selectedDeviceId: string | null;
  from: string;
  to: string;
  summary: TripSummary | null;
  trackLoading: boolean;
  onDeviceChange: (id: string | null) => void;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onSearch: () => void;
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function TracksFilterPanel({
  devices, isLoading, selectedDeviceId, from, to,
  summary, trackLoading, onDeviceChange, onFromChange, onToChange, onSearch,
}: Props) {
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  const filtered = devices.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.imei.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = () => setDropdownOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [dropdownOpen]);

  return (
    <div className="tracks-filter flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden">

      {/* Scrollable top section: inputs */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-4">

        {/* Title */}
        <div className="flex items-center gap-2">
          <Route size={18} className="text-primary-500" />
          <span className="font-semibold text-slate-800 text-sm">Tracks</span>
        </div>

        {/* Device Selector */}
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Device</label>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setDropdownOpen((o) => !o); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:outline-none focus:border-primary-400 transition"
            >
              <span className={selectedDevice ? 'text-slate-800 truncate' : 'text-slate-400'}>
                {isLoading ? 'Loading…' : selectedDevice?.name ?? 'Select a device…'}
              </span>
              <ChevronDown size={12} className={`text-slate-400 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-hidden flex flex-col"
              >
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-6 pr-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-primary-400"
                    />
                  </div>
                </div>
                <ul className="overflow-y-auto flex-1">
                  {filtered.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => { onDeviceChange(d.id); setDropdownOpen(false); setSearch(''); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${d.id === selectedDeviceId ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-700'}`}
                      >
                        <div className="font-medium truncate">{d.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{d.imei}</div>
                      </button>
                    </li>
                  ))}
                  {filtered.length === 0 && (
                    <li className="px-3 py-4 text-xs text-slate-400 text-center">No devices found</li>
                  )}
                </ul>
              </div>
            )}
          </div>
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

        {/* Trip Summary */}
        {summary && summary.totalPoints >= 2 && (
          <div>
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Trip Summary</h4>
            <div className="grid grid-cols-2 gap-2">
              <SummaryCard label="Distance"  value={`${summary.totalDistanceKm} km`} />
              <SummaryCard label="Duration"  value={fmtDuration(summary.durationMinutes)} />
              <SummaryCard label="Max Speed" value={`${summary.maxSpeedKmh} km/h`} />
              <SummaryCard label="Avg Speed" value={`${summary.avgSpeedKmh} km/h`} />
              <SummaryCard label="Stopped"   value={fmtDuration(summary.stoppedMinutes)} />
              <SummaryCard label="Points"    value={`${summary.totalPoints}`} />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Show Track button — always visible at the bottom */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-100 bg-white">
        <button
          onClick={onSearch}
          disabled={!selectedDeviceId || !from || !to || trackLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        >
          {trackLoading
            ? <><RefreshCw size={14} className="animate-spin" /> Loading…</>
            : <><Route size={14} /> Show Track</>}
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
      <div className="text-[9px] text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-xs font-semibold text-slate-700 mt-0.5">{value}</div>
    </div>
  );
}
