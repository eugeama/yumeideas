import '@testing-library/jest-dom'

// Mock para Firebase si es necesario
global.console = {
  ...console,
  error: jest.fn(), // Silenciar errores esperados en tests
  warn: jest.fn(),
}
