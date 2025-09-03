/**
 * Test setup configuration and global test utilities
 */

import '@testing-library/jest-dom';

// Global test configuration
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset console methods
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock IntersectionObserver globally
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver globally
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia globally
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo globally
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock getComputedStyle globally
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn().mockImplementation(() => 'mock-object-url'),
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock WebSocket globally
global.WebSocket = jest.fn(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
})) as any;

// Mock crypto for secure random values
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: jest.fn().mockReturnValue('mock-uuid'),
  },
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn().mockReturnValue(Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn().mockReturnValue([]),
    getEntriesByName: jest.fn().mockReturnValue([]),
  },
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn().mockImplementation((cb) => {
  return setTimeout(cb, 0);
});

// Mock cancelAnimationFrame
global.cancelAnimationFrame = jest.fn().mockImplementation((id) => {
  clearTimeout(id);
});

// Mock setTimeout and setInterval for better control
jest.useFakeTimers();

// Global test helpers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
    }
  }
}

// Custom matchers
expect.extend({
  toHaveFocus(received) {
    const pass = received === document.activeElement;
    return {
      pass,
      message: () => `Expected element ${pass ? 'not ' : ''}to have focus`,
    };
  },
  toHaveFormValues(received, expectedValues) {
    const form = received;
    const formData = new FormData(form);
    const actualValues = Object.fromEntries(formData.entries());
    
    const pass = Object.keys(expectedValues).every(
      key => actualValues[key] === expectedValues[key]
    );
    
    return {
      pass,
      message: () => {
        if (pass) {
          return `Expected form not to have values ${JSON.stringify(expectedValues)}`;
        } else {
          return `Expected form to have values ${JSON.stringify(expectedValues)}, but got ${JSON.stringify(actualValues)}`;
        }
      },
    };
  },
});

// Global test utilities
export const mockConsoleError = () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  return () => consoleSpy.mockRestore();
};

export const mockConsoleWarn = () => {
  const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
  return () => consoleSpy.mockRestore();
};

export const advanceTimers = (ms: number) => {
  jest.advanceTimersByTime(ms);
};

export const flushPromises = () => {
  return new Promise(resolve => setImmediate(resolve));
};

export const waitForNextTick = () => {
  return new Promise(resolve => process.nextTick(resolve));
};

// Environment helpers
export const setTestEnvironment = (env: 'development' | 'production') => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  return () => {
    process.env.NODE_ENV = originalEnv;
  };
};

// Mock cleanup helpers
export const cleanupMocks = () => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
};

// Global test configuration
export const testConfig = {
  timeout: 10000,
  retries: 2,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

