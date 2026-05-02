import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteDialog } from '../components/device/DeleteDialog';

describe('DeleteDialog', () => {
  it('does not render when open=false', () => {
    render(
      <DeleteDialog open={false} deviceName="Tracker A" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open=true', () => {
    render(
      <DeleteDialog open deviceName="Tracker A" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows device name in confirmation message', () => {
    render(
      <DeleteDialog open deviceName="Tracker Alpha" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText(/Tracker Alpha/)).toBeInTheDocument();
  });

  it('renders Delete and Cancel buttons', () => {
    render(
      <DeleteDialog open deviceName="X" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onConfirm when Delete button clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <DeleteDialog open deviceName="X" onConfirm={onConfirm} onCancel={vi.fn()} />
    );
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel button clicked', async () => {
    const onCancel = vi.fn();
    render(
      <DeleteDialog open deviceName="X" onConfirm={vi.fn()} onCancel={onCancel} />
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Delete button has destructive styling', () => {
    render(
      <DeleteDialog open deviceName="X" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    expect(deleteBtn.className).toMatch(/danger|red|destructive/i);
  });
});
