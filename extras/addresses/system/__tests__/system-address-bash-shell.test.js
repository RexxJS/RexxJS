/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for System ADDRESS with bash shell selection
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

describe('System ADDRESS with bash shell selection', () => {
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

    test('should use bash shell for array operations and validate RC/RESULT', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute command="declare -a fruits=('apple' 'banana' 'cherry'); echo \${fruits[1]}" shell="bash"
            SAY "RC: " || RC
            SAY "Result: " || result.stdout
            SAY "Success: " || result.success
            SAY "Shell: " || result.shell
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        // Get the result and validate
        const result = interpreter.getVariable('result');
        const rc = interpreter.getVariable('RC');
        
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toBe('banana'); // bash arrays are 0-indexed, so fruits[1] = banana
        expect(rc).toBe(0); // RC should be 0 for successful execution
    });

    test('should use bash for parameter expansion and process substitution', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute command="TEXT='Hello World'; echo Length: \${#TEXT} Uppercase: \${TEXT^^}" shell="bash"
            SAY "Bash parameter expansion result: " || result.stdout
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toContain('Length: 11'); // "Hello World" has 11 characters
        expect(result.stdout).toContain('Uppercase: HELLO WORLD'); // bash ${TEXT^^} converts to uppercase
    });

    test('should handle bash associative arrays', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute command="declare -A colors=([red]='#FF0000' [green]='#00FF00' [blue]='#0000FF'); echo \${colors[red]}" shell="bash"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toBe('#FF0000');
    });

    test('should use bash for arithmetic expansion and validate failure case', async () => {
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
        
        // Test division by zero (should fail)
        expect(failureResult.success).toBe(false);
        expect(failureResult.exitCode).not.toBe(0);
        expect(failureResult.shell).toBe('bash');
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
            LET result = execute shell="bash" command=<<BASH_MULTI_LINE
#!/bin/bash
# Test bash-specific features in multi-line script
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

        const result = interpreter.getVariable('result');
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toContain('Sum: 150');
        expect(result.stdout).toContain('Average: 30');
    });

    test('should handle different shell types and fallback', async () => {
        const script = `
            ADDRESS SYSTEM
            LET bash_result = execute command="echo 'Using bash'" shell="bash"
            LET zsh_result = execute command="echo 'Using zsh'" shell="zsh" 
            LET invalid_result = execute command="echo 'Fallback to default'" shell="invalid_shell"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const bashResult = interpreter.getVariable('bash_result');
        const zshResult = interpreter.getVariable('zsh_result');
        const invalidResult = interpreter.getVariable('invalid_result');
        
        expect(bashResult.shell).toBe('bash');
        expect(bashResult.stdout).toBe('Using bash');
        
        // zsh may or may not be installed, but should show the shell used
        expect(zshResult.shell).toBeDefined();
        
        // Invalid shell should fallback to default /bin/sh
        expect(invalidResult.shell).toBe('/bin/sh');
        expect(invalidResult.stdout).toBe('Fallback to default');
    });

    test('should validate bash conditional expressions', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute shell="bash" command="[[ 'hello' =~ ^h.*o$ ]] && echo 'Pattern matches' || echo 'No match'"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toBe('Pattern matches'); // bash regex matching
    });

    test('should handle bash functions and local variables', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute shell="bash" command=<<BASH_FUNCTION
multiply() {
    local a=\$1
    local b=\$2
    echo \$((a * b))
}
multiply 6 7
BASH_FUNCTION
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.shell).toBe('bash');
        expect(result.stdout).toBe('42');
    });

    test('should demonstrate RC and RESULT validation with complex bash operations', async () => {
        const script = `
            ADDRESS SYSTEM
            LET complex_result = execute shell="bash" command=<<COMPLEX_BASH
#!/bin/bash
set -e  # Exit on any error
declare -A config=([host]="localhost" [port]="8080" [ssl]="true")
if [[ \${config[ssl]} == "true" ]]; then
    protocol="https"
else  
    protocol="http"
fi
url="\${protocol}://\${config[host]}:\${config[port]}/api"
echo "Generated URL: \$url"
# Test array length
echo "Config items: \${#config[@]}"
# Exit with success
exit 0
COMPLEX_BASH
            SAY "Complex operation RC: " || RC
            SAY "Operation successful: " || complex_result.success  
            SAY "Exit code: " || complex_result.exitCode
            SAY "Shell used: " || complex_result.shell
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const complexResult = interpreter.getVariable('complex_result');
        const rc = interpreter.getVariable('RC');
        
        expect(complexResult).toBeDefined();
        expect(complexResult.success).toBe(true);
        expect(complexResult.exitCode).toBe(0);
        expect(complexResult.shell).toBe('bash');
        expect(complexResult.stdout).toContain('Generated URL: https://localhost:8080/api');
        expect(complexResult.stdout).toContain('Config items: 3');
        expect(rc).toBe(0);
    });
});