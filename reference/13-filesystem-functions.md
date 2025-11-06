# File System Functions

Unified file system operations supporting both localStorage and HTTP resource access for data persistence and configuration management.

## File System Architecture

### Automatic Routing
Files are automatically routed based on filename patterns:
- **localStorage files**: Filenames without path separators (e.g., `"config.txt"`, `"data"`)  
- **HTTP resources**: Filenames with path separators (e.g., `"/data/users.csv"`, `"./config/settings.json"`)

### Platform Restrictions
**Browser-only**: File operations require localStorage (persistent files) or fetch API (HTTP files). These functions are not available in Node.js environments.

## Core File Operations

### FILE_WRITE - Create and Write Files
```rexx
-- Basic file writing (localStorage)
LET writeResult = FILE_WRITE filename="config.txt" content="debug=true\nversion=1.0"

IF writeResult.success THEN
    SAY "File written successfully"
    SAY "Bytes written: " || writeResult.bytes
ELSE
    SAY "Write failed: " || writeResult.error
ENDIF

-- Dynamic filename generation
LET timestamp = NOW
LET logFile = "session_" || timestamp || ".log"
LET sessionData = "Session started: " || timestamp

LET writeSession = FILE_WRITE filename=logFile content=sessionData
SAY "Created session file: " || logFile
```

### FILE_READ - Read File Contents
```rexx
-- Read localStorage files
LET readResult = FILE_READ filename="config.txt"

IF readResult.success THEN
    SAY "File contains: " || readResult.content
    SAY "File size: " || readResult.size || " bytes"
ELSE
    SAY "Read failed: " || readResult.error
ENDIF

-- Read HTTP resources (with path separators)
LET csvData = FILE_READ filename="/data/users.csv"
LET configData = FILE_READ filename="./config/settings.json" 
LET apiData = FILE_READ filename="../api/endpoints.json"

IF csvData.success THEN
    SAY "CSV loaded: " || csvData.size || " bytes"
    SAY "Content type: " || csvData.contentType
    SAY "URL: " || csvData.url
ELSE
    SAY "HTTP read failed: " || csvData.error
    SAY "Status code: " || csvData.statusCode
ENDIF
```

### FILE_EXISTS - Check File Existence
```rexx
-- Check localStorage files
LET localExists = FILE_EXISTS filename="config.txt"
SAY "Config file exists: " || localExists

-- Check HTTP resources (uses HEAD request)
LET httpExists = FILE_EXISTS filename="/api/status.json"
LET manifestExists = FILE_EXISTS filename="./manifest.json"

SAY "HTTP resource exists: " || httpExists
SAY "Manifest exists: " || manifestExists
```

### FILE_SIZE - Get File Size
```rexx
-- Get file size in bytes
LET size = FILE_SIZE filename="config.txt"
SAY "Config file size: " || size || " bytes"

-- Check multiple files
LET files = '["config.txt", "data.json", "backup.txt"]'
LET fileArray = JSON_PARSE text=files
LET fileCount = ARRAY_LENGTH array=fileArray

LET totalSize = 0
DO i = 0 TO fileCount - 1
    LET filename = ARRAY_GET array=fileArray index=i
    LET fileSize = FILE_SIZE filename=filename
    
    IF fileSize > 0 THEN
        SAY filename || ": " || fileSize || " bytes"
        LET totalSize = totalSize + fileSize
    ELSE
        SAY filename || ": file not found or empty"
    ENDIF
END

SAY "Total size: " || totalSize || " bytes"
```

## File Management Operations

### FILE_DELETE - Remove Files
```rexx
-- Delete single file
LET deleteResult = FILE_DELETE filename="oldfile.txt"

IF deleteResult.success THEN
    SAY "File deleted successfully"
ELSE
    SAY "Delete failed: " || deleteResult.error
ENDIF

-- Cleanup temporary files
LET tempFiles = '["temp1.txt", "temp2.txt", "cache.tmp"]'
LET tempArray = JSON_PARSE text=tempFiles
LET tempCount = ARRAY_LENGTH array=tempArray

SAY "Cleaning up temporary files..."
DO i = 0 TO tempCount - 1
    LET tempFile = ARRAY_GET array=tempArray index=i
    LET deleteTemp = FILE_DELETE filename=tempFile
    
    IF deleteTemp.success THEN
        SAY "Deleted: " || tempFile
    ELSE
        SAY "Could not delete: " || tempFile
    ENDIF
END
```

### FILE_COPY - Copy Files
```rexx
-- Basic file copying
LET copyResult = FILE_COPY source="config.txt" destination="config.backup"

IF copyResult.success THEN
    SAY "File copied successfully"
    SAY "Copied " || copyResult.bytes || " bytes"
ELSE
    SAY "Copy failed: " || copyResult.error
ENDIF

-- Create multiple backups
LET timestamp = NOW
LET backupName = "config_" || timestamp || ".backup"
LET timestampedBackup = FILE_COPY source="config.txt" destination=backupName

SAY "Created timestamped backup: " || backupName
```

### FILE_MOVE - Move/Rename Files
```rexx
-- Move file to different location
LET moveResult = FILE_MOVE source="temp.txt" destination="archive/temp.txt"

IF moveResult.success THEN
    SAY "File moved successfully"
ELSE
    SAY "Move failed: " || moveResult.error
ENDIF

-- Rename files
LET renameResult = FILE_MOVE source="oldname.txt" destination="newname.txt"
SAY "File renamed: " || renameResult.success
```

### FILE_APPEND - Append to Files
```rexx
-- Append to existing file
LET appendResult = FILE_APPEND filename="log.txt" content="New log entry\n"

IF appendResult.success THEN
    SAY "Content appended successfully"
    SAY "New file size: " || appendResult.newSize || " bytes"
ELSE
    SAY "Append failed: " || appendResult.error
ENDIF

-- Append to non-existent file (creates new file)
LET appendNewFile = FILE_APPEND filename="newlog.txt" content="First entry\n"
SAY "New log file created: " || appendNewFile.success
```

## File Listing and Discovery

### FILE_LIST - List Files
```rexx
-- List all files
LET allFiles = FILE_LIST
SAY "All files: " || allFiles

-- List files by pattern
LET txtFiles = FILE_LIST pattern="*.txt"
LET configFiles = FILE_LIST pattern="config*"
LET backupFiles = FILE_LIST pattern="*.backup"

SAY "Text files: " || txtFiles
SAY "Config files: " || configFiles  
SAY "Backup files: " || backupFiles

-- Process file list
IF txtFiles THEN
    LET fileArray = JSON_PARSE text=txtFiles
    LET fileCount = ARRAY_LENGTH array=fileArray
    
    SAY "Found " || fileCount || " text files:"
    DO i = 0 TO fileCount - 1
        LET filename = ARRAY_GET array=fileArray index=i
        LET fileSize = FILE_SIZE filename=filename
        SAY "  " || filename || " (" || fileSize || " bytes)"
    END
ENDIF
```

## Advanced File Operations

### FILE_BACKUP - Create Backups
```rexx
-- Simple backup with default suffix
LET backupResult = FILE_BACKUP filename="important.txt"

IF backupResult.success THEN
    SAY "Backup created: " || backupResult.backupName
ELSE
    SAY "Backup failed: " || backupResult.error
ENDIF

-- Custom backup suffix
LET customBackup = FILE_BACKUP filename="data.json" suffix=".snapshot"
SAY "Custom backup: " || customBackup.backupName

-- Versioned backups
LET version = "v1"
LET versionBackup = FILE_BACKUP filename="config.txt" suffix="." || version
SAY "Version backup: " || versionBackup.backupName
```

## HTTP Resource Access

### Reading Remote Resources
```rexx
-- Access different types of HTTP resources
LET apiData = FILE_READ filename="/api/data.json"        -- Absolute path
LET configData = FILE_READ filename="./config/app.json"  -- Relative path  
LET parentData = FILE_READ filename="../shared/data.txt" -- Parent directory
LET fullUrl = FILE_READ filename="https://example.com/data.txt"  -- Full URL

-- Process HTTP response
IF apiData.success THEN
    SAY "API data loaded successfully"
    SAY "Content-Type: " || apiData.contentType
    SAY "Last-Modified: " || apiData.lastModified
    SAY "Content length: " || apiData.size || " bytes"
    
    -- Process JSON data
    IF apiData.contentType = "application/json" THEN
        LET jsonData = JSON_PARSE text=apiData.content
        SAY "Parsed JSON successfully"
    ENDIF
ELSE
    SAY "HTTP request failed: " || apiData.error
    SAY "Status code: " || apiData.statusCode
    SAY "Status text: " || apiData.statusText
ENDIF
```

### HTTP Limitations
```rexx
-- FILE_WRITE is restricted to localStorage only (security)
LET writeError = FILE_WRITE filename="/api/upload" content="data"
-- Returns: {success: false, error: "FILE_WRITE not supported for HTTP resources"}

SAY "Attempted HTTP write: " || writeError.success
SAY "Error message: " || writeError.error

-- FILE_EXISTS works with HTTP (uses HEAD request)
LET httpExists = FILE_EXISTS filename="/api/status.json"
SAY "HTTP resource exists: " || httpExists
```

## Practical File System Examples

### Configuration Management System
```rexx
-- Complete configuration management workflow
LET configFile = "app.config"
LET originalConfig = "mode=development\ndebug=true\nport=3000"

SAY "Setting up configuration system"
LET setupResult = FILE_WRITE filename=configFile content=originalConfig

SAY "Creating backup before changes"  
LET backupResult = FILE_BACKUP filename=configFile suffix=".original"

IF backupResult.success THEN
    SAY "Backup created: " || backupResult.backupName
    
    SAY "Updating configuration for production"
    LET prodConfig = "mode=production\ndebug=false\nport=8080\nssl=true"
    LET updateResult = FILE_WRITE filename=configFile content=prodConfig
    
    -- List all configuration files
    LET allConfigs = FILE_LIST pattern="*.config*"
    SAY "Configuration files: " || allConfigs
    
    -- Verify the update
    LET verifyRead = FILE_READ filename=configFile
    IF verifyRead.success THEN
        SAY "Production config verified:"
        SAY verifyRead.content
    ENDIF
ELSE
    SAY "Backup failed - aborting configuration update"
ENDIF
```

### Log File Management
```rexx
-- Comprehensive log file management
LET logFile = "application.log"
LET logExists = FILE_EXISTS filename=logFile

-- Initialize log file if it doesn't exist
IF NOT logExists THEN
    LET initLog = FILE_WRITE filename=logFile content="=== Application Log Started ===\n"
    SAY "Initialized new log file"
ENDIF

-- Add log entries
LET timestamp = NOW
LET logEntry = "[" || timestamp || "] Application event occurred\n"
LET appendLog = FILE_APPEND filename=logFile content=logEntry

SAY "Log entry added at " || timestamp

-- Check file size and manage rotation
LET currentSize = FILE_SIZE filename=logFile
SAY "Current log size: " || currentSize || " bytes"

IF currentSize > 1000 THEN
    SAY "Log file getting large, creating archive"
    LET archiveName = "application_" || timestamp || ".log"
    LET archiveResult = FILE_COPY source=logFile destination=archiveName
    
    IF archiveResult.success THEN
        LET resetLog = FILE_WRITE filename=logFile content="=== Log Reset ===\n"
        SAY "Log archived to: " || archiveName
        SAY "Active log reset"
    ELSE
        SAY "Archive failed - continuing with current log"
    ENDIF
ENDIF
```

### Data Processing Pipeline
```rexx
-- File-based data processing workflow
LET inputFile = "data/input.csv"
LET outputFile = "results/processed.json"
LET errorFile = "errors.log"

SAY "Starting data processing pipeline"

-- Check if input file exists (HTTP or local)
LET inputExists = FILE_EXISTS filename=inputFile
IF NOT inputExists THEN
    SAY "Input file not found: " || inputFile
    EXIT
ENDIF

-- Read input data
LET inputData = FILE_READ filename=inputFile
IF NOT inputData.success THEN
    LET errorMsg = "Failed to read input: " || inputData.error || "\n"
    LET logError = FILE_APPEND filename=errorFile content=errorMsg
    SAY "Input read failed - logged error"
    EXIT
ENDIF

SAY "Processing " || inputData.size || " bytes of input data"

-- Process the data (simplified example)
LET lines = REGEX_SPLIT string=inputData.content pattern="\n"
LET lineCount = ARRAY_LENGTH array=lines
LET processedData = '{"records": [], "count": ' || lineCount || '}'

-- Write results
LET outputResult = FILE_WRITE filename=outputFile content=processedData
IF outputResult.success THEN
    SAY "Processing complete - output written to " || outputFile
    SAY "Output size: " || outputResult.bytes || " bytes"
    
    -- Create success log entry
    LET successMsg = "[" || NOW || "] Processing completed successfully - " || lineCount || " records\n"
    LET logSuccess = FILE_APPEND filename="process.log" content=successMsg
ELSE
    SAY "Failed to write output: " || outputResult.error
ENDIF
```

### Batch File Operations
```rexx
-- Process multiple files in batch
LET sourceFiles = FILE_LIST pattern="input*.txt"

IF sourceFiles THEN
    LET fileArray = JSON_PARSE text=sourceFiles
    LET fileCount = ARRAY_LENGTH array=fileArray
    
    SAY "Processing " || fileCount || " input files"
    
    DO i = 0 TO fileCount - 1
        LET sourceFile = ARRAY_GET array=fileArray index=i
        LET processedFile = REGEX_REPLACE string=sourceFile pattern="input" replacement="processed"
        
        SAY "Processing: " || sourceFile || " -> " || processedFile
        
        -- Read source
        LET sourceContent = FILE_READ filename=sourceFile
        IF sourceContent.success THEN
            -- Simple processing (uppercase conversion)
            LET processedContent = UPPER string=sourceContent.content
            
            -- Write processed version
            LET writeResult = FILE_WRITE filename=processedFile content=processedContent
            IF writeResult.success THEN
                SAY "  ✅ Processed successfully"
            ELSE
                SAY "  ❌ Write failed: " || writeResult.error
            ENDIF
        ELSE
            SAY "  ❌ Read failed: " || sourceContent.error
        ENDIF
    END
    
    SAY "Batch processing complete"
ELSE
    SAY "No input files found"
ENDIF
```

### File System Monitoring and Cleanup
```rexx
-- Monitor and maintain file system
SAY "Starting file system maintenance"

-- Get all files
LET allFiles = FILE_LIST

IF allFiles THEN
    LET fileArray = JSON_PARSE text=allFiles
    LET fileCount = ARRAY_LENGTH array=fileArray
    
    LET totalSize = 0
    LET tempCount = 0
    LET backupCount = 0
    
    SAY "Analyzing " || fileCount || " files..."
    
    DO i = 0 TO fileCount - 1
        LET filename = ARRAY_GET array=fileArray index=i
        LET fileSize = FILE_SIZE filename=filename
        LET totalSize = totalSize + fileSize
        
        -- Count file types
        IF INCLUDES string=filename substring=".tmp" THEN
            LET tempCount = tempCount + 1
        ENDIF
        
        IF INCLUDES string=filename substring=".backup" THEN
            LET backupCount = backupCount + 1
        ENDIF
        
        -- Large file warning
        IF fileSize > 10000 THEN
            SAY "  ⚠️  Large file: " || filename || " (" || fileSize || " bytes)"
        ENDIF
    END
    
    SAY ""
    SAY "File system summary:"
    SAY "  Total files: " || fileCount
    SAY "  Total size: " || totalSize || " bytes"
    SAY "  Temporary files: " || tempCount
    SAY "  Backup files: " || backupCount
    
    -- Cleanup recommendations
    IF tempCount > 5 THEN
        SAY "  💡 Consider cleaning up temporary files"
    ENDIF
    
    IF backupCount > 10 THEN
        SAY "  💡 Consider archiving old backups"
    ENDIF
ELSE
    SAY "No files found or file listing failed"
ENDIF
```

## Error Handling and Validation

### Robust File Operations
```rexx
-- Comprehensive error handling
LET testFile = "validation.txt"
LET testContent = "Test data for validation"

-- Write with validation
LET writeTest = FILE_WRITE filename=testFile content=testContent
IF writeTest.success THEN
    SAY "Write successful: " || writeTest.bytes || " bytes written"
    
    -- Read back for validation
    LET readTest = FILE_READ filename=testFile
    IF readTest.success AND readTest.content = testContent THEN
        SAY "✅ Validation passed: file integrity confirmed"
        
        -- Clean up test file
        LET cleanupTest = FILE_DELETE filename=testFile
        IF cleanupTest.success THEN
            SAY "Test file cleaned up"
        ENDIF
    ELSE
        SAY "❌ Validation failed: content mismatch"
        SAY "Expected: " || testContent
        SAY "Got: " || readTest.content
    ENDIF
ELSE
    SAY "❌ Write failed: " || writeTest.error
ENDIF
```

## Function Reference

### Core File Operations
- `FILE_WRITE(filename, content)` - Write content to file
- `FILE_READ(filename)` - Read file contents
- `FILE_APPEND(filename, content)` - Append content to file
- `FILE_EXISTS(filename)` - Check if file exists
- `FILE_SIZE(filename)` - Get file size in bytes

### File Management
- `FILE_DELETE(filename)` - Delete file
- `FILE_COPY(source, destination)` - Copy file
- `FILE_MOVE(source, destination)` - Move/rename file
- `FILE_BACKUP(filename, suffix?)` - Create backup copy

### File Discovery
- `FILE_LIST(pattern?)` - List files, optionally by pattern

### Return Object Properties

#### Success Response
```javascript
{
  success: true,
  content: "file content",      // FILE_READ only
  size: 1234,                   // File size in bytes
  bytes: 1234,                  // Bytes written (FILE_WRITE/FILE_APPEND)
  newSize: 2468,               // New file size (FILE_APPEND)
  backupName: "file.backup"     // Generated backup name (FILE_BACKUP)
}
```

#### HTTP Response (FILE_READ)
```javascript
{
  success: true,
  content: "response content",
  contentType: "application/json",
  size: 1234,
  url: "https://example.com/api/data",
  lastModified: "Wed, 21 Oct 2015 07:28:00 GMT",
  statusCode: 200,
  statusText: "OK"
}
```

#### Error Response
```javascript
{
  success: false,
  error: "Error description",
  statusCode: 404,              // HTTP requests only
  statusText: "Not Found"       // HTTP requests only
}
```

### Routing Rules
- **localStorage**: Filenames without `/`, `./`, `../`, `http://`, `https://`
- **HTTP GET**: Filenames starting with `/`, `./`, `../`, or full URLs
- **FILE_WRITE constraint**: Only localStorage files can be written (HTTP resources are read-only)
- **FILE_EXISTS**: Supports both localStorage and HTTP (uses HEAD request for HTTP)

**See also:**
- [JSON Functions](08-json-functions.md) for processing file data
- [String Functions](04-string-functions.md) for file content manipulation
- [Web Functions](09-web-functions.md) for HTTP resource handling
- [Validation Functions](11-validation-functions.md) for file content validation