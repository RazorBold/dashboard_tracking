import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumb } from '../components/layout/Breadcrumb';

function renderWithRouter(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Breadcrumb />
    </MemoryRouter>
  );
}

describe('Breadcrumb', () => {
  it('renders nothing for a single-segment path', () => {
    const { container } = renderWithRouter('/monitor');
    expect(container.firstChild).toBeNull();
  });

  it('renders breadcrumb for /monitor/objects', () => {
    renderWithRouter('/monitor/objects');
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText('Monitor')).toBeInTheDocument();
    expect(screen.getByText('Objects')).toBeInTheDocument();
  });

  it('renders breadcrumb for /fleet/route-plan', () => {
    renderWithRouter('/fleet/route-plan');
    expect(screen.getByText('Fleet')).toBeInTheDocument();
    expect(screen.getByText('Route Planning')).toBeInTheDocument();
  });

  it('renders breadcrumb for /report/my-report', () => {
    renderWithRouter('/report/my-report');
    expect(screen.getByText('Report')).toBeInTheDocument();
    expect(screen.getByText('My Report')).toBeInTheDocument();
  });

  it('renders home icon link to monitor/objects', () => {
    renderWithRouter('/monitor/objects');
    // Home link contains only an SVG icon, so query by href
    const homeLink = document.querySelector('a[href="/monitor/objects"]');
    expect(homeLink).toBeInTheDocument();
  });

  it('last crumb is not a link', () => {
    renderWithRouter('/monitor/alerts');
    expect(screen.getByText('Alerts').tagName).toBe('SPAN');
  });

  it('parent crumb is a link', () => {
    renderWithRouter('/monitor/alerts');
    const monitorLink = screen.getByRole('link', { name: 'Monitor' });
    expect(monitorLink).toBeInTheDocument();
    expect(monitorLink).toHaveAttribute('href', '/monitor');
  });
});
