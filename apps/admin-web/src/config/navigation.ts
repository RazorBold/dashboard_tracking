import {
  Monitor,
  FileText,
  Cpu,
  Video,
  Truck,
  Shield,
  Gauge,
  // Monitor sub-menu
  LayoutGrid,
  AlertTriangle,
  Route,
  Layers,
  // Report sub-menu
  BarChart3,
  FileBarChart,
  CalendarClock,
  ListChecks,
  // Fleet sub-menu
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  Navigation,
  // OBD sub-menu
  Activity,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

// ─── Top Navigation Menu Items ────────────────────────
export interface TopMenuItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const topMenuItems: TopMenuItem[] = [
  { key: 'monitor',  label: 'Monitor',   icon: Monitor,  path: '/monitor' },
  { key: 'report',   label: 'Report',    icon: FileText, path: '/report' },
  { key: 'device',   label: 'Device',    icon: Cpu,      path: '/device' },
  { key: 'video',    label: 'Video',     icon: Video,    path: '/video' },
  { key: 'fleet',    label: 'Fleet',     icon: Truck,    path: '/fleet' },
  { key: 'geofence', label: 'Geo-fence', icon: Shield,   path: '/geofence' },
  { key: 'obd',      label: 'OBD',       icon: Gauge,    path: '/obd' },
];

// ─── Sidebar Menu Items (per Module) ──────────────────
export interface SidebarMenuItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

export interface SidebarConfig {
  title: string;
  items: SidebarMenuItem[];
}

export const sidebarMenus: Record<string, SidebarConfig> = {
  monitor: {
    title: 'Monitor',
    items: [
      { key: 'objects', label: 'Objects', icon: LayoutGrid, path: '/monitor/objects' },
      { key: 'alerts', label: 'Alerts', icon: AlertTriangle, path: '/monitor/alerts' },
      { key: 'tracks', label: 'Tracks', icon: Route, path: '/monitor/tracks' },
      { key: 'multi-track', label: 'Multi-track', icon: Layers, path: '/monitor/multi-track' },
      { key: 'zone', label: 'Zone Monitor', icon: MapPin, path: '/monitor/zone' },
    ],
  },
  report: {
    title: 'Report',
    items: [
      { key: 'overview', label: 'Overview', icon: BarChart3, path: '/report/overview' },
      { key: 'my-report', label: 'My Report', icon: FileBarChart, path: '/report/my-report' },
      { key: 'auto-report', label: 'Auto Report', icon: CalendarClock, path: '/report/auto-report' },
      { key: 'task-center', label: 'Task Center', icon: ListChecks, path: '/report/task-center' },
    ],
  },
  device: {
    title: 'Device',
    items: [
      { key: 'device-list', label: 'Device List', icon: Cpu, path: '/device/list' },
    ],
  },
  video: {
    title: 'Video',
    items: [],
  },
  fleet: {
    title: 'Fleet',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/fleet/dashboard' },
      { key: 'driver', label: 'Driver', icon: Users, path: '/fleet/driver' },
      { key: 'vehicle', label: 'Vehicle', icon: Car, path: '/fleet/vehicle' },
      { key: 'check-in', label: 'Check-in', icon: MapPin, path: '/fleet/check-in' },
      { key: 'route-plan', label: 'Route Planning', icon: Navigation, path: '/fleet/route-plan' },
    ],
  },
  geofence: {
    title: 'Geo-fence',
    items: [
      { key: 'geofences', label: 'Geofences', icon: Shield, path: '/geofence' },
    ],
  },
  obd: {
    title: 'OBD',
    items: [
      { key: 'obd-realtime', label: 'Realtime',    icon: Activity,    path: '/obd/realtime' },
      { key: 'obd-history',  label: 'History',     icon: BarChart3,   path: '/obd/history' },
      { key: 'obd-faults',   label: 'Fault Codes', icon: ShieldAlert, path: '/obd/faults' },
    ],
  },
};
