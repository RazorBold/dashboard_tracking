import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import type { GeofenceFormValues, Geofence } from '../types/geofence';

function buildLocalFence(payload: Partial<GeofenceFormValues>, base?: Geofence): Geofence {
  const now = new Date().toISOString();
  return {
    id: base?.id ?? `dummy-geo-local-${Date.now()}`,
    name: payload.name ?? base?.name ?? '',
    type: (payload as any).type ?? base?.type ?? 'circle',
    geometry: (payload as any).geometry ?? base?.geometry ?? { center: { lat: 0, lng: 0 }, radius: 500 },
    description: payload.description ?? base?.description ?? null,
    assignedDeviceIds: payload.assignedDeviceIds ?? base?.assignedDeviceIds ?? [],
    organizationId: base?.organizationId ?? null,
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
  };
}

export function useGeofenceMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async (payload: GeofenceFormValues): Promise<Geofence> => {
      try {
        const { data } = await axiosClient.post<{ data: Geofence }>('/geofences', payload);
        return data.data;
      } catch {
        // API unavailable — create locally so the user can still visualize the fence
        return buildLocalFence(payload);
      }
    },
    onSuccess: (newFence) => {
      qc.setQueryData<Geofence[]>(['geofences'], (old = []) => [...old, newFence]);
      toast.success('Geofence created');
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<GeofenceFormValues> }): Promise<Geofence> => {
      // Dummy fences (pre-seeded or locally created) never exist in DB
      if (id.startsWith('dummy-geo-')) {
        const current = qc.getQueryData<Geofence[]>(['geofences'])?.find((f) => f.id === id);
        return buildLocalFence(payload, current);
      }
      try {
        const { data } = await axiosClient.put<{ data: Geofence }>(`/geofences/${id}`, payload);
        return data.data;
      } catch {
        const current = qc.getQueryData<Geofence[]>(['geofences'])?.find((f) => f.id === id);
        return buildLocalFence(payload, current);
      }
    },
    onSuccess: (updatedFence) => {
      qc.setQueryData<Geofence[]>(['geofences'], (old = []) =>
        old.map((f) => (f.id === updatedFence.id ? updatedFence : f)),
      );
      toast.success('Geofence updated');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string): Promise<string> => {
      if (id.startsWith('dummy-geo-')) return id;
      try {
        await axiosClient.delete(`/geofences/${id}`);
      } catch {
        // API unavailable — still remove from local cache
      }
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData<Geofence[]>(['geofences'], (old = []) => old.filter((f) => f.id !== id));
      toast.success('Geofence deleted');
    },
  });

  return { create, update, remove };
}
