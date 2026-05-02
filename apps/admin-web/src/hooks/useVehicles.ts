import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { VehicleListResponse, VehicleStatus } from '../types/vehicle';

interface VehicleFilters {
  search?: string;
  status?: VehicleStatus;
  page?: number;
  limit?: number;
}

export function useVehicles(filters: VehicleFilters = {}) {
  const { search, status, page = 1, limit = 100 } = filters;

  return useQuery({
    queryKey: ['vehicles', search, status, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const { data } = await axiosClient.get<VehicleListResponse>(`/vehicles?${params}`);
      return data;
    },
    staleTime: 30_000,
  });
}
