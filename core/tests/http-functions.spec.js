/**
 * HTTP Functions Tests
 * Tests for HTTP_GET, HTTP_POST, HTTP_PUT, and HTTP_DELETE functions
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { httpFunctions } = require('../src/http-functions');

// Mock fetch for testing
global.fetch = jest.fn();

describe('HTTP Functions', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockReset();
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  describe('HTTP_GET function', () => {
    test('should make GET request and return response object', async () => {
      const mockResponse = 'Hello World';
      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(mockResponse),
        headers: new Map([['content-type', 'text/plain']])
      });

      const result = await httpFunctions.HTTP_GET('https://api.example.com/test');

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', expect.objectContaining({
        method: 'GET',
        headers: {}
      }));
      expect(result).toEqual(expect.objectContaining({
        status: 200,
        body: mockResponse,
        headers: { 'content-type': 'text/plain' },
        ok: true,
        attempt: 1
      }));
    });

    test('should handle GET request with custom headers', async () => {
      const mockResponse = '{"data": "test"}';
      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      const headers = {
        'Authorization': 'Bearer token123',
        'Accept': 'application/json'
      };

      const result = await httpFunctions.HTTP_GET('https://api.example.com/test', headers);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', expect.objectContaining({
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token123',
          'Accept': 'application/json'
        }
      }));
      expect(result.status).toBe(200);
      expect(result.body).toBe(mockResponse);
      expect(result.ok).toBe(true);
      expect(result.attempt).toBe(1);
    });

    test('should handle fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await httpFunctions.HTTP_GET('https://api.example.com/test');

      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'Network error',
        attempt: 1
      });
    });

    test('should validate URL parameter', async () => {
      const result = await httpFunctions.HTTP_GET('');
      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'HTTP_GET requires a valid URL string',
        attempt: 1
      });
    });

    test('should handle non-string URL', async () => {
      const result = await httpFunctions.HTTP_GET(null);
      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'HTTP_GET requires a valid URL string',
        attempt: 1
      });
    });

    test('should trim URL whitespace', async () => {
      const mockResponse = 'test';
      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      await httpFunctions.HTTP_GET('  https://api.example.com/test  ');

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', expect.objectContaining({
        method: 'GET',
        headers: {}
      }));
    });
  });

  describe('HTTP_POST function', () => {
    test('should make POST request with body and return response', async () => {
      const mockResponse = 'Created';
      const requestBody = '{"name": "test"}';

      fetch.mockResolvedValueOnce({
        status: 201,
        ok: true,
        text: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      const result = await httpFunctions.HTTP_POST('https://api.example.com/create', requestBody);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/create', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      }));
      expect(result).toEqual({
        status: 201,
        body: mockResponse,
        headers: {},
        ok: true
      });
    });

    test('should handle POST request with custom headers', async () => {
      const mockResponse = 'Success';
      const requestBody = 'test data';
      const headers = {
        'Content-Type': 'text/plain',
        'Authorization': 'Bearer token'
      };

      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      const result = await httpFunctions.HTTP_POST('https://api.example.com/create', requestBody, headers);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/create', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': 'Bearer token'
        },
        body: requestBody
      }));
      expect(result.status).toBe(200);
      expect(result.body).toBe(mockResponse);
      expect(result.ok).toBe(true);
    });

    test('should handle empty body', async () => {
      const mockResponse = 'OK';

      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      const result = await httpFunctions.HTTP_POST('https://api.example.com/create');

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/create', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: ''
      }));
      expect(result.body).toBe(mockResponse);
    });

    test('should handle POST fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Server error'));

      const result = await httpFunctions.HTTP_POST('https://api.example.com/create', 'data');

      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'Server error'
      });
    });

    test('should validate POST URL parameter', async () => {
      const result = await httpFunctions.HTTP_POST('');
      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'HTTP_POST requires a valid URL string'
      });
    });
  });

  describe('HTTP_PUT function', () => {
    test('should make PUT request with body and return response', async () => {
      const mockResponse = 'Updated';
      const requestBody = '{"id": 123, "name": "updated"}';

      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      const result = await httpFunctions.HTTP_PUT('https://api.example.com/update/123', requestBody);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/update/123', expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      }));
      expect(result).toEqual({
        status: 200,
        body: mockResponse,
        headers: {},
        ok: true
      });
    });

    test('should handle PUT fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Update failed'));

      const result = await httpFunctions.HTTP_PUT('https://api.example.com/update/123', 'data');

      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'Update failed'
      });
    });

    test('should validate PUT URL parameter', async () => {
      const result = await httpFunctions.HTTP_PUT('');
      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'HTTP_PUT requires a valid URL string'
      });
    });
  });

  describe('HTTP_DELETE function', () => {
    test('should make DELETE request and return response', async () => {
      const mockResponse = 'Deleted';

      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      const result = await httpFunctions.HTTP_DELETE('https://api.example.com/delete/123');

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/delete/123', expect.objectContaining({
        method: 'DELETE',
        headers: {}
      }));
      expect(result).toEqual({
        status: 200,
        body: mockResponse,
        headers: {},
        ok: true
      });
    });

    test('should handle DELETE request with custom headers', async () => {
      const mockResponse = 'Deleted successfully';
      const headers = {
        'Authorization': 'Bearer token123'
      };

      fetch.mockResolvedValueOnce({
        status: 204,
        ok: true,
        text: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      const result = await httpFunctions.HTTP_DELETE('https://api.example.com/delete/123', headers);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/delete/123', expect.objectContaining({
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer token123'
        }
      }));
      expect(result.status).toBe(204);
      expect(result.body).toBe(mockResponse);
      expect(result.ok).toBe(true);
    });

    test('should handle DELETE fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Delete failed'));

      const result = await httpFunctions.HTTP_DELETE('https://api.example.com/delete/123');

      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'Delete failed'
      });
    });

    test('should validate DELETE URL parameter', async () => {
      const result = await httpFunctions.HTTP_DELETE('');
      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'HTTP_DELETE requires a valid URL string'
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete REST workflow', async () => {
      // Mock GET request
      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve('{"users": []}'),
        headers: new Map()
      });

      // Mock POST request
      fetch.mockResolvedValueOnce({
        status: 201,
        ok: true,
        text: () => Promise.resolve('{"id": 1, "name": "John"}'),
        headers: new Map()
      });

      // Mock PUT request
      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve('{"id": 1, "name": "John Updated"}'),
        headers: new Map()
      });

      // Mock DELETE request
      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve('{"success": true}'),
        headers: new Map()
      });

      // Execute REST workflow
      const getResult = await httpFunctions.HTTP_GET('https://api.example.com/users');
      const postResult = await httpFunctions.HTTP_POST('https://api.example.com/users', '{"name": "John"}');
      const putResult = await httpFunctions.HTTP_PUT('https://api.example.com/users/1', '{"name": "John Updated"}');
      const deleteResult = await httpFunctions.HTTP_DELETE('https://api.example.com/users/1');

      expect(getResult.body).toBe('{"users": []}');
      expect(postResult.body).toBe('{"id": 1, "name": "John"}');
      expect(putResult.body).toBe('{"id": 1, "name": "John Updated"}');
      expect(deleteResult.body).toBe('{"success": true}');

      // Verify all calls were made correctly
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    test('should handle non-object headers gracefully', async () => {
      const mockResponse = 'OK';
      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      // Test with null headers
      const result = await httpFunctions.HTTP_GET('https://api.example.com/test', null);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', expect.objectContaining({
        method: 'GET',
        headers: {}
      }));
      expect(result.body).toBe(mockResponse);
    });

    test('should convert non-string values to strings', async () => {
      const mockResponse = 'OK';
      fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      const headers = {
        'X-Custom-Number': 123,
        'X-Custom-String': 'test'
      };

      await httpFunctions.HTTP_GET('https://api.example.com/test', headers);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', expect.objectContaining({
        method: 'GET',
        headers: {
          'X-Custom-Number': '123',
          'X-Custom-String': 'test'
        }
      }));
    });
  });

  describe('Error Handling', () => {
    test('should handle missing fetch API', async () => {
      // Temporarily remove fetch
      const originalFetch = global.fetch;
      delete global.fetch;

      const result = await httpFunctions.HTTP_GET('https://api.example.com/test');

      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'HTTP_GET requires fetch API (available in browsers and modern Node.js)',
        attempt: 1
      });

      // Restore fetch
      global.fetch = originalFetch;
    });

    test('should handle network timeouts', async () => {
      fetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await httpFunctions.HTTP_POST('https://api.example.com/slow', 'data');

      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'Timeout'
      });
    });

    test('should handle malformed URLs', async () => {
      fetch.mockRejectedValueOnce(new Error('Invalid URL'));

      const result = await httpFunctions.HTTP_GET('not-a-url');

      expect(result).toEqual({
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: 'Invalid URL',
        attempt: 1
      });
    });
  });
});