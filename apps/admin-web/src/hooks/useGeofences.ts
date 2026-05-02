import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { Geofence } from '../types/geofence';

export function useGeofences() {
  return useQuery<Geofence[]>({
    queryKey: ['geofences'],
    queryFn: async () => {
      const { data } = await axiosClient.get<{ data: Geofence[] }>('/geofences');
      return data.data;
    },
    staleTime: 30_000,
  });
}
