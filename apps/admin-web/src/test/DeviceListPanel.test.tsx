import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeviceListPanel } from '../components/monitor/DeviceListPanel';
import type { Device } from '../types/device';

const makeDevice = (overrides: Partial<Device> = {}): Device => ({
  id: '1',
  name: 'Device A',
  imei: '123456789012345',
  model: 'GT06',
  status: 'online',
  groupId: null,
  lat: -6.2,
  lng: 106.8,
  speed: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const devices: Device[] = [
  makeDevice({ id: '1', name: 'Truck Alpha', imei: '111111111111111', status: 'online' }),
  makeDevice({ id: '2', name: 'Van Beta', imei: '222222222222222', status: 'offline' }),
  makeDevice({ id: '3', name: 'Car Gamma', imei: '333333333333333', status: 'online' }),
  makeDevice({ id: '4', name: 'Bus Delta', imei: '444444444444444', status: 'inactive' }),
];

describe('DeviceListPanel', () => {
  it('renders all device cards when no filter applied', () => {
    render(<DeviceListPanel devices={devices} onSelect={vi.fn()} />);

    expect(screen.getByText('Truck Alpha')).toBeInTheDocument();
    expect(screen.getByText('Van Beta')).toBeInTheDocument();
    expect(screen.getByText('Car Gamma')).toBeInTheDocument();
    expect(screen.getByText('Bus Delta')).toBeInTheDocument();
  });

  it('renders device count badge', () => {
    render(<DeviceListPanel devices={devices} onSelect={vi.fn()} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('filters devices by search query (name)', async () => {
    render(<DeviceListPanel devices={devices} onSelect={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText(/search/i);

    await userEvent.type(searchInput, 'truck');

    expect(screen.getByText('Truck Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Van Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Car Gamma')).not.toBeInTheDocument();
  });

  it('filters devices by search query (IMEI)', async () => {
    render(<DeviceListPanel devices={devices} onSelect={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText(/search/i);

    await userEvent.type(searchInput, '2222');

    expect(screen.getByText('Van Beta')).toBeInTheDocument();
    expect(screen.queryByText('Truck Alpha')).not.toBeInTheDocument();
  });

  it('shows All / Online / Offline filter tabs', () => {
    render(<DeviceListPanel devices={devices} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /^all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^online/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^offline/i })).toBeInTheDocument();
  });

  it('filters to online devices when Online tab clicked', async () => {
    render(<DeviceListPanel devices={devices} onSelect={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /^online/i }));

    expect(screen.getByText('Truck Alpha')).toBeInTheDocument();
    expect(screen.getByText('Car Gamma')).toBeInTheDocument();
    expect(screen.queryByText('Van Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Bus Delta')).not.toBeInTheDocument();
  });

  it('filters to offline devices when Offline tab clicked', async () => {
    render(<DeviceListPanel devices={devices} onSelect={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /^offline/i }));

    expect(screen.getByText('Van Beta')).toBeInTheDocument();
    expect(screen.queryByText('Truck Alpha')).not.toBeInTheDocument();
    expect(screen.queryByText('Car Gamma')).not.toBeInTheDocument();
  });

  it('shows all devices again when All tab clicked after filter', async () => {
    render(<DeviceListPanel devices={devices} onSelect={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /^online/i }));
    await userEvent.click(screen.getByRole('button', { name: /^all/i }));

    expect(screen.getByText('Van Beta')).toBeInTheDocument();
    expect(screen.getByText('Bus Delta')).toBeInTheDocument();
  });

  it('calls onSelect with device when card is clicked', async () => {
    const onSelect = vi.fn();
    render(<DeviceListPanel devices={devices} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('Truck Alpha'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(devices[0]);
  });

  it('shows online badge on online device', () => {
    render(<DeviceListPanel devices={[devices[0]]} onSelect={vi.fn()} />);
    expect(screen.getByText('online')).toBeInTheDocument();
  });

  it('shows offline badge on offline device', () => {
    render(<DeviceListPanel devices={[devices[1]]} onSelect={vi.fn()} />);
    expect(screen.getByText('offline')).toBeInTheDocument();
  });

  it('is collapsible — hide list when collapse button clicked', async () => {
    render(<DeviceListPanel devices={devices} onSelect={vi.fn()} />);

    const collapseBtn = screen.getByRole('button', { name: /collapse/i });
    await userEvent.click(collapseBtn);

    expect(screen.queryByText('Truck Alpha')).not.toBeInTheDocument();
  });

  it('shows list again when expand button clicked after collapse', async () => {
    render(<DeviceListPanel devices={devices} onSelect={vi.fn()} />);

    const collapseBtn = screen.getByRole('button', { name: /collapse/i });
    await userEvent.click(collapseBtn);

    const expandBtn = screen.getByRole('button', { name: /expand/i });
    await userEvent.click(expandBtn);

    expect(screen.getByText('Truck Alpha')).toBeInTheDocument();
  });

  it('renders empty state when no devices match filter', async () => {
    render(<DeviceListPanel devices={devices} onSelect={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText(/search/i);

    await userEvent.type(searchInput, 'zzz-no-match');

    expect(screen.getByText(/no devices/i)).toBeInTheDocument();
  });
});
