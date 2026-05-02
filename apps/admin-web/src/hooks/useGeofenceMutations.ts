import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import type { GeofenceFormValues, Geofence } from '../types/geofence';

export function useGeofenceMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: GeofenceFormValues) =>
      axiosClient.post<{ data: Geofence }>('/geofences', payload).then((r) => r.data.data),
    onSuccess: (newFence) => {
      qc.setQueryData<Geofence[]>(['geofences'], (old = []) => [...old, newFence]);
      toast.success('Geofence created');
    },
    onError: () => toast.error('Failed to create geofence'),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GeofenceFormValues> }) => {
      // Dummy fences don't exist in DB — build merged object locally
      if (id.startsWith('dummy-geo-')) {
        const current = qc.getQueryData<Geofence[]>(['geofences'])?.find((f) => f.id === id);
        const merged: Geofence = { ...(current as Geofence), ...payload, updatedAt: new Date().toISOString() };
        return Promise.resolve(merged);
      }
      return axiosClient.put<{ data: Geofence }>(`/geofences/${id}`, payload).then((r) => r.data.data);
    },
    onSuccess: (updatedFence) => {
      qc.setQueryData<Geofence[]>(['geofences'], (old = []) =>
        old.map((f) => (f.id === updatedFence.id ? updatedFence : f)),
      );
      toast.success('Geofence updated');
    },
    onError: () => toast.error('Failed to update geofence'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => {
      // Dummy fences don't exist in DB — remove from cache only
      if (id.startsWith('dummy-geo-')) return Promise.resolve(null);
      return axiosClient.delete(`/geofences/${id}`);
    },
    onSuccess: (_, id) => {
      qc.setQueryData<Geofence[]>(['geofences'], (old = []) => old.filter((f) => f.id !== id));
      toast.success('Geofence deleted');
    },
    onError: () => toast.error('Failed to delete geofence'),
  });

  return { create, update, remove };
}
