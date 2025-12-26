# Ideal REXX Grammar for Windows Calculator Automation

This document explores the ideal REXX grammar for automating the Windows Calculator (WinCalc) application, inspired by the elegant browser automation patterns used in similar ADDRESS handlers.

## Current Implementation

The current `ADDRESS WINDOWS` handler provides low-level access:

```rexx
ADDRESS WINDOWS
"powershell Get-Process | Find 'calc'"
operation = "find_window" title="Calculator"
operation = "activate_window" window=RESULT.windowId
```

This works but is verbose and lacks semantic meaning for calculator-specific operations.

## Ideal Vision: ADDRESS WINCALC

### Design Goal

Create an ADDRESS handler that treats Windows Calculator as a domain-specific entity, providing high-level operations that match user intent rather than low-level window/process manipulation.

### Approach 1: WITH Context Pattern (Recommended)

This approach mirrors browser automation and provides the most elegant syntax:

```rexx
ADDRESS WINCALC

LAUNCH mode="standard"

WITH calculator
  PRESS 7
  PRESS "*"
  PRESS 6
  PRESS "="

  ASSERT display = "42"
END
```

**Advantages:**
- Semantic clarity - operations describe what the user wants
- Context scoping with `WITH` block
- Familiar pattern from browser automation
- Natural left-to-right reading

**Implementation would provide:**
```
PRESS button             -- Click button (digit, operator, or function)
ASSERT display           -- Verify display value
CLEAR                    -- Clear display
MODE mode_name           -- Switch modes (standard, scientific, programmer)
HISTORY view             -- Access calculation history
MEMORY op                -- Memory operations (M+, M-, MR, MC)
```

### Approach 2: Sequence Input Pattern

For pure calculation workflows:

```rexx
ADDRESS WINCALC

LAUNCH calculator

INPUT [7, "*", 6, "="]
STORE result = DISPLAY()
ASSERT result = "42"
```

**Advantages:**
- Concise for simple calculations
- Array-based input mirrors mathematical notation
- Good for batch operations

### Approach 3: Algebraic Expression Pattern

Most intuitive for math operations:

```rexx
ADDRESS WINCALC

LAUNCH mode="standard"

CALCULATE "7 * 6"
VERIFY result = "42"
```

**Advantages:**
- Most natural for mathematical operations
- Single command per calculation
- Minimal verbosity

**Challenges:**
- Expression parsing complexity
- Operator precedence handling
- Scientific notation support needed

### Approach 4: Hybrid Pattern (Pragmatic)

Combines approaches for different use cases:

```rexx
ADDRESS WINCALC

-- Simple calculation using expression syntax
CALCULATE "7 * 6" store_result
ASSERT store_result = "42"

-- Complex multi-step operation with context
LAUNCH mode="scientific"
WITH calculator
  PRESS "π"
  PRESS "*"
  PRESS 2
  PRESS "="
  ASSERT ABS(display - 6.28) < 0.01  -- Within tolerance
END

-- Batch calculations
DO i = 1 TO 10
  CALCULATE i * 7 store_result
  SAY "7 * " || i || " = " || store_result
END
```

## Proposed Full API

### Commands

```rexx
LAUNCH [calculator] [mode="standard"]
  -- Starts Windows Calculator if not running
  -- Modes: standard, scientific, programmer, developer
  -- Returns: window_id

CLOSE
  -- Closes the calculator application

PRESS button_name
  -- Presses a button: 0-9, +, -, *, /, =, backspace, etc.
  -- Examples: PRESS 7, PRESS "*", PRESS "equals"

CALCULATE expression
  -- Evaluates a mathematical expression
  -- Returns result to RESULT variable
  -- Example: CALCULATE "7 * 6"

DISPLAY() -- Function
  -- Returns current display value as string/number
  -- Handles scientific notation and formatting

CLEAR
  -- Clears current calculation (AC/C button)

ASSERT condition
  -- Verifies condition, fails if false
  -- Example: ASSERT display = "42"
```

### Memory Operations

```rexx
WITH calculator
  MEMORY ADD 42      -- M+
  MEMORY SUBTRACT 7  -- M-
  MEMORY RECALL      -- MR, returns value
  MEMORY CLEAR       -- MC
END
```

### Mode Switching

```rexx
WITH calculator
  MODE "scientific"  -- Standard, Scientific, Programmer, Developer

  PRESS "sin"
  PRESS "(30)"
  PRESS "="

  EXPECT ABS(display - 0.5) < 0.01
END
```

### History and Results

```rexx
WITH calculator
  HISTORY list_name
  DO i = 1 TO ARRAY_LENGTH(list_name)
    SAY list_name.i.operation || " = " || list_name.i.result
  END
END
```

## REXX Code Examples (Ideal Implementation)

### Basic Arithmetic

```rexx
ADDRESS WINCALC
LAUNCH

WITH calculator
  PRESS 7
  PRESS "*"
  PRESS 6
  PRESS "="
  ASSERT display = "42"
END
```

### Scientific Calculator

```rexx
ADDRESS WINCALC
LAUNCH mode="scientific"

WITH calculator
  -- Calculate sin(30°)
  PRESS "sin"
  PRESS "("
  PRESS 3
  PRESS 0
  PRESS ")"
  PRESS "="

  LET sin_30 = DISPLAY()
  ASSERT ABS(sin_30 - 0.5) < 0.001
END
```

### Batch Calculations with Validation

```rexx
ADDRESS WINCALC
LAUNCH mode="standard"

-- Verify multiplication table
DO i = 1 TO 12
  DO j = 1 TO 12
    WITH calculator
      PRESS i
      PRESS "*"
      PRESS j
      PRESS "="

      LET result = DISPLAY()
      LET expected = i * j

      IF result \= expected THEN DO
        SAY "ERROR: " || i || " * " || j || " = " || result || " (expected " || expected || ")"
      END
    END
  END
END
```

### Programmer Mode with Base Conversion

```rexx
ADDRESS WINCALC
LAUNCH mode="programmer"

WITH calculator
  MODE "HEX"
  PRESS "FF"
  PRESS "="

  MODE "DEC"
  LET dec_value = DISPLAY()
  ASSERT dec_value = "255"

  MODE "BIN"
  LET bin_value = DISPLAY()
  ASSERT bin_value = "11111111"
END
```

### With Error Handling

```rexx
ADDRESS WINCALC
LAUNCH

WITH calculator
  TRY
    PRESS 1
    PRESS "/"
    PRESS 0
    PRESS "="

    EXPECT display = "Error"  -- Or "∞"
  CATCH error_type
    SAY "Caught: " || error_type
  END
END
```

## Design Rationale

### Why WITH Context?

The `WITH` block pattern (borrowed from browser automation):
1. **Scoping** - Makes it clear what window/application we're automating
2. **Clarity** - Groups related operations
3. **Consistency** - Matches existing RexxJS patterns
4. **Error Handling** - Easy to isolate failures to specific contexts

### Why Semantic Operation Names?

Rather than generic `CLICK button`, `PRESS 7` is:
1. **Self-documenting** - Code reads like the user's intent
2. **Type-safe** - Parser can validate button names
3. **Domain-specific** - Matches calculator terminology
4. **Future-proof** - Easy to add validation and error checking

### Expression vs. Step-by-Step

Both patterns are valuable:
- **Expressions** (`CALCULATE "7 * 6"`) for simple, known calculations
- **Step-by-step** (`PRESS 7, PRESS "*"`) for complex workflows or UI testing

## Implementation Path

### Phase 1: Core Window Control
- LAUNCH, CLOSE, MODE switching
- PRESS for basic buttons
- DISPLAY() function

### Phase 2: Calculations
- CALCULATE expression parsing
- Result storage and assertion
- Error handling (division by zero, etc.)

### Phase 3: Advanced Features
- Memory operations (M+, M-, MR, MC)
- History tracking
- Clipboard integration
- Batch operations with logging

### Phase 4: Testing & Validation
- Comprehensive test coverage
- Cross-version Windows Calculator support
- Performance benchmarking

## Relationship to Current Handler

The current `ADDRESS WINDOWS` handler would remain the underlying implementation:

```rexx
ADDRESS WINCALC
-- Internally translates to:
-- ADDRESS WINDOWS
-- operation = "find_window" title="Calculator"
-- operation = "activate_window" ...
-- (platform-specific button clicking via Windows API)
```

A dedicated WINCALC handler would:
1. Provide domain-specific commands
2. Handle calculator-specific logic (expression parsing, modes)
3. Return calculator-appropriate results
4. Offer better error messages

## Questions for Future Development

1. Should CALCULATE support full mathematical expressions or be limited to calculator operations?
2. How should we handle different Windows versions (Windows 7 vs 11 have different Calculator UIs)?
3. Should we support keyboard shortcuts or stick to button clicks?
4. How verbose should error messages be?
5. Should we provide a GUI mode for recording/playback (similar to Selenium IDE)?

## Conclusion

An ideal `ADDRESS WINCALC` handler would provide Windows Calculator automation at a level of abstraction that matches user intent, making test scripts and automation workflows as readable and maintainable as the domain they describe.

The pattern shown here could serve as a template for other domain-specific ADDRESS handlers (WinWord, Excel, Notepad, etc.), each providing semantic operations appropriate to their application domain.
