/**
 * Variable Resolution Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Variable Resolution Tests', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new RexxInterpreter(null, {
      output: (text) => console.log('SAY:', text)
    });
  });

  test('should handle simple variable assignment', async () => {
    const rexxCode = `
      SAY "Testing simple assignment"
      LET count = 42
      SAY "Count is:" count
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    expect(interpreter.variables.get('count')).toBe(42);
  });

  test('should handle variable-to-variable assignment', async () => {
    const rexxCode = `
      SAY "Testing variable-to-variable assignment"
      LET a = 10
      LET b = a
      SAY "A is:" a
      SAY "B is:" b
    `;
    
    const commands = parse(rexxCode);
    
    try {
      await interpreter.run(commands);
      expect(interpreter.variables.get('a')).toBe(10);
      expect(interpreter.variables.get('b')).toBe(10);
    } catch (error) {
      console.error('Variable-to-variable assignment failed:', error.message);
      throw error;
    }
  });

  test('should handle DO loop with variable', async () => {
    const rexxCode = `
      SAY "Testing DO loop"
      DO i = 1 TO 3
        SAY "Loop i is:" i
      END
      SAY "Loop completed"
    `;
    
    const commands = parse(rexxCode);
    
    try {
      await interpreter.run(commands);
      // The control variable is left with the value that ended the loop,
      // 4 after DO i = 1 TO 3 (TRL 4.2)
      expect(interpreter.variables.get('i')).toBe(4);
    } catch (error) {
      console.error('DO loop failed:', error.message);
      throw error;
    }
  });

  test('should handle arithmetic with variables', async () => {
    const rexxCode = `
      SAY "Testing arithmetic"
      LET a = 5
      LET b = 3
      LET sum = a + b
      SAY "Sum is:" sum
    `;
    
    const commands = parse(rexxCode);
    
    try {
      await interpreter.run(commands);
      expect(interpreter.variables.get('sum')).toBe(8);
    } catch (error) {
      console.error('Arithmetic with variables failed:', error.message);
      throw error;
    }
  });

  test('should reproduce the exact failing scenario', async () => {
    // This is the exact pattern that fails in the browser
    const rexxCode = `
      SAY "Starting test"
      DO i = 1 TO 5
        LET remainder = i // 2
        SAY "Remainder:" remainder
      END
      SAY "Test complete"
    `;
    
    const commands = parse(rexxCode);
    
    try {
      await interpreter.run(commands);
      console.log('SUCCESS: Complex scenario worked in Jest');
    } catch (error) {
      console.error('FAILED: Same error as browser:', error.message);
      throw error;
    }
  });

  test('should simulate worker environment initialization', () => {
    // Test the exact initialization pattern from streaming-worker.html
    const testInterpreter = new RexxInterpreter(null, {
      output: (text) => console.log('Worker output:', text)
    });
    
    // Add streaming callback like in worker
    testInterpreter.streamingProgressCallback = (data) => {
      console.log('Progress callback:', data);
    };
    
    // Test if basic variable operations work
    const simpleTest = `
      LET test = 123
      SAY "Test value:" test
    `;
    
    const commands = parse(simpleTest);
    
    return testInterpreter.run(commands).then(() => {
      expect(testInterpreter.variables.get('test')).toBe(123);
      console.log('Worker environment simulation: SUCCESS');
    }).catch((error) => {
      console.error('Worker environment simulation: FAILED', error.message);
      throw error;
    });
  });
});