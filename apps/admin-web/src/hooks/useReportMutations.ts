import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import type { ReportTemplateFormValues } from '../types/report';

export function useReportMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['report-templates'] });

  const create = useMutation({
    mutationFn: (payload: ReportTemplateFormValues) =>
      axiosClient.post('/report-templates', payload).then((r) => r.data),
    onSuccess: () => { toast.success('Report saved'); invalidate(); },
    onError: () => toast.error('Failed to save report'),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      axiosClient.delete(`/report-templates/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success('Report deleted'); invalidate(); },
    onError: () => toast.error('Failed to delete report'),
  });

  return { create, remove };
}
