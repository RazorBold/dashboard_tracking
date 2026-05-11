import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { DeviceDetailSidebar } from './DeviceDetailSidebar';
import type { Device } from '../../types/device';

const mockDevice: Device = {
  id: 'd1',
  name: 'Test Device 1',
  imei: '861122334455667',
  model: 'GT06N',
  status: 'online',
  lat: -6.2,
  lng: 106.8,
  speed: 45,
  // New dummy fields
  accStatus: true,
  parkedDuration: '',
  batteryVoltage: '12.4V',
  batteryLevel: 85,
  gnssType: 'GPS+BDS',
  satellites: 12,
  gsmSignal: 25,
  gsmSignalLabel: '4G (Strong)',
  lastOnline: '2026-04-29T00:00:00.000Z',
  positionTimestamp: '2026-04-29T00:00:00.000Z',
  todayMileage: 124.5,
  vehicle: {
    ownerName: 'Budi Santoso',
    phone: '08123456789',
    plateNo: 'B 1234 ABC',
    make: 'Toyota',
    model: 'Avanza',
    vin: 'MHF1234567890',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('DeviceDetailSidebar', () => {
  it('should render nothing if device is undefined', () => {
    const { container } = render(<DeviceDetailSidebar device={undefined} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render basic device header', () => {
    render(<DeviceDetailSidebar device={mockDevice} onClose={vi.fn()} />);
    expect(screen.getByText('Test Device 1')).toBeInTheDocument();
    expect(screen.getByText('861122334455667')).toBeInTheDocument();
  });

  it('should display moving status with speed when acc is true and speed > 0', () => {
    render(<DeviceDetailSidebar device={mockDevice} onClose={vi.fn()} />);
    expect(screen.getByText('Moving (45 km/h)')).toBeInTheDocument();
  });

  it('should render new bottom tabs', () => {
    render(<DeviceDetailSidebar device={mockDevice} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Live' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tracks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Device' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Command' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configure' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  it('should display telemetry data in Device tab', async () => {
    const user = userEvent.setup();
    render(<DeviceDetailSidebar device={mockDevice} onClose={vi.fn()} />);
    
    // Check Battery (in Live tab)
    expect(screen.getByText('12.4V (85%)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Device' }));
    
    // Check GNSS and Network
    expect(screen.getByText('GPS+BDS')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // Satellites
    expect(screen.getByText('4G (Strong)')).toBeInTheDocument();
    
    // Check Vehicle Info
    expect(screen.getByText('B 1234 ABC')).toBeInTheDocument();
    expect(screen.getByText('Toyota Avanza')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
  });
});
