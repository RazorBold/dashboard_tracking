import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import type { DriverListResponse } from '../types/driver';

interface DriverFilters {
  search?: string;
  registerPlace?: string;
  licenseExpired?: boolean;
  page?: number;
  limit?: number;
}

export function useDrivers(filters: DriverFilters = {}) {
  const { search, registerPlace, licenseExpired, page = 1, limit = 50 } = filters;

  return useQuery({
    queryKey: ['drivers', search, registerPlace, licenseExpired, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (registerPlace) params.set('registerPlace', registerPlace);
      if (licenseExpired) params.set('licenseExpired', 'true');
      const { data } = await axiosClient.get<DriverListResponse>(`/drivers?${params}`);
      return data;
    },
    staleTime: 30_000,
  });
}
