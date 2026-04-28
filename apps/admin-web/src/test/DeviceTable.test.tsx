import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeviceTable } from '../components/device/DeviceTable';
import type { Device } from '../types/device';

const makeDevice = (overrides: Partial<Device> = {}): Device => ({
  id: '1',
  name: 'Tracker A',
  imei: '111111111111111',
  model: 'GT06',
  status: 'online',
  groupId: null,
  lat: null,
  lng: null,
  speed: null,
  createdAt: '2024-01-15T08:00:00.000Z',
  updatedAt: '2024-01-15T08:00:00.000Z',
  ...overrides,
});

const devices: Device[] = [
  makeDevice({ id: '1', name: 'Tracker Alpha', imei: '111111111111111', status: 'online', model: 'GT06' }),
  makeDevice({ id: '2', name: 'Tracker Beta', imei: '222222222222222', status: 'offline', model: 'TK103' }),
  makeDevice({ id: '3', name: 'Tracker Gamma', imei: '333333333333333', status: 'inactive', model: null }),
];

describe('DeviceTable', () => {
  it('renders table with column headers', () => {
    render(<DeviceTable devices={devices} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /imei/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /model/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
  });

  it('renders a row for each device', () => {
    render(<DeviceTable devices={devices} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const rows = screen.getAllByRole('row');
    // 1 header row + 3 data rows
    expect(rows).toHaveLength(4);
  });

  it('displays device name, IMEI, model, and status in each row', () => {
    render(<DeviceTable devices={devices} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Tracker Alpha')).toBeInTheDocument();
    expect(screen.getByText('111111111111111')).toBeInTheDocument();
    expect(screen.getByText('GT06')).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();

    expect(screen.getByText('Tracker Beta')).toBeInTheDocument();
    expect(screen.getByText('TK103')).toBeInTheDocument();
    expect(screen.getByText('offline')).toBeInTheDocument();
  });

  it('shows dash when model is null', () => {
    render(<DeviceTable devices={devices} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders Edit and Delete buttons for each row', () => {
    render(<DeviceTable devices={devices} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    const deleteBtns = screen.getAllByRole('button', { name: /delete/i });

    expect(editBtns).toHaveLength(3);
    expect(deleteBtns).toHaveLength(3);
  });

  it('calls onEdit with the correct device when Edit clicked', async () => {
    const onEdit = vi.fn();
    render(<DeviceTable devices={devices} onEdit={onEdit} onDelete={vi.fn()} />);

    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editBtns[0]);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(devices[0]);
  });

  it('calls onDelete with the correct device when Delete clicked', async () => {
    const onDelete = vi.fn();
    render(<DeviceTable devices={devices} onEdit={vi.fn()} onDelete={onDelete} />);

    const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteBtns[1]);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(devices[1]);
  });

  it('renders empty state when devices array is empty', () => {
    render(<DeviceTable devices={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/no devices/i)).toBeInTheDocument();
  });

  it('highlights online status with green color class', () => {
    render(<DeviceTable devices={[devices[0]]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const badge = screen.getByText('online');
    expect(badge.className).toMatch(/green|success/i);
  });

  it('highlights offline status with gray color class', () => {
    render(<DeviceTable devices={[devices[1]]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const badge = screen.getByText('offline');
    expect(badge.className).toMatch(/gray|slate/i);
  });
});
