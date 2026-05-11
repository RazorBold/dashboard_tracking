import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { AutoReport } from '../types/report';

interface ListResponse {
  data: AutoReport[];
}

export function useAutoReports() {
  return useQuery<AutoReport[]>({
    queryKey: ['auto-reports'],
    queryFn: async () => {
      const { data } = await axiosClient.get<ListResponse>('/auto-reports');
      return data.data;
    },
    staleTime: 30_000,
  });
}
