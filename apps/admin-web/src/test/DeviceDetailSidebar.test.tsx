import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeviceDetailSidebar } from '../components/monitor/DeviceDetailSidebar';
import type { Device } from '../types/device';

const onlineDevice: Device = {
  id: '1',
  name: 'Truck Alpha',
  imei: '111111111111111',
  model: 'GT06N',
  status: 'online',
  groupId: null,
  lat: -6.2088,
  lng: 106.8456,
  speed: 45,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const offlineDevice: Device = {
  ...onlineDevice,
  id: '2',
  name: 'Van Beta',
  status: 'offline',
  speed: 0,
  lat: -7.25,
  lng: 112.75,
};

const noLocationDevice: Device = {
  ...onlineDevice,
  id: '3',
  name: 'Sensor X',
  lat: null,
  lng: null,
  speed: null,
};

describe('DeviceDetailSidebar', () => {
  it('does not render when device is undefined', () => {
    const { container } = render(
      <DeviceDetailSidebar device={undefined} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders sidebar with device name in header', () => {
    render(<DeviceDetailSidebar device={onlineDevice} onClose={vi.fn()} />);
    expect(screen.getByText('Truck Alpha')).toBeInTheDocument();
  });

  it('renders device IMEI', () => {
    render(<DeviceDetailSidebar device={onlineDevice} onClose={vi.fn()} />);
    expect(screen.getByText('111111111111111')).toBeInTheDocument();
  });

  it('renders device model', () => {
    render(<DeviceDetailSidebar device={onlineDevice} onClose={vi.fn()} />);
    expect(screen.getByText('GT06N')).toBeInTheDocument();
  });

  it('renders online status badge', () => {
    render(<DeviceDetailSidebar device={onlineDevice} onClose={vi.fn()} />);
    expect(screen.getByText('online')).toBeInTheDocument();
  });

  it('renders offline status badge', () => {
    render(<DeviceDetailSidebar device={offlineDevice} onClose={vi.fn()} />);
    expect(screen.getByText('offline')).toBeInTheDocument();
  });

  it('calls onClose when × button clicked', async () => {
    const onClose = vi.fn();
    render(<DeviceDetailSidebar device={onlineDevice} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders coordinates in decimal format by default', () => {
    render(<DeviceDetailSidebar device={onlineDevice} onClose={vi.fn()} />);
    expect(screen.getByText(/-6\.2088/)).toBeInTheDocument();
    expect(screen.getByText(/106\.8456/)).toBeInTheDocument();
  });

  it('toggles coordinates to DMS format when toggle clicked', async () => {
    render(<DeviceDetailSidebar device={onlineDevice} onClose={vi.fn()} />);
    const toggleBtn = screen.getByRole('button', { name: /dms/i });
    await userEvent.click(toggleBtn);
    // DMS format contains °, ', "
    const coordSection = screen.getByTestId('coordinates');
    expect(coordSection.textContent).toMatch(/°/);
  });

  it('toggles back to decimal format when toggle clicked again', async () => {
    render(<DeviceDetailSidebar device={onlineDevice} onClose={vi.fn()} />);
    const toggleBtn = screen.getByRole('button', { name: /dms/i });
    await userEvent.click(toggleBtn);
    const decBtn = screen.getByRole('button', { name: /decimal/i });
    await userEvent.click(decBtn);
    expect(screen.getByText(/-6\.2088/)).toBeInTheDocument();
  });

  it('shows speed when available', () => {
    render(<DeviceDetailSidebar device={onlineDevice} onClose={vi.fn()} />);
    expect(screen.getByText(/45\s*km\/h/)).toBeInTheDocument();
  });

  it('shows 0 km/h when speed is 0', () => {
    render(<DeviceDetailSidebar device={offlineDevice} onClose={vi.fn()} />);
    expect(screen.getByText(/0\s*km\/h/)).toBeInTheDocument();
  });

  it('shows no location message when lat/lng are null', () => {
    render(<DeviceDetailSidebar device={noLocationDevice} onClose={vi.fn()} />);
    expect(screen.getByText(/no location/i)).toBeInTheDocument();
  });

  it('does not render coordinates section when lat/lng are null', () => {
    render(<DeviceDetailSidebar device={noLocationDevice} onClose={vi.fn()} />);
    expect(screen.queryByTestId('coordinates')).not.toBeInTheDocument();
  });

  it('renders Live and Device tab buttons', () => {
    render(<DeviceDetailSidebar device={onlineDevice} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^live$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^device$/i })).toBeInTheDocument();
  });

  it('Live tab is active by default', () => {
    render(<DeviceDetailSidebar device={onlineDevice} onClose={vi.fn()} />);
    const liveTab = screen.getByRole('button', { name: /^live$/i });
    expect(liveTab.className).toMatch(/active/i);
  });

  it('switches to Device tab when clicked', async () => {
    render(<DeviceDetailSidebar device={onlineDevice} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /^device$/i }));
    const deviceTab = screen.getByRole('button', { name: /^device$/i });
    expect(deviceTab.className).toMatch(/active/i);
  });

  it('accepts optional address prop and renders it', () => {
    render(
      <DeviceDetailSidebar
        device={onlineDevice}
        onClose={vi.fn()}
        address="Jl. Sudirman No.1, Jakarta"
      />
    );
    expect(screen.getByText('Jl. Sudirman No.1, Jakarta')).toBeInTheDocument();
  });

  it('shows loading address indicator when addressLoading is true', () => {
    render(
      <DeviceDetailSidebar
        device={onlineDevice}
        onClose={vi.fn()}
        addressLoading
      />
    );
    expect(screen.getByText(/loading address/i)).toBeInTheDocument();
  });
});
