import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import { useAlertStore } from '../stores/alertStore';

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  const decrementUnread = useAlertStore((s) => s.decrementUnread);

  return useMutation({
    mutationFn: async (alertId: string) => {
      await axiosClient.put(`/alerts/${alertId}/read`);
    },
    onSuccess: () => {
      decrementUnread();
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-count'] });
    },
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();
  const clearUnread = useAlertStore((s) => s.clearUnread);

  return useMutation({
    mutationFn: async () => {
      await axiosClient.put('/alerts/read-all');
    },
    onSuccess: () => {
      clearUnread();
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-count'] });
    },
  });
}
