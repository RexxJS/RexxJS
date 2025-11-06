/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Simple Tests for Claude ADDRESS Library
 * 
 * These tests verify basic Claude API ADDRESS target functionality
 * using the same patterns as other ADDRESS target tests in the codebase.
 */

const { Interpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');

describe('Claude ADDRESS Library - Basic Functionality', () => {
  let interpreter;
  let originalEnv;
  
  beforeEach(() => {
    // Mock environment variable
    originalEnv = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-api-key-12345';
    
    // Create interpreter instance with mock RPC client
    const mockRpcClient = {
      send: jest.fn().mockResolvedValue('mock response')
    };
    interpreter = new Interpreter(mockRpcClient);
    
    // Mock fetch globally
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: 'Mock Claude response' }],
        usage: { input_tokens: 10, output_tokens: 5 }
      })
    });
  });
  
  afterEach(() => {
    // Restore environment
    if (originalEnv) {
      process.env.ANTHROPIC_API_KEY = originalEnv;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  test('should load claude-address library and register ADDRESS target', async () => {
    // Load claude-address library
    await interpreter.run(parse('REQUIRE "./claude-address.js"'));
    
    // Verify ADDRESS target was registered
    expect(interpreter.addressTargets.has('claude')).toBe(true);
  });

  test('should provide correct library metadata', async () => {
    // Load claude-address library
    await interpreter.run(parse('REQUIRE "./claude-address.js"'));
    
    // Check that the meta function exists and returns correct metadata
    expect(global.CLAUDE_ADDRESS_META).toBeDefined();
    const metadata = global.CLAUDE_ADDRESS_META();
    
    expect(metadata.type).toBe('address-target');
    expect(metadata.name).toBe('Claude AI Chat Service');
    expect(metadata.provides.addressTarget).toBe('claude');
  });

  test('should handle basic session start command', async () => {
    await interpreter.run(parse('REQUIRE "./claude-address.js"'));
    await interpreter.run(parse('ADDRESS claude'));
    
    // Verify ADDRESS was set
    expect(interpreter.address).toBe('claude');
    
    // Test via direct handler call (similar to sqlite tests)
    const claudeTarget = interpreter.addressTargets.get('claude');
    const result = await claudeTarget.handler('SYSTEM ROLE You are a test assistant.');
    
    expect(result.operation).toBe('START_SESSION');
    expect(result.success).toBe(true);
    expect(result.sessionId).toBe(1);
  });

  test('should handle API key requirement', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    
    await interpreter.run(parse('REQUIRE "./claude-address.js"'));
    await interpreter.run(parse('ADDRESS claude'));
    
    // Should fail without API key
    try {
      await interpreter.run(parse('"SYSTEM ROLE You are a test assistant."'));
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('ANTHROPIC_API_KEY');
    }
  });

  test('should handle status command', async () => {
    await interpreter.run(parse('REQUIRE "./claude-address.js"'));
    await interpreter.run(parse('ADDRESS claude'));
    
    // Test via direct handler call
    const claudeTarget = interpreter.addressTargets.get('claude');
    const result = await claudeTarget.handler('status');
    
    
    expect(result.success).toBe(true);
    expect(result.service).toBe('claude');
    expect(result.provider).toBe('Anthropic');
  });
});