import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { Device, DeviceListResponse } from '../types/device';

type ApiEnvelope = {
  success: boolean;
  data: Device[];
  meta: DeviceListResponse['meta'];
};

function gsmLabel(signal?: number | null): string {
  if (signal == null) return 'Unknown';
  if (signal >= 20) return '4G (Strong)';
  if (signal >= 15) return '4G (Good)';
  if (signal >= 10) return '3G (Fair)';
  return '2G (Weak)';
}

export function useDevices(page = 1, limit = 100) {
  return useQuery<DeviceListResponse>({
    queryKey: ['devices', page, limit],
    queryFn: async () => {
      const { data } = await axiosClient.get<ApiEnvelope>(
        `/devices?page=${page}&limit=${limit}`,
      );

      const enriched = data.data.map((device) => {
        const isOnline = device.status === 'online';
        const isMoving = isOnline && (device.speed ?? 0) > 0;

        return {
          ...device,
          // Real telemetry from API — use as-is
          // Computed / display helpers
          accStatus: isOnline ? isMoving : false,
          parkedDuration: !isMoving && isOnline ? '—' : undefined,
          gnssType: 'GPS+BDS',
          gsmSignalLabel: isOnline ? gsmLabel(device.gsmSignal) : 'Offline',
          // lastFix = timestamp of latest GPS position (real)
          lastFix: device.positionTimestamp ?? device.lastOnline ?? undefined,
          // Dummy battery (no real sensor data yet)
          batteryVoltage: '12.4V',
          batteryLevel: isOnline ? Math.floor(Math.random() * 20) + 75 : 30,
          // Dummy mileage (will be replaced when mileage tracking is added)
          todayMileage: isOnline ? parseFloat((Math.random() * 100).toFixed(1)) : 0,
          vehicle: (device as any).vehicle ?? undefined,
        };
      });

      return { data: enriched, meta: data.meta };
    },
    refetchInterval: 15_000,
  });
}
