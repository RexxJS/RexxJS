# REXX REPL User Guide

RexxJS provides two interactive REPL (Read-Eval-Print Loop) environments for executing REXX commands, loading libraries, and exploring the language:

- **Terminal REPL** - Command-line interface for Node.js environments  
- **Web REPL** - Browser-based interface with graphics and visualization support

## Table of Contents

- [Terminal REPL (Node.js)](#terminal-repl-nodejs)
- [Web REPL (Browser)](#web-repl-browser)
- [Comparison](#comparison-terminal-vs-web-repl)
- [See Also](#see-also)

---

## Terminal REPL (Node.js)

The Terminal REPL provides an interactive command-line interface for executing REXX code in Node.js environments. It's ideal for scripting, automation, testing, and quick experimentation without a browser.

### Installation

The Terminal REPL is installed as part of the RexxJS core package:

```bash
# If installed via npm (globally)
npm install -g rexxjs

# If running from repository
cd /path/to/RexxJS/core
npm install
```

### Usage

Start the Terminal REPL:

```bash
# If installed globally
rexx-repl

# From repository
./src/rexx-repl

# With verbose output
rexx-repl --verbose
```

**Example Session:**

```
╔════════════════════════════════════════════════╗
║       RexxJS Terminal REPL (Node.js)           ║
║                                                ║
║  Type REXX commands and press Enter            ║
║  Special commands:                             ║
║    .help    - Show help                        ║
║    .exit    - Exit REPL                        ║
║    .clear   - Clear screen                     ║
║    .reset   - Reset interpreter                ║
║    .vars    - Show variables                   ║
║                                                ║
║  Use Ctrl+C to cancel, Ctrl+D to exit          ║
╚════════════════════════════════════════════════╝

rexx> SAY "Hello from Terminal REPL!"
Hello from Terminal REPL!

rexx> LET x = 5 + 3
rexx> SAY x
8

rexx> .vars
Current Variables:
═════════════════
  x = 8
  RUNTIME.TYPE = "nodejs"
```

### Special Commands

The Terminal REPL provides several special commands (prefixed with `.`):

| Command | Description |
|---------|-------------|
| `.help` | Display help information |
| `.exit` or `.quit` | Exit the REPL |
| `.clear` | Clear the screen and redisplay welcome banner |
| `.reset` | Reset the interpreter (clears all variables) |
| `.vars` | Show all current variables and their values |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` | Previous command in history |
| `↓` | Next command in history |
| `Enter` | Execute current command |
| `Ctrl+C` | Cancel multiline input or show exit hint |
| `Ctrl+D` | Exit REPL |

### Features

#### REQUIRE Support

Load libraries using relative paths (resolved from current working directory):

```rexx
rexx> REQUIRE "./src/expectations-address.js"
✓ Module loaded

rexx> REQUIRE "registry:org.rexxjs/r-graphics-functions"
✓ Library loaded
```

The terminal REPL uses Node.js `fetch` for HTTP(S) REQUIRE statements, so it works even in pkg-built executables without npm.

#### Variable Inspection

Use `.vars` to inspect all current variables:

```rexx
rexx> LET data = [1, 2, 3, 4, 5]
rexx> LET result = MEAN(data)
rexx> .vars
Current Variables:
═════════════════
  data = [1,2,3,4,5]
  result = 3
```

#### Persistent Interpreter

The interpreter persists across commands within a session:

```rexx
rexx> LET x = 10
rexx> LET y = 20
rexx> SAY x + y
30

rexx> .reset
Interpreter reset

rexx> SAY x
x
```

#### Multiline Support

The REPL automatically detects continuation for certain keywords (THEN, DO, ELSE):

```rexx
rexx> IF x > 5 THEN
...>   SAY "x is large"
...> ELSE  
...>   SAY "x is small"
...> END
```

#### No DOM Dependencies

The Terminal REPL runs in pure Node.js mode with no browser or DOM dependencies:

- `RUNTIME.TYPE` = "nodejs"
- `RUNTIME.HAS_DOM` = "0"
- `RUNTIME.HAS_WINDOW` = "0"
- `RUNTIME.HAS_NODEJS_REQUIRE` = "1"

---

## Web REPL (Browser)

The Web REPL provides a browser-based interactive environment with graphics rendering and visualization capabilities.

### Getting Started

1. Open your web browser
2. Navigate to the REPL interface (typically `http://localhost:8000/repl/`)
3. Wait for the "REXX REPL ready!" message
4. Start typing commands!

### Basic Usage

#### Variable Assignment

```rexx
LET name = "Alice"
LET age = 30
LET active = TRUE
LET numbers = [1, 2, 3, 4, 5]
```

#### String Interpolation

```rexx
LET greeting = "Hello, {name}! You are {age} years old."
SAY greeting
```

#### Control Flow

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

### Loading Libraries

```rexx
REQUIRE lib="../core/src/r-graphics-functions.js"

// With AS clause (prefixing)
REQUIRE lib="../core/src/r-graphics-functions.js" as="plot_"
REQUIRE lib="../core/src/string-utilities.js" as="str_"
```

### Graphics and Visualization

The Web REPL features automatic graphics rendering:

```rexx
// Load graphics library
REQUIRE "../../extras/functions/r-inspired/graphics/graphics-functions.js"

// Create and auto-render visualizations
LET data = [1,2,2,3,3,3,4,4,5]
LET hist = HIST data=data main="Distribution" col="lightblue"
// 📊 Plot auto-rendered successfully
```

Chart types include: HIST, SCATTER, BARPLOT, BOXPLOT, and more.

### Command History

- **↑ (Up Arrow)**: Previous command
- **↓ (Down Arrow)**: Next command  
- **Enter**: Execute current command

---

## Comparison: Terminal vs Web REPL

| Feature | Terminal REPL | Web REPL |
|---------|--------------|----------|
| **Environment** | Node.js CLI | Browser |
| **Graphics** | ❌ No | ✅ Yes (auto-render) |
| **DOM Access** | ❌ No | ✅ Yes |
| **File System** | ✅ Full access | ⚠️ Limited (localStorage) |
| **REQUIRE** | ✅ fetch-based | ✅ fetch-based |
| **Command History** | ✅ readline | ✅ Custom |
| **Special Commands** | `.help`, `.vars`, `.exit`, etc. | N/A |
| **Multiline** | Auto-detect keywords | Full support |
| **pkg Compatible** | ✅ Yes | N/A |
| **Use Cases** | Scripting, automation, testing | Visualization, web automation |

### When to Use Each

**Use Terminal REPL when:**
- Working in command-line environments
- Scripting and automation workflows
- Testing REXX code quickly
- No graphics needed
- Working with file system operations
- Running in Docker/VM environments

**Use Web REPL when:**
- Creating visualizations and charts
- DOM manipulation and web automation
- Interactive data analysis with graphics
- Learning REXX interactively
- Demonstrating REXX capabilities

---

## See Also

- [REQUIRE Statement Documentation](33-require-statement.md) - Library loading
- [AS Clause Reference](30-as-clause-reference.md) - Function prefixing and renaming
- [Function Reference](35-function-reference.md) - Built-in functions
- [ADDRESS Facility](27-address-facility.md) - Database and service integration
- [Basic Syntax](01-basic-syntax.md) - Language fundamentals
