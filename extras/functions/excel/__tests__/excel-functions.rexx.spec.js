const path = require('path');

// Import the Rexx interpreter from core
const { RexxInterpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');

// Import the function module for direct registration  
const excelFunctions = require('../src/excel-functions');

describe('Excel Functions - Rexx Integration Tests', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new RexxInterpreter(null, {
      output: (text) => {}, // Silent for tests
      loadPaths: [path.join(__dirname, '../../../core/src')]
    });
    
    // Register Excel functions directly with the interpreter
    // This is the approach the user wanted to test - ensuring functions are "hooked up"
    Object.keys(excelFunctions).forEach(funcName => {
      interpreter.builtInFunctions[funcName] = excelFunctions[funcName];
    });
  });

  test('should handle VLOOKUP function through Rexx interpreter', async () => {
    const rexxCode = `
      LET tableData = '[["Name", "Age", "City"], ["John", 30, "New York"], ["Jane", 25, "London"]]'
      LET result = VLOOKUP lookupValue="Jane" tableArray=tableData colIndex=2 exactMatch="true"
      SAY "VLOOKUP result: " || result
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBe(25);
  });

  test('should handle CONCATENATE function through Rexx interpreter', async () => {
    const rexxCode = `
      LET result = CONCATENATE text1="Hello" text2=" " text3="World"
      SAY "CONCATENATE result: " || result
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBe('Hello World');
  });

  test('should handle LEFT string function through Rexx interpreter', async () => {
    const rexxCode = `
      LET result = LEFT text="Hello World" numChars=5
      SAY "LEFT result: " || result
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBe('Hello');
  });

  test('should handle date functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET dateValue = "2025-01-15"
      LET yearResult = YEAR dateValue=dateValue
      LET monthResult = MONTH dateValue=dateValue  
      LET dayResult = DAY dateValue=dateValue
      SAY "Date components: " || yearResult || "-" || monthResult || "-" || dayResult
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    expect(interpreter.variables.get('yearResult')).toBe(2025);
    expect(interpreter.variables.get('monthResult')).toBe(1);
    expect(interpreter.variables.get('dayResult')).toBe(15);
  });

  test('should handle financial calculation through Rexx interpreter', async () => {
    const rexxCode = `
      LET rate = 0.08
      LET periods = 10
      LET presentValue = 10000
      LET payment = PMT rate=rate periods=periods presentValue=presentValue
      SAY "PMT calculation result: " || payment
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const payment = interpreter.variables.get('payment');
    expect(typeof payment).toBe('number');
    expect(Math.abs(payment)).toBeGreaterThan(1000); // Should be substantial payment
  });

  test('should handle new logical functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET test1 = IF logical_test="true" value_if_true="YES" value_if_false="NO"
      LET test2 = AND value1="true" value2="true"
      LET test3 = OR value1="false" value2="true"
      LET test4 = NOT logical="false"
      SAY "IF result: " || test1 || ", AND: " || test2 || ", OR: " || test3 || ", NOT: " || test4
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    expect(interpreter.variables.get('test1')).toBe('YES');
    expect(interpreter.variables.get('test2')).toBe(true);
    expect(interpreter.variables.get('test3')).toBe(true);
    expect(interpreter.variables.get('test4')).toBe(true);
  });

  test('should handle new text functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET concat = CONCATENATE text1="Hello" text2=" " text3="World"
      LET leftText = LEFT text="Hello World" num_chars="5"
      LET rightText = RIGHT text="Hello World" num_chars="5"
      LET midText = MID text="Hello World" start_num="7" num_chars="5"
      LET lenText = LEN text="Hello"
      SAY "Results: " || concat || ", " || leftText || ", " || rightText || ", " || midText || ", " || lenText
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    expect(interpreter.variables.get('concat')).toBe('Hello World');
    expect(interpreter.variables.get('leftText')).toBe('Hello');
    expect(interpreter.variables.get('rightText')).toBe('World');
    expect(interpreter.variables.get('midText')).toBe('World');
    expect(interpreter.variables.get('lenText')).toBe(5);
  });

  test('should handle new math functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET power = POWER number="2" power="3"
      LET sqrt = SQRT number="16"
      LET mod = MOD number="10" divisor="3"
      LET round = ROUND number="3.14159" num_digits="2"
      SAY "Math results: " || power || ", " || sqrt || ", " || mod || ", " || round
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    expect(interpreter.variables.get('power')).toBe(8);
    expect(interpreter.variables.get('sqrt')).toBe(4);
    expect(interpreter.variables.get('mod')).toBe(1);
    expect(interpreter.variables.get('round')).toBe(3.14);
  });
});