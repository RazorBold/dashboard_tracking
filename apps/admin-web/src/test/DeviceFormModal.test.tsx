import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeviceFormModal } from '../components/device/DeviceFormModal';
import type { Device } from '../types/device';

const existingDevice: Device = {
  id: '1',
  name: 'Tracker Alpha',
  imei: '111111111111111',
  model: 'GT06',
  status: 'online',
  groupId: null,
  lat: null,
  lng: null,
  speed: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('DeviceFormModal — create mode', () => {
  it('renders modal with Create title when no device passed', () => {
    render(<DeviceFormModal open onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText(/add device/i)).toBeInTheDocument();
  });

  it('renders name, IMEI, and model fields', () => {
    render(<DeviceFormModal open onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/imei/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
  });

  it('fields are empty in create mode', () => {
    render(<DeviceFormModal open onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/imei/i)).toHaveValue('');
    expect(screen.getByLabelText(/model/i)).toHaveValue('');
  });

  it('calls onSubmit with form values on valid submit', async () => {
    const onSubmit = vi.fn();
    render(<DeviceFormModal open onClose={vi.fn()} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/name/i), 'New Tracker');
    await userEvent.type(screen.getByLabelText(/imei/i), '123456789012345');
    await userEvent.type(screen.getByLabelText(/model/i), 'GT06N');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'New Tracker',
        imei: '123456789012345',
        model: 'GT06N',
      });
    });
  });

  it('shows validation error when name is empty', async () => {
    render(<DeviceFormModal open onClose={vi.fn()} onSubmit={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/imei/i), '123456789012345');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when IMEI is too short', async () => {
    render(<DeviceFormModal open onClose={vi.fn()} onSubmit={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/name/i), 'Test');
    await userEvent.type(screen.getByLabelText(/imei/i), '1234');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/15/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when IMEI contains non-digits', async () => {
    render(<DeviceFormModal open onClose={vi.fn()} onSubmit={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/name/i), 'Test');
    await userEvent.type(screen.getByLabelText(/imei/i), 'ABCDE12345678901');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/digit/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when Cancel button clicked', async () => {
    const onClose = vi.fn();
    render(<DeviceFormModal open onClose={onClose} onSubmit={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when open=false', () => {
    render(<DeviceFormModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
  });
});

describe('DeviceFormModal — edit mode', () => {
  it('renders modal with Edit title when device is passed', () => {
    render(
      <DeviceFormModal open device={existingDevice} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(screen.getByText(/edit device/i)).toBeInTheDocument();
  });

  it('pre-fills fields with existing device values', () => {
    render(
      <DeviceFormModal open device={existingDevice} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(screen.getByLabelText(/name/i)).toHaveValue('Tracker Alpha');
    expect(screen.getByLabelText(/model/i)).toHaveValue('GT06');
  });

  it('IMEI field is disabled in edit mode', () => {
    render(
      <DeviceFormModal open device={existingDevice} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(screen.getByLabelText(/imei/i)).toBeDisabled();
  });

  it('calls onSubmit with updated values (without IMEI) on save', async () => {
    const onSubmit = vi.fn();
    render(
      <DeviceFormModal open device={existingDevice} onClose={vi.fn()} onSubmit={onSubmit} />
    );

    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Name');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Name' })
      );
    });
  });
});
