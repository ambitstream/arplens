import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest globals are disabled, so Testing Library cannot register its
// automatic cleanup hook itself — without this, rendered DOM leaks
// between tests in the same file.
afterEach(cleanup);
