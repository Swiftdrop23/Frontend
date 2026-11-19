import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import CourierApp from './CourierApp';

describe('Courier workspace (demo mode)', () => {
  beforeEach(() => localStorage.clear());

  it("shows today's active demo deliveries when embedded in the dashboard", async () => {
    render(<CourierApp embedded />);

    expect(await screen.findByText('SD-000130')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Your deliveries, today.' })).toBeInTheDocument();
    // Completed deliveries are not in the active tab.
    expect(screen.queryByText('SD-000128')).not.toBeInTheDocument();
  });
});
