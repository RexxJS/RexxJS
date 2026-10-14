/**
 * Deployment Orchestrator Remote REQUIRE Tests
 * 
 * Tests for deployment orchestrator handling of remote REQUIRE requests via CHECKPOINT
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Mock dependencies
jest.mock('fs');
jest.mock('https');
jest.mock('../src/remote-shell-handler');
jest.mock('../../podman-address/podman-address.js');

// Import after mocking
const DeploymentOrchestrator = require('../src/deployment-orchestrator');

describe('Deployment Orchestrator Remote REQUIRE', () => {
  let orchestrator;
  let mockCheckpoint;
  let mockSocket;

  beforeEach(() => {
    orchestrator = new DeploymentOrchestrator();
    
    mockCheckpoint = {
      id: 'checkpoint_123',
      transport: 'websocket',
      results: [],
      progress: { step: 0 },
      status: 'active'
    };
    
    mockSocket = {
      send: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    };
    
    orchestrator.progressSocket = mockSocket;
    
    // Reset mocks
    fs.existsSync.mockClear();
    fs.readFileSync.mockClear();
    https.get.mockClear();
  });

  afterEach(() => {
    // path is Node's real module, shared with Jest's own runner: a stub left
    // on path.resolve breaks Jest after the tests ("Cannot find module
    // 'jest-util'"), so spies must be put back
    jest.restoreAllMocks();
  });

  describe('Remote REQUIRE Request Handling', () => {
    test('should handle remote REQUIRE request successfully', async () => {
      const requireData = {
        libraryName: 'test-library',
        requireId: 'req_123'
      };
      
      const mockLibraryCode = `
        module.exports = {
          TEST_FUNCTION: function(input) {
            return input * 2;
          }
        };
      `;
      
      // Mock successful library resolution
      jest.spyOn(orchestrator, 'resolveLibraryForRemote').mockResolvedValue(mockLibraryCode);
      
      await orchestrator.handleRemoteRequire(requireData, mockCheckpoint);
      
      expect(orchestrator.resolveLibraryForRemote).toHaveBeenCalledWith('test-library');
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"rexx-require-response"')
      );
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"requireId":"req_123"')
      );
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"success":true')
      );
    });

    test('should handle library resolution error', async () => {
      const requireData = {
        libraryName: 'missing-library',
        requireId: 'req_error_456'
      };
      
      jest.spyOn(orchestrator, 'resolveLibraryForRemote').mockRejectedValue(
        new Error('Library not found')
      );
      
      await orchestrator.handleRemoteRequire(requireData, mockCheckpoint);
      
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"rexx-require-response"')
      );
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"requireId":"req_error_456"')
      );
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"success":false')
      );
    });
  });

  describe('Library Resolution', () => {
    test('should resolve local file library', async () => {
      const libraryPath = './test-local-lib.js';
      const libraryContent = 'module.exports = { LOCAL_TEST: true };';
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(libraryContent);
      jest.spyOn(path, 'resolve').mockReturnValue('/full/path/test-local-lib.js');
      
      const result = await orchestrator.resolveLibraryForRemote(libraryPath);
      
      expect(result).toBe(libraryContent);
      expect(fs.existsSync).toHaveBeenCalledWith('/full/path/test-local-lib.js');
      expect(fs.readFileSync).toHaveBeenCalledWith('/full/path/test-local-lib.js', 'utf8');
    });

    test('should throw error for missing local file', async () => {
      const libraryPath = './missing-lib.js';
      
      fs.existsSync.mockReturnValue(false);
      jest.spyOn(path, 'resolve').mockReturnValue('/full/path/missing-lib.js');
      
      await expect(
        orchestrator.resolveLibraryForRemote(libraryPath)
      ).rejects.toThrow('Local library file not found: ./missing-lib.js');
    });

    test('should resolve GitHub library via HTTPS', async () => {
      const libraryName = 'user/repo/lib';
      const libraryContent = 'module.exports = { GITHUB_LIB: true };';
      
      // Mock HTTPS response
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(libraryContent);
          } else if (event === 'end') {
            callback();
          }
        })
      };
      
      const mockRequest = {
        on: jest.fn()
      };
      
      https.get.mockImplementation((url, callback) => {
        expect(url).toBe('https://raw.githubusercontent.com/hammant/rexx-functions/main/user/repo/lib.js');
        callback(mockResponse);
        return mockRequest;
      });
      
      const result = await orchestrator.resolveLibraryForRemote(libraryName);
      
      expect(result).toBe(libraryContent);
    });

    test('should handle HTTPS fetch error', async () => {
      const libraryName = 'user/failing-repo';
      
      const mockResponse = {
        statusCode: 404,
        on: jest.fn((event, callback) => {
          if (event === 'end') {
            callback();
          }
        })
      };
      
      const mockRequest = {
        on: jest.fn()
      };
      
      https.get.mockImplementation((url, callback) => {
        callback(mockResponse);
        return mockRequest;
      });
      
      await expect(
        orchestrator.resolveLibraryForRemote(libraryName)
      ).rejects.toThrow('Failed to fetch user/failing-repo: HTTP 404');
    });
  });

  describe('Integration with CHECKPOINT Listener', () => {
    test('should route remote REQUIRE messages to handler', async () => {
      const requireMessage = {
        type: 'rexx-require',
        subtype: 'require_request',
        data: {
          libraryName: 'integration-test-lib',
          requireId: 'req_integration_161718'
        }
      };
      
      jest.spyOn(orchestrator, 'handleRemoteRequire').mockResolvedValue();
      
      // Set up checkpoint listener
      orchestrator.setupCheckpointListener('checkpoint_integration', mockCheckpoint);
      
      // Simulate message received
      await mockCheckpoint.listener(JSON.stringify(requireMessage));
      
      expect(orchestrator.handleRemoteRequire).toHaveBeenCalledWith(
        requireMessage.data,
        mockCheckpoint
      );
    });

    test('should handle non-REQUIRE messages normally', () => {
      const normalMessage = {
        checkpointId: 'checkpoint_integration',
        key: 'progress',
        value: 'step_complete',
        progress: 50,
        timestamp: Date.now()
      };
      
      jest.spyOn(orchestrator, 'handleRemoteRequire').mockImplementation();
      
      // Set up checkpoint listener
      orchestrator.setupCheckpointListener('checkpoint_integration', mockCheckpoint);
      
      // Simulate normal checkpoint message
      mockCheckpoint.listener(JSON.stringify(normalMessage));
      
      // Should process as normal checkpoint update
      expect(mockCheckpoint.results).toHaveLength(1);
      expect(mockCheckpoint.results[0]).toMatchObject({
        key: 'progress',
        value: 'step_complete',
        progress: 50,
        source: 'remote'
      });
      
      // Should NOT call remote REQUIRE handler
      expect(orchestrator.handleRemoteRequire).not.toHaveBeenCalled();
    });
  });
});