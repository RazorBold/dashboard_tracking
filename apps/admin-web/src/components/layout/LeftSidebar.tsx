import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { sidebarMenus } from '../../config/navigation';

export function LeftSidebar() {
  const location = useLocation();
  const {
    sidebarCollapsed,
    toggleSidebar,
    activeModule,
    sidebarOpen,
    setSidebarOpen,
  } = useUIStore();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  const config = sidebarMenus[activeModule];

  // Don't render sidebar if module has no items (e.g. Video)
  if (!config || config.items.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`left-sidebar ${sidebarCollapsed ? 'left-sidebar--collapsed' : ''} ${sidebarOpen ? 'left-sidebar--open' : ''}`}
      >
        {/* Sidebar header */}
        <div className="left-sidebar__header">
          {!sidebarCollapsed && (
            <h3 className="left-sidebar__title">{config.title}</h3>
          )}
          <button
            className="left-sidebar__toggle"
            onClick={toggleSidebar}
            id="sidebar-toggle"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Sidebar nav items */}
        <nav className="left-sidebar__nav">
          {config.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) =>
                  `left-sidebar__item ${isActive ? 'left-sidebar__item--active' : ''}`
                }
                id={`sidebar-${item.key}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={20} className="left-sidebar__item-icon" />
                {!sidebarCollapsed && (
                  <span className="left-sidebar__item-label">{item.label}</span>
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`left-sidebar__item-badge ${sidebarCollapsed ? 'left-sidebar__item-badge--mini' : ''}`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="left-sidebar__footer">
          {!sidebarCollapsed && (
            <p className="left-sidebar__version">v1.0.0</p>
          )}
        </div>
      </aside>
    </>
  );
}
