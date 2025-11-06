/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Simple tests for System ADDRESS with bash shell selection
 * Debug version to isolate issues
 */

const { Interpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');
const fs = require('fs');
const path = require('path');

// Load the system address handler
const source = fs.readFileSync(path.join(__dirname, '../system-address.js'), 'utf8');
eval(source);

describe('System ADDRESS bash shell (debug)', () => {
    jest.setTimeout(15000);
    
    let interpreter;
    
    beforeAll(() => {
        const addressSender = {
            send: async (namespace, method, params) => {
                console.log('ADDRESS call:', namespace, method, params);
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

    test('should execute simple bash command with shell parameter', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute command="echo 'Hello from bash'" shell="bash"
            SAY "Result: " || result.stdout
            SAY "Success: " || result.success
            SAY "Shell: " || result.shell
            SAY "Exit Code: " || result.exitCode
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        expect(result).toBeDefined();
        expect(result.shell).toBe('bash');
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('Hello from bash');
    });

    test('should test bash array functionality', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute command="fruits=('apple' 'banana' 'cherry'); echo \${fruits[1]}" shell="bash"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        
        console.log('Bash array result:', result);
        expect(result).toBeDefined();
        expect(result.shell).toBe('bash');
        
        if (result.success) {
            expect(result.stdout).toBe('banana');
        }
    });

    test('should check if bash is available', async () => {
        const script = `
            ADDRESS SYSTEM
            LET result = execute command="which bash" shell="bash"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        console.log('Bash availability:', result);
    });
});