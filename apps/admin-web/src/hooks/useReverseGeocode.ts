import { useState, useEffect } from 'react';

interface Result {
  address: string | undefined;
  loading: boolean;
}

export function useReverseGeocode(lat: number | null, lng: number | null): Result {
  const [address, setAddress] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat == null || lng == null) {
      setAddress(undefined);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'IoT-Tracking-Dashboard/1.0' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setAddress(data.display_name);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAddress(undefined);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return { address, loading };
}
