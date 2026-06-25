import '@testing-library/jest-dom';

import { server } from '@/mocks/server';

// Polyfill ResizeObserver para componentes Radix (Tooltip, Popover, Dialog)
// que lo usan para calcular posicionamiento.
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserverPolyfill {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ResizeObserver = ResizeObserverPolyfill;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = ResizeObserverPolyfill;
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
