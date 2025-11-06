/**
 * ADDRESS Remote HTTP Endpoint Tests
 *
 * Tests the built-in ADDRESS remote HTTP endpoint functionality:
 * ADDRESS "url" AUTH "token" AS name
 *
 * The AUTH parameter uses Bearer token authentication:
 * - Sends: Authorization: Bearer <token>
 * - Most common pattern for REST APIs
 * - Can be extended to support other schemes in the future
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS Remote HTTP Endpoints', () => {
  let interpreter;
  let mockFetch;
  let originalFetch;

  beforeEach(() => {
    const outputHandler = {
      writeLine: (text) => {},
      output: (text) => {}
    };

    interpreter = new Interpreter(null, outputHandler);
    interpreter.scriptPath = __filename;

    // Mock fetch for HTTP requests
    mockFetch = jest.fn();
    originalFetch = global.fetch;
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Parser Tests', () => {
    test('should parse ADDRESS with URL and AUTH token', () => {
      const script = 'ADDRESS "http://localhost:8080/api" AUTH "token-123" AS MYAPP';
      const commands = parse(script);

      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('ADDRESS_REMOTE');
      expect(commands[0].url).toBe('http://localhost:8080/api');
      expect(commands[0].authToken).toBe('token-123');
      expect(commands[0].asName).toBe('MYAPP');
    });

    test('should parse ADDRESS with URL but no AUTH token', () => {
      const script = 'ADDRESS "http://localhost:8080/api" AS MYAPP';
      const commands = parse(script);

      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('ADDRESS_REMOTE');
      expect(commands[0].url).toBe('http://localhost:8080/api');
      expect(commands[0].authToken).toBeNull();
      expect(commands[0].asName).toBe('MYAPP');
    });

    test('should parse ADDRESS with https URL', () => {
      const script = 'ADDRESS "https://api.example.com/v1/endpoint" AUTH "secret" AS API';
      const commands = parse(script);

      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('ADDRESS_REMOTE');
      expect(commands[0].url).toBe('https://api.example.com/v1/endpoint');
      expect(commands[0].authToken).toBe('secret');
      expect(commands[0].asName).toBe('API');
    });

    test('should support single quotes in URL', () => {
      const script = "ADDRESS 'http://localhost:8080/api' AUTH 'token' AS MYAPP";
      const commands = parse(script);

      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('ADDRESS_REMOTE');
      expect(commands[0].url).toBe('http://localhost:8080/api');
    });

    // Note: Backticks are not supported for ADDRESS URL syntax
    // Only single and double quotes are supported
  });

  describe('Registration Tests', () => {
    test('should register remote endpoint and store URL and token', async () => {
      const script = 'ADDRESS "http://localhost:8080/api" AUTH "token-123" AS MYAPP';
      const commands = parse(script);

      await interpreter.run(commands);

      expect(interpreter.addressRemoteEndpoints).toBeDefined();
      expect(interpreter.addressRemoteEndpoints.myapp).toBeDefined();
      expect(interpreter.addressRemoteEndpoints.myapp.url).toBe('http://localhost:8080/api');
      expect(interpreter.addressRemoteEndpoints.myapp.authToken).toBe('token-123');
    });

    test('should register remote endpoint without auth token', async () => {
      const script = 'ADDRESS "http://localhost:8080/api" AS MYAPP';
      const commands = parse(script);

      await interpreter.run(commands);

      expect(interpreter.addressRemoteEndpoints.myapp).toBeDefined();
      expect(interpreter.addressRemoteEndpoints.myapp.url).toBe('http://localhost:8080/api');
      expect(interpreter.addressRemoteEndpoints.myapp.authToken).toBeNull();
    });

    test('should automatically switch to registered ADDRESS', async () => {
      const script = 'ADDRESS "http://localhost:8080/api" AUTH "token" AS MYAPP';
      const commands = parse(script);

      await interpreter.run(commands);

      expect(interpreter.address).toBe('myapp');
    });

    test('should allow switching between ADDRESS contexts', async () => {
      const script = `
        ADDRESS "http://localhost:8080/api" AUTH "token" AS MYAPP
        ADDRESS REXX
        ADDRESS MYAPP
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      expect(interpreter.address).toBe('myapp');
    });

    test('should support multiple remote endpoints', async () => {
      const script = `
        ADDRESS "http://localhost:8080/api1" AUTH "token1" AS API1
        ADDRESS "http://localhost:8080/api2" AUTH "token2" AS API2
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      expect(interpreter.addressRemoteEndpoints.api1).toBeDefined();
      expect(interpreter.addressRemoteEndpoints.api2).toBeDefined();
      expect(interpreter.address).toBe('api2'); // Last one registered
    });
  });

  describe('Command Execution Tests', () => {
    test('should send HTTP POST request with command', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: 'OK' })
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AUTH "token-123" AS MYAPP
        "setCell A1 10"
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token-123'
          }),
          body: expect.stringContaining('"command":"setCell"')
        })
      );
    });

    test('should parse command string into command and params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: 'OK' })
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AUTH "token" AS MYAPP
        "setCell A1 10"
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody).toEqual({
        command: 'setCell',
        params: {
          ref: 'A1',
          content: '10'
        }
      });
    });

    test('should handle commands with multiple arguments', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: 'OK' })
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AS MYAPP
        "command arg1 arg2 arg3"
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.command).toBe('command');
      expect(callBody.params.ref).toBe('arg1');
      expect(callBody.params.content).toBe('arg2 arg3');
    });

    test('should not include Authorization header when no token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: 'OK' })
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AS MYAPP
        "command"
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('Return Value Tests', () => {
    test('should set RC to 0 on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: 'OK' })
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AS MYAPP
        "command"
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      expect(interpreter.variables.get('RC')).toBe(0);
    });

    test('should set RC to 1 on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: false, error: 'Failed' })
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AS MYAPP
        "command"
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      expect(interpreter.variables.get('RC')).toBe(1);
    });

    test('should set RESULT variable from response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: 'Hello World' })
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AS MYAPP
        "command"
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      expect(interpreter.variables.get('RESULT')).toBe('Hello World');
    });

    test('should set ERRORTEXT on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: false, error: 'Something went wrong' })
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AS MYAPP
        "command"
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      expect(interpreter.variables.get('ERRORTEXT')).toBe('Something went wrong');
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle HTTP 401 Unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AUTH "wrong-token" AS MYAPP
        "command"
      `;
      const commands = parse(script);

      await expect(interpreter.run(commands)).rejects.toThrow('Unauthorized - check authentication token');
      expect(interpreter.variables.get('RC')).toBe(1);
    });

    test('should handle HTTP 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AS MYAPP
        "command"
      `;
      const commands = parse(script);

      await expect(interpreter.run(commands)).rejects.toThrow('HTTP 500: Internal Server Error');
      expect(interpreter.variables.get('RC')).toBe(1);
    });

    test('should handle connection refused', async () => {
      mockFetch.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED'
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AS MYAPP
        "command"
      `;
      const commands = parse(script);

      await expect(interpreter.run(commands)).rejects.toThrow('Connection refused to http://localhost:8080/api');
      expect(interpreter.variables.get('RC')).toBe(1);
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('fetch failed'));

      const script = `
        ADDRESS "http://localhost:8080/api" AS MYAPP
        "command"
      `;
      const commands = parse(script);

      await expect(interpreter.run(commands)).rejects.toThrow('Connection refused to http://localhost:8080/api');
      expect(interpreter.variables.get('RC')).toBe(1);
    });
  });

  describe('Integration Tests', () => {
    test('should support complete workflow like spreadsheet control', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: 'OK' })
      });

      const script = `
        ADDRESS "http://localhost:8083/api/spreadsheet" AUTH "dev-token-12345" AS SPREADSHEET

        "setCell A1 10"
        "setCell A2 20"
        "setCell A3 =A1+A2"
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(interpreter.variables.get('RC')).toBe(0);
    });

    test('should work with conditional logic', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, result: 'Success' })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: false, error: 'Failed' })
        });

      const script = `
        ADDRESS "http://localhost:8080/api" AS MYAPP

        "command1"
        IF RC = 0 THEN DO
          SAY "Command 1 succeeded"
        END

        "command2"
        IF RC <> 0 THEN DO
          SAY "Command 2 failed"
        END
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should work with loops', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: 'OK' })
      });

      const script = `
        ADDRESS "http://localhost:8080/api" AS MYAPP

        DO i = 1 TO 3
          "command {{i}}"
        END
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('should allow switching between multiple remote endpoints', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: 'OK' })
      });

      const script = `
        ADDRESS "http://localhost:8080/api1" AUTH "token1" AS API1
        ADDRESS "http://localhost:8080/api2" AUTH "token2" AS API2

        ADDRESS API1
        "command1"

        ADDRESS API2
        "command2"
      `;
      const commands = parse(script);

      await interpreter.run(commands);

      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify first call went to API1
      expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:8080/api1');
      expect(mockFetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer token1');

      // Verify second call went to API2
      expect(mockFetch.mock.calls[1][0]).toBe('http://localhost:8080/api2');
      expect(mockFetch.mock.calls[1][1].headers['Authorization']).toBe('Bearer token2');
    });
  });
});
