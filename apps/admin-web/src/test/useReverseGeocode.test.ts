import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useReverseGeocode } from '../hooks/useReverseGeocode';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const nominatimResponse = {
  display_name: 'Jl. Sudirman No.1, Kebayoran Baru, Jakarta Selatan, DKI Jakarta, Indonesia',
};

describe('useReverseGeocode', () => {
  it('returns undefined address when lat/lng are null', () => {
    const { result } = renderHook(() => useReverseGeocode(null, null));
    expect(result.current.address).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it('fetches address from Nominatim when lat/lng are provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => nominatimResponse,
    });

    const { result } = renderHook(() => useReverseGeocode(-6.2088, 106.8456));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.address).toBe(nominatimResponse.display_name);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org'),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('passes correct lat/lng in the fetch URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => nominatimResponse,
    });

    renderHook(() => useReverseGeocode(-6.2088, 106.8456));

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain('-6.2088');
    expect(url).toContain('106.8456');
  });

  it('sets loading=true while fetching', async () => {
    let resolveFetch!: (v: unknown) => void;
    mockFetch.mockReturnValueOnce(
      new Promise((r) => { resolveFetch = r; })
    );

    const { result } = renderHook(() => useReverseGeocode(-6.2088, 106.8456));

    expect(result.current.loading).toBe(true);

    resolveFetch({ ok: true, json: async () => nominatimResponse });
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('returns undefined address and loading=false on fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useReverseGeocode(-6.2088, 106.8456));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.address).toBeUndefined();
  });

  it('re-fetches when lat/lng change', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => nominatimResponse,
    });

    const { rerender } = renderHook(
      ({ lat, lng }: { lat: number; lng: number }) => useReverseGeocode(lat, lng),
      { initialProps: { lat: -6.2, lng: 106.8 } }
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    rerender({ lat: -7.25, lng: 112.75 });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});
