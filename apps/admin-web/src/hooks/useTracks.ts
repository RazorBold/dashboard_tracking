import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { TrackHistoryResponse, TripSummary, TrackPosition } from '../types/track';

interface UseTracksParams {
  deviceId: string | null;
  from: string | null;
  to: string | null;
}

export function useTracks({ deviceId, from, to }: UseTracksParams) {
  return useQuery<TrackHistoryResponse>({
    queryKey: ['tracks', deviceId, from, to],
    enabled: !!deviceId && !!from && !!to,
    queryFn: async () => {
      const { data } = await axiosClient.get<TrackHistoryResponse>(
        `/devices/${deviceId}/positions`,
        { params: { from, to } },
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function computeTripSummary(positions: TrackPosition[]): TripSummary {
  if (positions.length < 2) {
    return { totalPoints: positions.length, totalDistanceKm: 0, maxSpeedKmh: 0, avgSpeedKmh: 0, durationMinutes: 0, stoppedMinutes: 0 };
  }

  let totalDistanceKm = 0;
  let stoppedMinutes = 0;
  const speeds = positions.map((p) => p.speed ?? 0);

  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    totalDistanceKm += haversineKm(prev.latitude, prev.longitude, curr.latitude, curr.longitude);

    const dtMin = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 60000;
    if ((curr.speed ?? 0) < 3) stoppedMinutes += dtMin;
  }

  const first = new Date(positions[0].timestamp).getTime();
  const last  = new Date(positions[positions.length - 1].timestamp).getTime();
  const durationMinutes = (last - first) / 60000;
  const movingSpeeds = speeds.filter((s) => s > 3);
  const avgSpeedKmh = movingSpeeds.length > 0
    ? movingSpeeds.reduce((a, b) => a + b, 0) / movingSpeeds.length
    : 0;

  return {
    totalPoints:      positions.length,
    totalDistanceKm:  Math.round(totalDistanceKm * 10) / 10,
    maxSpeedKmh:      Math.round(Math.max(...speeds)),
    avgSpeedKmh:      Math.round(avgSpeedKmh),
    durationMinutes:  Math.round(durationMinutes),
    stoppedMinutes:   Math.round(stoppedMinutes),
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
