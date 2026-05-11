import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import { useAlertStore } from '../stores/alertStore';
import type { AlertListResponse, AlertFilters } from '../types/alert';

export function useAlerts(filters?: AlertFilters) {
  return useQuery<AlertListResponse>({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = { limit: 100, offset: 0, ...filters };
      const { data } = await axiosClient.get<AlertListResponse>('/alerts', { params });
      return data;
    },
    refetchInterval: 10_000,
  });
}

export function useAlertUnreadCount() {
  const setUnreadCount = useAlertStore((s) => s.setUnreadCount);

  const query = useQuery<{ unread: number }>({
    queryKey: ['alerts-count'],
    queryFn: async () => {
      const { data } = await axiosClient.get<{ unread: number }>('/alerts/count');
      return data;
    },
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (query.data?.unread !== undefined) {
      setUnreadCount(query.data.unread);
    }
  }, [query.data?.unread, setUnreadCount]);

  return query;
}
