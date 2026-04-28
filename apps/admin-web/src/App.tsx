import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Monitor pages
import {
  MonitorObjectsPage,
  MonitorAlertsPage,
  MonitorTracksPage,
  MonitorMultiTrackPage,
} from './pages/monitor';

// Report pages
import {
  ReportOverviewPage,
  MyReportPage,
  AutoReportPage,
  TaskCenterPage,
} from './pages/report';

// Device pages
import { DeviceListPage } from './pages/device';

// Video pages
import { VideoPage } from './pages/video';

// Fleet pages
import {
  FleetDashboardPage,
  DriverPage,
  VehiclePage,
  CheckInPage,
  RoutePlanPage,
} from './pages/fleet';

function App() {
  const hydrate = useAuthStore((state) => state.hydrate);

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with App Shell layout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Monitor */}
            <Route path="/monitor/objects" element={<MonitorObjectsPage />} />
            <Route path="/monitor/alerts" element={<MonitorAlertsPage />} />
            <Route path="/monitor/tracks" element={<MonitorTracksPage />} />
            <Route path="/monitor/multi-track" element={<MonitorMultiTrackPage />} />
            <Route path="/monitor" element={<Navigate to="/monitor/objects" replace />} />

            {/* Report */}
            <Route path="/report/overview" element={<ReportOverviewPage />} />
            <Route path="/report/my-report" element={<MyReportPage />} />
            <Route path="/report/auto-report" element={<AutoReportPage />} />
            <Route path="/report/task-center" element={<TaskCenterPage />} />
            <Route path="/report" element={<Navigate to="/report/overview" replace />} />

            {/* Device */}
            <Route path="/device/list" element={<DeviceListPage />} />
            <Route path="/device" element={<Navigate to="/device/list" replace />} />

            {/* Video */}
            <Route path="/video" element={<VideoPage />} />

            {/* Fleet */}
            <Route path="/fleet/dashboard" element={<FleetDashboardPage />} />
            <Route path="/fleet/driver" element={<DriverPage />} />
            <Route path="/fleet/vehicle" element={<VehiclePage />} />
            <Route path="/fleet/check-in" element={<CheckInPage />} />
            <Route path="/fleet/route-plan" element={<RoutePlanPage />} />
            <Route path="/fleet" element={<Navigate to="/fleet/dashboard" replace />} />

            {/* Dashboard redirect (backward compat) */}
            <Route path="/dashboard" element={<Navigate to="/monitor/objects" replace />} />
          </Route>

          {/* Catch-all */}
          <Route path="/" element={<Navigate to="/monitor/objects" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#059669',
            },
          },
          error: {
            style: {
              background: '#dc2626',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
