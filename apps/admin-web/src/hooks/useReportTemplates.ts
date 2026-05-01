import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import type { ReportTemplate } from '../types/report';

interface ListResponse {
  data: ReportTemplate[];
}

export function useReportTemplates() {
  return useQuery<ReportTemplate[]>({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data } = await axiosClient.get<ListResponse>('/report-templates');
      return data.data;
    },
    staleTime: 30_000,
  });
}

export async function downloadReportCsv(id: string, name: string) {
  try {
    const { data } = await axiosClient.get(`/report-templates/${id}/run`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error('Failed to download report');
  }
}
