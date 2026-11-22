import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Courier workspace (demo mode)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.stubEnv('VITE_COURIER_API_URL', '');
    vi.stubEnv('VITE_COURIER_LOCAL_ACCESS', '');
  });
  afterEach(() => vi.unstubAllEnvs());

  it("shows today's active demo deliveries when embedded in the dashboard", async () => {
    const { default: CourierApp } = await import('./CourierApp');
    render(<CourierApp embedded />);

    expect(await screen.findByText('SD-000130')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Your deliveries, today.' })).toBeInTheDocument();
    // Completed deliveries are not in the active tab.
    expect(screen.queryByText('SD-000128')).not.toBeInTheDocument();
  });
});