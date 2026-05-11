import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';

export interface ObdSnapshot {
  id: string;
  deviceId: string;
  imei: string;
  timestamp: string;
  rpm: number | null;
  engineLoad: string | null;
  coolantTemp: number | null;
  intakeTemp: number | null;
  throttle: string | null;
  timingAdvance: string | null;
  mafRate: string | null;
  fuelLevel: string | null;
  fuelPressure: number | null;
  shortFuelTrim: string | null;
  longFuelTrim: string | null;
  vehicleSpeed: number | null;
  odometer: number | null;
  batteryVoltage: string | null;
  o2Voltage: string | null;
}

export interface ObdDtc {
  id: string;
  deviceId: string;
  imei: string;
  code: string;
  description: string | null;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'cleared';
  detectedAt: string;
  clearedAt: string | null;
}

// Parse numeric string from Drizzle numeric columns
export function n(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const parsed = typeof v === 'number' ? v : parseFloat(v);
  return isNaN(parsed) ? null : parsed;
}

export function useObdLatest(deviceId: string | null) {
  return useQuery<ObdSnapshot | null>({
    queryKey: ['obd', 'latest', deviceId],
    enabled: !!deviceId,
    queryFn: async () => {
      const { data } = await axiosClient.get(`/obd/${deviceId}/latest`);
      return data.data ?? null;
    },
    refetchInterval: 10_000,
    staleTime: 8_000,
  });
}

export function useObdHistory(deviceId: string | null, from: string | null, to: string | null) {
  return useQuery<ObdSnapshot[]>({
    queryKey: ['obd', 'history', deviceId, from, to],
    enabled: !!deviceId && !!from && !!to,
    queryFn: async () => {
      const { data } = await axiosClient.get(`/obd/${deviceId}/history`, {
        params: { from, to, limit: 1000 },
      });
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useObdDtcs(deviceId: string | null, history = false) {
  return useQuery<ObdDtc[]>({
    queryKey: ['obd', 'dtcs', deviceId, history],
    enabled: !!deviceId,
    queryFn: async () => {
      const { data } = await axiosClient.get(`/obd/${deviceId}/dtc`, {
        params: history ? { history: 'true' } : undefined,
      });
      return data.data ?? [];
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useClearDtc(deviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dtcId: string) =>
      axiosClient.put(`/obd/${deviceId}/dtc/${dtcId}/clear`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obd', 'dtcs', deviceId] });
    },
  });
}

export function useClearAllDtcs(deviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => axiosClient.put(`/obd/${deviceId}/dtc/clear-all`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obd', 'dtcs', deviceId] });
    },
  });
}
