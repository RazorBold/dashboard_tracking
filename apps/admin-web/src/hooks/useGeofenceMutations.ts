import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import type { GeofenceFormValues, Geofence } from '../types/geofence';

export function useGeofenceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['geofences'] });

  const create = useMutation({
    mutationFn: (payload: GeofenceFormValues) =>
      axiosClient.post<{ data: Geofence }>('/geofences', payload).then((r) => r.data.data),
    onSuccess: () => { toast.success('Geofence created'); invalidate(); },
    onError: () => toast.error('Failed to create geofence'),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GeofenceFormValues> }) =>
      axiosClient.put<{ data: Geofence }>(`/geofences/${id}`, payload).then((r) => r.data.data),
    onSuccess: () => { toast.success('Geofence updated'); invalidate(); },
    onError: () => toast.error('Failed to update geofence'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/geofences/${id}`),
    onSuccess: () => { toast.success('Geofence deleted'); invalidate(); },
    onError: () => toast.error('Failed to delete geofence'),
  });

  return { create, update, remove };
}
