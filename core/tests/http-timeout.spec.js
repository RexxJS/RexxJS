/**
 * HTTP_GET timeout test
 * Tests that the timeout parameter actually works
 */

const { httpFunctions } = require('../src/http-functions');

// Mock fetch for testing
global.fetch = jest.fn();

describe('HTTP_GET timeout', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockReset();
  });

  test('should timeout on a hanging connection', async () => {
    // Mock a fetch that hangs until aborted
    fetch.mockImplementation((url, options) => {
      return new Promise((resolve, reject) => {
        // Listen for abort signal
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        }
        // Never resolve - simulates hanging connection
      });
    });

    const startTime = Date.now();
    const result = await httpFunctions.HTTP_GET('http://example.com/', {}, 2000);
    const duration = Date.now() - startTime;

    expect(result.ok).toBe(false);
    expect(result.error).toContain('timeout');
    expect(result.error).toContain('2000ms');
    expect(duration).toBeGreaterThanOrEqual(2000);
    expect(duration).toBeLessThan(2500); // Should timeout quickly, not hang
  });

  test('should successfully fetch from working endpoint with timeout', async () => {
    // Mock a successful response
    fetch.mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve('OK'),
      headers: new Map()
    });

    const result = await httpFunctions.HTTP_GET('https://example.com/status/200', {}, 5000);

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.attempt).toBe(1);
  });

  test('should use default 30s timeout when not specified', async () => {
    // Mock a fetch that hangs until aborted
    fetch.mockImplementation((url, options) => {
      return new Promise((resolve, reject) => {
        // Listen for abort signal
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        }
        // Never resolve - simulates hanging connection
      });
    });

    const startTime = Date.now();
    const result = await httpFunctions.HTTP_GET('http://example.com/', {});
    const duration = Date.now() - startTime;

    expect(result.ok).toBe(false);
    expect(result.error).toContain('timeout');
    expect(duration).toBeGreaterThanOrEqual(30000); // Should be around 30s
    expect(duration).toBeLessThan(31000);
  }, 35000);

  test('should pass AbortSignal to fetch', async () => {
    // Mock a successful response
    fetch.mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve('OK'),
      headers: new Map()
    });

    await httpFunctions.HTTP_GET('https://example.com/', {}, 5000);

    // Verify fetch was called with signal
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/',
      expect.objectContaining({
        method: 'GET',
        signal: expect.any(Object) // AbortSignal
      })
    );
  });

  test('should clear timeout on successful request', async () => {
    // Mock a fast successful response
    fetch.mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve('Fast response'),
      headers: new Map()
    });

    const startTime = Date.now();
    const result = await httpFunctions.HTTP_GET('https://example.com/', {}, 10000);
    const duration = Date.now() - startTime;

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    // Should complete quickly, not wait for timeout
    expect(duration).toBeLessThan(1000);
  });
});
