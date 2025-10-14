/**
 * HTTP request functions for REXX interpreter
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const httpFunctions = {
  'HTTP_GET': async (url, headers = {}, timeout = 30000, retryInterval = 0, maxRetries = 0) => {
    // Parse retry parameters
    const retryIntervalMs = typeof retryInterval === 'number' ? retryInterval : parseInt(retryInterval) || 0;
    const maxAttempts = typeof maxRetries === 'number' ? maxRetries : parseInt(maxRetries) || 0;
    const totalAttempts = maxAttempts + 1; // maxRetries=0 means 1 attempt, maxRetries=3 means 4 attempts

    let lastError = null;

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      try {
        // Validate URL
        if (typeof url !== 'string' || !url.trim()) {
          throw new Error('HTTP_GET requires a valid URL string');
        }

        // Check if fetch is available
        if (typeof fetch === 'undefined') {
          throw new Error('HTTP_GET requires fetch API (available in browsers and modern Node.js)');
        }

        // Prepare headers object
        const fetchHeaders = {};
        if (headers && typeof headers === 'object') {
          // Convert Rexx compound variable to JavaScript object
          for (const [key, value] of Object.entries(headers)) {
            if (typeof value === 'string' || typeof value === 'number') {
              fetchHeaders[key] = String(value);
            }
          }
        }

        // Parse timeout value
        const timeoutMs = typeof timeout === 'number' ? timeout : parseInt(timeout) || 30000;

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          // Make the HTTP GET request with timeout
          const response = await fetch(url.trim(), {
            method: 'GET',
            headers: fetchHeaders,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          // Get response body
          const body = await response.text();

          // Convert headers to plain object
          const responseHeaders = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          // Return structured response object
          return {
            status: response.status,
            body: body,
            headers: responseHeaders,
            ok: response.ok,
            attempt: attempt + 1
          };
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeoutMs}ms`);
          }
          throw fetchError;
        }

      } catch (error) {
        lastError = error;

        // If this was the last attempt, return error
        if (attempt === totalAttempts - 1) {
          return {
            status: 0,
            body: '',
            headers: {},
            ok: false,
            error: error.message,
            attempt: attempt + 1
          };
        }

        // Wait before retrying (if retryInterval > 0)
        if (retryIntervalMs > 0) {
          await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
        }
      }
    }

    // Should not reach here, but return error just in case
    return {
      status: 0,
      body: '',
      headers: {},
      ok: false,
      error: lastError ? lastError.message : 'Unknown error',
      attempt: totalAttempts
    };
  },

  'HTTP_POST': async (url, body = '', headers = {}, timeout = 30000) => {
    try {
      // Validate URL
      if (typeof url !== 'string' || !url.trim()) {
        throw new Error('HTTP_POST requires a valid URL string');
      }

      // Check if fetch is available
      if (typeof fetch === 'undefined') {
        throw new Error('HTTP_POST requires fetch API (available in browsers and modern Node.js)');
      }

      // Prepare headers object
      const fetchHeaders = {};
      if (headers && typeof headers === 'object') {
        // Convert Rexx compound variable to JavaScript object
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === 'string' || typeof value === 'number') {
            fetchHeaders[key] = String(value);
          }
        }
      }

      // Default Content-Type if not specified
      if (!fetchHeaders['Content-Type'] && !fetchHeaders['content-type']) {
        fetchHeaders['Content-Type'] = 'application/json';
      }

      // Convert body to string
      const requestBody = body ? String(body) : '';

      // Parse timeout value
      const timeoutMs = typeof timeout === 'number' ? timeout : parseInt(timeout) || 30000;

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Make the HTTP POST request with timeout
        const response = await fetch(url.trim(), {
          method: 'POST',
          headers: fetchHeaders,
          body: requestBody,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Get response body
        const responseBody = await response.text();

        // Convert headers to plain object
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Return structured response object
        return {
          status: response.status,
          body: responseBody,
          headers: responseHeaders,
          ok: response.ok
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        throw fetchError;
      }

    } catch (error) {
      // Return error object for Rexx to handle
      return {
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: error.message
      };
    }
  },

  'HTTP_PUT': async (url, body = '', headers = {}, timeout = 30000) => {
    try {
      // Validate URL
      if (typeof url !== 'string' || !url.trim()) {
        throw new Error('HTTP_PUT requires a valid URL string');
      }

      // Check if fetch is available
      if (typeof fetch === 'undefined') {
        throw new Error('HTTP_PUT requires fetch API (available in browsers and modern Node.js)');
      }

      // Prepare headers object
      const fetchHeaders = {};
      if (headers && typeof headers === 'object') {
        // Convert Rexx compound variable to JavaScript object
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === 'string' || typeof value === 'number') {
            fetchHeaders[key] = String(value);
          }
        }
      }

      // Default Content-Type if not specified
      if (!fetchHeaders['Content-Type'] && !fetchHeaders['content-type']) {
        fetchHeaders['Content-Type'] = 'application/json';
      }

      // Convert body to string
      const requestBody = body ? String(body) : '';

      // Parse timeout value
      const timeoutMs = typeof timeout === 'number' ? timeout : parseInt(timeout) || 30000;

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Make the HTTP PUT request with timeout
        const response = await fetch(url.trim(), {
          method: 'PUT',
          headers: fetchHeaders,
          body: requestBody,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Get response body
        const responseBody = await response.text();

        // Convert headers to plain object
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Return structured response object
        return {
          status: response.status,
          body: responseBody,
          headers: responseHeaders,
          ok: response.ok
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        throw fetchError;
      }

    } catch (error) {
      // Return error object for Rexx to handle
      return {
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: error.message
      };
    }
  },

  'HTTP_DELETE': async (url, headers = {}, timeout = 30000) => {
    try {
      // Validate URL
      if (typeof url !== 'string' || !url.trim()) {
        throw new Error('HTTP_DELETE requires a valid URL string');
      }

      // Check if fetch is available
      if (typeof fetch === 'undefined') {
        throw new Error('HTTP_DELETE requires fetch API (available in browsers and modern Node.js)');
      }

      // Prepare headers object
      const fetchHeaders = {};
      if (headers && typeof headers === 'object') {
        // Convert Rexx compound variable to JavaScript object
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === 'string' || typeof value === 'number') {
            fetchHeaders[key] = String(value);
          }
        }
      }

      // Parse timeout value
      const timeoutMs = typeof timeout === 'number' ? timeout : parseInt(timeout) || 30000;

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Make the HTTP DELETE request with timeout
        const response = await fetch(url.trim(), {
          method: 'DELETE',
          headers: fetchHeaders,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Get response body
        const body = await response.text();

        // Convert headers to plain object
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Return structured response object
        return {
          status: response.status,
          body: body,
          headers: responseHeaders,
          ok: response.ok
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        throw fetchError;
      }

    } catch (error) {
      // Return error object for Rexx to handle
      return {
        status: 0,
        body: '',
        headers: {},
        ok: false,
        error: error.message
      };
    }
  }
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { httpFunctions };
} else if (typeof window !== 'undefined') {
  window.httpFunctions = httpFunctions;
}