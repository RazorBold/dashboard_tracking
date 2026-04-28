import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopNavbar } from './TopNavbar';
import { LeftSidebar } from './LeftSidebar';
import { Breadcrumb } from './Breadcrumb';
import { useUIStore } from '../../stores/uiStore';
import { sidebarMenus } from '../../config/navigation';

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, activeModule } = useUIStore();

  // Auto-redirect bare module paths to first sub-item
  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 1) {
      const module = segments[0];
      const config = sidebarMenus[module];
      if (config && config.items.length > 0) {
        navigate(config.items[0].path, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const config = sidebarMenus[activeModule];
  const hasSidebar = config && config.items.length > 0;

  return (
    <div className="main-layout">
      <TopNavbar />
      <div className="main-layout__body">
        {hasSidebar && <LeftSidebar />}
        <main
          className={`main-layout__content ${
            hasSidebar
              ? sidebarCollapsed
                ? 'main-layout__content--sidebar-collapsed'
                : 'main-layout__content--sidebar-expanded'
              : 'main-layout__content--no-sidebar'
          }`}
        >
          <Breadcrumb />
          <div className="main-layout__page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
