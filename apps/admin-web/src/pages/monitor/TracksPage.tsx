import { useState, useEffect, useRef, useCallback } from 'react';
import { TracksFilterPanel } from '../../components/monitor/TracksFilterPanel';
import { TrackMapView } from '../../components/monitor/TrackMapView';
import { PlaybackControls, type PlaybackSpeed } from '../../components/monitor/PlaybackControls';
import { useDevices } from '../../hooks/useDevices';
import { useTracks, computeTripSummary } from '../../hooks/useTracks';
import type { TripSummary } from '../../types/track';

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MonitorTracksPage() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [fromInput, setFromInput] = useState(toDatetimeLocal(yesterday));
  const [toInput, setToInput] = useState(toDatetimeLocal(now));
  // Committed query params (only update on "Show Track" click)
  const [queryParams, setQueryParams] = useState<{ deviceId: string | null; from: string | null; to: string | null }>({
    deviceId: null, from: null, to: null,
  });

  // Playback state
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: devicesData, isLoading: devicesLoading } = useDevices(1, 100);
  const devices = devicesData?.data ?? [];

  const { data: trackData, isFetching: trackLoading } = useTracks({
    deviceId: queryParams.deviceId,
    from: queryParams.from ? new Date(queryParams.from).toISOString() : null,
    to: queryParams.to ? new Date(queryParams.to).toISOString() : null,
  });

  const positions = trackData?.data ?? [];
  const [summary, setSummary] = useState<TripSummary | null>(null);

  // Recompute summary + reset playback when track data arrives
  useEffect(() => {
    if (positions.length > 0) {
      setSummary(computeTripSummary(positions));
      setPlaybackIndex(0);
      setIsPlaying(false);
    } else {
      setSummary(null);
    }
  }, [positions]);

  // Playback ticker
  const stepForward = useCallback(() => {
    setPlaybackIndex((prev) => {
      if (prev >= positions.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [positions.length]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlaying && positions.length > 0) {
      // Base interval: 300ms, divided by speed multiplier
      intervalRef.current = setInterval(stepForward, Math.round(300 / playbackSpeed));
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed, stepForward, positions.length]);

  const handleSearch = () => {
    setQueryParams({
      deviceId: selectedDeviceId,
      from: fromInput,
      to: toInput,
    });
    setIsPlaying(false);
    setPlaybackIndex(0);
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden" style={{ margin: '-24px' }}>
      {/* Left panel — filter + summary */}
      <aside className="w-72 flex-shrink-0 flex flex-col h-full overflow-y-auto">
        <TracksFilterPanel
          devices={devices}
          isLoading={devicesLoading}
          selectedDeviceId={selectedDeviceId}
          from={fromInput}
          to={toInput}
          summary={summary}
          trackLoading={trackLoading}
          onDeviceChange={setSelectedDeviceId}
          onFromChange={setFromInput}
          onToChange={setToInput}
          onSearch={handleSearch}
        />
      </aside>

      {/* Main — map + playback controls */}
      <main className="flex-1 relative overflow-hidden">
        <TrackMapView
          positions={positions}
          playbackIndex={positions.length >= 2 ? playbackIndex : null}
        />

        {positions.length >= 2 && (
          <PlaybackControls
            positions={positions}
            currentIndex={playbackIndex}
            isPlaying={isPlaying}
            speed={playbackSpeed}
            onPlay={() => {
              if (playbackIndex >= positions.length - 1) setPlaybackIndex(0);
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
            onSeek={(i) => { setPlaybackIndex(i); setIsPlaying(false); }}
            onSpeedChange={setPlaybackSpeed}
          />
        )}

        {/* Empty / insufficient data overlay */}
        {!trackLoading && positions.length < 2 && queryParams.deviceId && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 rounded-2xl px-8 py-6 text-center shadow-xl border border-slate-200 max-w-xs">
              <div className="text-4xl mb-3">{positions.length === 0 ? '🗺️' : '📍'}</div>
              <p className="font-semibold text-slate-700 text-sm">
                {positions.length === 0 ? 'No track data found' : 'Not enough data to play track'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {positions.length === 0
                  ? 'Try a different date range, or run pnpm db:seed to load history data'
                  : `Only ${positions.length} position found — need at least 2 to draw a route`}
              </p>
            </div>
          </div>
        )}

        {/* Initial hint overlay */}
        {!queryParams.deviceId && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 rounded-2xl px-8 py-6 text-center shadow-xl border border-slate-200">
              <div className="text-4xl mb-3">🚗</div>
              <p className="font-semibold text-slate-700 text-sm">Select a device to view its track</p>
              <p className="text-xs text-slate-400 mt-1">Choose a device and date range, then click Show Track</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
