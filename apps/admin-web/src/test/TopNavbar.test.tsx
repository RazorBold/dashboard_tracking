import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TopNavbar } from '../components/layout/TopNavbar';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

// Mock axiosClient so logout API call doesn't fail
vi.mock('../utils/axiosClient', () => ({
  default: { post: vi.fn().mockResolvedValue({}) },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

function renderNavbar(path = '/monitor/objects') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TopNavbar />
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuthStore.setState({
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
    token: 'mock-token',
    isAuthenticated: true,
  });
  useUIStore.setState({
    sidebarCollapsed: false,
    sidebarOpen: false,
    activeModule: 'monitor',
    isMobileMenuOpen: false,
  });
});

describe('TopNavbar', () => {
  it('renders the app logo', () => {
    renderNavbar();
    expect(screen.getByText('IoT Tracking')).toBeInTheDocument();
  });

  it('renders all 5 top-level nav items', () => {
    renderNavbar();
    expect(screen.getByText('Monitor')).toBeInTheDocument();
    expect(screen.getByText('Report')).toBeInTheDocument();
    expect(screen.getByText('Device')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Fleet')).toBeInTheDocument();
  });

  it('renders the notification bell button', () => {
    renderNavbar();
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('renders user name in navbar', () => {
    renderNavbar();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders user initials in avatar', () => {
    renderNavbar();
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('opens user dropdown on click', async () => {
    renderNavbar();
    const trigger = screen.getByRole('button', { name: /TU/i });
    await userEvent.click(trigger);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    renderNavbar();
    const trigger = screen.getByRole('button', { name: /TU/i });
    await userEvent.click(trigger);
    expect(screen.getByText('Logout')).toBeInTheDocument();
    await userEvent.click(document.body);
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('toggles mobile menu on hamburger click', async () => {
    renderNavbar();
    const hamburger = screen.getByLabelText('Toggle menu');
    await userEvent.click(hamburger);
    expect(useUIStore.getState().isMobileMenuOpen).toBe(true);
    await userEvent.click(hamburger);
    expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
  });
});
