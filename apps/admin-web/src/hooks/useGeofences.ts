import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { Geofence } from '../types/geofence';
import { DUMMY_GEOFENCES } from '../data/dummyGeofenceData';

export function useGeofences() {
  return useQuery<Geofence[]>({
    queryKey: ['geofences'],
    queryFn: async () => {
      try {
        const { data } = await axiosClient.get<{ data: Geofence[] }>('/geofences');
        if (!data.data || data.data.length === 0) return DUMMY_GEOFENCES;
        return data.data;
      } catch {
        return DUMMY_GEOFENCES;
      }
    },
    // Infinity prevents background refetch that would cause dummy fences to disappear
    // once a real fence is created (real data length > 0 skips dummy injection).
    // Data is refreshed on mount and after mutations via setQueryData.
    staleTime: Infinity,
  });
}
