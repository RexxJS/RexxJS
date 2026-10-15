/**
 * Tests for CALL with arguments and ARG statement functionality
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { parse } = require('../src/parser');
const { RexxInterpreter } = require('../src/interpreter');

describe('CALL with arguments and ARG statement', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new RexxInterpreter();
  });

  describe('CALL with string literals', () => {
    test('should pass single string argument', async () => {
      const script = `
        TestSub:
          ARG message
        RETURN
        
        CALL TestSub "Hello World"
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('message')).toBe('Hello World');
    });

    test('should pass multiple string arguments', async () => {
      const script = `
        TestSub:
          ARG first, second, third
        RETURN
        
        CALL TestSub "Hello", "Beautiful", "World"
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('first')).toBe('Hello');
      expect(interpreter.getVariable('second')).toBe('Beautiful');
      expect(interpreter.getVariable('third')).toBe('World');
    });
  });

  describe('CALL with variables', () => {
    test('should pass variable arguments', async () => {
      const script = `
        TestSub:
          ARG name, value
        RETURN
        
        LET myName = "Claude"
        LET myValue = 42
        CALL TestSub myName, myValue
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('name')).toBe('Claude');
      expect(interpreter.getVariable('value')).toBe(42);
    });
  });

  describe('CALL with mixed argument types', () => {
    test('should handle string, variable, and number arguments', async () => {
      const script = `
        TestSub:
          ARG text, variable, number
        RETURN
        
        LET someVar = "from variable"
        CALL TestSub "literal string", someVar, 123
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('text')).toBe('literal string');
      expect(interpreter.getVariable('variable')).toBe('from variable');
      expect(interpreter.getVariable('number')).toBe(123); // A number, as LET x = 123 and a function call's 123 are
    });
  });

  describe('ARG statement variations', () => {
    test('should handle ARG with single variable', async () => {
      const script = `
        SingleArg:
          ARG message
          LET result = message
        RETURN
        
        CALL SingleArg "Test Message"
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('message')).toBe('Test Message');
      expect(interpreter.getVariable('result')).toBe('Test Message');
    });

    test('should handle ARG with multiple variables', async () => {
      const script = `
        MultipleArgs:
          ARG x, y, operation
          LET result = operation || ": " || x || " and " || y
        RETURN
        
        CALL MultipleArgs 10, 20, "adding"
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('x')).toBe(10); // A number, as LET x = 10 is
      expect(interpreter.getVariable('y')).toBe(20);
      expect(interpreter.getVariable('operation')).toBe('adding');
      expect(interpreter.getVariable('result')).toBe('adding: 10 and 20');
    });
  });

  describe('ARG edge cases', () => {
    test('should handle empty argument list', async () => {
      const script = `
        NoArgs:
          ARG message
          LET hasMessage = message
        RETURN
        
        CALL NoArgs
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('message')).toBe('');
      expect(interpreter.getVariable('hasMessage')).toBe('');
    });

    test('should handle more arguments than ARG variables', async () => {
      const script = `
        TwoVars:
          ARG first, second
          LET firstSet = first
          LET secondSet = second
          LET third = ARG(3)
          LET fourth = ARG(4)
        RETURN

        CALL TwoVars "one", "two", "three", "four"
      `;

      await interpreter.run(parse(script));
      expect(interpreter.getVariable('first')).toBe('one');
      expect(interpreter.getVariable('second')).toBe('two');
      // Extra arguments should be accessible via ARG(3), ARG(4)
      expect(interpreter.getVariable('third')).toBe('three');
      expect(interpreter.getVariable('fourth')).toBe('four');
    });

    test('should handle more ARG variables than arguments', async () => {
      const script = `
        ThreeVars:
          ARG first, second, third
          LET firstSet = first
          LET secondSet = second  
          LET thirdSet = third
        RETURN
        
        CALL ThreeVars "only", "two"
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('first')).toBe('only');
      expect(interpreter.getVariable('second')).toBe('two');
      expect(interpreter.getVariable('third')).toBe(''); // Should default to empty
    });
  });

  describe('Practical usage example', () => {
    test('should work with LogMessage style subroutine', async () => {
      const script = `
        LogMessage:
          ARG message
          LET logOutput = "[LOG] " || message
          LET logCalled = "true"
        RETURN
        
        CALL LogMessage "Operation completed successfully"
      `;
      
      await interpreter.run(parse(script));
      expect(interpreter.getVariable('message')).toBe('Operation completed successfully');
      expect(interpreter.getVariable('logOutput')).toBe('[LOG] Operation completed successfully');
      expect(interpreter.getVariable('logCalled')).toBe('true');
    });
  });
});