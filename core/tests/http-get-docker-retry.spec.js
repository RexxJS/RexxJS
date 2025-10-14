/**
 * HTTP_GET Docker Retry Issue Reproduction
 *
 * This test reproduces the issue where HTTP_GET with retries fails to connect
 * to a Docker container running Sinatra, even though:
 * - The container is running
 * - curl can connect successfully
 * - The retry mechanism should wait long enough
 *
 * Issue observed in test-docker-complete.rexx where after 15 retry attempts
 * over ~60 seconds, HTTP_GET still reports "fetch failed" even though manual
 * curl succeeds after 10 seconds.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const http = require('http');

describe('HTTP_GET Docker Retry Issue', () => {
  let interpreter;
  let server;
  let serverPort;
  let serverStartTime;
  let requestCount = 0;

  beforeAll(async () => {
    // Create a server that simulates Sinatra's startup delay
    // Takes ~10 seconds to start responding (like Sinatra in Alpine container)
    server = http.createServer((req, res) => {
      requestCount++;
      const elapsedMs = Date.now() - serverStartTime;

      // Simulate Sinatra startup: reject connections for first 10 seconds
      if (elapsedMs < 10000) {
        // Immediately close connection without response (like Sinatra not ready yet)
        res.socket.destroy();
        return;
      }

      // After 10 seconds, respond successfully
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello from RexxJS + Sinatra!');
    });

    // Start server on random port
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        serverStartTime = Date.now();
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(() => {
    requestCount = 0;
    serverStartTime = Date.now();

    const mockAddressSender = {
      send: async () => { throw new Error('Should not reach fallback'); }
    };

    const outputHandler = {
      writeLine: () => {},
      output: () => {}
    };

    interpreter = new Interpreter(mockAddressSender, outputHandler);
  });

  test('HTTP_GET with retries should eventually connect to slow-starting server', async () => {
    const script = `
      /* Wait up to 60 seconds, retrying every 3 seconds (timeout=15000ms, retryInterval=3000ms, maxRetries=14) */
      LET response = HTTP_GET("http://localhost:${serverPort}/", {}, 15000, 3000, 14)
    `;

    const commands = parse(script);
    const startTime = Date.now();
    await interpreter.run(commands);
    const duration = Date.now() - startTime;

    const response = interpreter.getVariable('response');

    // Should eventually succeed after server starts responding (~10 seconds)
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.body).toBe('Hello from RexxJS + Sinatra!');

    // Should have taken at least 10 seconds (server startup time)
    expect(duration).toBeGreaterThanOrEqual(10000);

    // Should have made multiple attempts
    expect(response.attempt).toBeGreaterThan(1);
    expect(requestCount).toBeGreaterThan(1);

    console.log(`Success after ${response.attempt} attempts in ${duration}ms`);
  }, 70000); // 70 second timeout for the test

  test('HTTP_GET without retries should fail immediately on slow-starting server', async () => {
    const script = `
      /* Single attempt, no retries */
      LET response = HTTP_GET("http://localhost:${serverPort}/", {}, 2000)
    `;

    const commands = parse(script);
    const startTime = Date.now();
    await interpreter.run(commands);
    const duration = Date.now() - startTime;

    const response = interpreter.getVariable('response');

    // Should fail quickly since server isn't ready yet
    expect(response.ok).toBe(false);
    expect(response.error).toBeTruthy();

    // Should fail within timeout period
    expect(duration).toBeLessThan(5000);

    // Should only have made 1 attempt
    expect(response.attempt).toBe(1);

    console.log(`Failed after ${response.attempt} attempt in ${duration}ms: ${response.error}`);
  });

  test('simulate exact Docker test scenario with connection reset', async () => {
    // This test simulates what happens in the Docker test:
    // - Container is created and started
    // - Sinatra takes ~10 seconds to fully start
    // - Early connection attempts get "Connection reset by peer"
    // - After ~10 seconds, connections succeed

    const script = `
      SAY 'Testing HTTP_GET with retries (simulating Docker Sinatra startup)...'
      /* Same parameters as test-docker-complete.rexx */
      LET response = HTTP_GET("http://localhost:${serverPort}/", {}, 15000, 3000, 14)

      IF response.ok THEN DO
        SAY '  ✓ HTTP Status:' || response.status
        SAY '  ✓ Response:' || response.body
        SAY '  ✓ Connected after attempt:' || response.attempt
      END
      ELSE DO
        SAY '  ERROR: HTTP request failed after' response.attempt 'attempts:' response.error
      END
    `;

    const commands = parse(script);
    const startTime = Date.now();

    let output = [];
    const captureOutputHandler = {
      writeLine: (line) => output.push(line),
      output: (text) => output.push(text)
    };
    interpreter.outputHandler = captureOutputHandler;

    await interpreter.run(commands);
    const duration = Date.now() - startTime;

    const response = interpreter.getVariable('response');

    console.log('\n=== Test Output ===');
    output.forEach(line => console.log(line));
    console.log(`\n=== Duration: ${duration}ms, Requests: ${requestCount} ===`);

    // Should succeed after retries
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.body).toContain('Hello from RexxJS + Sinatra!');

    // Verify it took multiple attempts due to slow startup
    expect(response.attempt).toBeGreaterThan(3); // Should need at least 3-4 retries
    expect(requestCount).toBeGreaterThan(3);
  }, 70000);

  test('reproduce exact failure: fetch failed after 15 attempts', async () => {
    // This test tries to reproduce the exact error message:
    // "ERROR: HTTP request failed after 15 attempts: fetch failed"

    // Reset server start time to ensure it's not ready
    serverStartTime = Date.now();

    const script = `
      LET response = HTTP_GET("http://localhost:${serverPort}/", {}, 15000, 3000, 14)
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    const response = interpreter.getVariable('response');

    // Log what actually happened
    console.log(`\nActual result:`);
    console.log(`  ok: ${response.ok}`);
    console.log(`  status: ${response.status}`);
    console.log(`  attempt: ${response.attempt}`);
    console.log(`  error: ${response.error || 'none'}`);
    console.log(`  body preview: ${response.body ? response.body.substring(0, 50) : 'empty'}`);
    console.log(`  total requests to server: ${requestCount}`);

    // This test documents the actual behavior
    // If it succeeds (response.ok === true), the issue is not reproducible here
    // If it fails, we can investigate why

    if (!response.ok) {
      // If this fails, it would help debug the issue
      console.log(`\nFailed as expected. Error: ${response.error}`);
      console.log(`This may help debug the Docker test failure.`);
    } else {
      // If it succeeds, the retry mechanism works in this environment
      console.log(`\nSucceeded after ${response.attempt} attempts.`);
      console.log(`This suggests the issue is specific to the Docker environment.`);
    }

    // The test should succeed - HTTP_GET with proper retries should work
    expect(response.ok).toBe(true);
  }, 70000);
});
