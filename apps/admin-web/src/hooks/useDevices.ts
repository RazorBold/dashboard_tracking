import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { DeviceListResponse } from '../types/device';

export function useDevices(page = 1, limit = 200) {
  return useQuery<DeviceListResponse>({
    queryKey: ['devices', page, limit],
    queryFn: async () => {
      const { data } = await axiosClient.get<{ data: DeviceListResponse }>(
        `/devices?page=${page}&limit=${limit}`,
      );
      return data.data;
    },
    refetchInterval: 15_000,
  });
}
