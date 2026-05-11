import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapView } from '../components/monitor/MapView';
import type { Device } from '../types/device';

// Leaflet relies on browser APIs not available in jsdom
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Marker: ({ children, zIndexOffset }: any) => (
    <div data-testid="map-marker" data-selected={zIndexOffset === 1000 ? 'true' : 'false'}>{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-popup">{children}</div>
  ),
  useMap: () => ({ setView: vi.fn(), flyTo: vi.fn() }),
}));

const makeDevice = (overrides: Partial<Device> = {}): Device => ({
  id: '1',
  name: 'Device A',
  imei: '111111111111111',
  model: 'GT06',
  status: 'online',
  groupId: null,
  lat: -6.2,
  lng: 106.8,
  speed: 45,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const devices: Device[] = [
  makeDevice({ id: '1', name: 'Truck Alpha', lat: -6.2, lng: 106.8, status: 'online' }),
  makeDevice({ id: '2', name: 'Van Beta', lat: -6.3, lng: 106.9, status: 'offline' }),
  makeDevice({ id: '3', name: 'No Location', lat: null, lng: null, status: 'online' }),
];

describe('MapView', () => {
  it('renders the map container', () => {
    render(<MapView devices={devices} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders a tile layer', () => {
    render(<MapView devices={devices} />);
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('renders markers only for devices with coordinates', () => {
    render(<MapView devices={devices} />);
    // Truck Alpha and Van Beta have coords; No Location does not
    const markers = screen.getAllByTestId('map-marker');
    expect(markers).toHaveLength(2);
  });

  it('renders popup with device name inside marker', () => {
    render(<MapView devices={devices} />);
    expect(screen.getByText('Truck Alpha')).toBeInTheDocument();
    expect(screen.getByText('Van Beta')).toBeInTheDocument();
  });

  it('renders popup with device status', () => {
    render(<MapView devices={devices} />);
    const popups = screen.getAllByTestId('map-popup');
    expect(popups[0]).toHaveTextContent('online');
    expect(popups[1]).toHaveTextContent('offline');
  });

  it('renders popup with speed when available', () => {
    render(<MapView devices={devices} />);
    expect(screen.getAllByText(/45\s*km\/h/)[0]).toBeInTheDocument();
  });

  it('does not render marker for device with null coordinates', () => {
    render(<MapView devices={[makeDevice({ lat: null, lng: null })]} />);
    expect(screen.queryByTestId('map-marker')).not.toBeInTheDocument();
  });

  it('highlights selected device marker', () => {
    render(<MapView devices={devices} selectedId="1" />);
    const markers = screen.getAllByTestId('map-marker');
    // first marker (Truck Alpha) should have selected attribute
    expect(markers[0]).toHaveAttribute('data-selected', 'true');
  });

  it('calls onSelect when a popup is clicked', async () => {
    const onSelect = vi.fn();
    render(<MapView devices={devices} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('Truck Alpha'));

    expect(onSelect).toHaveBeenCalledWith(devices[0]);
  });
});
