import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import type { VehicleFormValues } from '../types/vehicle';

export function useVehicleMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['vehicles'] });

  const create = useMutation({
    mutationFn: (payload: VehicleFormValues) =>
      axiosClient.post('/vehicles', payload).then((r) => r.data),
    onSuccess: () => { toast.success('Vehicle created'); invalidate(); },
    onError: () => toast.error('Failed to create vehicle'),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<VehicleFormValues> }) =>
      axiosClient.put(`/vehicles/${id}`, payload).then((r) => r.data),
    onSuccess: () => { toast.success('Vehicle updated'); invalidate(); },
    onError: () => toast.error('Failed to update vehicle'),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      axiosClient.delete(`/vehicles/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success('Vehicle deleted'); invalidate(); },
    onError: () => toast.error('Failed to delete vehicle'),
  });

  const bindDevice = useMutation({
    mutationFn: ({ vehicleId, deviceId }: { vehicleId: string; deviceId: string }) =>
      axiosClient.post(`/vehicles/${vehicleId}/bind-device`, { deviceId }).then((r) => r.data),
    onSuccess: () => { toast.success('Device bound'); invalidate(); },
    onError: () => toast.error('Failed to bind device'),
  });

  const unbindDevice = useMutation({
    mutationFn: (vehicleId: string) =>
      axiosClient.delete(`/vehicles/${vehicleId}/bind-device`).then((r) => r.data),
    onSuccess: () => { toast.success('Device unbound'); invalidate(); },
    onError: () => toast.error('Failed to unbind device'),
  });

  const exportCsv = async () => {
    try {
      const { data } = await axiosClient.get('/vehicles/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vehicles.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  return { create, update, remove, bindDevice, unbindDevice, exportCsv };
}
