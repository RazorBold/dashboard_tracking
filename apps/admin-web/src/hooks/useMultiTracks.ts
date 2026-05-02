import { useQueries } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { TrackHistoryResponse, TrackPosition } from '../types/track';
import { computeTripSummary } from './useTracks';
import type { TripSummary } from '../types/track';
import { generateDummyTrack } from '../data/dummyTrackData';

export interface DeviceTrack {
  deviceId: string;
  positions: TrackPosition[];
  summary: TripSummary | null;
  isLoading: boolean;
  isError: boolean;
}

interface MultiTrackParams {
  deviceIds: string[];
  from: string | null;
  to: string | null;
}

export function useMultiTracks({ deviceIds, from, to }: MultiTrackParams): DeviceTrack[] {
  const enabled = deviceIds.length > 0 && !!from && !!to;

  const results = useQueries({
    queries: deviceIds.map((deviceId) => ({
      queryKey: ['tracks', deviceId, from, to],
      queryFn: async (): Promise<TrackPosition[]> => {
        const params = new URLSearchParams({
          from: new Date(from!).toISOString(),
          to: new Date(to!).toISOString(),
        });
        const { data } = await axiosClient.get<TrackHistoryResponse>(
          `/devices/${deviceId}/positions?${params}`,
        );
        if (!data.data || data.data.length < 2) {
          return generateDummyTrack(deviceId, from!, to!);
        }
        return data.data;
      },
      enabled: enabled && !!deviceId,
      staleTime: 5 * 60 * 1000,
    })),
  });

  return deviceIds.map((deviceId, i) => {
    const result = results[i];
    const positions = (result?.data ?? []) as TrackPosition[];
    return {
      deviceId,
      positions,
      summary: positions.length >= 2 ? computeTripSummary(positions) : null,
      isLoading: result?.isLoading ?? false,
      isError: result?.isError ?? false,
    };
  });
}
