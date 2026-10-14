/**
 * ARRAY_FILTER Enhancement Tests
 * Tests for enhanced object array filtering capabilities
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { arrayFunctions } = require('../src/array-functions');
const { Interpreter } = require('../src/interpreter');
const { MockKitchenService } = require('./mocks/kitchen-service');

describe('ARRAY_FILTER Enhancement', () => {
  let interpreter;
  let addressSender;
  let kitchenService;
  
  beforeEach(() => {
    kitchenService = new MockKitchenService();
    addressSender = kitchenService.createRpcClient();
    interpreter = new Interpreter(addressSender);
  });

  describe('JavaScript Callback Support', () => {
    test('should handle arrow function callbacks for primitive arrays', () => {
      const input = [1, 2, 3, 4, 5, 6];
      const result = arrayFunctions.ARRAY_FILTER(input, 'x => x > 3');
      expect(result).toEqual([4, 5, 6]);
    });

    test('should handle basic filtering (via Rexx interpreter)', async () => {
      const script = `
        LET mixed = '[1, null, 2, \"\", 3, 0, 4]'
        LET filtered = ARRAY_FILTER array=mixed
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('filtered');
      expect(result).toEqual([1, 2, 3, 0, 4]);
    });

    test('should handle arrow function callbacks for string arrays', () => {
      const input = ['apple', 'banana', 'cherry', 'date'];
      const result = arrayFunctions.ARRAY_FILTER(input, 'x => x.length > 5');
      expect(result).toEqual(['banana', 'cherry']);
    });

    test('should handle arrow function callbacks for string arrays (via Rexx interpreter)', async () => {
      const script = `
        LET words = ["apple", "banana", "cherry", "date"]
        LET result = ARRAY_FILTER array=words filterExpression="x => x.length > 5"
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual(['banana', 'cherry']);
    });

    test('should handle traditional function callbacks', () => {
      const input = [1, 2, 3, 4, 5];
      const result = arrayFunctions.ARRAY_FILTER(input, 'function(x) { return x % 2 === 0; }');
      expect(result).toEqual([2, 4]);
    });

    test('should handle complex arrow function callbacks', () => {
      const input = ['test', 'hello', 'world', 'javascript'];
      const result = arrayFunctions.ARRAY_FILTER(input, 'str => str.includes("a") && str.length > 4');
      expect(result).toEqual(['javascript']);
    });

    test('should handle callback errors gracefully', () => {
      const input = [1, 2, 3];
      // Invalid callback - this should trigger the catch block and fall back
      const result = arrayFunctions.ARRAY_FILTER(input, 'x => {{{ invalid syntax');
      expect(result).toEqual([]);
    });

    test('should handle object array callbacks', () => {
      const users = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 }
      ];
      const result = arrayFunctions.ARRAY_FILTER(users, 'user => user.age >= 30');
      expect(result).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Charlie', age: 35 }
      ]);
    });

    test('should handle object array callbacks (via Rexx interpreter)', async () => {
      const script = `
        LET users = '[{"name":"Alice","age":30},{"name":"Bob","age":25},{"name":"Charlie","age":35}]'
        LET result = ARRAY_FILTER array=users filterExpression="user => user.age >= 30"
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Charlie', age: 35 }
      ]);
    });
  });

  describe('Backward Compatibility', () => {
    test('should filter null/empty values without filterExpression', () => {
      const input = [1, null, 2, "", 3, 0, 4];
      const result = arrayFunctions.ARRAY_FILTER(input);
      expect(result).toEqual([1, 2, 3, 0, 4]);
    });

    test('should handle JSON string arrays', () => {
      const input = JSON.stringify(['a', '', 'b', null, 'c']);
      const result = arrayFunctions.ARRAY_FILTER(input);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    test('should handle string array value matching', () => {
      const input = ['apple', 'banana', 'apple', 'orange'];
      const result = arrayFunctions.ARRAY_FILTER(input, 'apple');
      expect(result).toEqual(['apple', 'apple']);
    });

    test('should handle truthy/falsy filtering for string arrays', () => {
      const input = [1, 0, 'hello', '', true, false, null];
      const truthyResult = arrayFunctions.ARRAY_FILTER(input, 'truthy');
      const falsyResult = arrayFunctions.ARRAY_FILTER(input, 'falsy');
      
      expect(truthyResult).toEqual([1, 'hello', true]);
      expect(falsyResult).toEqual([0, '', false, null]);
    });

    test('should handle simple expressions with item variable', () => {
      const input = [1, 2, 3, 4, 5];
      const result = arrayFunctions.ARRAY_FILTER(input, 'item > 3');
      expect(result).toEqual([4, 5]);
    });

    test('should handle string expressions with item variable', () => {
      const input = ['apple', 'banana', 'cherry'];
      const result = arrayFunctions.ARRAY_FILTER(input, 'item.length === 5');
      expect(result).toEqual(['apple']);
    });
  });

  describe('Object Array Filtering', () => {
    const users = [
      { name: 'Alice', age: 30, active: true },
      { name: 'Bob', age: 25, active: false },
      { name: 'Charlie', age: 35, active: true },
      { name: 'Diana', age: 22, active: false }
    ];

    test('should filter by property existence (truthy values)', () => {
      const result = arrayFunctions.ARRAY_FILTER(users, 'active');
      expect(result).toEqual([
        { name: 'Alice', age: 30, active: true },
        { name: 'Charlie', age: 35, active: true }
      ]);
    });

    test('should filter by property name extraction', () => {
      const result = arrayFunctions.ARRAY_FILTER(users, 'name');
      // All users have names, so all should pass
      expect(result).toEqual(users);
    });

    test('should filter by numeric comparison', () => {
      const result = arrayFunctions.ARRAY_FILTER(users, 'age >= 30');
      expect(result).toEqual([
        { name: 'Alice', age: 30, active: true },
        { name: 'Charlie', age: 35, active: true }
      ]);
    });

    test('should handle basic object property extraction (via Rexx interpreter)', async () => {
      const script = `
        LET users = '[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
        LET filtered = ARRAY_FILTER array=users filterExpression="name"
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('filtered');
      // Should return users with names (both should have names)
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
    });

    test('should filter by string equality', () => {
      const result = arrayFunctions.ARRAY_FILTER(users, 'name === "Alice"');
      expect(result).toEqual([
        { name: 'Alice', age: 30, active: true }
      ]);
    });

    test('should filter by boolean property', () => {
      const result = arrayFunctions.ARRAY_FILTER(users, 'active === true');
      expect(result).toEqual([
        { name: 'Alice', age: 30, active: true },
        { name: 'Charlie', age: 35, active: true }
      ]);
    });

    test('should handle complex expressions', () => {
      const result = arrayFunctions.ARRAY_FILTER(users, 'age > 25 && active === true');
      expect(result).toEqual([
        { name: 'Alice', age: 30, active: true },
        { name: 'Charlie', age: 35, active: true }
      ]);
    });

    test('should handle complex expressions (via Rexx interpreter)', async () => {
      const script = `
        LET users = '[{"name":"Alice","age":30,"active":true},{"name":"Bob","age":25,"active":false},{"name":"Charlie","age":35,"active":true},{"name":"Diana","age":22,"active":false}]'
        LET result = ARRAY_FILTER array=users filterExpression="age > 25 && active === true"
      `;
      
      const commands = require('../src/parser').parse(script);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('result');
      expect(result).toEqual([
        { name: 'Alice', age: 30, active: true },
        { name: 'Charlie', age: 35, active: true }
      ]);
    });

    test('should handle string contains operations', () => {
      const result = arrayFunctions.ARRAY_FILTER(users, 'name.includes("a")');
      expect(result).toEqual([
        { name: 'Charlie', age: 35, active: true },
        { name: 'Diana', age: 22, active: false }
      ]);
    });
  });

  describe('JSON String Object Arrays', () => {
    test('should handle JSON string object arrays', () => {
      const jsonUsers = JSON.stringify([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ]);
      
      const result = arrayFunctions.ARRAY_FILTER(jsonUsers, 'age >= 30');
      expect(result).toEqual([{ name: 'Alice', age: 30 }]);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid expressions gracefully', () => {
      const users = [{ name: 'Alice', age: 30 }];
      const result = arrayFunctions.ARRAY_FILTER(users, 'invalid.property.chain()');
      expect(result).toEqual([]);
    });

    test('should handle mixed array types', () => {
      const mixed = [{ age: 30 }, 'string', null, { age: 25 }];
      const result = arrayFunctions.ARRAY_FILTER(mixed, 'age >= 25');
      expect(result).toEqual([{ age: 30 }, { age: 25 }]);
    });

    test('should handle empty arrays', () => {
      const result = arrayFunctions.ARRAY_FILTER([], 'age >= 25');
      expect(result).toEqual([]);
    });

    test('should handle malformed JSON', () => {
      const result = arrayFunctions.ARRAY_FILTER('invalid json', 'age >= 25');
      expect(result).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    test('should handle objects with null/undefined properties', () => {
      const users = [
        { name: 'Alice', age: null },
        { name: 'Bob', age: undefined },
        { name: 'Charlie', age: 30 }
      ];
      
      const result = arrayFunctions.ARRAY_FILTER(users, 'age');
      expect(result).toEqual([{ name: 'Charlie', age: 30 }]);
    });

    test('should handle numeric strings in comparisons', () => {
      const items = [
        { value: '30' },
        { value: '25' },
        { value: '35' }
      ];
      
      const result = arrayFunctions.ARRAY_FILTER(items, 'value >= 30');
      expect(result).toEqual([{ value: '30' }, { value: '35' }]);
    });

    test('should handle arrays as property values', () => {
      const users = [
        { name: 'Alice', tags: ['admin', 'user'] },
        { name: 'Bob', tags: ['user'] },
        { name: 'Charlie', tags: [] }
      ];
      
      const result = arrayFunctions.ARRAY_FILTER(users, 'tags.length > 1');
      expect(result).toEqual([{ name: 'Alice', tags: ['admin', 'user'] }]);
    });
  });
});