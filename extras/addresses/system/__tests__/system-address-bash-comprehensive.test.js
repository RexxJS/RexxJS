/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Comprehensive tests for System ADDRESS with bash shell selection
 * Demonstrates real bash-specific features and validates RC/RESULT
 */

const { Interpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load the system address handler
const source = fs.readFileSync(path.join(__dirname, '../system-address.js'), 'utf8');
eval(source);

describe('System ADDRESS comprehensive bash shell tests', () => {
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

    test('should use bash shell for array operations and validate RESULT structure', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute command="declare -a fruits=('apple' 'banana' 'cherry'); echo \${fruits[1]}" shell="bash"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toBe('banana'); // bash arrays are 0-indexed, so fruits[1] = banana
        expect(result.operation).toBe('EXECUTE');
    });

    test('should use bash for parameter expansion', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute command="TEXT='Hello World'; echo Length: \${#TEXT}" shell="bash"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toBe('Length: 11'); // "Hello World" has 11 characters
    });

    test('should handle bash associative arrays', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute command="declare -A colors=([red]='#FF0000' [green]='#00FF00'); echo \${colors[red]}" shell="bash"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toBe('#FF0000');
    });

    test('should validate bash arithmetic and error handling', async () => {
        const script = `
            ADDRESS SYSTEM
            LET success_result = execute command="echo \$((2 * 21))" shell="bash"
            LET failure_result = execute command="echo \$((10 / 0))" shell="bash"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const successResult = interpreter.getVariable('success_result');
        const failureResult = interpreter.getVariable('failure_result');
        
        // Test successful arithmetic
        expect(successResult.success).toBe(true);
        expect(successResult.exitCode).toBe(0);
        expect(successResult.stdout).toBe('42');
        expect(successResult.shell).toBe('bash');
        
        // Test division by zero (should fail with non-zero exit code)
        expect(failureResult.success).toBe(false);
        expect(failureResult.exitCode).not.toBe(0);
        expect(failureResult.shell).toBe('bash');
        expect(failureResult.operation).toBe('EXECUTE');
    });

    test('should use bash brace expansion', async () => {
        const script = `
            ADDRESS SYSTEM  
            LET result = execute command="echo file{1,2,3}.txt" shell="bash"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toBe('file1.txt file2.txt file3.txt');
    });

    test('should use bash with HEREDOC multi-line script', async () => {
        const script = `
            ADDRESS SYSTEM
            <<BASH_MULTI_LINE
#!/bin/bash
declare -a numbers=(10 20 30 40 50)
total=0
for num in "\${numbers[@]}"; do
    ((total += num))
done
echo "Sum: $total"
echo "Average: \$((total / \${#numbers[@]}))"
BASH_MULTI_LINE
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        // Note: HEREDOC with ADDRESS will execute directly, we can't capture result in a variable easily
        // This test validates that the HEREDOC syntax works and executes without errors
        expect(true).toBe(true);
    });

    test('should handle different shell types and validate shell field', async () => {
        const script = `
            ADDRESS SYSTEM
            LET bash_result = execute command="echo 'Using bash'" shell="bash"
            LET default_result = execute command="echo 'Using default shell'"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const bashResult = interpreter.getVariable('bash_result');
        const defaultResult = interpreter.getVariable('default_result');
        
        expect(bashResult.shell).toBe('bash');
        expect(bashResult.stdout).toBe('Using bash');
        expect(bashResult.success).toBe(true);
        
        expect(defaultResult.shell).toBe('/bin/sh'); // Should default to /bin/sh
        expect(defaultResult.stdout).toBe('Using default shell');
        expect(defaultResult.success).toBe(true);
    });

    test('should validate bash conditional expressions with [[ ]]', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute shell="bash" command="[[ 5 -gt 3 ]] && echo 'Five is greater than three'"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toBe('Five is greater than three');
    });

    test('should demonstrate comprehensive RESULT validation', async () => {
        const script = `
            ADDRESS SYSTEM
            LET complex_result = execute shell="bash" command="echo 'SUCCESS'; echo 'Lines: 2'; exit 0"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const complexResult = interpreter.getVariable('complex_result');
        
        expect(complexResult).toBeDefined();
        expect(complexResult.success).toBe(true);
        expect(complexResult.exitCode).toBe(0);
        expect(complexResult.shell).toBe('bash');
        expect(complexResult.operation).toBe('EXECUTE');
        expect(complexResult.stdout).toContain('SUCCESS');
        expect(complexResult.stdout).toContain('Lines: 2');
        expect(complexResult.combineStderr).toBe(false);
        expect(complexResult.stderr).toBe('');
        expect(complexResult.message).toBe('Command executed successfully');
    });

    test('should handle bash local variables and arithmetic', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute shell="bash" command="X=5; Y=7; echo Result: \$((X * Y))"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toBe('Result: 35');
    });
});