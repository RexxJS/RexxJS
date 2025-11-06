---
layout: default
title: Reference
---

# RexxJS Reference Documentation

A comprehensive reference guide to all RexxJS features, organized by category.

## Execution Mode Overview

RexxJS supports three distinct execution modes, each designed for different use cases and control architectures:

### 1. **Autonomous Web Mode**
Direct browser execution where the RexxJS interpreter runs independently within a single web context. The script controls its own execution flow with no external orchestration. Ideal for interaction with standalone web applications, white-box browser automation, and client-side scripting.

### 2. **Controlled Web Mode** 
Browser execution using a Director/Worker architecture with two iframes communicating via postMessage. An external director orchestrates execution, providing real-time control (pause/resume/abort), progress monitoring, and distributed workflow coordination. Designed for complex multi-step processes requiring external supervision.

### 3. **Command-line Mode**
Execution in Node.js environments (desktop, server, docker-style container or VM) with full file system access but no web/DOM capability. While a programming language attempting to use instead of bash will lead to longer scripts.

*Detailed documentation for each mode is provided in the sections below and in dedicated function references.*

## Core Language Features

### 📝 [Basic Syntax](01-basic-syntax.md)
- Variable assignment and management
- Function calls and parameters
- Comments and code structure
- String interpolation

### 🎯 [Control Flow](02-control-flow.md)
- IF/ELSE/ENDIF statements  
- Complete comparison operators: `=`, `==`, `\=`, `!=`, `<>`, `¬=`, `><`, `>`, `<`, `>=`, `<=`
- DO/END loops (range, step, while, repeat)
- SELECT/WHEN/OTHERWISE branching
- SIGNAL statement for jumps

### 🔧 [Advanced Statements](03-advanced-statements.md)
- NUMERIC statement - precision control
- PARSE statement - string parsing
- Stack operations (PUSH/PULL/QUEUE)
- Subroutines (CALL/RETURN)
- TRACE statement - debugging
- Program structure and flow

## Built-in Functions

### 📊 [String Functions](04-string-functions.md)
- Basic string operations (UPPER, LOWER, LENGTH, etc.)
- Advanced string processing with regex
- String validation and testing
- Text manipulation and formatting

### 🧮 [Math Functions](05-math-functions.md)
- Basic arithmetic (ABS, MAX, MIN)
- Advanced mathematical functions
- Statistical operations
- Geometry and trigonometry

### 📋 [Array Functions](06-array-functions.md)
- Array creation and manipulation
- Array searching and sorting
- Mathematical operations on arrays
- Data processing and analysis

### 🗓️ [Date/Time Functions](07-datetime-functions.md)
- Current date and time retrieval
- Date component extraction and parsing
- Date format conversion and validation
- Time-based calculations and workflows

### 🔗 [JSON Functions](08-json-functions.md)
- JSON parsing and stringification
- Data interchange with APIs
- Object manipulation
- Error handling

### 🌐 [Web Functions](09-web-functions.md)  
- URL parsing and encoding/decoding
- Base64 operations and URL-safe encoding
- HTTP resource access and API integration
- Cross-origin communication support

### 🎯 [ID Generation Functions](10-id-functions.md)
- UUID generation (RFC4122)
- Short IDs (NANOID)
- Random data generation
- Cryptographic security

### ✅ [Validation Functions](11-validation-functions.md)
- Email, URL, and phone number validation
- Network address validation (IP, MAC)
- Data type and format verification
- Financial and geographic validation

### 🔒 [Security Functions](12-security-functions.md)
- Hashing (SHA256, SHA1, MD5)
- HMAC generation
- Password hashing and verification
- JWT token handling
- Cryptographic operations

### 💾 [File System Functions](13-filesystem-functions.md)
- Unified localStorage and HTTP resource access
- File operations (read, write, copy, move, delete)
- File discovery and listing with patterns
- Backup management and data persistence

### 📈 [Excel Functions](14-excel-functions.md)
- Logical functions (IF, AND, OR, NOT)
- Statistical calculations (AVERAGE, MEDIAN, STDEV)
- Lookup functions (VLOOKUP, HLOOKUP, INDEX, MATCH)
- Text manipulation (CONCATENATE, LEFT, RIGHT, MID)
- Date operations (TODAY, YEAR, MONTH, DAY)
- Financial calculations (PMT, FV, PV, NPV, IRR)

## Advanced Functions

### 📊 [R-Language Functions](15-r-functions.md)
- Statistical computing and data analysis (150+ functions)
- Matrix operations and linear algebra
- Data manipulation and transformation
- Graphics and visualization
- Machine learning and time series analysis
- Complete R-language compatibility layer

### 🔬 [SciPy Interpolation Functions](16-scipy-functions.md) 
- Advanced interpolation methods (16+ functions)
- 1D/2D interpolation with multiple algorithms
- Spline functions and scattered data interpolation
- Radial basis functions and shape-preserving methods
- Scientific computing and numerical analysis

### 🔍 [Regular Expression Functions](17-regex-functions.md)
- Pattern matching and text processing
- Full JavaScript regex engine support
- Capture groups and advanced matching
- Text extraction and transformation

## Advanced Features

### 🔄 [Variable Resolver (var_missing)](variable-resolver.md)
- Lazy variable resolution system
- External data source integration
- Spreadsheet cell references
- Database query results
- No-cache on-demand resolution
- First-class environment interop

### 🏃 [Dynamic Execution](18-interpret.md)
- INTERPRET statement modes
- Variable scoping and isolation
- Security controls (NO-INTERPRET)
- Meta-programming patterns
- Code generation techniques

### 📡 [Application Addressing](19-application-addressing.md)
- ADDRESS statement for cross-application communication
- **ADDRESS HEREDOC patterns** for domain-specific languages
- Secure iframe integration and postMessage protocols
- API integration and authentication workflows
- Multi-application automation patterns

### 💬 [Output and Debugging](20-output-debug.md)
- SAY statement with variable interpolation
- Structured logging and audit trails
- Debug workflows and progress tracking
- Error reporting and diagnostics

### 🎮 [DOM Functions](21-dom-functions.md)
- Browser DOM query and manipulation (Autonomous Web Mode)
- Element interaction (click, type, select)
- CSS style and class management
- Web automation and testing capabilities

### 🚌 [Control Bus](22-control-bus.md)
- General-purpose distributed application coordination
- CHECKPOINT function for progress monitoring and flow control
- Director/Worker patterns and event loops
- Multi-application workflow orchestration
- Fault tolerance and error recovery

### 📦 [REQUIRE System](23-require-system.md)
- Dynamic library loading including from GitHub releases
- Zero-overhead detection and caching
- Transitive dependency resolution with circular detection
- Minification-safe dependency metadata
- Multi-mode compatibility (Autonomous Web, Controlled Web, Command-line)
- Library publishing conventions and best practices

### ⚠️ [Error Handling](24-error-handling.md)
- Enhanced error context functions (ERROR_LINE, ERROR_FUNCTION, etc.)
- SIGNAL statement usage (SIGNAL ON ERROR, SIGNAL OFF ERROR)
- Error recovery patterns and smart retry logic
- Integration with built-in functions and DOM operations
- JavaScript stack trace integration for debugging
- Best practices for robust error handling

## Specialized ADDRESS Handlers

### 🔧 [ADDRESS System](25-system-address.md)
- System command execution and process management
- Environment variable access and configuration
- Cross-platform file system operations
- Process coordination and automation

### 🗄️ [ADDRESS SQLite](26-sqlite-address.md)
- Database operations and query execution
- Transaction management and data persistence
- Schema creation and migration patterns
- Data analysis and reporting workflows

### 🎯 [ADDRESS HEREDOC Patterns](27-address-heredoc-patterns.md)
- Multiline content handling with HEREDOC syntax
- Domain-specific language integration
- Clean syntax for SQL, JSON, XML, and templates
- Migration from legacy MATCHING patterns

### 🔗 [ADDRESS Variable Patterns](28-address-variable-patterns.md)
- Dynamic ADDRESS target resolution
- Variable-based routing and dispatch
- Runtime configuration and target selection
- Flexible automation architectures

### 🛠️ [ADDRESS Handler Utilities](29-address-handler-utilities.md)
- Common utility functions for ADDRESS handlers
- Handler development patterns and best practices
- Error handling and validation utilities
- Testing and debugging support for custom handlers

## Language Extensions

### ✨ [AS Clause Reference](30-as-clause-reference.md)
- Variable aliasing and transformation patterns
- Data type conversion and formatting
- Output redirection and capture
- Advanced parameter passing techniques

### 📝 [Assertions and Expectations](31-assertions-expect-documentation.md)
- Built-in assertion functions for testing and validation
- EXPECT statement for behavior verification
- Test-driven development patterns
- Quality assurance and debugging support

### 🔄 [REQUIRE Statement](33-require-statement.md)
- Detailed REQUIRE statement syntax and semantics
- Registry-based library loading with namespace verification
- Dynamic loading patterns and best practices
- Dependency management and version control
- Library development and publishing guidelines

### 💻 [REPL Guide](34-repl-guide.md)
- Interactive RexxJS development environment
- REPL-specific features and commands
- Debugging and exploration techniques
- Development workflow integration

### 🔤 [Interpolation Patterns](36-interpolation-patterns.md)
- Complete INTERPOLATION PATTERN statement reference
- Predefined and custom interpolation patterns
- Pattern lifecycle management and validation
- Integration with ADDRESS HEREDOC blocks

## Reference Materials

### 📚 [Function Reference](35-function-reference.md)
- Comprehensive cross-reference catalog (400+ functions)
- Implementation status and environment compatibility
- Function availability by category and use case
- Cross-reference index for all built-in functions

### 🧪 [Testing with rexxt](32-testing-rexxt.md)
- Native test runner for RexxJS code
- Execution-based testing without formal suites
- ADDRESS EXPECTATIONS integration patterns
- Test discovery, filtering, and reporting
- Dogfooding and comprehensive testing strategies

---

## Navigation Tips

- **Quick Reference**: Each function includes practical examples and usage patterns
- **Cross-References**: Related functions are linked at the bottom of each section
- **Integration Examples**: Most sections show how features work together
- **Error Handling**: Security and error handling patterns included throughout

---

**Total Functions:** 400+ built-in functions across all categories
**Language Features:** Complete Rexx implementation with modern enhancements
**Security:** Sandboxing, isolation, and cryptographic functions built-in

### 📚 [Function Libraries](12-function-libraries.md)
- Built‑ins vs third‑party
- Positional vs named arguments
- External script CALL semantics
- COPY() and pass‑by semantics
