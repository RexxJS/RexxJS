# Plain English Assertion DSL ADDRESS Library

A natural language assertion library for RexxJS that lets you write tests and validations in plain English. This is the foundation for testing in the rexxt test runner.

## Overview

The Assertions ADDRESS library allows you to write assertions like:
- `{age} should be greater than 18`
- `{name} should contain "John"`  
- `{items} should not be empty`

## Installation and Usage

### As ADDRESS Target in RexxJS (Testing with rexxt)

For test files run with the rexxt test runner, use `expectations-address`:

```rexx
REQUIRE "expectations-address"

-- Test pattern for rexxt
SimpleTest:
  LET result = 2 + 2
  ADDRESS EXPECTATIONS "{result} should be 4"
RETURN
```

### As ADDRESS Target in RexxJS (General Usage)

For general assertions outside of testing:

```rexx
REQUIRE "assertions-expect"

-- One-liner style (most convenient)
ADDRESS ASSERT "{2} should be 2"
ADDRESS ASSERT "{name} should contain 'test'"

-- Multi-line command-string style  
ADDRESS ASSERT
"{age} should be greater than 18"
"{items} should not be empty"

-- Method-call style with context
LET result = assert expression="{score} should be between 0 and 100" context=data
```

### Direct JavaScript Usage

```javascript
const { assert, AssertionError } = require('./src/assertions-expect');

// Basic usage
assert('{5} should be 5');
assert('{name} should contain "test"', { name: 'testing' });

// Will throw AssertionError if assertion fails
try {
  assert('{5} should be 10');
} catch (error) {
  console.log(error.message); // "Expected 5 to equal 10"
}
```

## Syntax

### Basic Pattern
```
{actualValue} should [not] [matcher] [expectedValue]
```

- **actualValue**: Variable name, dot notation path, or literal value in braces
- **should**: Required keyword
- **not**: Optional negation
- **matcher**: Natural language matcher phrase
- **expectedValue**: Expected value (numbers, strings, arrays, objects, etc.)

### Variable Resolution

```javascript
// Literal values
assert('{42} should be a number');
assert('{"hello"} should start with "he"');
assert('{[1,2,3]} should have length 3');

// Context variables  
assert('{age} should be 25', { age: 25 });

// Dot notation paths
assert('{user.profile.name} should be "John"', {
  user: { profile: { name: "John" } }
});
```

## Supported Matchers

### Equality
- **be**, **equal**, **be equal to**, **equals**
  ```javascript
  assert('{5} should be 5');
  assert('{name} should equal "test"', { name: 'test' });
  ```

### Comparisons
- **be greater than**, **be more than**
  ```javascript
  assert('{score} should be greater than 50', { score: 75 });
  ```

- **be less than**, **be fewer than** 
  ```javascript
  assert('{age} should be less than 100', { age: 25 });
  ```

- **be at least**, **be greater than or equal to**
  ```javascript
  assert('{score} should be at least 60', { score: 85 });
  ```

- **be at most**, **be less than or equal to**
  ```javascript
  assert('{items} should be at most 10', { items: 5 });
  ```

- **be between X and Y**
  ```javascript
  assert('{temperature} should be between 20 and 30', { temperature: 25 });
  ```

- **be within X of Y**
  ```javascript
  assert('{10} should be within 2 of 11');
  ```

### String Matchers
- **contain**, **include**
  ```javascript
  assert('{"hello world"} should contain "world"');
  ```

- **start with**, **begin with**
  ```javascript
  assert('{"hello"} should start with "he"');
  ```

- **end with**, **finish with**
  ```javascript  
  assert('{"world"} should end with "ld"');
  ```

- **match** (regex)
  ```javascript
  assert('{"test123"} should match /^test\\d+$/');
  ```

- **be uppercase**
    ```javascript
    assert('{"HELLO"} should be uppercase');
    ```

- **be lowercase**
    ```javascript
    assert('{"hello"} should be lowercase');
    ```

- **have words**
    ```javascript
    assert('{"hello world"} should have words 2');
    ```

### Type Checking
- **be a number**, **be a string**, **be an array**, **be an object**, **be a function**
  ```javascript
  assert('{42} should be a number');
  assert('{"text"} should be a string');
  assert('{[1,2,3]} should be an array');
  ```

### Special Values
- **be null**, **be undefined**, **be defined**
  ```javascript
  assert('{value} should be null', { value: null });
  assert('{data} should be defined', { data: 'exists' });
  ```

- **be truthy**, **be falsy**
  ```javascript
  assert('{active} should be truthy', { active: true });
  assert('{disabled} should be falsy', { disabled: false });
  ```

### Collections & Objects
- **have length**, **have size**
  ```javascript
  assert('{items} should have length 3', { items: [1,2,3] });
  ```

- **be empty**
  ```javascript
  assert('{list} should be empty', { list: [] });
  assert('{""}  should be empty');
  ```

- **contain** (for arrays)
  ```javascript
  assert('{colors} should contain "red"', { colors: ['red', 'blue'] });
  ```
- **have all of**
    ```javascript
    assert('{[1, 2, 3]} should have all of [1, 2]');
    ```

- **have any of**
    ```javascript
    assert('{[1, 2, 3]} should have any of [3, 4, 5]');
    ```

- **have none of**
    ```javascript
    assert('{[1, 2, 3]} should have none of [4, 5, 6]');
    ```

- **have property**
    ```javascript
    assert('{user} should have property "name"', { user: { name: 'John' } });
    ```

## Error Handling

### AssertionError Class

When assertions fail, a custom `AssertionError` is thrown:

```javascript
try {
  assert('{5} should be 10');
} catch (error) {
  console.log(error.name);        // "AssertionError"
  console.log(error.message);     // "Expected 5 to equal 10"  
  console.log(error.actual);      // 5
  console.log(error.expected);    // 10
  console.log(error.matcher);     // "equality"
  console.log(error.negated);     // false
  console.log(error.originalAssertion); // "{5} should be 10"
}
```

### Detailed Error Output

The `toString()` method of the `AssertionError` provides a detailed error message, including a diff for object and array comparisons.

**Object Diff:**
```javascript
try {
    assert('{{ "a": 1, "b": 2 }} should be { "a": 1, "c": 3 }');
} catch (error) {
    console.log(error.toString());
}
// AssertionError: Expected { a: 1, b: 2 } to equal { a: 1, c: 3 }
//   Original: "{{ "a": 1, "b": 2 }} should be { "a": 1, "c": 3 }"
//   Actual:   {
//     "a": 1,
//     "b": 2
//   }
//   Expected: {
//     "a": 1,
//     "c": 3
//   }
//   Diff:     Differences:
//     + Extra key: "b": 2
//     - Missing key: "c": 3
```

**Array Diff:**
```javascript
try {
    assert('{[1, 2, 4]} should be [1, 3, 4]');
} catch (error) {
    console.log(error.toString());
}
// AssertionError: Expected [1, 2, 4] to equal [1, 3, 4]
//   Original: "{[1, 2, 4]} should be [1, 3, 4]"
//   Actual:   [1, 2, 4]
//   Expected: [1, 3, 4]
//   Diff:     Differences:
//     - Index 1: 3
//     + Index 1: 2
```

## ADDRESS Target Integration

### Metadata
```javascript
const metadata = ASSERTIONS_ADDRESS_MAIN();
// Returns:
// {
//   type: 'address-target',
//   name: 'Plain English Assertions Service', 
//   provides: { addressTarget: 'assert', commandSupport: true, methodSupport: true },
//   dependencies: [],
//   // ...
// }
```

### Methods
- `assert(expression, context)` - Execute assertion
- `test(expression, context)` - Alias for assert
- `check(expression, context)` - Alias for assert  
- `status()` - Get service information

### Return Format
```javascript
// Success
{
  operation: 'ASSERTION',
  success: true,
  result: { success: true, actual: 5, expected: 5, ... },
  message: 'Assertion passed',
  timestamp: '2025-01-01T00:00:00.000Z'
}

// Failure  
{
  operation: 'ASSERTION',
  success: false,
  error: 'Expected 5 to equal 10',
  actual: 5,
  expected: 10,
  matcher: 'equality',
  negated: false,
  originalAssertion: '{5} should be 10',
  message: 'Assertion failed: Expected 5 to equal 10',
  timestamp: '2025-01-01T00:00:00.000Z'
}
```

## Examples

### User Validation
```javascript  
const user = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
  active: true,
  roles: ['user', 'admin']
};

assert('{name} should not be empty', user);
assert('{age} should be greater than 18', user);  
assert('{email} should contain "@"', user);
assert('{active} should be truthy', user);
assert('{roles} should contain "user"', user);
assert('{roles} should have length 2', user);
```

### API Response Testing
```javascript
const response = {
  status: 200,
  data: { items: [1, 2, 3] }
};

assert('{status} should be 200', response);
assert('{data.items} should be an array', response);
assert('{data.items} should have length 3', response);
assert('{data.items} should contain 2', response);
```

### String Validation
```javascript
const input = 'test@example.com';

assert('{input} should contain "@"', { input });
assert('{input} should end with ".com"', { input });  
assert('{input} should match /^\\w+@\\w+\\.\\w+$/', { input });
```

## Performance

- **Optimized for readability over performance**
- **Handles 1000+ assertions per second**
- **Memory efficient with no external dependencies**
- **Works in both Node.js and browser environments**

## Browser Support

- **Modern browsers** (ES6+ features used)
- **Node.js 14+** 
- **UMD module format** for universal compatibility
- **No external dependencies**

## Related Documentation

- **[Testing with rexxt](32-testing-rexxt.md)**: Complete guide to RexxJS test runner and execution patterns
- **[Control Flow](02-control-flow.md)**: Core RexxJS statements and flow control
- **[Error Handling](21-error-handling.md)**: Error patterns and recovery strategies

## License

MIT License - see source file for full license text.