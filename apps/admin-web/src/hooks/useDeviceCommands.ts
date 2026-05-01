import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import type { DeviceCommand, CommandType, CommandParameters } from '../types/command';

interface SendCommandPayload {
  type: CommandType;
  parameters?: CommandParameters;
}

export function useDeviceCommands(deviceId: string) {
  const qc = useQueryClient();

  const history = useQuery<DeviceCommand[]>({
    queryKey: ['device-commands', deviceId],
    queryFn: async () => {
      const { data } = await axiosClient.get<{ success: boolean; data: DeviceCommand[] }>(
        `/devices/${deviceId}/commands`,
      );
      return data.data;
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
    enabled: !!deviceId,
  });

  const send = useMutation({
    mutationFn: (payload: SendCommandPayload) =>
      axiosClient.post(`/devices/${deviceId}/commands`, payload).then((r) => r.data),
    onSuccess: () => {
      toast.success('Command sent to device');
      qc.invalidateQueries({ queryKey: ['device-commands', deviceId] });
    },
    onError: () => toast.error('Failed to send command'),
  });

  return { history, send };
}
