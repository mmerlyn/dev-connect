// Environment setup for tests
// Module mocks are handled per-test file using jest.unstable_mockModule() for ESM compatibility
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';
