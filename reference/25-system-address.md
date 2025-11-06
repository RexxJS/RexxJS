# System Commands ADDRESS Target Reference

The System ADDRESS target provides OS command execution via the REXX ADDRESS interface. This allows REXX scripts to execute shell commands, system utilities, and external programs using both classic ADDRESS syntax and modern method calls.

## Loading the Library

```rexx
REQUIRE "system-address"
ADDRESS SYSTEM
```

## Basic Usage

### Classic REXX ADDRESS Syntax

```rexx
REQUIRE "system-address"
ADDRESS SYSTEM

-- Execute simple commands
"echo Hello World"
SAY "Command output: " RESULT
SAY "Return code: " RC

-- File operations  
"ls -la"
SAY "Directory listing completed, RC=" RC
SAY "Files: " RESULT

-- Process management
"ps aux | grep node"
IF RC = 0 THEN SAY "Processes: " RESULT
ELSE SAY "Error: " ERRORTEXT
```

### Modern Method Call Syntax

```rexx
REQUIRE "system-address"
ADDRESS SYSTEM

LET result = execute command="pwd"
SAY "Current directory: " result.stdout
SAY "Success: " result.success

LET status_info = status()
SAY "Running on: " status_info.platform " (" status_info.arch ")"
```

## REXX Variables

### Standard REXX Variables
- **RC** - Return code (matches the process exit code: 0 for success, non-zero for failure)
- **RESULT** - Command standard output (stdout content)
- **ERRORTEXT** - Error message from standard error (stderr content, only set when stderr is present)

## Available Methods

### execute(command=string)
Execute a system command and capture output.

**Parameters:**
- `command` - The shell command to execute

**Returns:**
- `operation` - Always "EXECUTE"
- `command` - The executed command
- `success` - Boolean success status
- `exitCode` - Process exit code
- `stdout` - Standard output
- `stderr` - Standard error
- `message` - Status message

### run(command=string)
Alias for execute() method.

### exec(command=string, options=object)
Execute a command with additional options.

**Parameters:**
- `command` - The shell command to execute
- `options` - Execution options (timeout, encoding, etc.)

### status()
Get system service status and environment information.

**Returns:**
- `service` - Always "system"
- `version` - Node.js version
- `platform` - Operating system platform
- `arch` - System architecture
- `cwd` - Current working directory
- `methods` - Array of available methods

## Command Examples

### File System Operations

```rexx
ADDRESS SYSTEM

-- Directory listing
"ls -la /home"
SAY "Files: " RESULT

-- File operations
"cat /etc/passwd | wc -l"  
SAY "User count: " RESULT
SAY "Exit code: " EXITCODE

-- Create and manipulate files
"echo 'Hello World' > /tmp/test.txt"
"cat /tmp/test.txt"
SAY "File content: " RESULT
```

### Process Management

```rexx
ADDRESS SYSTEM

-- List processes
"ps aux | grep rexx"
IF RC = 0 THEN SAY "REXX processes found: " RESULT
ELSE SAY "No REXX processes running"

-- System information
"uname -a"
SAY "System: " RESULT

"free -h"
SAY "Memory info: " RESULT
```

### Network Operations

```rexx
ADDRESS SYSTEM

-- Network connectivity
"ping -c 1 google.com"
IF RC = 0 THEN SAY "Network is available"
ELSE SAY "Network error: " STDERR

-- Download files
"curl -s https://api.github.com/users/octocat"
SAY "API Response: " RESULT
```

## Error Handling

```rexx
ADDRESS SYSTEM
"nonexistent_command_that_will_fail"

IF RC != 0 THEN DO
  SAY "Command failed:"
  SAY "  Return Code: " RC
  SAY "  Error Message: " ERRORTEXT
END
ELSE DO
  SAY "Command succeeded: " RESULT
END
```

## Cross-Platform Compatibility

### Linux/Unix Commands
```rexx
ADDRESS SYSTEM
"ls -la"              -- List files
"grep pattern file"    -- Search text
"find /path -name '*'" -- Find files
"chmod +x script.sh"   -- Change permissions
```

### Windows Commands  
```rexx
ADDRESS SYSTEM
"dir"                  -- List files
"findstr pattern file" -- Search text
"where node"           -- Find executable
"type file.txt"        -- Display file content
```

### Cross-Platform Scripts
```rexx
ADDRESS SYSTEM

-- Check platform first
LET sys_info = status()
IF sys_info.platform = "win32" THEN DO
  "dir"
  SAY "Windows directory listing: " RESULT
END
ELSE DO
  "ls -la"
  SAY "Unix directory listing: " RESULT
END
```

## Parameterized Commands

```rexx
ADDRESS SYSTEM

-- Using variables in commands
LET filename = "/tmp/data.txt"
LET search_term = "error"

LET cmd = "grep " search_term " " filename
LET result = execute command=cmd
SAY "Search completed: " result.success
```

## Multiple Commands

```rexx
ADDRESS SYSTEM

-- Sequential command execution
"echo 'Starting backup process'"
"tar -czf backup.tar.gz /important/data"
IF RC = 0 THEN DO
  SAY "Backup created successfully"
  "ls -lh backup.tar.gz"
  SAY "Backup size: " RESULT
END
ELSE DO
  SAY "Backup failed: " STDERR
END
```

## Command Timeouts and Options

```rexx
ADDRESS SYSTEM

-- Commands with timeout handling
LET result = exec command="sleep 5" options={timeout: 3000}
IF result.success = false THEN SAY "Command timed out"
```

## Environment Variables

```rexx
ADDRESS SYSTEM

-- Access environment variables
"echo $HOME"
SAY "Home directory: " RESULT

-- Set environment for command
"export MYVAR=test && echo $MYVAR"
SAY "Variable value: " RESULT
```

## Scripting Integration

### Calling External Scripts
```rexx
ADDRESS SYSTEM

-- Execute shell scripts
"./backup.sh"
IF RC = 0 THEN SAY "Backup script completed"

-- Execute with interpreters
"python3 data_analysis.py"
"node web_service.js &"  -- Background execution
```

### Pipeline Operations

### Basic Pipe Operations
```rexx
ADDRESS SYSTEM

-- Simple word count
"echo 'hello world test' | wc -w"
SAY "Word count: " RESULT

-- Line count with grep
"printf 'line1\nline2\nline3\n' | grep line | wc -l"
SAY "Lines with 'line': " RESULT
```

### Sorting and Filtering
```rexx
ADDRESS SYSTEM

-- Sort text data
"printf 'zebra\napple\nbanana\n' | sort"
SAY "Sorted list: " RESULT

-- Filter with grep
"printf 'apple\nbanana\ncherry\napricot\n' | grep '^a'"
SAY "Words starting with 'a': " RESULT
```

### Complex Pipeline Chains
```rexx
ADDRESS SYSTEM

-- Find and sort specific file types
"printf 'test1.js\nfile.txt\ntest2.js\ndata.json\napp.js\n' | grep '\.js$' | sort | head -2"
SAY "First 2 JS files: " RESULT

-- Process management
"ps aux | grep node | wc -l"
SAY "Node processes: " RESULT

-- Log analysis
"cat /var/log/app.log | grep ERROR | tail -10"
SAY "Recent errors: " RESULT
```

### Pipe Error Handling
```rexx
ADDRESS SYSTEM

-- Pipes can fail at any stage
"echo 'test data' | nonexistent_command | sort"
IF RC != 0 THEN DO
  SAY "Pipeline failed with RC: " RC
  SAY "Error: " ERRORTEXT
END
```

### Method Call Style Pipes
```rexx
ADDRESS SYSTEM

-- Classic pipe
"echo 'one two three' | wc -w"
SAY "Classic result: " RESULT

-- Method call with same pipe
LET method_result = execute command="echo 'four five six' | wc -w"
SAY "Method result: " method_result.stdout
```

## File Redirection Operations

### Basic Output Redirection
```rexx
ADDRESS SYSTEM

-- Simple output redirection
"echo 'Hello from REXX' > /tmp/output.txt"
SAY "Write completed, RC: " RC

-- Read the file back
"cat /tmp/output.txt"
SAY "File contents: " RESULT
```

### Append Redirection
```rexx
ADDRESS SYSTEM

-- Create initial file
"echo 'Line 1' > /tmp/data.txt"

-- Append additional lines
"echo 'Line 2' >> /tmp/data.txt"
"echo 'Line 3' >> /tmp/data.txt"

-- Read complete file
"cat /tmp/data.txt"
SAY "Complete file: " RESULT
```

### Input Redirection
```rexx
ADDRESS SYSTEM

-- Create a test file
"printf 'zebra\napple\nbanana\n' > /tmp/unsorted.txt"

-- Sort using input redirection
"sort < /tmp/unsorted.txt"
SAY "Sorted data: " RESULT

-- Clean up
"rm /tmp/unsorted.txt"
```

### Redirection with Pipes
```rexx
ADDRESS SYSTEM

-- Combine pipes and output redirection
"printf 'file1.js\ntest.txt\nfile2.js\ndata.json\n' | grep '\.js$' | sort > /tmp/js_files.txt"

-- Read the results
"cat /tmp/js_files.txt"
SAY "JS files: " RESULT

-- Complex pipeline with redirection
"ps aux | grep node | head -5 > /tmp/node_processes.txt"
SAY "Node processes saved, RC: " RC
```

### Error Handling with Redirection
```rexx
ADDRESS SYSTEM

-- Handle permission errors
"echo 'test' > /root/forbidden.txt"
IF RC != 0 THEN DO
  SAY "Redirection failed: " ERRORTEXT
  SAY "Error code: " RC
END

-- Safe redirection to temp directory
"echo 'safe write' > /tmp/safe_file.txt"
IF RC = 0 THEN DO
  SAY "Write successful"
  "cat /tmp/safe_file.txt"
  SAY "Content: " RESULT
END
```

### Method Call Style Redirection
```rexx
ADDRESS SYSTEM

-- Classic redirection
"echo 'classic output' > /tmp/classic.txt"
SAY "Classic RC: " RC

-- Method call redirection
LET write_result = execute command="echo 'method output' > /tmp/method.txt"
SAY "Method success: " write_result.success

-- Read back with method call
LET read_result = execute command="cat /tmp/method.txt"
SAY "Read content: " read_result.stdout
```

### Multiple Redirection Types
```rexx
ADDRESS SYSTEM

-- Combine input, pipes, and output redirection
"printf 'data1\ndata2\ndata3\n' > /tmp/input.txt"
"sort < /tmp/input.txt | grep 'data' > /tmp/filtered.txt"
"cat /tmp/filtered.txt"
SAY "Processed data: " RESULT

-- Clean up files
"rm -f /tmp/input.txt /tmp/filtered.txt"
```

## Stderr/Stdout Combination

ADDRESS SYSTEM supports both traditional shell `2>&1` syntax and a REXX-programmatic approach for combining stderr with stdout. Choose the approach that best fits your needs and experience level.

### Both Approaches Supported

```rexx
ADDRESS SYSTEM

-- Traditional shell approach (familiar, full control)
"sh -c 'echo output; echo error >&2' 2>&1"
SAY "Combined (shell): " RESULT

-- REXX programmatic approach (explicit, self-documenting)
LET result = execute command="sh -c 'echo output; echo error >&2'" combine_stderr=true
SAY "Combined (REXX): " result.stdout
SAY "Stderr is empty: " (result.stderr = "")
SAY "Was combined: " result.combineStderr
```

### When to Use Each Approach

**Use traditional `2>&1` when:**
- You're comfortable with shell syntax
- You need precise control over redirection placement in complex pipelines
- You want maximum flexibility (`cmd1 2>&1 | cmd2` vs `cmd1 | cmd2 2>&1`)

**Use `combine_stderr=true` when:**
- You prefer explicit, self-documenting parameters
- You're primarily a REXX programmer less familiar with shell operators
- You want access to metadata like `combineStderr` flag in results

### Method Call Syntax

```rexx
ADDRESS SYSTEM

-- Execute method with stderr combination
LET result = execute command="command_with_errors" combine_stderr=true

-- Run method (alias for execute)  
LET result2 = run command="another_command" combine_stderr=true

-- Exec method with combine_stderr parameter
LET result3 = exec command="complex_command" combine_stderr=true
```

### Error Stream Processing

```rexx
ADDRESS SYSTEM

-- Step 1: Run command that produces mixed output
LET mixed = execute command="sh -c 'echo INFO; echo ERROR >&2; echo DONE'" combine_stderr=true

-- Step 2: Filter errors from combined stream
LET errors_only = execute command="echo '" + mixed.stdout + "' | grep ERROR"

-- Step 3: Count total messages
LET total_lines = execute command="echo '" + mixed.stdout + "' | wc -l"

SAY "Combined output: " mixed.stdout
SAY "Errors found: " errors_only.stdout  
SAY "Total messages: " total_lines.stdout
```

### Complex Pipeline Examples

```rexx
ADDRESS SYSTEM

-- Traditional shell approach (direct, flexible positioning)
"application_cmd 2>&1 | grep -E '(ERROR|WARN)' | tail -10"
SAY "Recent issues (shell): " RESULT

-- REXX programmatic approach (explicit, with metadata)
LET combined = execute command="application_cmd" combine_stderr=true
LET filtered = execute command="echo '" + combined.stdout + "' | grep -E '(ERROR|WARN)' | tail -10"
SAY "Recent issues (REXX): " filtered.stdout
SAY "Original command succeeded: " combined.success
```

### Advanced Shell Integration

```rexx
ADDRESS SYSTEM

-- Complex pipeline with traditional syntax
"ps aux | grep node 2>&1 | head -5 > /tmp/processes.txt"
IF RC = 0 THEN SAY "Process list saved successfully"

-- Mixed approach: traditional 2>&1 in pipeline, REXX methods for processing  
LET processes = execute command="ps aux | grep node 2>&1 | head -5"
LET save_result = execute command="echo '" + processes.stdout + "' > /tmp/processes.txt"
SAY "Processes found: " (LENGTH(processes.stdout) > 0)
SAY "Save successful: " save_result.success
```

### Benefits of Each Approach

**Traditional `2>&1` Benefits:**
1. **Shell Standard**: Works exactly like bash, sh, zsh
2. **Precise Control**: Place anywhere in pipeline (`cmd1 2>&1 | cmd2` vs `cmd1 | cmd2 2>&1`)
3. **Familiar**: No learning curve for shell users
4. **Flexible**: Combines naturally with other shell operators

**REXX `combine_stderr=true` Benefits:**
1. **Self-Documenting**: Clear intent without cryptic operators
2. **Metadata Rich**: Access to `combineStderr`, `success`, `actualCommand` fields
3. **REXX Idiomatic**: Fits naturally with REXX parameter patterns
4. **Beginner Friendly**: No need to remember shell redirection syntax

### Error Handling with Combined Streams

```rexx
ADDRESS SYSTEM

LET result = execute command="failing_command" combine_stderr=true

IF result.success = false THEN DO
  SAY "Command failed with RC: " result.exitCode
  SAY "Combined output contains: " result.stdout
  SAY "Pure stderr is: " result.stderr  -- Will be empty when combined
  SAY "Was stderr combined: " result.combineStderr
END
```

### Advanced Stream Processing

```rexx
ADDRESS SYSTEM

-- Process logs with both info and error messages
LET log_output = execute command="application_with_logging" combine_stderr=true

-- Extract different message types
LET info_msgs = execute command="echo '" + log_output.stdout + "' | grep 'INFO:'"  
LET warn_msgs = execute command="echo '" + log_output.stdout + "' | grep 'WARN:'"
LET error_msgs = execute command="echo '" + log_output.stdout + "' | grep 'ERROR:'"

-- Generate summary
SAY "Application produced:"
SAY "  Info messages: " (LENGTH(info_msgs.stdout) > 0)
SAY "  Warnings: " (LENGTH(warn_msgs.stdout) > 0) 
SAY "  Errors: " (LENGTH(error_msgs.stdout) > 0)
```

## Security Considerations

- **Input validation**: Always validate command strings from user input
- **Path sanitization**: Be careful with file paths and user-provided data
- **Command injection**: Avoid concatenating untrusted input into commands
- **Privilege escalation**: Commands run with same privileges as REXX interpreter
- **Resource limits**: Long-running commands may need timeout controls

## Environment Requirements

- **Node.js only** - Not available in browser environments  
- **child_process module** - Built into Node.js, no additional installation needed
- **Shell access** - Requires access to system shell (`/bin/sh`, `cmd.exe`)
- **File system permissions** - Commands run with interpreter's permissions

## Best Practices

1. **Check return codes**: Always verify RC after command execution
2. **Handle errors**: Use STDERR and ERRORTEXT for error details
3. **Validate input**: Sanitize any user-provided command strings
4. **Use absolute paths**: Specify full paths for reliability
5. **Timeout long operations**: Set timeouts for potentially long-running commands
6. **Test cross-platform**: Verify commands work on target operating systems

## Integration with INTERPRET

The ADDRESS SYSTEM context is inherited by INTERPRET statements:

```rexx
ADDRESS SYSTEM
INTERPRET "echo 'Dynamic command execution'"
-- System context automatically available in interpreted code
```

## Debugging Commands

```rexx
ADDRESS SYSTEM

-- Debug command execution
"echo 'Debug: About to run complex command'"
"complex_command_here"
SAY "Command RC: " RC
SAY "Command Output: " RESULT
SAY "Command Errors: " STDERR
```

This enables powerful system integration capabilities within REXX scripts while maintaining the familiar ADDRESS interface pattern.