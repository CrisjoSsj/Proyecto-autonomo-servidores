/**
 * setupTests.ts
 * Configuración global para tests con Vitest y Testing Library
 */

import '@testing-library/jest-dom';

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock de WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_url: string) {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose();
  });
}

Object.defineProperty(window, 'WebSocket', {
  value: MockWebSocket,
});

// Mock de fetch global
global.fetch = vi.fn();

// Silenciar console.log/error en tests (opcional)
// beforeEach(() => {
//   vi.spyOn(console, 'log').mockImplementation(() => {});
//   vi.spyOn(console, 'error').mockImplementation(() => {});
// });

// Limpiar mocks después de cada test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
});
