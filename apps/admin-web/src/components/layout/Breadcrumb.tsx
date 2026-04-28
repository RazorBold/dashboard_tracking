import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// Map of path segments to readable labels
const segmentLabels: Record<string, string> = {
  monitor: 'Monitor',
  report: 'Report',
  device: 'Device',
  video: 'Video',
  fleet: 'Fleet',
  objects: 'Objects',
  alerts: 'Alerts',
  tracks: 'Tracks',
  'multi-track': 'Multi-track',
  overview: 'Overview',
  'my-report': 'My Report',
  'auto-report': 'Auto Report',
  'task-center': 'Task Center',
  list: 'Device List',
  dashboard: 'Dashboard',
  driver: 'Driver',
  vehicle: 'Vehicle',
  'check-in': 'Check-in',
  'route-plan': 'Route Planning',
};

interface BreadcrumbItem {
  label: string;
  path: string;
}

export function Breadcrumb() {
  const location = useLocation();

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => ({
      label: segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      path: '/' + segments.slice(0, index + 1).join('/'),
    }));
  }, [location.pathname]);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb__list">
        <li className="breadcrumb__item">
          <Link to="/monitor/objects" className="breadcrumb__link">
            <Home size={14} />
          </Link>
        </li>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={crumb.path} className="breadcrumb__item">
              <ChevronRight size={12} className="breadcrumb__separator" />
              {isLast ? (
                <span className="breadcrumb__current">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="breadcrumb__link">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
