import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { beforeEach, afterEach, vi } from 'vitest';

// Tests must never inherit a developer's live API address; individual clients use mocked fetch.
beforeEach(() => vi.stubEnv('VITE_API_URL', ''));
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });
