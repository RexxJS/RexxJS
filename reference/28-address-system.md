# ADDRESS SYSTEM - Shell Command Execution

## Overview

The SYSTEM ADDRESS target allows RexxJS scripts to execute operating system shell commands directly. This provides full integration with the host operating system for file operations, process management, and system administration tasks.

**Availability**: Node.js environments only (not available in browsers for security reasons)

## Basic Usage

```rexx
-- Switch to SYSTEM ADDRESS
ADDRESS SYSTEM

-- Execute shell commands
"ls -la"
"cat /etc/hostname"
"mkdir -p /tmp/mydir"
```

## Command Execution

### Simple Command

```rexx
ADDRESS SYSTEM
"echo 'Hello from shell'"
```

The command executes in the system shell (`/bin/sh` on Unix, `cmd.exe` on Windows).

### Check Return Code

```rexx
ADDRESS SYSTEM
"test -f /etc/passwd"
IF RC = 0 THEN
  SAY "File exists"
ELSE
  SAY "File does not exist"
```

The RC (Return Code) variable contains the exit status of the command:
- 0 = success
- Non-zero = error (specific meaning depends on the command)

### Capture Output

```rexx
ADDRESS SYSTEM
"hostname"
SAY "Hostname: " || RESULT

-- RESULT contains the command's stdout output
```

The RESULT variable contains the standard output (stdout) from the command.

### One-time Execution

Execute a single command without switching ADDRESS context:

```rexx
ADDRESS SYSTEM "ls -la"
-- Automatically returns to previous ADDRESS after command
```

## Shell Features

### Pipes and Redirection

```rexx
ADDRESS SYSTEM
"cat /var/log/syslog | grep error | wc -l"
"ps aux | grep node > /tmp/node-processes.txt"
"find /home -name '*.txt' 2>/dev/null"
```

### Environment Variables

```rexx
ADDRESS SYSTEM
"export MYVAR=hello"
"echo $MYVAR"  -- Note: Each command runs in a new shell, so exports don't persist

-- Use shell subshells for multi-step operations
"export MYVAR=hello && echo $MYVAR"  -- This works
```

### Command Chaining

```rexx
ADDRESS SYSTEM
"cd /tmp && mkdir testdir && cd testdir && pwd"
```

Use `&&` for conditional execution (stop on error) or `;` for unconditional execution.

## HEREDOC with SYSTEM

For complex shell scripts, use HEREDOC:

```rexx
ADDRESS SYSTEM
LET script = <<BASH
#!/bin/bash
for i in {1..5}; do
  echo "Line $i"
  sleep 1
done
BASH

-- Execute the script
"bash -c \"$script\""
```

Or create a script file:

```rexx
ADDRESS SYSTEM
LET script = <<BASH
#!/bin/bash
echo "Starting backup..."
tar -czf /backup/myfiles-$(date +%Y%m%d).tar.gz /home/user/documents
echo "Backup complete"
BASH

-- Write to file
"cat > /tmp/backup.sh <<'EOF'
{script}
EOF"

-- Make executable and run
"chmod +x /tmp/backup.sh"
"/tmp/backup.sh"

IF RC = 0 THEN
  SAY "Backup successful"
```

## Common Patterns

### File Operations

```rexx
ADDRESS SYSTEM

-- Check if file exists
"test -f /path/to/file"
LET file_exists = (RC = 0)

-- Check if directory exists
"test -d /path/to/dir"
LET dir_exists = (RC = 0)

-- Create directory
"mkdir -p /path/to/new/dir"

-- Copy files
"cp -r /source /destination"

-- Delete files
"rm -f /path/to/file"

-- Delete directory
"rm -rf /path/to/dir"

-- Find files
"find /home -name '*.log' -mtime +7"
SAY "Old log files: " || RESULT
```

### Process Management

```rexx
ADDRESS SYSTEM

-- List processes
"ps aux | grep node"
SAY RESULT

-- Kill process by PID
"kill -9 1234"

-- Check if process is running
"pgrep -f 'my-app'"
IF RC = 0 THEN
  SAY "Process is running"
ELSE
  SAY "Process is not running"

-- Start background process
"nohup ./my-app > /var/log/my-app.log 2>&1 &"
```

### System Information

```rexx
ADDRESS SYSTEM

-- Get hostname
"hostname"
LET hostname = RESULT

-- Get OS info
"uname -a"
LET os_info = RESULT

-- Get disk space
"df -h"
SAY "Disk space:"
SAY RESULT

-- Get memory info
"free -h"
SAY "Memory:"
SAY RESULT

-- Get CPU info
"lscpu | grep 'Model name'"
LET cpu = RESULT
```

### Text Processing

```rexx
ADDRESS SYSTEM

-- Count lines in file
"wc -l /var/log/syslog"
LET line_count = WORD(RESULT, 1)

-- Extract specific lines
"sed -n '10,20p' /var/log/syslog"
SAY "Lines 10-20:"
SAY RESULT

-- Search and replace
"sed 's/old/new/g' input.txt > output.txt"

-- grep for patterns
"grep -i 'error' /var/log/syslog"
SAY "Error lines:"
SAY RESULT
```

### Network Operations

```rexx
ADDRESS SYSTEM

-- Check network connectivity
"ping -c 3 google.com"
IF RC = 0 THEN
  SAY "Network is up"

-- Download file
"curl -O https://example.com/file.tar.gz"

-- HTTP request
"curl -s https://api.github.com/users/octocat"
LET json_response = RESULT

-- Check port
"nc -zv localhost 8080"
IF RC = 0 THEN
  SAY "Port 8080 is open"
```

### Archive Operations

```rexx
ADDRESS SYSTEM

-- Create tar archive
"tar -czf archive.tar.gz /path/to/dir"

-- Extract tar archive
"tar -xzf archive.tar.gz -C /destination"

-- Create zip archive
"zip -r archive.zip /path/to/dir"

-- Extract zip archive
"unzip archive.zip -d /destination"

-- List archive contents
"tar -tzf archive.tar.gz"
SAY "Archive contents:"
SAY RESULT
```

## Error Handling

### Check for Command Existence

```rexx
ADDRESS SYSTEM
"which docker"
IF RC = 0 THEN DO
  SAY "Docker is installed"
  "docker --version"
  SAY RESULT
END
ELSE
  SAY "Docker is not installed"
```

### Handle Command Failures

```rexx
SIGNAL ON ERROR NAME HandleSystemError

ADDRESS SYSTEM
"risky-command --that-might-fail"

IF RC \= 0 THEN DO
  SAY "Command failed with exit code: " || RC
  SAY "Output: " || RESULT
  EXIT RC
END

EXIT

HandleSystemError:
  SAY "System command error: " || RC
  SAY "Output: " || RESULT
  EXIT RC
```

### Stderr Capture

By default, only stdout is captured in RESULT. To capture stderr:

```rexx
ADDRESS SYSTEM
"my-command 2>&1"  -- Redirect stderr to stdout
SAY "All output: " || RESULT

-- Or capture separately
"my-command > /tmp/stdout.txt 2> /tmp/stderr.txt"
"cat /tmp/stdout.txt"
LET stdout_content = RESULT
"cat /tmp/stderr.txt"
LET stderr_content = RESULT
```

## Platform Differences

### Unix/Linux vs Windows

```rexx
-- Detect platform
IF RUNTIME.PLATFORM = "linux" | RUNTIME.PLATFORM = "darwin" THEN DO
  -- Unix commands
  ADDRESS SYSTEM
  "ls -la"
  "cp source destination"
END
ELSE IF RUNTIME.PLATFORM = "win32" THEN DO
  -- Windows commands
  ADDRESS SYSTEM
  "dir"
  "copy source destination"
END
```

### Cross-platform Path Handling

```rexx
-- Use forward slashes (works on Windows too)
ADDRESS SYSTEM
"mkdir -p /tmp/mydir"  -- Works on Unix

-- For Windows-specific paths
IF RUNTIME.PLATFORM = "win32" THEN
  "mkdir C:\\temp\\mydir"
```

## Security Considerations

### 1. Command Injection

**Never** concatenate user input directly into shell commands:

```rexx
-- DANGEROUS - DO NOT DO THIS
LET user_input = ... -- From user
ADDRESS SYSTEM
"cat " || user_input  -- VULNERABLE to injection!

-- SAFE - Validate and sanitize input
IF \VALIDATE_FILENAME(user_input) THEN DO
  SAY "Invalid filename"
  EXIT 1
END
ADDRESS SYSTEM
"cat " || SHELL_ESCAPE(user_input)
```

### 2. Use Absolute Paths

```rexx
-- RISKY
ADDRESS SYSTEM
"node server.js"  -- Which node? Could be hijacked

-- SAFE
ADDRESS SYSTEM
"/usr/bin/node /opt/myapp/server.js"
```

### 3. Limit Privileges

Run REXX scripts with minimum necessary privileges. Use sudo only when required:

```rexx
ADDRESS SYSTEM
-- Don't run entire script as root
"sudo systemctl restart nginx"  -- Only elevate when needed
```

### 4. Avoid Sensitive Data in Commands

```rexx
-- BAD - Password visible in process list
ADDRESS SYSTEM
"mysql -u root -pSECRET database"

-- BETTER - Use config file
ADDRESS SYSTEM
"mysql --defaults-file=/etc/mysql/client.cnf database"
```

## Limitations

1. **Browser Unavailability**: SYSTEM ADDRESS is not available in browser environments
2. **Synchronous Execution**: Commands execute synchronously and block the script
3. **Shell-specific**: Behavior depends on the system shell (sh, bash, zsh, cmd.exe)
4. **No Interactive Commands**: Cannot handle commands requiring user input (use expect/pexpect separately)

## Integration with Other Features

### With File Functions

```rexx
-- Read file using shell
ADDRESS SYSTEM
"cat /etc/hosts"
LET hosts_content = RESULT

-- Or use built-in file functions
LET hosts_content = FILE_READ("/etc/hosts")
```

### With HTTP Functions

```rexx
-- Download with curl
ADDRESS SYSTEM
"curl -s https://api.example.com/data.json"
LET json = RESULT

-- Or use built-in HTTP functions
LET response = HTTP_GET("https://api.example.com/data.json")
LET json = response.body
```

### With ADDRESS SQL

```rexx
-- Export data from database to file
ADDRESS SQL
"SELECT * FROM users"
LET users = RESULT

-- Process with shell commands
ADDRESS SYSTEM
"echo '" || JSON_STRINGIFY(users) || "' | jq '.[] | .name'"
SAY "User names: " || RESULT
```

## Advanced Examples

### Automated System Backup

```rexx
ADDRESS SYSTEM

-- Create backup directory with timestamp
LET backup_dir = "/backup/daily-" || DATE('YYYY-MM-DD')
"mkdir -p {backup_dir}"

-- Backup database
"mysqldump -u backup_user my_database > {backup_dir}/database.sql"
IF RC \= 0 THEN DO
  SAY "Database backup failed"
  EXIT 1
END

-- Backup files
"tar -czf {backup_dir}/files.tar.gz /var/www/html"
IF RC \= 0 THEN DO
  SAY "File backup failed"
  EXIT 1
END

-- Remove old backups (keep last 7 days)
"find /backup -name 'daily-*' -mtime +7 -exec rm -rf {} \;"

SAY "Backup completed successfully"
```

### Service Health Check

```rexx
ADDRESS SYSTEM

-- Check if service is running
"systemctl is-active nginx"
IF RC = 0 THEN
  SAY "Nginx is running"
ELSE DO
  SAY "Nginx is not running, attempting restart..."
  "sudo systemctl restart nginx"
  IF RC = 0 THEN
    SAY "Nginx restarted successfully"
  ELSE DO
    SAY "Failed to restart Nginx"
    EXIT 1
  END
END
```

### Log Analysis

```rexx
ADDRESS SYSTEM

-- Count error types in log
"grep -i 'error' /var/log/app.log | awk '{print $4}' | sort | uniq -c | sort -rn"
SAY "Error summary:"
SAY RESULT

-- Find recent errors
"tail -n 100 /var/log/app.log | grep -i 'error'"
SAY "Recent errors:"
SAY RESULT
```

## Best Practices

1. **Always check RC**: Verify command success/failure
2. **Use absolute paths**: Avoid relying on PATH environment variable
3. **Sanitize input**: Never trust user input in shell commands
4. **Capture errors**: Redirect stderr when needed (2>&1)
5. **Document shell dependencies**: Note which commands/tools are required
6. **Test cross-platform**: If supporting multiple OSes, test each
7. **Use built-in functions when available**: They're safer and more portable

## Next Steps

- [ADDRESS Facility Overview](27-address-facility.md)
- [File Functions](16-file-functions.md)
- [Error Handling](06-error-handling.md)
- [HEREDOC Documentation](08-heredoc.md)
