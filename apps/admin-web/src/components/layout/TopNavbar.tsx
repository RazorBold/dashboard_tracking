import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useAlertStore } from '../../stores/alertStore';
import { topMenuItems } from '../../config/navigation';
import axiosClient from '../../utils/axiosClient';
import toast from 'react-hot-toast';

export function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { setActiveModule, isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const unreadCount = useAlertStore((s) => s.unreadCount);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive active module from path
  useEffect(() => {
    const segment = location.pathname.split('/')[1] || 'monitor';
    const match = topMenuItems.find((m) => m.key === segment);
    if (match) setActiveModule(match.key);
  }, [location.pathname, setActiveModule]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch {
      // continue even if API fails
    }
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const activeModule = location.pathname.split('/')[1] || 'monitor';

  // Get user initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="top-navbar">
      <div className="top-navbar__inner">
        {/* Left: Logo + Mobile menu button */}
        <div className="top-navbar__left">
          <button
            className="top-navbar__mobile-toggle"
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            id="mobile-menu-toggle"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <NavLink to="/monitor/objects" className="top-navbar__logo">
            <div className="top-navbar__logo-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="url(#logo-grad)" />
                <path
                  d="M14 7C10.7 7 8 9.7 8 13c0 4.5 6 11 6 11s6-6.5 6-11c0-3.3-2.7-6-6-6zm0 8.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"
                  fill="white"
                />
                <defs>
                  <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="top-navbar__logo-text">IoT Tracking</span>
          </NavLink>
        </div>

        {/* Center: Navigation */}
        <nav className="top-navbar__nav">
          {topMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.key;
            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={`top-navbar__nav-item ${isActive ? 'top-navbar__nav-item--active' : ''}`}
                id={`nav-${item.key}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="top-navbar__right">
          {/* Notification Bell */}
          <button className="top-navbar__icon-btn" id="notification-bell" aria-label="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="top-navbar__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {/* User dropdown */}
          <div className="top-navbar__user" ref={dropdownRef}>
            <button
              className="top-navbar__user-trigger"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              id="user-dropdown-trigger"
            >
              <div className="top-navbar__avatar">{initials}</div>
              <span className="top-navbar__username">{user?.name || 'User'}</span>
              <ChevronDown
                size={14}
                className={`top-navbar__chevron ${userDropdownOpen ? 'top-navbar__chevron--open' : ''}`}
              />
            </button>

            {userDropdownOpen && (
              <div className="top-navbar__dropdown">
                <div className="top-navbar__dropdown-header">
                  <p className="top-navbar__dropdown-name">{user?.name}</p>
                  <p className="top-navbar__dropdown-email">{user?.email}</p>
                  <span className="top-navbar__dropdown-role">{user?.role}</span>
                </div>
                <div className="top-navbar__dropdown-divider" />
                <button
                  className="top-navbar__dropdown-item"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    // TODO: navigate to profile
                  }}
                  id="dropdown-profile"
                >
                  <User size={16} />
                  <span>Profile</span>
                </button>
                <button
                  className="top-navbar__dropdown-item"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    // TODO: navigate to settings
                  }}
                  id="dropdown-settings"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <div className="top-navbar__dropdown-divider" />
                <button
                  className="top-navbar__dropdown-item top-navbar__dropdown-item--danger"
                  onClick={handleLogout}
                  id="dropdown-logout"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
