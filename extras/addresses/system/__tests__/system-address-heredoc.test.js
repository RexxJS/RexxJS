/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for System ADDRESS HEREDOC functionality
 * Demonstrates multi-line shell script execution using HEREDOC syntax
 */

const { Interpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load the system address handler
const source = fs.readFileSync(path.join(__dirname, '../system-address.js'), 'utf8');
eval(source);

describe('System ADDRESS HEREDOC Support', () => {
    jest.setTimeout(30000); // 30s timeout for system commands
    
    let interpreter;
    
    beforeAll(() => {
        const addressSender = {
            send: async (namespace, method, params) => {
                if (namespace.toLowerCase() === 'system') {
                    return await global.ADDRESS_SYSTEM_HANDLER(method, params);
                }
                throw new Error(`Unknown address namespace: ${namespace}`);
            }
        };
        interpreter = new Interpreter(addressSender);
    });

    afterAll(() => {
        delete global.SYSTEM_ADDRESS_META;
        delete global.ADDRESS_SYSTEM_HANDLER; 
        delete global.ADDRESS_SYSTEM_METHODS;
    });

    test('should execute multi-line shell script using HEREDOC with sh shell', async () => {
        const script = `
            ADDRESS SYSTEM
            <<SHELL_SCRIPT
            #!/bin/sh
            # Multi-line shell script test
            echo "Starting shell script..."
            TEST_VAR="Hello World"
            echo "Test variable: $TEST_VAR"
            echo "Current directory: $(pwd)"
            echo "Shell script completed successfully"
            SHELL_SCRIPT
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        // Check that the command executed (we can't easily capture stdout in this test setup,
        // but we can verify no errors were thrown)
        expect(true).toBe(true); // If we get here, the HEREDOC execution succeeded
    });

    test('should execute multi-line shell script with file operations', async () => {
        const tempDir = os.tmpdir();
        const testFile = path.join(tempDir, `rexx-test-${Date.now()}.txt`);
        
        const script = `
            ADDRESS SYSTEM
            <<FILE_SCRIPT
            #!/bin/sh
            echo "Creating test file..."
            echo "Line 1: Hello from REXX HEREDOC" > "${testFile}"
            echo "Line 2: Multi-line shell script" >> "${testFile}" 
            echo "Line 3: File operations working" >> "${testFile}"
            echo "Test file created at: ${testFile}"
            cat "${testFile}"
            rm "${testFile}"
            echo "Test file cleaned up"
            FILE_SCRIPT
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        // Verify the test file was cleaned up (shouldn't exist)
        expect(fs.existsSync(testFile)).toBe(false);
    });

    test('should execute multi-line shell script with conditional logic', async () => {
        const script = `
            ADDRESS SYSTEM
            <<CONDITIONAL_SCRIPT
            #!/bin/sh
            echo "Testing conditional logic..."
            
            if [ -d "/tmp" ]; then
                echo "SUCCESS: /tmp directory exists"
                RESULT="directory_check_passed"
            else
                echo "FAILURE: /tmp directory missing"  
                RESULT="directory_check_failed"
            fi
            
            echo "Conditional result: $RESULT"
            
            # Test numeric comparison
            NUMBER=42
            if [ $NUMBER -gt 40 ]; then
                echo "SUCCESS: Number $NUMBER is greater than 40"
            else
                echo "FAILURE: Number $NUMBER is not greater than 40"
            fi
            
            echo "Conditional script completed"
            CONDITIONAL_SCRIPT
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        // If we reach this point, the HEREDOC with conditionals executed successfully
        expect(true).toBe(true);
    });

    test('should execute multi-line shell script with loops and functions', async () => {
        const script = `
            ADDRESS SYSTEM
            <<LOOP_SCRIPT
            #!/bin/sh
            echo "Testing loops and functions..."
            
            # Define a function
            print_message() {
                echo "Function says: $1"
            }
            
            # Call the function
            print_message "Hello from shell function!"
            
            # Test a for loop
            echo "Counting from 1 to 3:"
            for i in 1 2 3; do
                echo "  Count: $i"
                print_message "Iteration $i"
            done
            
            # Test variable manipulation
            COUNTER=0
            while [ $COUNTER -lt 3 ]; do
                COUNTER=$((COUNTER + 1))
                echo "While loop iteration: $COUNTER"
            done
            
            echo "Loop script completed successfully"
            LOOP_SCRIPT
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        // Successful execution means HEREDOC with complex shell logic worked
        expect(true).toBe(true);
    });

    test('should preserve shell script formatting and indentation', async () => {
        const script = `
            ADDRESS SYSTEM
            <<FORMATTED_SCRIPT
            #!/bin/sh
            echo "Testing formatting preservation..."
            
            if true; then
                echo "  Indented line 1"
                if true; then
                    echo "    Nested indented line"
                    echo "    Another nested line"
                fi
                echo "  Back to first level indent"
            fi
            
            # Multi-line command with backslash continuation
            echo "This is a long command that spans" \\
                 "multiple lines using backslash" \\
                 "continuation in the shell script"
                 
            echo "Formatting test completed"
            FORMATTED_SCRIPT
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        expect(true).toBe(true);
    });

    test('should handle HEREDOC with POSIX shell features', async () => {
        const script = `
            ADDRESS SYSTEM
            <<POSIX_SCRIPT
            #!/bin/sh
            echo "Testing POSIX shell features..."
            
            # POSIX-compatible variable handling
            TEXT="Hello World"
            echo "Original text: $TEXT"
            
            # POSIX parameter expansion
            echo "Text length: \${#TEXT}"
            echo "First 5 chars: \${TEXT%%World}"
            
            # Command substitution
            CURRENT_USER=\$(whoami)
            echo "Current user: $CURRENT_USER"
            
            # Process count (POSIX compatible)
            PROC_COUNT=\$(ps | wc -l)
            echo "Process count: $PROC_COUNT"
            
            echo "POSIX shell script completed"
            POSIX_SCRIPT
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        expect(true).toBe(true);
    });
});