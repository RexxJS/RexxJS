# REXX REPL User Guide

The REXX REPL (Read-Eval-Print Loop) provides an interactive environment for executing REXX commands, loading libraries, and visualizing results in real-time.

## Table of Contents

- [Getting Started](#getting-started)
- [Basic Usage](#basic-usage)  
- [Loading Libraries](#loading-libraries)
- [Graphics and Visualization](#graphics-and-visualization)
- [Command History](#command-history)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the REPL

1. Open your web browser
2. Navigate to the REPL interface (typically `http://localhost:8000/repl/`)
3. Wait for the "REXX REPL ready!" message
4. Start typing commands!

### First Commands

```rexx
SAY "Hello, REXX World!"
LET x = 42
SAY "The answer is {x}"
```

## Basic Usage

### Variable Assignment

```rexx
LET name = "Alice"
LET age = 30
LET active = TRUE
LET numbers = [1, 2, 3, 4, 5]
```

### String Interpolation

```rexx
LET greeting = "Hello, {name}! You are {age} years old."
SAY greeting
```

### Control Flow

```rexx
IF age >= 18 THEN
    SAY "You are an adult"
ELSE
    SAY "You are a minor"  
ENDIF

DO i = 1 TO 5
    SAY "Count: {i}"
END
```

### Function Calls

```rexx
LET text = "  hello world  "
LET cleaned = TRIM value=text
LET length = LENGTH string=cleaned
SAY "'{cleaned}' has {length} characters"
```

## Loading Libraries

### Basic Library Loading

```rexx
REQUIRE lib="../core/src/r-graphics-functions.js"
```

### With AS Clause (Prefixing)

```rexx
REQUIRE lib="../core/src/r-graphics-functions.js" as="plot_"
REQUIRE lib="../core/src/string-utilities.js" as="str_"
```

**Available in REPL:**
- Simple prefixing: `as="math_"`
- Regex patterns: `as="gfx_(.*)"` 
- ADDRESS renaming: `as="Database"`

### Common Libraries

#### R Graphics Functions
```rexx
REQUIRE lib="../core/src/r-graphics-functions.js"
// Provides: HIST, R_PLOT, R_SCATTER, R_BOXPLOT, etc.
```

#### SQLite Database
```rexx  
REQUIRE lib="./core/src/sqlite-address.js" as="Database"
ADDRESS Database
LET result = execute sql="CREATE TABLE test (id INTEGER, name TEXT)"
```

#### String Utilities
```rexx
REQUIRE lib="../core/src/string-utilities.js" as="str_"
// Provides: str_UPPER, str_LOWER, str_TRIM, etc.
```

## Graphics and Visualization

### Universal Graphics System

The REPL features a universal graphics system that works with any compatible graphics library. Charts are automatically rendered when you create plot objects.

### Loading Graphics Libraries

```rexx
// Load R-inspired graphics library
REQUIRE "../../extras/functions/r-inspired/graphics/graphics-functions.js"

// Create data  
LET sales_data = [120, 135, 140, 128, 155, 142, 138]

// Create and auto-render histogram
LET histogram = HIST data=sales_data main="Weekly Sales" col="steelblue"
// 📊 Plot auto-rendered successfully
```

### Chart Types

#### Histogram
```rexx
LET data = [1,2,2,3,3,3,4,4,5]
LET hist = HIST data=data main="Distribution" col="lightblue"
// Auto-renders to DOM
```

#### Scatter Plot  
```rexx
LET x = [1,2,3,4,5]
LET y = [2,4,1,5,3] 
LET scatter = SCATTER x=x y=y main="Correlation" col="red"
// Auto-renders to DOM
```

#### Bar Plot
```rexx
LET values = [10,20,15,25,30]
LET names = ["A","B","C","D","E"]
LET barplot = BARPLOT heights=values names=names main="Categories" col="orange"
// Auto-renders to DOM
```

#### Box Plot  
```rexx
LET data = [10,12,14,15,18,20,22,25,28]
LET boxplot = BOXPLOT data=data main="Summary Stats" col="lightgreen"
// Auto-renders to DOM
```

### Graphics Control

The REPL provides several graphics control commands:

```rexx
// Disable auto-rendering
window.rexxjs.setAutoRender(false)

// Create plot (won't auto-render)  
LET hist = HIST data=[1,2,3,4,5]
// 📊 Plot ready for rendering (auto-render disabled)

// Manually render the last suggested plot
window.rexxjs.renderSuggested()
// 📊 Plot rendered manually

// Re-enable auto-rendering
window.rexxjs.setAutoRender(true)

// Set custom render target
window.rexxjs.setRenderTarget("#my-chart-div")
```

### Graphics Display

- **Auto-rendering (default)**: Charts appear automatically when plot objects are created
- **Manual rendering**: Disable auto-render and use `window.rexxjs.renderSuggested()` 
- **Custom targets**: Direct plots to specific DOM elements
- **Universal compatibility**: Works with any graphics library implementing the suggestion pattern

### Universal Graphics Architecture

The REPL uses a universal graphics system that works with any compatible library:

1. **Graphics functions suggest renders**: When you call `HIST()`, `SCATTER()`, etc., the function sets `window.rexxjs.suggestedRenderFunction`

2. **REPL checks for suggestions**: After each command, the REPL checks if a render was suggested

3. **Auto-render or notify**: Depending on `autoRenderMode`, the REPL either:
   - Auto-renders the plot to the DOM
   - Notifies you that a plot is ready for manual rendering

4. **Library independence**: Any graphics library can implement this pattern - it's not limited to R-inspired functions

**Example of how it works:**
```rexx
// 1. Function suggests render
LET hist = HIST data=[1,2,3]  // Sets window.rexxjs.suggestedRenderFunction

// 2. REPL detects suggestion after command execution
// 3. REPL auto-renders (if enabled) or notifies user
// 📊 Plot auto-rendered successfully

// You can also inspect the suggestion:
window.rexxjs.suggestedRenderFunction  // Function that would render the plot
```

## Command History

### Navigation

- **↑ (Up Arrow)**: Previous command
- **↓ (Down Arrow)**: Next command  
- **Enter**: Execute current command

### History Features

- All commands are automatically saved to history
- Navigate through previous commands easily
- Rerun or modify previous commands

### Example Session

```rexx
rexx> LET data = [1,2,3,4,5]
rexx> LET mean = MEAN values=data  
rexx> SAY "Average: {mean}"
Average: 3
rexx> ↑  // (Up arrow brings back previous command)
rexx> SAY "Average: {mean}"  // Can modify and rerun
```

## Advanced Features

### Multi-line Expressions

```rexx
LET complex_calc = (
    (10 + 5) * 2 - 3
) / 4
```

### Database Operations

```rexx
// Load database support
REQUIRE lib="./core/src/sqlite-address.js" as="DB"

// Create and populate table
ADDRESS DB
LET create = execute sql="CREATE TABLE users (id INTEGER, name TEXT, email TEXT)"
LET insert1 = execute sql="INSERT INTO users VALUES (1, 'Alice', 'alice@example.com')"
LET insert2 = execute sql="INSERT INTO users VALUES (2, 'Bob', 'bob@example.com')"

// Query data
LET users = execute sql="SELECT * FROM users WHERE id > 0"
SAY "Found {users.count} users"
```

### JSON Processing

```rexx
LET json_data = '{"name": "Alice", "age": 30, "skills": ["REXX", "SQL", "JavaScript"]}'
LET parsed = JSON_PARSE string=json_data
SAY "Name: {parsed.name}, Age: {parsed.age}"
```

### Array Operations

```rexx
LET numbers = [1, 2, 3, 4, 5]
LET doubled = ARRAY_MAP array=numbers callback="x => x * 2"
LET filtered = ARRAY_FILTER array=numbers callback="x => x > 2"
SAY "Doubled: {doubled}"
SAY "Filtered: {filtered}"
```

## Troubleshooting

### Common Issues

#### Library Not Loading

**Problem:**
```rexx
rexx> REQUIRE lib="../core/src/nonexistent.js"
Error: Could not load library: ../src/nonexistent.js
```

**Solutions:**
- Check file path is correct
- Ensure file exists and is accessible
- Try absolute path if relative path fails

#### Function Not Found After Loading

**Problem:**
```rexx
rexx> REQUIRE lib="../core/src/r-graphics-functions.js" as="plot_"
rexx> LET hist = HIST data=[1,2,3]  // Error: HIST not found
```

**Solution:** Use prefixed function name
```rexx
rexx> LET hist = plot_HIST data=[1,2,3]  // Works!
```

#### Graphics Not Auto-Rendering

**Problem:** Created plot but it doesn't appear automatically

**Solutions:**
- Check that auto-rendering is enabled: `window.rexxjs.autoRenderMode` should be `true`
- Manually trigger render: `window.rexxjs.renderSuggested()`
- Check that graphics library is loaded properly
- Ensure data is in valid format for the plot type
- Check browser console for RENDER() errors

**Example:**
```rexx
// Enable auto-rendering if disabled
window.rexxjs.setAutoRender(true)

// Create plot (should auto-render)
LET hist = HIST data=[1,2,3,4,5] main="Test"

// Or manually render if needed
window.rexxjs.renderSuggested()
```

#### Command History Not Working

**Problem:** Arrow keys don't navigate history

**Solutions:**
- Click in the input field to focus it
- Refresh the page if REPL becomes unresponsive
- Clear browser cache if issues persist

### Performance Tips

#### Loading Multiple Libraries

```rexx
// ✅ Good - load all libraries at start
REQUIRE lib="../core/src/r-graphics-functions.js" as="plot_"
REQUIRE lib="../core/src/string-utilities.js" as="str_" 
REQUIRE lib="./core/src/sqlite-address.js" as="DB"

// Then use throughout session
LET chart = plot_HIST data=[1,2,3,4,5]
LET cleaned = str_TRIM input="  hello  "
```

#### Reusing Variables

```rexx
// ✅ Good - reuse calculated data
LET large_dataset = [/* ... lots of data ... */]
LET stats = SUMMARY data=large_dataset  // Calculate once
LET hist = HIST data=large_dataset title="Distribution"
LET scatter = SCATTER x=large_dataset y=large_dataset title="Correlation"
```

### Keyboard Shortcuts

| Key Combination | Action |
|----------------|---------|
| ↑ | Previous command in history |
| ↓ | Next command in history |
| Enter | Execute current command |
| Ctrl+L | Clear REPL output (browser dependent) |

## Example Workflows

### Data Analysis Workflow

```rexx
// 1. Load required libraries
REQUIRE "../../extras/functions/r-inspired/graphics/graphics-functions.js"
REQUIRE "../../extras/functions/r-inspired/math-stats/r-summary-functions.js"

// 2. Create or load data
LET sales = [125, 130, 140, 135, 155, 142, 138, 145, 160, 158]

// 3. Calculate summary statistics  
LET mean_sales = MEAN data=sales
LET median_sales = MEDIAN data=sales
LET std_dev = SD data=sales

// 4. Create visualizations (auto-render)
LET histogram = HIST data=sales main="Sales Distribution" col="steelblue"
// 📊 Plot auto-rendered successfully

LET boxplot = BOXPLOT data=sales main="Sales Summary" col="lightgreen" 
// 📊 Plot auto-rendered successfully

// 5. Report results
SAY "Sales Analysis Results:"
SAY "Mean: {mean_sales}"
SAY "Median: {median_sales}"
SAY "Standard Deviation: {std_dev}"
```

### Database Analysis Workflow

```rexx
// 1. Load database support
REQUIRE lib="./core/src/sqlite-address.js" as="Analytics"

// 2. Set up database
ADDRESS Analytics
LET setup = execute sql="CREATE TABLE sales (date TEXT, amount REAL, region TEXT)"

// 3. Insert sample data  
LET insert1 = execute sql="INSERT INTO sales VALUES ('2025-01-01', 1250.50, 'North')"
LET insert2 = execute sql="INSERT INTO sales VALUES ('2025-01-02', 1340.75, 'South')"
LET insert3 = execute sql="INSERT INTO sales VALUES ('2025-01-03', 1180.25, 'North')"

// 4. Analyze data
LET regional = execute sql="SELECT region, AVG(amount) as avg_sales FROM sales GROUP BY region"
LET daily = execute sql="SELECT date, SUM(amount) as daily_total FROM sales GROUP BY date"

// 5. Report findings
SAY "Regional Analysis: Found {regional.count} regions"  
SAY "Daily Analysis: Found {daily.count} days of data"
```

## See Also

- [REQUIRE Statement Documentation](REQUIRE-STATEMENT.md) - Library loading
- [AS Clause Reference](AS-CLAUSE-REFERENCE.md) - Function prefixing and renaming  
- [Function Reference](FUNCTIONS.md) - Built-in functions
- [ADDRESS Statement Documentation](ADDRESS.md) - Database and service integration