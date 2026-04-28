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

      // --- INJECT DUMMY DATA FOR UI TESTING (ISSUE #10) ---
      const dummyData = data.data.map((device) => {
        const isOnline = device.status === 'online';
        const isMoving = isOnline && (device.speed ?? 0) > 0;
        
        return {
          ...device,
          accStatus: isOnline ? isMoving : false,
          parkedDuration: !isMoving ? '2h 15m' : undefined,
          batteryVoltage: '12.4V',
          batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100
          gnssType: 'GPS+BDS',
          satellites: isOnline ? Math.floor(Math.random() * 8) + 8 : 0, // 8-15
          gsmSignal: isOnline ? '4G (Strong)' : 'Offline',
          lastOnline: new Date().toISOString(),
          lastFix: new Date().toISOString(),
          todayMileage: parseFloat((Math.random() * 100).toFixed(1)),
          vehicle: {
            ownerName: 'Budi Santoso',
            phone: '081234567890',
            plateNo: `B ${Math.floor(Math.random() * 8999) + 1000} XYZ`,
            make: 'Toyota',
            model: 'Avanza',
            vin: 'MHF' + Math.random().toString().slice(2, 12),
          },
        };
      });

      return { data: dummyData, meta: data.meta };
    },
    refetchInterval: 15_000,
  });
}
