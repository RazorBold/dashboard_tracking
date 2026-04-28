import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { Device, DeviceListResponse } from '../types/device';

type ApiEnvelope = {
  success: boolean;
  data: Device[];
  meta: DeviceListResponse['meta'];
};

export function useDevices(page = 1, limit = 100) {
  return useQuery<DeviceListResponse>({
    queryKey: ['devices', page, limit],
    queryFn: async () => {
      const { data } = await axiosClient.get<ApiEnvelope>(
        `/devices?page=${page}&limit=${limit}`,
      );
      return { data: data.data, meta: data.meta };
    },
    refetchInterval: 15_000,
  });
}
