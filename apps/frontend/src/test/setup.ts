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

// Polyfill Element.prototype.hasPointerCapture para Radix Select en jsdom
// Se verifica directamente en Element.prototype ya que window.hasPointerCapture
// puede existir en Window prototype pero no en Element instances.
if (
  typeof Element !== 'undefined' &&
  !('hasPointerCapture' in Element.prototype)
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Element.prototype as any).hasPointerCapture = function () {
    return false;
  };
}

// Polyfill Element.prototype.scrollIntoView para Radix Select en jsdom
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Element.prototype as any).scrollIntoView = function () {
    // no-op polyfill
  };
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
