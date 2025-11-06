# Control Flow

Control structures for conditional execution, loops, and program flow control.

## Conditional Statements (IF/ELSE/ENDIF)

### Basic IF Statement
```rexx
IF condition THEN
  -- commands
ELSE
  -- alternative commands  
ENDIF
```

**Examples:**
```rexx
LET age = 25

IF age >= 18 THEN
    SAY "You can vote!"
ELSE
    SAY "Too young to vote"
ENDIF
```

### Comparison Operators

**All Supported Comparison Operators:**

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equal | `a = b` |
| `==` | Equal (alternative syntax) | `a == b` |
| `\=` | Not equal | `a \= b` |
| `!=` | Not equal (C-style) | `a != b` |
| `<>` | Not equal (SQL-style) | `a <> b` |
| `¬=` | Not equal (logical not) | `a ¬= b` |
| `><` | Greater than or less than | `a >< b` |
| `>` | Greater than | `a > b` |
| `<` | Less than | `a < b` |
| `>=` | Greater than or equal | `a >= b` |
| `<=` | Less than or equal | `a <= b` |

**Additional Features:**
- **Boolean Conditions**: Direct variable evaluation
- **Complex Conditions**: Use `&` (AND) and `|` (OR)
- **String Comparisons**: Lexicographic ordering (e.g., "apple" < "banana")
- **Numeric String Coercion**: Automatic conversion ("100" = 100)

**Examples of Different Comparison Operators:**
```rexx
LET x = 10
LET y = 20
LET z = 10

-- Equality operators
IF x = z THEN SAY "x equals z"        -- Output: x equals z
IF x == z THEN SAY "x equals z (alt)" -- Output: x equals z (alt)

-- Not-equal operators (all equivalent)  
IF x \= y THEN SAY "x not equals y (backslash)"  -- Output: x not equals y (backslash)
IF x != y THEN SAY "x not equals y (C-style)"    -- Output: x not equals y (C-style)
IF x <> y THEN SAY "x not equals y (SQL-style)"  -- Output: x not equals y (SQL-style)
IF x ¬= y THEN SAY "x not equals y (logical)"    -- Output: x not equals y (logical)
IF x >< y THEN SAY "x greater/less than y"       -- Output: x greater/less than y

-- Relational operators
IF y > x THEN SAY "y is greater than x"          -- Output: y is greater than x
IF x < y THEN SAY "x is less than y"             -- Output: x is less than y
IF x >= z THEN SAY "x is greater/equal to z"     -- Output: x is greater/equal to z
IF x <= y THEN SAY "x is less/equal to y"        -- Output: x is less/equal to y
```

**Complex Conditions:**
```rexx
LET temperature = 75
LET humidity = 60

IF temperature > 80 & humidity > 70 THEN
    SAY "It's hot and humid"
ELSE IF temperature > 80 THEN
    SAY "It's hot but dry"
ELSE IF temperature < 32 THEN
    SAY "It's freezing!"
ELSE
    SAY "Weather is comfortable"
ENDIF
```

### Nested Conditionals
Full support for nested IF statements:

```rexx
LET age = 25
LET has_license = "yes"

IF age >= 18 AND has_license = "yes" THEN
    SAY "You can rent a car!"
ELSE
    SAY "You cannot rent a car"
    IF age < 18 THEN
        SAY "Reason: Too young"
    ENDIF
    IF has_license = "no" THEN
        SAY "Reason: No driver's license"
    ENDIF
ENDIF
```

## Loop Structures (DO/END)

### Range Loops
```rexx
DO i = 1 TO 10
  -- commands
END
```

**Example:**
```rexx
DO i = 1 TO 5
    SAY "Count: " || i
END
```

### Step Loops
```rexx
DO i = 1 TO 10 BY 2
  -- commands
END
```

**Example:**
```rexx
SAY "Even numbers from 2 to 20:"
DO i = 2 TO 20 BY 2
    SAY i
END
```

### While Loops
```rexx
DO WHILE condition
  -- commands
END
```

**Example:**
```rexx
LET number = 1

DO WHILE number <= 50
    SAY "Current number: " || number
    LET number = number * 2 + 1
END

SAY "First number over 50: " || number
```

### Repeat Loops
```rexx
DO 5
  -- commands (repeat 5 times)
END
```

**Example:**
```rexx
DO 3
    SAY "Processing batch..."
    -- Batch processing logic here
END
```

## Multi-way Branching (SELECT/WHEN/OTHERWISE/END)

### SELECT Statement
```rexx
SELECT
  WHEN condition1 THEN
    -- commands
  WHEN condition2 THEN
    -- commands
  OTHERWISE
    -- default commands
END
```

**Example:**
```rexx
LET grade = 85

SELECT
    WHEN grade >= 90 THEN
        SAY "Grade A - Excellent!"
        LET message = "Outstanding performance"
    WHEN grade >= 80 THEN
        SAY "Grade B - Good work!"
        LET message = "Above average"
    WHEN grade >= 70 THEN
        SAY "Grade C - Passing"
        LET message = "Satisfactory"
    WHEN grade >= 60 THEN
        SAY "Grade D - Below average"
        LET message = "Needs improvement"
    OTHERWISE
        SAY "Grade F - Failing"
        LET message = "Must retake"
END

SAY "Feedback: " || message
```

### Complex SELECT Conditions
```rexx
LET temperature = 75
LET sunny = 1
LET weekend = 0

SELECT
  WHEN temperature > 70 AND sunny THEN
    SAY "Perfect weather for outdoor activities"
  WHEN (temperature > 60) OR weekend THEN
    SAY "Good day for light activities"
  OTHERWISE
    SAY "Indoor activities recommended"
END
```

## SIGNAL Statement - Unconditional Jumps

### Basic SIGNAL
```rexx
SIGNAL label_name          -- Jump to label
```

**Label Definition:**
```rexx
label_name:               -- Label on its own line
label_name: statement     -- Label with statement on same line  
```

### Examples

**Basic Jump:**
```rexx
LET status = "start"
SIGNAL process_data
LET unreachable = "never executed"

process_data:
  LET status = "processing"
  EXIT
```

**State Machine Pattern:**
```rexx
LET state = "init"
check_state:
  IF state = "init" THEN
    SIGNAL initialize
  ELSE IF state = "process" THEN
    SIGNAL process
  ENDIF
  
initialize:
  LET state = "process"
  SIGNAL check_state
  
process:
  SAY "Processing complete"
  EXIT
```

**Error Handling Pattern:**
```rexx
retry_loop:
  LET success = attempt_operation()
  IF success THEN
    SIGNAL success_handler
  ELSE
    LET retry_count = retry_count + 1
    IF retry_count < 3 THEN
      SIGNAL retry_loop
    ELSE
      SIGNAL failure_handler
    ENDIF
  ENDIF

success_handler:
  SAY "Operation succeeded"
  EXIT
  
failure_handler:
  SAY "Operation failed after retries"
  EXIT
```

### Label Rules
- Case-insensitive (`MyLabel` matches `mylabel`)
- Must start with letter/underscore, followed by letters/numbers/underscores
- Can be on separate line or followed by a statement
- Labels are discovered before execution begins

### Best Practices
- Use structured control flow (IF/DO/SELECT) when possible
- SIGNAL is useful for error recovery and state machines
- Avoid complex jumping patterns that make code hard to follow
- Label names should be descriptive of their purpose

## Control Flow Integration

### With String Interpolation
```rexx
-- Within conditionals
IF stock.quantity > 5 THEN
  createMeal name="Meal for {guest}" chicken=3
ENDIF

-- Within loops
DO i = 1 TO 3
  prepareDish name="{mealName} #{i}" servings=i
END

-- Within SELECT statements
SELECT
  WHEN stock.chicken >= 8 THEN
    createMeal name="Large {mealName}" chicken=6
  WHEN stock.chicken >= 3 THEN
    createMeal name="Medium {mealName}" chicken=3
  OTHERWISE
    prepareDish name="Simple {mealName}" servings=1
END
```

### With Mathematical Expressions
```rexx
-- Loop bounds with expressions
DO i = 1 TO result/4
  prepareDish servings=i*2+1
END

-- Conditional expressions
IF temperature > baseTemp + tolerance THEN
  adjustThermostat delta=temperature-baseTemp
ENDIF
```