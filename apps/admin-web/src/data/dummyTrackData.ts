import type { TrackPosition } from '../types/track';

// Long Jakarta route: Monas → Thamrin → Sudirman → Semanggi → Gatot Subroto →
// Senayan → Kebayoran → Pondok Indah → TB Simatupang → Cawang → Casablanca → Kuningan → back to Monas
const WAYPOINTS: { lat: number; lng: number; speed: number }[] = [
  // === START: Monas area (engine on, warming up) ===
  { lat: -6.1754, lng: 106.8272, speed: 0 },
  { lat: -6.1756, lng: 106.8273, speed: 0 },
  { lat: -6.1758, lng: 106.8274, speed: 3 },
  { lat: -6.1762, lng: 106.8275, speed: 8 },
  { lat: -6.1770, lng: 106.8277, speed: 12 },
  { lat: -6.1778, lng: 106.8280, speed: 18 },

  // === Jl. Medan Merdeka heading south ===
  { lat: -6.1790, lng: 106.8270, speed: 22 },
  { lat: -6.1800, lng: 106.8258, speed: 28 },
  { lat: -6.1812, lng: 106.8245, speed: 32 },
  { lat: -6.1825, lng: 106.8235, speed: 35 },

  // === Jl. Thamrin northbound ===
  { lat: -6.1840, lng: 106.8225, speed: 38 },
  { lat: -6.1855, lng: 106.8218, speed: 42 },
  { lat: -6.1868, lng: 106.8212, speed: 45 },
  { lat: -6.1880, lng: 106.8205, speed: 48 },
  { lat: -6.1895, lng: 106.8198, speed: 50 },
  { lat: -6.1910, lng: 106.8192, speed: 52 },
  { lat: -6.1925, lng: 106.8187, speed: 48 },
  { lat: -6.1935, lng: 106.8185, speed: 42 },

  // === Bundaran HI (traffic circle, slow down) ===
  { lat: -6.1945, lng: 106.8225, speed: 25 },
  { lat: -6.1950, lng: 106.8232, speed: 18 },
  { lat: -6.1955, lng: 106.8238, speed: 12 },
  { lat: -6.1961, lng: 106.8237, speed: 8 },
  { lat: -6.1968, lng: 106.8233, speed: 5 },
  { lat: -6.1975, lng: 106.8230, speed: 0 },
  { lat: -6.1975, lng: 106.8230, speed: 0 },

  // === Jl. Sudirman (main corridor, speeding up) ===
  { lat: -6.1985, lng: 106.8225, speed: 10 },
  { lat: -6.1995, lng: 106.8218, speed: 25 },
  { lat: -6.2008, lng: 106.8212, speed: 38 },
  { lat: -6.2020, lng: 106.8205, speed: 48 },
  { lat: -6.2035, lng: 106.8198, speed: 55 },
  { lat: -6.2050, lng: 106.8195, speed: 58 },
  { lat: -6.2065, lng: 106.8188, speed: 60 },
  { lat: -6.2080, lng: 106.8180, speed: 62 },
  { lat: -6.2095, lng: 106.8175, speed: 60 },
  { lat: -6.2110, lng: 106.8170, speed: 58 },
  { lat: -6.2125, lng: 106.8165, speed: 62 },
  { lat: -6.2140, lng: 106.8158, speed: 65 },
  { lat: -6.2155, lng: 106.8152, speed: 60 },
  { lat: -6.2170, lng: 106.8148, speed: 55 },
  { lat: -6.2185, lng: 106.8142, speed: 50 },
  { lat: -6.2200, lng: 106.8135, speed: 48 },
  { lat: -6.2215, lng: 106.8128, speed: 45 },

  // === Semanggi intersection (slow/stop) ===
  { lat: -6.2228, lng: 106.8122, speed: 30 },
  { lat: -6.2235, lng: 106.8118, speed: 20 },
  { lat: -6.2242, lng: 106.8112, speed: 12 },
  { lat: -6.2248, lng: 106.8105, speed: 5 },
  { lat: -6.2255, lng: 106.8098, speed: 0 },
  { lat: -6.2255, lng: 106.8098, speed: 0 },
  { lat: -6.2255, lng: 106.8098, speed: 0 },

  // === Jl. Gatot Subroto (fast highway) ===
  { lat: -6.2262, lng: 106.8088, speed: 15 },
  { lat: -6.2270, lng: 106.8075, speed: 30 },
  { lat: -6.2278, lng: 106.8060, speed: 45 },
  { lat: -6.2285, lng: 106.8045, speed: 55 },
  { lat: -6.2292, lng: 106.8030, speed: 62 },
  { lat: -6.2300, lng: 106.8015, speed: 68 },
  { lat: -6.2310, lng: 106.8000, speed: 72 },
  { lat: -6.2320, lng: 106.7985, speed: 75 },
  { lat: -6.2330, lng: 106.7972, speed: 78 },
  { lat: -6.2342, lng: 106.7958, speed: 80 },
  { lat: -6.2355, lng: 106.7945, speed: 82 },
  { lat: -6.2368, lng: 106.7932, speed: 78 },
  { lat: -6.2380, lng: 106.7920, speed: 75 },
  { lat: -6.2392, lng: 106.7905, speed: 72 },
  { lat: -6.2400, lng: 106.7890, speed: 70 },

  // === Senayan area (slower residential) ===
  { lat: -6.2412, lng: 106.7878, speed: 55 },
  { lat: -6.2420, lng: 106.7870, speed: 45 },
  { lat: -6.2432, lng: 106.7862, speed: 38 },
  { lat: -6.2445, lng: 106.7855, speed: 35 },
  { lat: -6.2458, lng: 106.7850, speed: 38 },
  { lat: -6.2470, lng: 106.7845, speed: 42 },
  { lat: -6.2485, lng: 106.7838, speed: 45 },
  { lat: -6.2500, lng: 106.7830, speed: 48 },

  // === Turn south - Jl. Panglima Polim ===
  { lat: -6.2515, lng: 106.7835, speed: 35 },
  { lat: -6.2530, lng: 106.7838, speed: 30 },
  { lat: -6.2545, lng: 106.7842, speed: 28 },
  { lat: -6.2560, lng: 106.7845, speed: 32 },
  { lat: -6.2575, lng: 106.7848, speed: 35 },
  { lat: -6.2590, lng: 106.7852, speed: 38 },
  { lat: -6.2605, lng: 106.7855, speed: 35 },
  { lat: -6.2620, lng: 106.7858, speed: 32 },
  { lat: -6.2635, lng: 106.7860, speed: 28 },
  { lat: -6.2650, lng: 106.7862, speed: 25 },

  // === Kebayoran Baru (stop for break) ===
  { lat: -6.2665, lng: 106.7865, speed: 20 },
  { lat: -6.2678, lng: 106.7868, speed: 15 },
  { lat: -6.2690, lng: 106.7872, speed: 8 },
  { lat: -6.2700, lng: 106.7875, speed: 0 },
  { lat: -6.2700, lng: 106.7875, speed: 0 },
  { lat: -6.2700, lng: 106.7875, speed: 0 },
  { lat: -6.2700, lng: 106.7875, speed: 0 },
  { lat: -6.2700, lng: 106.7875, speed: 0 },

  // === Resume to Pondok Indah ===
  { lat: -6.2708, lng: 106.7878, speed: 5 },
  { lat: -6.2718, lng: 106.7882, speed: 15 },
  { lat: -6.2730, lng: 106.7888, speed: 28 },
  { lat: -6.2745, lng: 106.7892, speed: 38 },
  { lat: -6.2760, lng: 106.7898, speed: 45 },
  { lat: -6.2775, lng: 106.7902, speed: 48 },
  { lat: -6.2790, lng: 106.7908, speed: 50 },
  { lat: -6.2808, lng: 106.7912, speed: 52 },
  { lat: -6.2825, lng: 106.7918, speed: 48 },
  { lat: -6.2842, lng: 106.7922, speed: 45 },
  { lat: -6.2858, lng: 106.7928, speed: 42 },
  { lat: -6.2875, lng: 106.7932, speed: 38 },
  { lat: -6.2890, lng: 106.7935, speed: 35 },

  // === Pondok Indah area (arrived, park briefly) ===
  { lat: -6.2905, lng: 106.7838, speed: 25 },
  { lat: -6.2912, lng: 106.7835, speed: 15 },
  { lat: -6.2718, lng: 106.7832, speed: 8 },
  { lat: -6.2720, lng: 106.7830, speed: 0 },
  { lat: -6.2720, lng: 106.7830, speed: 0 },
  { lat: -6.2720, lng: 106.7830, speed: 0 },

  // === Head east towards TB Simatupang ===
  { lat: -6.2722, lng: 106.7838, speed: 8 },
  { lat: -6.2725, lng: 106.7855, speed: 20 },
  { lat: -6.2728, lng: 106.7875, speed: 35 },
  { lat: -6.2730, lng: 106.7895, speed: 45 },
  { lat: -6.2732, lng: 106.7918, speed: 52 },
  { lat: -6.2735, lng: 106.7940, speed: 58 },
  { lat: -6.2738, lng: 106.7965, speed: 62 },
  { lat: -6.2740, lng: 106.7988, speed: 65 },
  { lat: -6.2742, lng: 106.8010, speed: 68 },
  { lat: -6.2745, lng: 106.8035, speed: 65 },
  { lat: -6.2748, lng: 106.8058, speed: 62 },
  { lat: -6.2750, lng: 106.8080, speed: 58 },

  // === TB Simatupang intersection ===
  { lat: -6.2752, lng: 106.8095, speed: 45 },
  { lat: -6.2748, lng: 106.8108, speed: 35 },
  { lat: -6.2742, lng: 106.8118, speed: 25 },
  { lat: -6.2735, lng: 106.8125, speed: 15 },
  { lat: -6.2728, lng: 106.8130, speed: 0 },
  { lat: -6.2728, lng: 106.8130, speed: 0 },

  // === North on inner ring road towards Cawang ===
  { lat: -6.2720, lng: 106.8138, speed: 12 },
  { lat: -6.2708, lng: 106.8148, speed: 25 },
  { lat: -6.2695, lng: 106.8160, speed: 38 },
  { lat: -6.2680, lng: 106.8175, speed: 48 },
  { lat: -6.2665, lng: 106.8192, speed: 55 },
  { lat: -6.2648, lng: 106.8210, speed: 60 },
  { lat: -6.2632, lng: 106.8228, speed: 62 },
  { lat: -6.2615, lng: 106.8248, speed: 58 },
  { lat: -6.2598, lng: 106.8265, speed: 55 },
  { lat: -6.2582, lng: 106.8280, speed: 52 },

  // === Cawang junction (slow) ===
  { lat: -6.2565, lng: 106.8295, speed: 35 },
  { lat: -6.2550, lng: 106.8305, speed: 25 },
  { lat: -6.2538, lng: 106.8312, speed: 18 },
  { lat: -6.2525, lng: 106.8318, speed: 12 },
  { lat: -6.2515, lng: 106.8322, speed: 0 },
  { lat: -6.2515, lng: 106.8322, speed: 0 },

  // === Jl. Casablanca heading northwest ===
  { lat: -6.2505, lng: 106.8315, speed: 10 },
  { lat: -6.2492, lng: 106.8305, speed: 22 },
  { lat: -6.2478, lng: 106.8292, speed: 35 },
  { lat: -6.2465, lng: 106.8278, speed: 42 },
  { lat: -6.2450, lng: 106.8265, speed: 48 },
  { lat: -6.2435, lng: 106.8252, speed: 52 },
  { lat: -6.2420, lng: 106.8240, speed: 55 },
  { lat: -6.2405, lng: 106.8228, speed: 50 },
  { lat: -6.2390, lng: 106.8218, speed: 45 },
  { lat: -6.2375, lng: 106.8208, speed: 42 },

  // === Kuningan area ===
  { lat: -6.2358, lng: 106.8198, speed: 38 },
  { lat: -6.2342, lng: 106.8192, speed: 35 },
  { lat: -6.2328, lng: 106.8188, speed: 32 },
  { lat: -6.2312, lng: 106.8185, speed: 30 },
  { lat: -6.2298, lng: 106.8182, speed: 28 },

  // === Heading north back via Rasuna Said ===
  { lat: -6.2282, lng: 106.8180, speed: 32 },
  { lat: -6.2265, lng: 106.8178, speed: 38 },
  { lat: -6.2248, lng: 106.8175, speed: 42 },
  { lat: -6.2232, lng: 106.8172, speed: 45 },
  { lat: -6.2215, lng: 106.8175, speed: 48 },
  { lat: -6.2200, lng: 106.8180, speed: 50 },
  { lat: -6.2185, lng: 106.8188, speed: 48 },
  { lat: -6.2170, lng: 106.8195, speed: 45 },

  // === Back on Sudirman heading north ===
  { lat: -6.2155, lng: 106.8202, speed: 42 },
  { lat: -6.2140, lng: 106.8210, speed: 40 },
  { lat: -6.2125, lng: 106.8218, speed: 38 },
  { lat: -6.2110, lng: 106.8225, speed: 35 },
  { lat: -6.2095, lng: 106.8232, speed: 32 },
  { lat: -6.2080, lng: 106.8238, speed: 30 },
  { lat: -6.2065, lng: 106.8245, speed: 28 },
  { lat: -6.2050, lng: 106.8250, speed: 25 },
  { lat: -6.2035, lng: 106.8255, speed: 22 },
  { lat: -6.2020, lng: 106.8260, speed: 20 },
  { lat: -6.2005, lng: 106.8265, speed: 18 },
  { lat: -6.1990, lng: 106.8268, speed: 15 },
  { lat: -6.1975, lng: 106.8272, speed: 12 },

  // === Final approach back to Monas ===
  { lat: -6.1960, lng: 106.8275, speed: 10 },
  { lat: -6.1945, lng: 106.8276, speed: 8 },
  { lat: -6.1930, lng: 106.8277, speed: 10 },
  { lat: -6.1915, lng: 106.8278, speed: 8 },
  { lat: -6.1900, lng: 106.8278, speed: 5 },
  { lat: -6.1885, lng: 106.8277, speed: 3 },
  { lat: -6.1870, lng: 106.8276, speed: 0 },
  { lat: -6.1870, lng: 106.8276, speed: 0 },
];

// Alternative routes for multi-track: each is a distinct Jakarta corridor
// [latOffset, lngOffset] relative to the base WAYPOINTS route
const MULTI_TRACK_OFFSETS: Array<{ latOff: number; lngOff: number; speedMult: number }> = [
  { latOff:  0,      lngOff:  0,      speedMult: 1.0 }, // 0: Monas loop (base)
  { latOff:  0.010, lngOff:  0.018, speedMult: 0.9 }, // 1: Kemayoran → Cempaka Putih corridor
  { latOff: -0.008, lngOff: -0.020, speedMult: 1.1 }, // 2: Palmerah → Grogol corridor
  { latOff:  0.018, lngOff: -0.010, speedMult: 0.85 }, // 3: Rawamangun → Pulo Gadung
  { latOff: -0.015, lngOff:  0.025, speedMult: 1.05 }, // 4: Tebet → Pancoran corridor
];

function deviceRouteIndex(deviceId: string): number {
  let hash = 0;
  for (let k = 0; k < deviceId.length; k++) hash = (hash * 31 + deviceId.charCodeAt(k)) >>> 0;
  return hash % MULTI_TRACK_OFFSETS.length;
}

export function generateDummyTrack(deviceId: string, fromIso: string, _toIso: string, routeIndex?: number): TrackPosition[] {
  const start = new Date(fromIso);
  const points: TrackPosition[] = [];
  const intervalMs = 60_000;

  const idx = routeIndex ?? deviceRouteIndex(deviceId);
  const { latOff, lngOff, speedMult } = MULTI_TRACK_OFFSETS[idx];

  WAYPOINTS.forEach((wp, i) => {
    const ts = new Date(start.getTime() + i * intervalMs);
    const jLat = (Math.random() - 0.5) * 0.00015;
    const jLng = (Math.random() - 0.5) * 0.00015;

    points.push({
      id: `track-${deviceId}-${i}`,
      deviceId,
      latitude:  wp.lat + latOff + jLat,
      longitude: wp.lng + lngOff + jLng,
      speed: Math.max(0, wp.speed * speedMult + (Math.random() - 0.5) * 4),
      heading: i > 0
        ? Math.round(Math.atan2(wp.lng - WAYPOINTS[i - 1].lng, wp.lat - WAYPOINTS[i - 1].lat) * 180 / Math.PI)
        : 180,
      altitude: 12 + Math.random() * 8,
      satellites: Math.floor(Math.random() * 5) + 8,
      gsmSignal: Math.floor(Math.random() * 10) + 20,
      batteryVoltage: 12.1 + Math.random() * 0.5,
      accStatus: wp.speed > 0 ? 1 : 0,
      mileage: null,
      timestamp: ts.toISOString(),
    });
  });

  return points;
}
