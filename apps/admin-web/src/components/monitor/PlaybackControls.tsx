import { Play, Pause, SkipBack, SkipForward, Gauge } from 'lucide-react';
import type { TrackPosition } from '../../types/track';

const SPEED_OPTIONS = [0.5, 1, 2, 5, 10] as const;
type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];

interface Props {
  positions: TrackPosition[];
  currentIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (s: PlaybackSpeed) => void;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PlaybackControls({
  positions, currentIndex, isPlaying, speed,
  onPlay, onPause, onSeek, onSpeedChange,
}: Props) {
  if (positions.length === 0) return null;

  const current = positions[currentIndex];
  const total = positions.length - 1;
  const progress = total > 0 ? (currentIndex / total) * 100 : 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 z-[800] shadow-lg">
      {/* Timestamp row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-slate-400">{formatDate(current.timestamp)}</span>
        <span className="text-xs font-semibold text-slate-700 tabular-nums">
          {formatTimestamp(current.timestamp)}
        </span>
        <span className="text-[10px] text-slate-400">
          {(current.speed ?? 0).toFixed(0)} km/h
        </span>
      </div>

      {/* Scrubber */}
      <div className="relative mb-3 group">
        <input
          type="range"
          min={0}
          max={total}
          value={currentIndex}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary-600"
          style={{
            background: `linear-gradient(to right, var(--color-primary-600, #6366f1) ${progress}%, #e2e8f0 ${progress}%)`,
          }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Left: frame counter */}
        <span className="text-[10px] text-slate-400 tabular-nums w-16">
          {currentIndex + 1} / {positions.length}
        </span>

        {/* Center: play controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Go to start"
          >
            <SkipBack size={14} />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button
            onClick={() => onSeek(total)}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Go to end"
          >
            <SkipForward size={14} />
          </button>
        </div>

        {/* Right: speed selector */}
        <div className="flex items-center gap-1 w-16 justify-end">
          <Gauge size={11} className="text-slate-400" />
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value) as PlaybackSpeed)}
            className="text-[11px] border-0 bg-transparent text-slate-600 font-medium cursor-pointer focus:outline-none"
          >
            {SPEED_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export type { PlaybackSpeed };
