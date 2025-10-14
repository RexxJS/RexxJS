/**
 * Minimal ADDRESS Return Value Bug Reproduction
 * 
 * CORE BUG: `LET result = methodName` returns literal string instead of handler's returned object
 * WORKAROUND: `LET result = methodName params=""` works correctly
 * 
 * This test proves the RexxJS interpreter has a bug where certain ADDRESS call patterns
 * don't properly capture the returned result from the handler, even though the handler
 * is called correctly and returns the proper object.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS Return Value Bug - Minimal Reproduction', () => {
  let interpreter;
  
  beforeEach(() => {
    const mockAddressSender = {
      send: async () => { throw new Error('Should not reach fallback'); }
    };
    
    const outputHandler = {
      writeLine: () => {},
      output: () => {}
    };
    
    interpreter = new Interpreter(mockAddressSender, outputHandler);
    
    // Register mock ADDRESS target with multiple methods
    const mockHandler = (commandOrMethod, params, sourceContext) => {
      // TEMPORARY DEBUG: Log what we receive
      console.log('\n=== ADDRESS HANDLER CALLED ===');
      console.log('commandOrMethod:', commandOrMethod);
      console.log('params:', params);
      console.log('sourceContext keys:', sourceContext ? Object.keys(sourceContext) : 'none');
      console.log('sourceContext.variables keys:', sourceContext?.variables ? Array.from(sourceContext.variables.keys()) : 'none');
      console.log('\nCall stack:');
      console.log(new Error().stack);
      console.log('=== END DEBUG ===\n');

      switch (commandOrMethod.toLowerCase()) {
        case 'status':
          return Promise.resolve({
            success: true,
            service: 'mock',
            database: ':memory:',
            methods: ['status', 'banana', 'execute']
          });
        case 'banana':
          return Promise.resolve({
            success: true,
            fruit: 'yellow',
            calories: 105,
            potassium: '358mg'
          });
        default:
          return Promise.resolve({
            success: true,
            method: commandOrMethod,
            receivedParams: params
          });
      }
    };
    
    interpreter.addressTargets.set('mock', {
      handler: mockHandler,
      methods: ['status', 'banana'],
      metadata: { libraryName: 'mock-bug-test' }
    });
  });
  
  test('BUG: bare method call should return handler result (currently fails)', async () => {
    const script = `
      ADDRESS MOCK
      LET result = status
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    const result = interpreter.getVariable('result');
    
    // THIS IS HOW IT SHOULD WORK (will fail until bug is fixed):
    expect(typeof result).toBe('object');     // Should be object from handler
    expect(result.success).toBe(true);        // Should have handler's properties
    expect(result.service).toBe('mock');      // Should have handler's properties
    expect(result.database).toBe(':memory:'); // Should have handler's properties
  });
  
  test('WORKAROUND: method call with params works correctly', async () => {
    const script = `
      ADDRESS MOCK
      LET result = status params=""
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    const result = interpreter.getVariable('result');
    
    // CORRECT: This properly returns the handler's object
    expect(typeof result).toBe('object');
    expect(result.success).toBe(true);
    expect(result.service).toBe('mock');
    expect(result.database).toBe(':memory:');
  });
  
  test('FIXED: both patterns now work correctly and call handler with same arguments', async () => {
    let callCount = 0;
    const calls = [];
    
    const trackingHandler = (commandOrMethod, params) => {
      callCount++;
      calls.push({ commandOrMethod, params });
      return Promise.resolve({ 
        callNumber: callCount,
        success: true 
      });
    };
    
    interpreter.addressTargets.set('tracker', {
      handler: trackingHandler,
      methods: ['test'],
      metadata: { libraryName: 'tracker' }
    });
    
    // Test both patterns
    const script = `
      ADDRESS TRACKER
      LET buggy = test
      ADDRESS TRACKER
      LET working = test params=""
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify both calls happened with similar arguments
    expect(callCount).toBe(2);
    expect(calls[0].commandOrMethod).toBe('test');
    expect(calls[1].commandOrMethod).toBe('test');
    expect(calls[0].params).toEqual({ params: '' });
    expect(calls[1].params).toEqual({ params: '' });
    
    // Now both results work correctly (bug is fixed!)
    const buggyResult = interpreter.getVariable('buggy');
    const workingResult = interpreter.getVariable('working');
    
    expect(typeof buggyResult).toBe('object');  // FIXED: now returns object
    expect(buggyResult.callNumber).toBe(1);     // FIXED: handler result
    expect(typeof workingResult).toBe('object'); // CORRECT: handler result
    expect(workingResult.callNumber).toBe(2);
  });
  
  test('SAME BUG: any parameterless method should work (currently fails)', async () => {
    const script = `
      ADDRESS MOCK
      LET bananaResult = banana
      LET bananaWorking = banana params=""
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    const bananaResult = interpreter.getVariable('bananaResult');
    const bananaWorking = interpreter.getVariable('bananaWorking');
    
    // THIS IS HOW bananaResult SHOULD WORK (will fail until bug is fixed):
    expect(typeof bananaResult).toBe('object');    // Should be object from handler
    expect(bananaResult.success).toBe(true);       // Should have handler's properties
    expect(bananaResult.fruit).toBe('yellow');     // Should have handler's properties
    expect(bananaResult.calories).toBe(105);       // Should have handler's properties
    
    // Workaround still works for any method
    expect(typeof bananaWorking).toBe('object');
    expect(bananaWorking.success).toBe(true);
    expect(bananaWorking.fruit).toBe('yellow');
    expect(bananaWorking.calories).toBe(105);
  });
});