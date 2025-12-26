# Windows Automation ADDRESS Handler for RexxJS

A comprehensive Windows automation ADDRESS handler for RexxJS providing direct access to Windows system operations including PowerShell command execution, registry access, process management, and window control.

## Features

### PowerShell Integration
Execute any PowerShell command directly from REXX code:

```rexx
REQUIRE "windows-automation"
ADDRESS WINDOWS
"powershell Get-Process | ConvertTo-Json"
SAY RESULT
```

### Process Management
- List running processes
- Kill processes by name or ID
- Get process information
- Monitor system resources

```rexx
ADDRESS WINDOWS
operation = "process_list"
SAY RESULT.count || " processes running"

operation = "kill_process" process="notepad.exe"
```

### Registry Operations
- Read registry values
- Write registry values
- Delete registry entries
- Batch registry modifications

```rexx
ADDRESS WINDOWS
operation = "registry_read"
path = "HKLM\Software\Microsoft\Windows"
value = "CurrentVersion"

operation = "registry_write"
path = "HKCU\Software\MyApp"
value = "AppSetting"
data = "MyValue"
```

### Window Automation
- Find windows by title
- Activate/focus windows
- Minimize/maximize windows
- Close windows
- Send keyboard input to windows

```rexx
ADDRESS WINDOWS
operation = "find_window" title="Notepad"
LET windowId = RESULT.windowId

operation = "activate_window" window=windowId
```

### File Operations
- Read files
- Write files
- Create directories
- List files with attributes

```rexx
ADDRESS WINDOWS
operation = "file_read" path="C:\test.txt"
SAY RESULT.content

operation = "file_write" path="C:\output.txt" content="Hello World"
```

### System Information
- Get system details (OS version, processor, memory)
- Retrieve computer name and user information
- Monitor system status

```rexx
ADDRESS WINDOWS
operation = "system_info"
SAY "Computer: " || RESULT.computerName
SAY "OS: " || RESULT.osVersion
```

## Installation

### As a Dependency
```bash
npm install @rexxjs/windows-automation-address
```

### From Source
```bash
git clone https://github.com/RexxJS/windows-automation
cd windows-automation
npm install
```

## Usage

### Basic Usage

```rexx
-- Load the Windows Automation ADDRESS handler
REQUIRE "registry:org.rexxjs/windows-automation"

-- Switch to Windows ADDRESS context
ADDRESS WINDOWS

-- Execute a PowerShell command
"powershell Get-Service | Where-Object {$_.Status -eq 'Running'} | ConvertTo-Json"
SAY RESULT

-- Check for errors
IF RC = 0 THEN
  SAY "Command executed successfully"
ELSE
  SAY "Error: " || RESULT
```

### Complete Workflow Example

```rexx
-- System Administration Workflow
REQUIRE "windows-automation"
ADDRESS WINDOWS

-- 1. Check system information
SAY "=== System Information ==="
operation = "system_info"
SAY "OS Version: " || RESULT.osVersion
SAY "Computer: " || RESULT.computerName
SAY "Processors: " || RESULT.processorCount

-- 2. List running processes
SAY ""
SAY "=== Running Processes ==="
operation = "process_list"
DO i = 1 TO RESULT.count
  proc = RESULT.processes.i
  SAY proc.name || " (PID: " || proc.id || ")"
END

-- 3. Registry check
SAY ""
SAY "=== Registry Settings ==="
operation = "registry_read"
path = "HKLM\Software\Microsoft\Windows\CurrentVersion"
value = "ProductName"
IF RC = 0 THEN
  SAY "Windows Product: " || RESULT.data
END

-- 4. File operations
SAY ""
SAY "=== File Operations ==="
operation = "file_write"
path = "C:\Logs\automation_log.txt"
content = "Automation completed at " || DATE('Standard')
IF RC = 0 THEN
  SAY "Log file created successfully"
```

### Advanced: PowerShell with Embedded Scripts

```rexx
-- Run complex PowerShell scripts
REQUIRE "windows-automation"
ADDRESS WINDOWS

LET psScript = "
$processes = Get-Process
$topProcesses = $processes | Sort-Object -Property WorkingSet -Descending | Select-Object -First 5
$topProcesses | ConvertTo-Json
"

"powershell " || psScript
SAY RESULT
```

### Working with Windows Applications

```rexx
-- Automate application control
REQUIRE "windows-automation"
ADDRESS WINDOWS

-- Find and activate an application window
operation = "find_window" title="Microsoft Excel"

IF RESULT.found = 'true' THEN DO
  operation = "activate_window" window=RESULT.windowId
  SAY "Excel window activated"
END
```

## Testing

The address handler includes comprehensive test coverage with:
- **Unit tests** with mocked operations (run on all platforms)
- **Integration tests** that run on Windows systems (skipped on non-Windows)
- **Embedded REXX snippets** demonstrating real-world workflows

### Run Tests

```bash
# Run all tests
npm test

# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- windows-automation-address.spec.js
```

### Test Coverage

- Library loading and registration
- Classic REXX ADDRESS syntax
- PowerShell command execution
- Process management
- Registry operations
- File operations
- Window automation
- System information
- Error handling
- Integration with REXX features

## API Reference

### Command Formats

#### PowerShell Commands
Execute any PowerShell command as a string:

```rexx
ADDRESS WINDOWS
"powershell Get-Content C:\file.txt"
```

#### Operation Method
Use operation parameter for structured operations:

```rexx
ADDRESS WINDOWS
operation = "process_list"
```

### Available Operations

| Operation | Parameters | Description |
|-----------|-----------|-------------|
| `powershell` | command | Execute PowerShell command |
| `process_list` | none | List all running processes |
| `kill_process` | process | Kill process by name |
| `find_window` | title | Find window by title |
| `activate_window` | window | Activate/focus window |
| `window_minimize` | window | Minimize window |
| `window_maximize` | window | Maximize window |
| `window_close` | window | Close window |
| `registry_read` | path, value | Read registry value |
| `registry_write` | path, value, data | Write registry value |
| `registry_delete` | path, value | Delete registry value |
| `file_read` | path | Read file contents |
| `file_write` | path, content | Write file contents |
| `system_info` | none | Get system information |

### Return Values

All operations return a result object with:

```javascript
{
  success: boolean,      // true if operation succeeded
  operation: string,     // operation name
  errorCode: number,     // 0 for success, non-zero for errors
  error?: string,        // error message if failed
  // ... operation-specific fields
}
```

### Return Value Examples

**Process List:**
```javascript
{
  success: true,
  operation: "process_list",
  processes: [
    { name: "explorer.exe", id: 100, memory: 204800000 },
    { name: "svchost.exe", id: 200, memory: 10485760 }
  ],
  count: 2
}
```

**Registry Read:**
```javascript
{
  success: true,
  operation: "registry_read",
  path: "HKLM\Software\Microsoft\Windows",
  value: "CurrentVersion",
  data: "10.0"
}
```

**PowerShell Command:**
```javascript
{
  success: true,
  operation: "powershell",
  command: "Get-Process",
  output: "ProcessName     : notepad\nId              : 1234\n..."
}
```

## Error Handling

Use standard REXX error checking:

```rexx
ADDRESS WINDOWS
"powershell Get-Service"

IF RC = 0 THEN
  SAY "Command succeeded"
ELSE DO
  SAY "Command failed with RC=" || RC
  SAY "Error: " || RESULT.error
END
```

## Platform Support

### Windows

#### Supported Versions
- **Windows 10** (version 21H2 and later) - Full support ✅
- **Windows 11** (all versions) - Full support ✅
- **Windows Server 2016** and later - Full support ✅
- **Windows 8.1** - Partial support (PowerShell, registry, processes; window automation limited)
- **Windows 7** - Legacy support (PowerShell 5.1 required; not officially tested)

#### Requirements
- **PowerShell 5.0 or later** (Windows PowerShell 5.1 on Windows 10; PowerShell 7+ recommended)
- **Administrator privileges** for:
  - Registry modifications (write/delete operations)
  - Process termination (kill_process)
  - Window manipulation (some operations may require elevated privileges)
  - System information on restricted systems

#### Native Features
- Full native support for all operations
- Direct PowerShell integration via `powershell` command
- Complete Windows Registry access (HKLM, HKCU, HKCR, HKU, HKCC)
- Window automation via Windows API
- Process management via Windows APIs and tasklist utility

### Mac/Linux
- **Mocked mode** for testing: Returns simulated results for unit tests
- **Mock tests pass 100%** on all platforms
- **Integration tests skipped** when not on Windows
- Enables CI/CD pipelines to test Windows automation code on any OS

### Browser
- Limited to mock mode
- PowerShell and registry operations return simulated responses
- Useful for testing workflows without Windows environment

## Configuration

### Mock Mode (for testing on non-Windows systems)

The handler automatically detects the platform and uses mock mode when appropriate:

```javascript
// Manually enable mock mode for testing
const { setWindowsAutomationMockMode } = require('./src/windows-automation-address.js');
setWindowsAutomationMockMode(true);
```

### Registry Path Formats

- `HKLM` = HKEY_LOCAL_MACHINE
- `HKCU` = HKEY_CURRENT_USER
- `HKCR` = HKEY_CLASSES_ROOT
- `HKU` = HKEY_USERS
- `HKCC` = HKEY_CURRENT_CONFIG

## Security Considerations

⚠️ **Important**: This ADDRESS handler provides low-level system access. Use with caution:

- Registry modifications can affect system stability
- PowerShell execution should validate commands
- Process killing can affect system operation
- Use in controlled environments only

### Best Practices

1. Validate user input before constructing commands
2. Use specific, non-destructive operations when possible
3. Log all system modifications
4. Test in development/staging before production
5. Run with appropriate user permissions

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

- **Documentation**: [RexxJS Windows Automation Docs](https://rexxjs.org/reference/windows-automation)
- **Issues**: GitHub Issues
- **Community**: RexxJS Community Forum

## Changelog

### v1.0.0 (2025-12-26)
- Initial release
- PowerShell command execution
- Process management
- Registry operations
- File operations
- Window automation
- System information
- Comprehensive test coverage
- Cross-platform mock testing support
