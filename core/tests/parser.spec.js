/**
 * Parser Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { parse } = require('../src/parser');

describe('Rexx-lite Parser', () => {
  it('should parse a single command with no arguments', () => {
    const script = 'listMeals';
    const result = parse(script);
    expect(result).toEqual([
      {
        type: 'FUNCTION_CALL',
        command: 'listMeals',
        params: {},
        lineNumber: 1,
        originalLine: 'listMeals'
      }
    ]);
  });

  it('should parse a command with multiple keyword arguments', () => {
    const script = 'createMeal potatoes=2 chicken=1 spices=true';
    const result = parse(script);
    expect(result).toEqual([
      {
        type: 'FUNCTION_CALL',
        command: 'createMeal',
        params: {
          potatoes: 2,
          chicken: 1,
          spices: 'true'
        },
        lineNumber: 1,
        originalLine: 'createMeal potatoes=2 chicken=1 spices=true'
      }
    ]);
  });

  it('should parse a multi-line script and ignore blank lines', () => {
    const script = `
      prepareDish name=salad
      
      createMeal rice=3
    `;
    const result = parse(script);
    expect(result).toEqual([
      {
        type: 'FUNCTION_CALL',
        command: 'prepareDish',
        params: {
          name: 'salad'
        },
        lineNumber: 2,
        originalLine: 'prepareDish name=salad'
      },
      {
        type: 'FUNCTION_CALL',
        command: 'createMeal',
        params: {
          rice: 3
        },
        lineNumber: 4,
        originalLine: 'createMeal rice=3'
      }
    ]);
  });

  it('should parse ADDRESS commands', () => {
    const script = 'ADDRESS appliance';
    const result = parse(script);
    expect(result).toEqual([
      {
        type: 'ADDRESS',
        target: 'appliance',
        lineNumber: 1,
        originalLine: 'ADDRESS appliance'
      }
    ]);
  });

  it('should parse arguments with quoted strings', () => {
    const script = "prepareDish name='Chicken Parmesan' servings=4 time=45";
    const result = parse(script);
    expect(result).toEqual([
      {
        type: 'FUNCTION_CALL',
        command: 'prepareDish',
        params: {
          name: { type: 'LITERAL', value: 'Chicken Parmesan' },
          servings: 4,
          time: 45
        },
        lineNumber: 1,
        originalLine: "prepareDish name='Chicken Parmesan' servings=4 time=45"
      }
    ]);
  });

  it('should parse simple IF/ENDIF statements', () => {
    const script = `
      IF stock.quantity > 5 THEN
        createMeal chicken=2
      ENDIF
    `;
    const result = parse(script);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'IF',
      condition: {
        type: 'COMPARISON',
        left: 'stock.quantity',
        operator: '>',
        right: '5'
      },
      thenCommands: [
        {
          type: 'FUNCTION_CALL',
          command: 'createMeal',
          params: { chicken: 2 },
          lineNumber: 3,
          originalLine: 'createMeal chicken=2'
        }
      ],
      elseCommands: [],
      lineNumber: 2,
      originalLine: 'IF stock.quantity > 5 THEN'
    });
  });

  it('should parse IF/ELSE/ENDIF statements', () => {
    const script = `
      IF inventory.chicken < 3 THEN
        prepareDish name='Salad' servings=2
      ELSE
        createMeal chicken=3 potatoes=2
      ENDIF
    `;
    const result = parse(script);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'IF',
      condition: {
        type: 'COMPARISON',
        left: 'inventory.chicken',
        operator: '<',
        right: '3'
      },
      thenCommands: [
        {
          type: 'FUNCTION_CALL',
          command: 'prepareDish',
          params: { name: { type: 'LITERAL', value: 'Salad' }, servings: 2 },
          lineNumber: 3,
          originalLine: "prepareDish name='Salad' servings=2"
        }
      ],
      elseCommands: [
        {
          type: 'FUNCTION_CALL',
          command: 'createMeal',
          params: { chicken: 3, potatoes: 2 },
          lineNumber: 5,
          originalLine: 'createMeal chicken=3 potatoes=2'
        }
      ],
      lineNumber: 2,
      originalLine: 'IF inventory.chicken < 3 THEN'
    });
  });

  it('should parse nested IF statements', () => {
    const script = `
      IF stock.quantity > 0 THEN
        IF stock.quantity > 5 THEN
          createMeal chicken=stock.quantity
        ELSE
          prepareDish name='Light Meal' servings=1
        ENDIF
      ENDIF
    `;
    const result = parse(script);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('IF');
    expect(result[0].thenCommands).toHaveLength(1);
    expect(result[0].thenCommands[0].type).toBe('IF');
    expect(result[0].thenCommands[0].thenCommands).toHaveLength(1);
    expect(result[0].thenCommands[0].elseCommands).toHaveLength(1);
  });

  it('should parse boolean conditions', () => {
    const script = `
      IF hasIngredients THEN
        createMeal potatoes=2
      ENDIF
    `;
    const result = parse(script);
    expect(result[0].condition).toEqual({
      type: 'BOOLEAN',
      expression: 'hasIngredients'
    });
  });

  it('should parse multiple statements with conditionals', () => {
    const script = `
      LET stock = checkStock item=chicken
      IF stock.quantity > 3 THEN
        createMeal chicken=3
      ELSE
        prepareDish name='Vegetarian' servings=2
      ENDIF
      listMeals
    `;
    const result = parse(script);
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('ASSIGNMENT');
    expect(result[1].type).toBe('IF');
    expect(result[2].type).toBe('FUNCTION_CALL');
    expect(result[2].command).toBe('listMeals');
  });

  it('should parse simple DO range loops', () => {
    const script = `
      DO i = 1 TO 3
        createMeal potatoes=i
      END
    `;
    const result = parse(script);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'DO',
      loopSpec: {
        type: 'RANGE',
        variable: 'i',
        start: { type: 'LITERAL', value: 1 },
        end: { type: 'LITERAL', value: 3 }
      },
      bodyCommands: [
        {
          type: 'FUNCTION_CALL',
          command: 'createMeal',
          params: { potatoes: 'i' },
          lineNumber: 3,
          originalLine: 'createMeal potatoes=i'
        }
      ]
    });
  });

  it('should parse DO range loops with step', () => {
    const script = `
      DO count = 2 TO 10 BY 2
        prepareDish name='Dish' servings=count
      END
    `;
    const result = parse(script);
    expect(result).toHaveLength(1);
    expect(result[0].loopSpec).toEqual({
      type: 'RANGE_WITH_STEP',
      variable: 'count',
      start: { type: 'LITERAL', value: 2 },
      end: { type: 'LITERAL', value: 10 },
      step: { type: 'LITERAL', value: 2 }
    });
  });

  it('should parse DO WHILE loops', () => {
    const script = `
      DO WHILE stock.quantity > 0
        createMeal chicken=1
      END
    `;
    const result = parse(script);
    expect(result).toHaveLength(1);
    expect(result[0].loopSpec).toEqual({
      type: 'WHILE',
      condition: {
        type: 'COMPARISON',
        left: 'stock.quantity',
        operator: '>',
        right: '0'
      }
    });
  });

  it('should parse simple DO repeat loops', () => {
    const script = `
      DO 3
        prepareDish name='Snack' servings=1
      END
    `;
    const result = parse(script);
    expect(result).toHaveLength(1);
    expect(result[0].loopSpec).toEqual({
      type: 'REPEAT',
      count: 3
    });
  });

  it('should parse nested DO loops', () => {
    const script = `
      DO i = 1 TO 2
        DO j = 1 TO 2
          createMeal chicken=i potatoes=j
        END
      END
    `;
    const result = parse(script);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('DO');
    expect(result[0].bodyCommands).toHaveLength(1);
    expect(result[0].bodyCommands[0].type).toBe('DO');
    expect(result[0].bodyCommands[0].bodyCommands).toHaveLength(1);
  });

  it('should parse DO loops with variables in range', () => {
    const script = `
      DO i = start TO end
        prepareDish name='Dynamic' servings=i
      END
    `;
    const result = parse(script);
    expect(result[0].loopSpec).toEqual({
      type: 'RANGE',
      variable: 'i',
      start: { type: 'VARIABLE', name: 'start' },
      end: { type: 'VARIABLE', name: 'end' }
    });
  });

  it('should parse basic SELECT statement with WHEN and OTHERWISE', () => {
    const script = `
      SELECT
        WHEN stock.chicken > 10 THEN
          prepareDish name='Feast' servings=8
        WHEN stock.chicken > 5 THEN
          createMeal chicken=3 potatoes=4
        OTHERWISE
          prepareDish name='Light Meal' servings=2
      END
    `;
    const result = parse(script);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'SELECT',
      lineNumber: 2,
      whenClauses: [
        {
          condition: {
            type: 'COMPARISON',
            left: 'stock.chicken',
            operator: '>',
            right: '10'
          },
          commands: [
            {
              type: 'FUNCTION_CALL',
              command: 'prepareDish',
              params: { name: { type: 'LITERAL', value: 'Feast' }, servings: 8 },
              lineNumber: 4,
              originalLine: "prepareDish name='Feast' servings=8"
            }
          ],
          lineNumber: 3
        },
        {
          condition: {
            type: 'COMPARISON',
            left: 'stock.chicken',
            operator: '>',
            right: '5'
          },
          commands: [
            {
              type: 'FUNCTION_CALL',
              command: 'createMeal',
              params: { chicken: 3, potatoes: 4 },
              lineNumber: 6,
              originalLine: 'createMeal chicken=3 potatoes=4'
            }
          ],
          lineNumber: 5
        }
      ],
      otherwiseCommands: [
        {
          type: 'FUNCTION_CALL',
          command: 'prepareDish',
          params: { name: { type: 'LITERAL', value: 'Light Meal' }, servings: 2 },
          lineNumber: 8,
          originalLine: "prepareDish name='Light Meal' servings=2"
        }
      ],
      otherwiseLineNumber: 7
    });
  });

  it('should parse SELECT statement without OTHERWISE clause', () => {
    const script = `
      SELECT
        WHEN inventory.spices >= 5 THEN
          createMeal spices=true
        WHEN inventory.spices >= 1 THEN
          prepareDish name='Mild Dish' servings=3
      END
    `;
    const result = parse(script);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('SELECT');
    expect(result[0].whenClauses).toHaveLength(2);
    expect(result[0].otherwiseCommands).toHaveLength(0);
  });

  it('should parse SELECT statement with multiple commands in WHEN clauses', () => {
    const script = `
      SELECT
        WHEN budget > 100 THEN
          createMeal chicken=5 potatoes=8 spices=true
          prepareDish name='Side Salad' servings=6
        OTHERWISE
          prepareDish name='Budget Meal' servings=2
          prepareDish name='Bread' servings=4
      END
    `;
    const result = parse(script);
    expect(result[0].whenClauses[0].commands).toHaveLength(2);
    expect(result[0].otherwiseCommands).toHaveLength(2);
  });

  it('should parse nested SELECT statements', () => {
    const script = `
      SELECT
        WHEN season = 'summer' THEN
          SELECT
            WHEN temperature > 85 THEN
              prepareDish name='Cold Salad' servings=4
            OTHERWISE
              prepareDish name='Light Meal' servings=3
          END
        OTHERWISE
          prepareDish name='Regular Meal' servings=4
      END
    `;
    const result = parse(script);
    expect(result[0].whenClauses[0].commands).toHaveLength(1);
    expect(result[0].whenClauses[0].commands[0].type).toBe('SELECT');
  });

  it('should parse SELECT statement with equality and boolean conditions', () => {
    const script = `
      SELECT
        WHEN dayOfWeek = 'Friday' THEN
          prepareDish name='Fish Special' servings=6
        WHEN isHoliday THEN
          prepareDish name='Holiday Meal' servings=8
        OTHERWISE
          prepareDish name='Regular Meal' servings=4
      END
    `;
    const result = parse(script);
    expect(result[0].whenClauses[0].condition).toEqual({
      type: 'COMPARISON',
      left: 'dayOfWeek',
      operator: '=',
      right: "'Friday'"
    });
    expect(result[0].whenClauses[1].condition).toEqual({
      type: 'BOOLEAN',
      expression: 'isHoliday'
    });
  });

  it('should parse LET assignment with simple mathematical expressions', () => {
    const script = 'LET portions = stock.quantity + 2';
    const result = parse(script);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'ASSIGNMENT',
      variable: 'portions',
      expression: {
        type: 'BINARY_OP',
        operator: '+',
        left: {
          type: 'VARIABLE',
          name: 'stock.quantity'
        },
        right: {
          type: 'LITERAL',
          value: 2
        }
      },
      lineNumber: 1,
      originalLine: 'LET portions = stock.quantity + 2'
    });
  });

  it('should parse LET assignment with complex mathematical expressions', () => {
    const script = 'LET result = (count + 3) * 2';
    const result = parse(script);
    expect(result[0].expression).toEqual({
      type: 'BINARY_OP',
      operator: '*',
      left: {
        type: 'BINARY_OP',
        operator: '+',
        left: {
          type: 'VARIABLE',
          name: 'count'
        },
        right: {
          type: 'LITERAL',
          value: 3
        }
      },
      right: {
        type: 'LITERAL',
        value: 2
      }
    });
  });

  it('should parse function parameters with mathematical expressions', () => {
    const script = 'createMeal chicken=count+1 potatoes=portions*2';
    const result = parse(script);
    expect(result[0].params.chicken).toEqual({
      type: 'BINARY_OP',
      operator: '+',
      left: {
        type: 'VARIABLE',
        name: 'count'
      },
      right: {
        type: 'LITERAL',
        value: 1
      }
    });
    expect(result[0].params.potatoes).toEqual({
      type: 'BINARY_OP',
      operator: '*',
      left: {
        type: 'VARIABLE',
        name: 'portions'
      },
      right: {
        type: 'LITERAL',
        value: 2
      }
    });
  });

  it('should parse function parameters with parenthesized expressions', () => {
    const script = 'prepareDish servings=(base+extra)*multiplier';
    const result = parse(script);
    expect(result[0].params.servings).toEqual({
      type: 'BINARY_OP',
      operator: '*',
      left: {
        type: 'BINARY_OP',
        operator: '+',
        left: {
          type: 'VARIABLE',
          name: 'base'
        },
        right: {
          type: 'VARIABLE',
          name: 'extra'
        }
      },
      right: {
        type: 'VARIABLE',
        name: 'multiplier'
      }
    });
  });

  it('should handle operator precedence correctly', () => {
    const script = 'LET result = a + b * c';
    const result = parse(script);
    // Should parse as a + (b * c), not (a + b) * c
    expect(result[0].expression).toEqual({
      type: 'BINARY_OP',
      operator: '+',
      left: {
        type: 'VARIABLE',
        name: 'a'
      },
      right: {
        type: 'BINARY_OP',
        operator: '*',
        left: {
          type: 'VARIABLE',
          name: 'b'
        },
        right: {
          type: 'VARIABLE',
          name: 'c'
        }
      }
    });
  });

  it('should parse expressions with division and subtraction', () => {
    const script = 'LET result = total / count - overhead';
    const result = parse(script);
    // Should parse as (total / count) - overhead due to operator precedence
    expect(result[0].expression).toEqual({
      type: 'BINARY_OP',
      operator: '-',
      left: {
        type: 'BINARY_OP',
        operator: '/',
        left: {
          type: 'VARIABLE',
          name: 'total'
        },
        right: {
          type: 'VARIABLE',
          name: 'count'
        }
      },
      right: {
        type: 'VARIABLE',
        name: 'overhead'
      }
    });
  });

  it('should handle negative numbers in expressions', () => {
    const script = 'LET result = count + -5';
    const result = parse(script);
    expect(result[0].expression.right).toEqual({
      type: 'LITERAL',
      value: -5
    });
  });

  it('should parse simple variable assignments as expressions', () => {
    const script = 'LET portions = baseAmount';
    const result = parse(script);
    expect(result[0]).toEqual({
      type: 'ASSIGNMENT',
      variable: 'portions',
      expression: {
        type: 'VARIABLE',
        name: 'baseAmount'
      },
      lineNumber: 1,
      originalLine: 'LET portions = baseAmount'
    });
  });

  it('should parse simple numeric literals as expressions', () => {
    const script = 'LET count = 42';
    const result = parse(script);
    expect(result[0]).toEqual({
      type: 'ASSIGNMENT',
      variable: 'count',
      expression: {
        type: 'LITERAL',
        value: 42
      },
      lineNumber: 1,
      originalLine: 'LET count = 42'
    });
  });

  it('should fall back to original parsing for non-expressions', () => {
    const script = 'LET meal = createMeal chicken=2';
    const result = parse(script);
    // Should parse as function call assignment, not expression assignment
    expect(result[0].command).toBeDefined();
    expect(result[0].expression).toBeUndefined();
  });

  describe('String Interpolation', () => {
    it('should parse interpolated strings in function parameters', () => {
      const script = 'prepareDish name="Today\'s {mealName}" servings=4';
      const result = parse(script);
      expect(result[0]).toEqual({
        type: 'FUNCTION_CALL',
        command: 'prepareDish',
        params: {
          name: {
            type: 'INTERPOLATED_STRING',
            template: "Today's {mealName}"
          },
          servings: 4
        },
        lineNumber: 1,
        originalLine: 'prepareDish name="Today\'s {mealName}" servings=4'
      });
    });

    it('should parse interpolated strings with single quotes', () => {
      const script = 'prepareDish name=\'Hello {userName}\'';
      const result = parse(script);
      expect(result[0]).toEqual({
        type: 'FUNCTION_CALL',
        command: 'prepareDish',
        params: {
          name: {
            type: 'INTERPOLATED_STRING',
            template: "Hello {userName}"
          }
        },
        lineNumber: 1,
        originalLine: 'prepareDish name=\'Hello {userName}\''
      });
    });

    it('should parse interpolated strings in LET assignments', () => {
      const script = 'LET message = "Welcome {firstName} {lastName}"';
      const result = parse(script);
      expect(result[0]).toEqual({
        type: 'ASSIGNMENT',
        variable: 'message',
        expression: {
          type: 'INTERPOLATED_STRING',
          template: "Welcome {firstName} {lastName}"
        },
        lineNumber: 1,
        originalLine: 'LET message = "Welcome {firstName} {lastName}"'
      });
    });

    it('should handle multiple variables in interpolated strings', () => {
      const script = 'LET greeting = "Hello {name}, you have {count} messages"';
      const result = parse(script);
      expect(result[0]).toEqual({
        type: 'ASSIGNMENT',
        variable: 'greeting',
        expression: {
          type: 'INTERPOLATED_STRING',
          template: "Hello {name}, you have {count} messages"
        },
        lineNumber: 1,
        originalLine: 'LET greeting = "Hello {name}, you have {count} messages"'
      });
    });

    it('should parse regular strings without interpolation normally', () => {
      const script = 'prepareDish name="Simple Name" servings=2';
      const result = parse(script);
      expect(result[0]).toEqual({
        type: 'FUNCTION_CALL',
        command: 'prepareDish',
        params: {
          name: { type: 'LITERAL', value: "Simple Name" },
          servings: 2
        },
        lineNumber: 1,
        originalLine: 'prepareDish name="Simple Name" servings=2'
      });
    });

    it('should handle mixed interpolated and regular parameters', () => {
      const script = 'createMeal name="Meal for {guest}" chicken=2 note="Regular string"';
      const result = parse(script);
      expect(result[0]).toEqual({
        type: 'FUNCTION_CALL',
        command: 'createMeal',
        params: {
          name: {
            type: 'INTERPOLATED_STRING',
            template: "Meal for {guest}"
          },
          chicken: 2,
          note: { type: 'LITERAL', value: "Regular string" }
        },
        lineNumber: 1,
        originalLine: 'createMeal name="Meal for {guest}" chicken=2 note="Regular string"'
      });
    });

    it('should handle complex variable names in interpolation', () => {
      const script = 'LET result = "Stock: {stock.quantity} items"';
      const result = parse(script);
      expect(result[0]).toEqual({
        type: 'ASSIGNMENT',
        variable: 'result',
        expression: {
          type: 'INTERPOLATED_STRING',
          template: "Stock: {stock.quantity} items"
        },
        lineNumber: 1,
        originalLine: 'LET result = "Stock: {stock.quantity} items"'
      });
    });

    it('should handle empty interpolation placeholders', () => {
      const script = 'LET test = "Before {} after"';
      const result = parse(script);
      expect(result[0]).toEqual({
        type: 'ASSIGNMENT',
        variable: 'test',
        expression: {
          type: 'INTERPOLATED_STRING',
          template: "Before {} after"
        },
        lineNumber: 1,
        originalLine: 'LET test = "Before {} after"'
      });
    });
  });

  describe('SAY Statement', () => {
    it('should parse simple SAY with quoted string', () => {
      const script = 'SAY "Hello World"';
      const result = parse(script);
      expect(result).toEqual([{
        type: 'SAY',
        expression: '"Hello World"',
        lineNumber: 1,
        originalLine: 'SAY "Hello World"'
      }]);
    });

    it('should parse SAY with variables', () => {
      const script = 'SAY name age';
      const result = parse(script);
      expect(result).toEqual([{
        type: 'SAY',
        expression: 'name age',
        lineNumber: 1,
        originalLine: 'SAY name age'
      }]);
    });

    it('should parse SAY with mixed content', () => {
      const script = 'SAY "User:" username "has" score "points"';
      const result = parse(script);
      expect(result).toEqual([{
        type: 'SAY',
        expression: '"User:" username "has" score "points"',
        lineNumber: 1,
        originalLine: 'SAY "User:" username "has" score "points"'
      }]);
    });

    it('should parse SAY with string interpolation', () => {
      const script = 'SAY "Hello {name}, your score is {score}"';
      const result = parse(script);
      expect(result).toEqual([{
        type: 'SAY',
        expression: '"Hello {name}, your score is {score}"',
        lineNumber: 1,
        originalLine: 'SAY "Hello {name}, your score is {score}"'
      }]);
    });

    it('should parse SAY with single quotes', () => {
      const script = "SAY 'No interpolation here'";
      const result = parse(script);
      expect(result).toEqual([{
        type: 'SAY',
        expression: "'No interpolation here'",
        lineNumber: 1,
        originalLine: 'SAY \'No interpolation here\''
      }]);
    });

    it('should parse SAY with complex expression', () => {
      const script = 'SAY "Count:" count "of" total "items"';
      const result = parse(script);
      expect(result).toEqual([{
        type: 'SAY',
        expression: '"Count:" count "of" total "items"',
        lineNumber: 1,
        originalLine: 'SAY "Count:" count "of" total "items"'
      }]);
    });

    it('should parse empty SAY statement', () => {
      const script = 'SAY ""';
      const result = parse(script);
      expect(result).toEqual([{
        type: 'SAY',
        expression: '""',
        lineNumber: 1,
        originalLine: 'SAY ""'
      }]);
    });

    it('should parse case-insensitive SAY', () => {
      const script = 'say "hello world"';
      const result = parse(script);
      expect(result).toEqual([{
        type: 'SAY',
        expression: '"hello world"',
        lineNumber: 1,
        originalLine: 'say "hello world"'
      }]);
    });

    it('should handle SAY with variable paths', () => {
      const script = 'SAY "Stock:" stock.quantity "units remaining"';
      const result = parse(script);
      expect(result).toEqual([{
        type: 'SAY',
        expression: '"Stock:" stock.quantity "units remaining"',
        lineNumber: 1,
        originalLine: 'SAY "Stock:" stock.quantity "units remaining"'
      }]);
    });
  });
});
