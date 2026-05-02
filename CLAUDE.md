# CLAUDE.md — IoT Tracking Dashboard

## Project Overview

Monorepo fleet/IoT tracking platform. Two apps:
- `apps/admin-web` — React + Vite + Tailwind v4 frontend dashboard
- `apps/api` — Express 5 + Drizzle ORM backend API

Package manager: **pnpm** (workspaces). Task runner: **Turbo**.

## Dev Commands

```bash
# Root
pnpm dev          # run both apps concurrently (turbo)
pnpm build        # build both apps

# API only
pnpm --filter @iot-platform/api dev
pnpm --filter @iot-platform/api test
pnpm --filter @iot-platform/api test:coverage
pnpm --filter @iot-platform/api db:push    # apply schema to DB
pnpm --filter @iot-platform/api db:seed    # seed demo data

# Frontend only
pnpm --filter @iot-platform/admin-web dev
pnpm --filter @iot-platform/admin-web build
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind v4, React Query, React Router v7 |
| Maps | React-Leaflet v5, Leaflet |
| Forms | React Hook Form + Zod |
| Backend | Express 5, TypeScript, Drizzle ORM (PostgreSQL) |
| Auth | JWT (access + refresh tokens) |
| Realtime | MQTT + WebSocket (Socket.io) |
| Testing | Vitest + supertest (API route integration tests) |

## Critical Architecture Notes

### Tailwind v4 (NOT v3)
Project uses `tailwindcss@4.x`. **`tailwind.config.ts` is ignored**. Custom colors must be in CSS:
```css
/* apps/admin-web/src/styles/globals.css */
@import "tailwindcss";

@theme {
  --color-primary-50:  #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  /* ... */
}
```

### React-Leaflet v5 Map Rules
- **`preferCanvas={false}`** — required for `Tooltip` on `CircleMarker` (canvas mode breaks tooltips)
- **Never use `<div>` as wrapper for map layer children** — use `<Fragment key={...}>` instead
- **Map pan**: use `setView([lat, lng], zoom, { animate: true, duration: 0.5 })` — `flyTo()` was rejected by user as "too disorienting"
- **FlyToX pattern**: create a child component inside `MapContainer` that uses `useMap()` + `useEffect` to imperatively control map

### Dummy Data Injection Pattern
When API returns empty, hooks inject dummy data for UI visualization (no DB needed for demo):
```ts
// Pattern used in: useTracks.ts, useMultiTracks.ts, useGeofences.ts
queryFn: async () => {
  const { data } = await axiosClient.get('/endpoint');
  if (!data.data || data.data.length === 0) return DUMMY_DATA;
  return data.data;
},
```
Dummy data files live in `apps/admin-web/src/data/`.

### Geofence Mutations — Cache-First (No Invalidate)
After create/update/delete, mutations use `setQueryData` directly instead of `invalidateQueries`. This prevents dummy data from disappearing when real data is created:
```ts
// useGeofenceMutations.ts
onSuccess: (newFence) => {
  qc.setQueryData<Geofence[]>(['geofences'], (old = []) => [...old, newFence]);
}
```
Dummy geofences (`id.startsWith('dummy-geo-')`) are handled locally without API calls.

### API Auth Middleware
Routes use `verifyToken` from `../middleware/auth.middleware` OR `../middleware` barrel. Both are mocked in test `setup.ts`. JWT payload: `{ sub, email, role, orgId }`.

### Validation Status Codes
- Routes using `validate()` middleware → **422** on validation error
- Routes using manual `z.ZodError` catch → **400** on validation error

## Project Structure

```
apps/
  admin-web/src/
    components/
      layout/        — MainLayout, TopNav, LeftSidebar
      monitor/       — MapView, AlertMapView, TrackMapView, MultiTrackMapView, DeviceListPanel, DeviceDetailSidebar
      geofence/      — GeofenceMapPanel
      device/        — DeviceTable
    config/
      navigation.ts  — ALL menu items and sidebar configs (source of truth for nav)
    data/            — Dummy data files (dummyTrackData, dummyGeofenceData)
    hooks/           — useDevices, useGeofences, useAlerts, useTracks, useMultiTracks, useGeofenceMutations, ...
    pages/
      monitor/       — ObjectsPage, AlertsPage, TracksPage, MultiTrackPage
      fleet/         — FleetDashboardPage, DriverPage, VehiclePage, CheckInPage, RoutePlanPage
      geofence/      — GeofencePage
      report/        — ReportOverviewPage, MyReportPage, AutoReportPage, TaskCenterPage
    stores/          — authStore (Zustand), uiStore, alertStore
    types/           — device.ts, geofence.ts, alert.ts, ...
    styles/          — globals.css (Tailwind @theme block here)
  api/src/
    routes/          — Express routers, all have @swagger JSDoc
    services/        — Business logic (device, vehicle, alert, geofence, report, user, tracking)
    db/              — Drizzle schema + connection
    middleware/      — auth (verifyToken, requireRole), validate (422 on fail), error
    test/
      setup.ts       — Global Vitest mocks (db, logger, websocket, auth middleware)
      routes/        — Route integration tests (supertest, 158 tests total)
```

## Navigation Config

Adding a new menu item: edit **`apps/admin-web/src/config/navigation.ts`** only.
- `topMenuItems` — top bar modules (Monitor, Fleet, etc.)
- `sidebarMenus[module].items` — left sidebar per module

## Adding a New Monitor Sub-page (checklist)

1. Create `apps/admin-web/src/pages/monitor/NewPage.tsx`
2. Export from `apps/admin-web/src/pages/monitor/index.ts`
3. Add route in `apps/admin-web/src/App.tsx`
4. Add sidebar item in `apps/admin-web/src/config/navigation.ts` under `monitor.items`

## GitHub Issues / PR Conventions

- Issues and PRs created via `gh` CLI
- Branch: feature work stays on `main`, merge to `staging` via PR
- Commit format: `feat(scope):`, `fix(scope):`, `test(scope):`, `docs(scope):`
