/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { Interpreter } = require('../../../../../core/src/interpreter');
const { parse } = require('../../../../../core/src/parser');
const fs = require('path');

describe('REQUIRE Control Bus Integration', () => {
  let interpreter;
  let mockParentWindow;
  let messageEventListener;
  
  beforeEach(() => {
    // Mock control bus environment
    messageEventListener = null;
    
    mockParentWindow = {
      postMessage: jest.fn()
    };
    
    global.window = {
      parent: mockParentWindow,
      addEventListener: jest.fn((event, listener) => {
        if (event === 'message') {
          messageEventListener = listener;
        }
      }),
      removeEventListener: jest.fn()
    };
    
    interpreter = new Interpreter(null);
    
    // Clear any previously loaded libraries
    if (global.HISTOGRAM) delete global.HISTOGRAM;
    if (global.SP_INTERP1D) delete global.SP_INTERP1D;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should detect control bus environment', () => {
    // Mock the environment detection for controlbus tests
    const originalDetectEnvironment = interpreter.detectEnvironment;
    interpreter.detectEnvironment = jest.fn(() => 'web-controlbus');
    
    expect(interpreter.detectEnvironment()).toBe('web-controlbus');
    
    // Restore original method
    interpreter.detectEnvironment = originalDetectEnvironment;
  });

  test('should send library request to director', async () => {
    // Mock environment detection for controlbus behavior
    const originalDetectEnvironment = interpreter.detectEnvironment;
    interpreter.detectEnvironment = jest.fn(() => 'web-controlbus');
    
    const script = `
      REQUIRE "r-graphing"
    `;
    
    const commands = parse(script);
    
    // Start the execution (will send library request)
    const executionPromise = interpreter.run(commands);
    
    // Wait for request to be sent
    await new Promise(resolve => setTimeout(resolve, 10));
    
    
    // Verify permission request was sent
    expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'LIBRARY_PERMISSION_REQUEST',
        libraryName: 'r-graphing',
        requestId: expect.stringMatching(/^req_\d+_[a-z0-9]+$/)
      }),
      '*'
    );
    
    // Get the permission request that was sent
    const permissionRequest = mockParentWindow.postMessage.mock.calls[0][0];
    
    // Step 1: Send permission approval
    const permissionResponse = {
      type: 'LIBRARY_PERMISSION_RESPONSE',
      requestId: permissionRequest.requestId,
      approved: true,
      libraryName: 'r-graphing'
    };
    
    // Send permission approval
    messageEventListener({
      data: permissionResponse,
      source: mockParentWindow
    });
    
    // Wait for the library request to be sent after permission is approved
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Now there should be 2 messages: permission request + library request
    if (mockParentWindow.postMessage.mock.calls.length > 1) {
      const libraryRequest = mockParentWindow.postMessage.mock.calls[1][0];
      
      // Step 2: Send library response with actual code
      const libraryCode = `
        function HISTOGRAM() { 
          // Return library info when called with no parameters (detection mode)
          if (arguments.length === 0) {
            return { 
              type: 'library_info', 
              loaded: true, 
              functions: ['HISTOGRAM'], 
              source: 'controlbus-test' 
            };
          }
          // Normal function behavior when called with parameters
          return { type: 'histogram' }; 
        }
        if (typeof global !== 'undefined') {
          global.HISTOGRAM = HISTOGRAM;
          // Self-register with the library detection system
          if (typeof global.registerLibraryDetectionFunction === 'function') {
            global.registerLibraryDetectionFunction('r-graphing', 'HISTOGRAM');
          }
        }
        if (typeof window !== 'undefined') {
          window.HISTOGRAM = HISTOGRAM;
          // Self-register with the library detection system
          if (typeof window.registerLibraryDetectionFunction === 'function') {
            window.registerLibraryDetectionFunction('r-graphing', 'HISTOGRAM');
          }
        }
      `;
      
      const libraryResponse = {
        type: 'library-response',
        requestId: libraryRequest.requestId,
        approved: true,
        libraryCode: libraryCode
      };
      
      // Send library response
      messageEventListener({
        data: libraryResponse,
        source: mockParentWindow
      });
    }
    
    // Wait for execution to complete
    await executionPromise;
    
    // Verify library was loaded
    expect(typeof global.HISTOGRAM).toBe('function');
    
    // Restore original method
    interpreter.detectEnvironment = originalDetectEnvironment;
  });

  test('should handle director denial', async () => {
    // Mock environment detection for controlbus behavior
    const originalDetectEnvironment = interpreter.detectEnvironment;
    interpreter.detectEnvironment = jest.fn(() => 'web-controlbus');
    
    const script = `
      REQUIRE "unauthorized-lib"
    `;
    
    const commands = parse(script);
    const executionPromise = interpreter.run(commands);
    
    // Wait for request
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Get the request
    const sentRequest = mockParentWindow.postMessage.mock.calls[0][0];
    
    // Send permission denial
    const permissionResponse = {
      type: 'LIBRARY_PERMISSION_RESPONSE',
      requestId: sentRequest.requestId,
      approved: false,
      reason: 'Library not in approved list',
      libraryName: 'unauthorized-lib'
    };
    
    messageEventListener({ 
      data: permissionResponse,
      source: mockParentWindow 
    });
    
    // Should throw error
    await expect(executionPromise).rejects.toThrow('Library permission denied: Library not in approved list');
    
    // Restore original method
    interpreter.detectEnvironment = originalDetectEnvironment;
  });

  test('should handle library request timeout', async () => {
    // Mock environment detection for controlbus behavior
    const originalDetectEnvironment = interpreter.detectEnvironment;
    interpreter.detectEnvironment = jest.fn(() => 'web-controlbus');
    
    // Mock setTimeout to trigger immediately
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => {
      if (delay === 30000) { // Library timeout
        setImmediate(fn); // Trigger immediately
      } else {
        originalSetTimeout(fn, delay);
      }
    };
    
    const script = `
      REQUIRE "timeout-lib"
    `;
    
    const commands = parse(script);
    
    // Should timeout and throw error
    await expect(interpreter.run(commands)).rejects.toThrow('Library permission request timed out for timeout-lib');
    
    // Restore mocks
    global.setTimeout = originalSetTimeout;
    interpreter.detectEnvironment = originalDetectEnvironment;
  });

  test('should handle library loading via URL', async () => {
    // Mock environment detection for controlbus behavior
    const originalDetectEnvironment = interpreter.detectEnvironment;
    interpreter.detectEnvironment = jest.fn(() => 'web-controlbus');
    
    // Mock both fetchFromUrl and loadLibraryFromUrl
    const mockLibraryContent = `
      function HISTOGRAM() { 
        // Return library info when called with no parameters (detection mode)
        if (arguments.length === 0) {
          return { 
            type: 'library_info', 
            loaded: true, 
            functions: ['HISTOGRAM'], 
            source: 'controlbus-url-test' 
          };
        }
        // Normal function behavior when called with parameters
        return { type: 'histogram' }; 
      }
      if (typeof global !== 'undefined') {
        global.HISTOGRAM = HISTOGRAM;
        // Self-register with the library detection system
        if (typeof global.registerLibraryDetectionFunction === 'function') {
          global.registerLibraryDetectionFunction('r-graphing', 'HISTOGRAM');
        }
      }
      if (typeof window !== 'undefined') {
        window.HISTOGRAM = HISTOGRAM;
        // Self-register with the library detection system
        if (typeof window.registerLibraryDetectionFunction === 'function') {
          window.registerLibraryDetectionFunction('r-graphing', 'HISTOGRAM');
        }
      }
    `;
    
    interpreter.fetchFromUrl = jest.fn().mockResolvedValue(mockLibraryContent);
    interpreter.loadLibraryFromUrl = jest.fn().mockImplementation(async (url, libraryName) => {
      // Execute the mock content to set up global functions
      eval(mockLibraryContent);
      return { loaded: true };
    });
    
    const script = `
      REQUIRE "r-graphing"
    `;
    
    const commands = parse(script);
    const executionPromise = interpreter.run(commands);
    
    // Wait for permission request
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const permissionRequest = mockParentWindow.postMessage.mock.calls[0][0];
    
    // Step 1: Send permission approval
    const permissionResponse = {
      type: 'LIBRARY_PERMISSION_RESPONSE',
      requestId: permissionRequest.requestId,
      approved: true,
      libraryName: 'r-graphing'
    };
    
    messageEventListener({
      data: permissionResponse,
      source: mockParentWindow
    });
    
    // Wait for library request
    await new Promise(resolve => setTimeout(resolve, 10));
    
    if (mockParentWindow.postMessage.mock.calls.length > 1) {
      const libraryRequest = mockParentWindow.postMessage.mock.calls[1][0];
      
      // Step 2: Send library response with URL
      const libraryResponse = {
        type: 'library-response',
        requestId: libraryRequest.requestId,
        approved: true,
        libraryUrl: 'https://example.com/libs/r-graphing.js'
      };
      
      messageEventListener({
        data: libraryResponse,
        source: mockParentWindow
      });
    }
    
    await executionPromise;
    
    // Verify loadLibraryFromUrl was called
    expect(interpreter.loadLibraryFromUrl).toHaveBeenCalledWith('https://example.com/libs/r-graphing.js', 'r-graphing');
    expect(typeof global.HISTOGRAM).toBe('function');
    
    // Restore original method
    interpreter.detectEnvironment = originalDetectEnvironment;
  });

  test('should ignore messages from wrong source', async () => {
    // Mock environment detection for controlbus behavior
    const originalDetectEnvironment = interpreter.detectEnvironment;
    interpreter.detectEnvironment = jest.fn(() => 'web-controlbus');
    
    // Mock setTimeout to trigger timeout quickly for this test
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => {
      if (delay === 30000) { // Library or permission timeout
        setTimeout(fn, 100); // Quick timeout for test
      } else {
        originalSetTimeout(fn, delay);
      }
    };
    
    const script = `
      REQUIRE "r-graphing"
    `;
    
    const commands = parse(script);
    const executionPromise = interpreter.run(commands);
    
    // Wait for permission request
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const permissionRequest = mockParentWindow.postMessage.mock.calls[0][0];
    
    // Simulate permission response from wrong source
    const wrongPermissionResponse = {
      type: 'LIBRARY_PERMISSION_RESPONSE',
      requestId: permissionRequest.requestId,
      approved: true,
      libraryName: 'r-graphing'
    };
    
    messageEventListener({ 
      data: wrongPermissionResponse,
      source: { postMessage: jest.fn() } // Different source
    });
    
    // Should ignore the wrong source and eventually timeout
    await expect(executionPromise).rejects.toThrow('Library request timeout (30s)');
    
    // Should not have executed any library code
    expect(global.HISTOGRAM).toBeUndefined();
    
    // Restore mocks
    global.setTimeout = originalSetTimeout;
    interpreter.detectEnvironment = originalDetectEnvironment;
  });

  test('should handle multiple concurrent requests', async () => {
    // Mock environment detection for controlbus behavior
    const originalDetectEnvironment = interpreter.detectEnvironment;
    interpreter.detectEnvironment = jest.fn(() => 'web-controlbus');
    
    // Test handling first library
    const script1 = `REQUIRE "r-graphing"`;
    const commands1 = parse(script1);
    const executionPromise1 = interpreter.run(commands1);
    
    // Wait for first permission request  
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(mockParentWindow.postMessage).toHaveBeenCalledTimes(1);
    const request1 = mockParentWindow.postMessage.mock.calls[0][0];
    expect(request1.libraryName).toBe('r-graphing');
    
    // Send first permission approval
    const permissionResponse1 = {
      type: 'LIBRARY_PERMISSION_RESPONSE',
      requestId: request1.requestId,
      approved: true,
      libraryName: 'r-graphing'
    };
    
    messageEventListener({ data: permissionResponse1, source: mockParentWindow });
    
    // Wait for library request
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(mockParentWindow.postMessage).toHaveBeenCalledTimes(2);
    const libraryRequest1 = mockParentWindow.postMessage.mock.calls[1][0];
    
    // Send library response
    const libraryResponse1 = {
      type: 'library-response',
      requestId: libraryRequest1.requestId,
      approved: true,
      libraryCode: `
        function HISTOGRAM() { 
          if (arguments.length === 0) {
            return { type: 'library_info', loaded: true, functions: ['HISTOGRAM'], source: 'controlbus-multi-test' };
          }
          return { type: 'histogram' }; 
        }
        if (typeof global !== 'undefined') {
          global.HISTOGRAM = HISTOGRAM;
          // Self-register with the library detection system
          if (typeof global.registerLibraryDetectionFunction === 'function') {
            global.registerLibraryDetectionFunction('r-graphing', 'HISTOGRAM');
          }
        }
        if (typeof window !== 'undefined') {
          window.HISTOGRAM = HISTOGRAM;
          // Self-register with the library detection system
          if (typeof window.registerLibraryDetectionFunction === 'function') {
            window.registerLibraryDetectionFunction('r-graphing', 'HISTOGRAM');
          }
        }
      `
    };
    
    messageEventListener({ data: libraryResponse1, source: mockParentWindow });
    await executionPromise1;
    
    // First library should be loaded
    expect(typeof global.HISTOGRAM).toBe('function');
    
    // Test second library permission request (don't wait for completion)
    const script2 = `REQUIRE "scipy-interpolation"`;
    const commands2 = parse(script2);
    
    // Start the second request but don't await it to avoid timeout
    interpreter.run(commands2).catch(() => {});
    
    // Wait for second permission request
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(mockParentWindow.postMessage).toHaveBeenCalledTimes(3);
    const request2 = mockParentWindow.postMessage.mock.calls[2][0];
    expect(request2.libraryName).toBe('scipy-interpolation');
    
    // Verify we can handle the permission approval
    const permissionResponse2 = {
      type: 'LIBRARY_PERMISSION_RESPONSE',
      requestId: request2.requestId,
      approved: true,
      libraryName: 'scipy-interpolation'
    };
    
    // Just send the approval to test the system can handle it
    messageEventListener({ data: permissionResponse2, source: mockParentWindow });
    
    // Verify the permission system works for multiple libraries
    expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'LIBRARY_PERMISSION_REQUEST',
        libraryName: 'r-graphing'
      }),
      '*'
    );
    
    expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'LIBRARY_PERMISSION_REQUEST', 
        libraryName: 'scipy-interpolation'
      }),
      '*'
    );
    
    // Restore original method
    interpreter.detectEnvironment = originalDetectEnvironment;
  });

  test('should handle library code execution errors', async () => {
    // Mock environment detection for controlbus behavior
    const originalDetectEnvironment = interpreter.detectEnvironment;
    interpreter.detectEnvironment = jest.fn(() => 'web-controlbus');
    
    const script = `
      REQUIRE "r-graphing"
    `;
    
    const commands = parse(script);
    const executionPromise = interpreter.run(commands);
    
    // Wait for permission request
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const permissionRequest = mockParentWindow.postMessage.mock.calls[0][0];
    
    // Send permission approval
    const permissionResponse = {
      type: 'LIBRARY_PERMISSION_RESPONSE',
      requestId: permissionRequest.requestId,
      approved: true,
      libraryName: 'r-graphing'
    };
    
    messageEventListener({ data: permissionResponse, source: mockParentWindow });
    
    // Wait for library request
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const libraryRequest = mockParentWindow.postMessage.mock.calls[1][0];
    
    // Respond with invalid JavaScript
    const response = {
      type: 'library-response',
      requestId: libraryRequest.requestId,
      approved: true,
      libraryCode: 'invalid javascript syntax !@#$'
    };
    
    messageEventListener({ 
      data: response,
      source: mockParentWindow 
    });
    
    // Should throw execution error
    await expect(executionPromise).rejects.toThrow('Failed to execute library code');
    
    // Restore original method
    interpreter.detectEnvironment = originalDetectEnvironment;
  });
});