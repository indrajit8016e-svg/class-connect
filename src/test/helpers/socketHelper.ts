import { vi } from 'vitest';

export const createMockSocket = () => {
  const handlers: Record<string, ((data: any) => void)[]> = {};

  const socket = {
    connected: false,
    connect: vi.fn(() => {
      socket.connected = true;
      if (handlers['connect']) {
        handlers['connect'].forEach(cb => cb({}));
      }
    }),
    disconnect: vi.fn(() => {
      socket.connected = false;
      if (handlers['disconnect']) {
        handlers['disconnect'].forEach(cb => cb({}));
      }
    }),
    emit: vi.fn((event: string, data: any) => {
      // Logic for testing emissions
    }),
    on: vi.fn((event: string, cb: (data: any) => void) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(cb);
    }),
    off: vi.fn((event: string, cb: (data: any) => void) => {
      if (handlers[event]) {
        handlers[event] = handlers[event].filter(h => h !== cb);
      }
    }),
    // Helper to simulate receiving an event
    mockReceive: (event: string, data: any) => {
      if (handlers[event]) {
        handlers[event].forEach(cb => cb(data));
      }
    }
  };

  return socket;
};
