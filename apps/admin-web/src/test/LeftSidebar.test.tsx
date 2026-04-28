import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LeftSidebar } from '../components/layout/LeftSidebar';
import { useUIStore } from '../stores/uiStore';

function renderSidebar() {
  return render(
    <MemoryRouter>
      <LeftSidebar />
    </MemoryRouter>
  );
}

beforeEach(() => {
  useUIStore.setState({
    sidebarCollapsed: false,
    sidebarOpen: false,
    activeModule: 'monitor',
    isMobileMenuOpen: false,
  });
});

describe('LeftSidebar — monitor module', () => {
  it('renders Monitor sidebar items', () => {
    renderSidebar();
    expect(screen.getByText('Objects')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Tracks')).toBeInTheDocument();
    expect(screen.getByText('Multi-track')).toBeInTheDocument();
  });

  it('renders sidebar title', () => {
    renderSidebar();
    expect(screen.getByText('Monitor')).toBeInTheDocument();
  });

  it('toggles collapse on button click', async () => {
    renderSidebar();
    const toggleBtn = screen.getByLabelText(/collapse sidebar/i);
    await userEvent.click(toggleBtn);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it('hides item labels when collapsed', async () => {
    renderSidebar();
    const toggleBtn = screen.getByLabelText(/collapse sidebar/i);
    await userEvent.click(toggleBtn);
    // Labels should not be visible when collapsed
    expect(screen.queryByText('Objects')).not.toBeInTheDocument();
  });

  it('shows expand label on toggle button when collapsed', async () => {
    useUIStore.setState({ sidebarCollapsed: true });
    renderSidebar();
    expect(screen.getByLabelText(/expand sidebar/i)).toBeInTheDocument();
  });
});

describe('LeftSidebar — fleet module', () => {
  beforeEach(() => {
    useUIStore.setState({ activeModule: 'fleet', sidebarCollapsed: false, sidebarOpen: false, isMobileMenuOpen: false });
  });

  it('renders Fleet sidebar items', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Driver')).toBeInTheDocument();
    expect(screen.getByText('Vehicle')).toBeInTheDocument();
    expect(screen.getByText('Check-in')).toBeInTheDocument();
    expect(screen.getByText('Route Planning')).toBeInTheDocument();
  });
});

describe('LeftSidebar — video module (no sidebar)', () => {
  beforeEach(() => {
    useUIStore.setState({ activeModule: 'video', sidebarCollapsed: false, sidebarOpen: false, isMobileMenuOpen: false });
  });

  it('renders nothing for video module', () => {
    const { container } = renderSidebar();
    expect(container.firstChild).toBeNull();
  });
});
