# REXX Language Basics

## Overview

RexxJS implements the core REXX language with modern extensions. This document covers the fundamental syntax and commands you need to write REXX scripts.

## Comments

```rexx
-- This is a single-line comment

/* This is a
   multi-line
   comment */
```

## Output with SAY

The `SAY` command outputs text to the console:

```rexx
SAY "Hello, World!"
SAY "The answer is " || 42
SAY variable_name
```

## Variable Assignment

### Classic REXX Assignment

```rexx
name = "Alice"
age = 25
result = age + 5
```

### Modern LET Statement

```rexx
LET name = "Alice"
LET age = 25
LET result = age + 5
```

Note: In RexxJS, both forms work identically. `LET` is preferred for clarity in modern code.

## Variables

### Variable Names

- Case-insensitive (`name`, `NAME`, and `Name` are the same variable)
- Can contain letters, numbers, underscores, periods, and special characters
- No declaration needed - variables are created on first assignment

### Variable Types

REXX is weakly typed:

```rexx
LET x = 42          -- Number
LET x = "42"        -- String (but can still be used in math)
LET x = [1, 2, 3]   -- Array (RexxJS extension)
LET x = {}          -- Object (RexxJS extension)
```

Strings and numbers are automatically converted as needed:

```rexx
LET age = "25"
LET next_year = age + 1  -- Result: 26 (string "25" converted to number)
```

## String Concatenation

Use the `||` operator to concatenate strings:

```rexx
LET first_name = "John"
LET last_name = "Doe"
LET full_name = first_name || " " || last_name
SAY full_name  -- Output: John Doe
```

## Comparison Operators

```rexx
=   -- Equal
\=  -- Not equal
<   -- Less than
>   -- Greater than
<=  -- Less than or equal
>=  -- Greater than or equal
```

Case-insensitive string comparison:

```rexx
IF "hello" = "HELLO" THEN
  SAY "Equal!"  -- This executes (case-insensitive)
```

## Logical Operators

```rexx
&   -- AND
|   -- OR
\   -- NOT
```

Example:

```rexx
IF age >= 18 & age < 65 THEN
  SAY "Working age"
```

## Arithmetic Operators

```rexx
+   -- Addition
-   -- Subtraction
*   -- Multiplication
/   -- Division
%   -- Integer division
//  -- Modulo (remainder)
**  -- Exponentiation
```

Example:

```rexx
LET x = 10
LET y = 3
SAY x + y   -- 13
SAY x - y   -- 7
SAY x * y   -- 30
SAY x / y   -- 3.333...
SAY x % y   -- 3 (integer division)
SAY x // y  -- 1 (remainder)
SAY x ** y  -- 1000 (10 cubed)
```

## Arrays (RexxJS Extension)

```rexx
-- Array literals
LET numbers = [1, 2, 3, 4, 5]
LET names = ["Alice", "Bob", "Charlie"]
LET mixed = [1, "hello", 3.14, [1, 2]]

-- Access elements (0-based indexing in JavaScript arrays)
SAY numbers[0]  -- 1
SAY names[1]    -- Bob

-- Array length
SAY LENGTH(numbers)  -- 5
```

Note: Traditional REXX uses 1-based indexing for stem variables. JavaScript arrays in RexxJS use 0-based indexing.

## Objects (RexxJS Extension)

```rexx
-- Object literals
LET person = {name: "Alice", age: 25, city: "NYC"}

-- Access properties
SAY person.name   -- Alice
SAY person['age'] -- 25
```

## Stem Variables (Traditional REXX)

Stem variables are REXX's traditional array-like structures (1-based):

```rexx
-- Set stem values
names.1 = "Alice"
names.2 = "Bob"
names.3 = "Charlie"
names.0 = 3  -- By convention, .0 holds the count

-- Access stem values
DO i = 1 TO names.0
  SAY names.i
END
```

## IF/THEN/ELSE

```rexx
-- Simple IF
IF x > 10 THEN
  SAY "X is greater than 10"

-- IF with ELSE
IF age >= 18 THEN
  SAY "Adult"
ELSE
  SAY "Minor"

-- Multi-line blocks
IF score >= 90 THEN DO
  SAY "Excellent!"
  grade = "A"
END
ELSE IF score >= 80 THEN DO
  SAY "Good job"
  grade = "B"
END
ELSE DO
  SAY "Keep trying"
  grade = "C"
END
```

## SELECT/WHEN/OTHERWISE

SELECT provides multi-way branching:

```rexx
SELECT
  WHEN score >= 90 THEN
    grade = "A"
  WHEN score >= 80 THEN
    grade = "B"
  WHEN score >= 70 THEN
    grade = "C"
  OTHERWISE
    grade = "F"
END
```

With blocks:

```rexx
SELECT
  WHEN day = "Monday" THEN DO
    SAY "Start of week"
    mood = "motivated"
  END
  WHEN day = "Friday" THEN DO
    SAY "End of week"
    mood = "happy"
  END
  OTHERWISE DO
    SAY "Middle of week"
    mood = "working"
  END
END
```

## DO Loops

### Simple DO Loop (Counted)

```rexx
DO i = 1 TO 5
  SAY "Iteration " || i
END

-- With STEP
DO i = 0 TO 10 BY 2
  SAY i  -- 0, 2, 4, 6, 8, 10
END

-- Counting down
DO i = 10 TO 1 BY -1
  SAY i
END
```

### DO WHILE

```rexx
LET count = 0
DO WHILE count < 5
  SAY "Count is " || count
  count = count + 1
END
```

### DO UNTIL

```rexx
LET count = 0
DO UNTIL count = 5
  SAY "Count is " || count
  count = count + 1
END
```

### DO FOREVER

```rexx
LET count = 0
DO FOREVER
  SAY "Count is " || count
  count = count + 1
  IF count >= 5 THEN LEAVE  -- Exit loop
END
```

### DO OVER (RexxJS Extension)

Iterate over arrays:

```rexx
LET names = ["Alice", "Bob", "Charlie"]
DO name OVER names
  SAY "Hello, " || name
END
```

### Loop Control

- **LEAVE**: Exit the loop immediately
- **ITERATE**: Skip to next iteration

```rexx
DO i = 1 TO 10
  IF i = 5 THEN ITERATE  -- Skip 5
  IF i = 8 THEN LEAVE    -- Stop at 8
  SAY i
END
-- Output: 1, 2, 3, 4, 6, 7
```

## EXIT

Exit the script with optional return code:

```rexx
EXIT            -- Exit with code 0
EXIT 0          -- Explicit success
EXIT 1          -- Exit with error code
EXIT error_code -- Exit with variable value
```

## CALL and RETURN (Subroutines)

Call labeled subroutines:

```rexx
CALL GreetUser "Alice"
CALL CalculateSum 5, 10
EXIT

GreetUser:
  PARSE ARG name
  SAY "Hello, " || name
  RETURN

CalculateSum:
  PARSE ARG a, b
  result = a + b
  SAY "Sum: " || result
  RETURN result
```

## SIGNAL (Goto with Labels)

Jump to a label (like goto):

```rexx
LET x = 5
IF x > 3 THEN SIGNAL ProcessLarge

SAY "Small number"
EXIT

ProcessLarge:
  SAY "Large number"
  EXIT
```

**Note**: SIGNAL is considered harmful in modern programming. Prefer structured control flow (IF, SELECT, DO).

## PARSE ARG

Extract arguments in subroutines:

```rexx
CALL ProcessData "Alice" 25 "NYC"
EXIT

ProcessData:
  PARSE ARG name age city
  SAY "Name: " || name
  SAY "Age: " || age
  SAY "City: " || city
  RETURN
```

## INTERPRET

Execute REXX code dynamically (eval-like):

```rexx
LET code = "SAY 'Hello from interpreted code'"
INTERPRET code

LET expr = "2 + 2"
INTERPRET "result = " || expr
SAY result  -- 4
```

**Warning**: INTERPRET is powerful but dangerous. Avoid using it with user input.

## TRACE

Debug your scripts by tracing execution:

```rexx
TRACE I  -- Trace intermediate values
TRACE R  -- Trace results
TRACE N  -- Normal (no tracing)

-- Example
TRACE R
LET x = 5
LET y = 10
LET z = x + y
SAY z
```

Trace levels:
- `N` - Normal (off)
- `R` - Results (show results of expressions)
- `I` - Intermediate (show intermediate values)
- `A` - All (maximum detail)

## Case Sensitivity

### Keywords

Keywords are case-insensitive:

```rexx
SAY "Hello"     -- Valid
say "Hello"     -- Valid
Say "Hello"     -- Valid
```

### Variables

Variables are case-insensitive:

```rexx
LET Name = "Alice"
SAY name   -- Alice
SAY NAME   -- Alice
SAY NaMe   -- Alice
```

### String Literals

String literals are case-sensitive:

```rexx
LET x = "Hello"
LET y = "hello"
IF x = y THEN
  SAY "Equal"    -- This executes (comparison is case-insensitive)
ELSE
  SAY "Not equal"
```

## Line Continuation

Long lines can be continued:

```rexx
-- Using comma
LET message = "This is a very long message that " ||,
              "continues on the next line"

-- Expression continuation is automatic in many contexts
LET result = very_long_function_name(
  param1,
  param2,
  param3
)
```

## Numeric Precision

REXX maintains high numeric precision:

```rexx
NUMERIC DIGITS 20  -- Set precision to 20 digits
LET x = 1 / 3
SAY x  -- 0.33333333333333333333
```

## Common Patterns

### Input Validation

```rexx
IF \DATATYPE(age, 'N') THEN DO
  SAY "Age must be a number"
  EXIT 1
END
```

### Safe Division

```rexx
IF divisor = 0 THEN DO
  SAY "Cannot divide by zero"
  result = 0
END
ELSE
  result = dividend / divisor
```

### Conditional Assignment

```rexx
-- Set default if variable is empty
IF name = "" THEN name = "Unknown"

-- Or more concisely
name = COALESCE(name, "Unknown")
```

## Next Steps

- [Variables and Scoping](02-variables.md)
- [Control Flow Details](03-control-flow.md)
- [Functions Overview](04-functions-overview.md)
- [String Functions](11-string-functions.md)
