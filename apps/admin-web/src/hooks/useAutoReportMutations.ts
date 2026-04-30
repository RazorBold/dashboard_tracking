import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import type { AutoReportFormValues } from '../types/report';

export function useAutoReportMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['auto-reports'] });

  const create = useMutation({
    mutationFn: (payload: AutoReportFormValues) =>
      axiosClient.post('/auto-reports', payload).then((r) => r.data),
    onSuccess: () => { toast.success('Schedule saved'); invalidate(); },
    onError: () => toast.error('Failed to save schedule'),
  });

  const toggle = useMutation({
    mutationFn: (id: string) =>
      axiosClient.patch(`/auto-reports/${id}`).then((r) => r.data),
    onSuccess: () => { invalidate(); },
    onError: () => toast.error('Failed to toggle schedule'),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      axiosClient.delete(`/auto-reports/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success('Schedule deleted'); invalidate(); },
    onError: () => toast.error('Failed to delete schedule'),
  });

  return { create, toggle, remove };
}
