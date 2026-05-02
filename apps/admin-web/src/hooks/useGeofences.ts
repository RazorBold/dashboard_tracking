import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { Geofence } from '../types/geofence';
import { DUMMY_GEOFENCES } from '../data/dummyGeofenceData';

export function useGeofences() {
  return useQuery<Geofence[]>({
    queryKey: ['geofences'],
    queryFn: async () => {
      const { data } = await axiosClient.get<{ data: Geofence[] }>('/geofences');
      if (!data.data || data.data.length === 0) {
        return DUMMY_GEOFENCES;
      }
      return data.data;
    },
    staleTime: 30_000,
  });
}
