import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock window.confirm for tests
Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true)
})

// Mock window.alert for tests
Object.defineProperty(window, 'alert', {
  value: vi.fn()
})

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
}) 