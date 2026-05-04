import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import { useAlertStore } from '../stores/alertStore';
import { DUMMY_ALERTS } from '../data/dummyAlertData';
import type { AlertListResponse, AlertFilters } from '../types/alert';

const DUMMY_RESPONSE: AlertListResponse = { data: DUMMY_ALERTS };

export function useAlerts(filters?: AlertFilters) {
  return useQuery<AlertListResponse>({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      try {
        const params: Record<string, unknown> = { limit: 50, offset: 0, ...filters };
        const { data } = await axiosClient.get<AlertListResponse>('/alerts', { params });
        if (!data.data || data.data.length === 0) return DUMMY_RESPONSE;
        return data;
      } catch {
        return DUMMY_RESPONSE;
      }
    },
    refetchInterval: 10_000,
  });
}

export function useAlertUnreadCount() {
  const setUnreadCount = useAlertStore((s) => s.setUnreadCount);

  const query = useQuery<{ unread: number }>({
    queryKey: ['alerts-count'],
    queryFn: async () => {
      try {
        const { data } = await axiosClient.get<{ unread: number }>('/alerts/count');
        return data;
      } catch {
        return { unread: DUMMY_ALERTS.filter((a) => !a.isRead).length };
      }
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
