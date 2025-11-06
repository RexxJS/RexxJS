/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const fs = require('fs');
const path = require('path');
const { Interpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');

// Load the pyodide address handler
const source = fs.readFileSync(path.join(__dirname, '../src/pyodide-address.js'), 'utf8');
eval(source);

describe.skip('Pyodide Session Management E2E Tests', () => {
    jest.setTimeout(90000); // 90s timeout for Pyodide loading and session operations

    let interpreter;

    beforeAll(() => {
        const addressSender = {
            send: async (namespace, method, params) => {
                if (namespace.toLowerCase() === 'pyodide') {
                    return await global.ADDRESS_PYODIDE_HANDLER(method, params);
                }
                throw new Error(`Unknown address namespace: ${namespace}`);
            }
        };
        interpreter = new Interpreter(addressSender);
    });

    afterAll(() => {
        delete global.PYODIDE_ADDRESS_META;
        delete global.ADDRESS_PYODIDE_HANDLER;
        delete global.ADDRESS_PYODIDE_METHODS;
    });

    test('should isolate variables between sessions', async () => {
        const script = `
            // First session
            ADDRESS PYODIDE
            "first_var = 'first session'"
            "shared_name = 100"
            LET first_result = run code="first_var + ' - ' + str(shared_name)"
            
            // Check variables exist
            LET vars_before_close = session_info()
            
            // Close session and start new one
            close_session()
            new_session()
            
            // Second session - previous variables should be gone
            "second_var = 'second session'"
            "shared_name = 200"
            
            // Try to access first_var (should fail)
            LET error_result = run code="first_var if 'first_var' in globals() else 'VARIABLE_NOT_FOUND'"
            
            // This should work with new values
            LET second_result = run code="second_var + ' - ' + str(shared_name)"
            
            // Check variables in new session
            LET vars_after_new = session_info()
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        // Check results
        const firstResult = interpreter.getVariable('first_result');
        expect(firstResult.result).toBe('first session - 100');

        const varsBeforeClose = interpreter.getVariable('vars_before_close');
        expect(varsBeforeClose.result.pythonVariables).toContain('first_var');
        expect(varsBeforeClose.result.pythonVariables).toContain('shared_name');

        const errorResult = interpreter.getVariable('error_result');
        expect(errorResult.result).toBe('VARIABLE_NOT_FOUND');

        const secondResult = interpreter.getVariable('second_result');
        expect(secondResult.result).toBe('second session - 200');

        const varsAfterNew = interpreter.getVariable('vars_after_new');
        expect(varsAfterNew.result.pythonVariables).toContain('second_var');
        expect(varsAfterNew.result.pythonVariables).toContain('shared_name');
        expect(varsAfterNew.result.pythonVariables).not.toContain('first_var');
    });

    test('should maintain session state until explicitly closed', async () => {
        const script = `
            ADDRESS PYODIDE
            "persistent_var = 'I persist'"
            "counter = 0"
            
            // Modify variables multiple times
            "counter += 1"
            "temp_result = persistent_var + ' - count: ' + str(counter)"
            LET result1 = run code="temp_result"
            
            "counter += 5"
            "temp_result = persistent_var + ' - count: ' + str(counter)"  
            LET result2 = run code="temp_result"
            
            // Variables should still be there
            LET session_vars = list_variables()
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        const result1 = interpreter.getVariable('result1');
        expect(result1.result).toBe('I persist - count: 1');

        const result2 = interpreter.getVariable('result2');
        expect(result2.result).toBe('I persist - count: 6');

        const sessionVars = interpreter.getVariable('session_vars');
        expect(sessionVars.result.pythonVariables).toContain('persistent_var');
        expect(sessionVars.result.pythonVariables).toContain('counter');
        expect(sessionVars.result.pythonVariables).toContain('temp_result');
    });

    test('should handle multiple session resets in same script', async () => {
        const script = `
            ADDRESS PYODIDE
            
            // Session 1
            "session_id = 1"
            "data = 'session one'"
            LET session1_vars = session_info()
            
            // Reset to Session 2  
            reset_session()
            "session_id = 2"
            "data = 'session two'"
            LET session2_vars = session_info()
            
            // Reset to Session 3
            new_session()
            "session_id = 3"
            "data = 'session three'"
            LET session3_result = run code="f'Session {session_id}: {data}'"
            LET final_vars = list_variables()
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        // Each session should have only its own variables
        const session1Vars = interpreter.getVariable('session1_vars');
        expect(session1Vars.result.pythonVariables).toContain('session_id');
        expect(session1Vars.result.pythonVariables).toContain('data');

        const session2Vars = interpreter.getVariable('session2_vars');
        expect(session2Vars.result.pythonVariables).toContain('session_id');
        expect(session2Vars.result.pythonVariables).toContain('data');

        // Session 3 result should show the correct values
        const session3Result = interpreter.getVariable('session3_result');
        expect(session3Result.result).toBe('Session 3: session three');

        const finalVars = interpreter.getVariable('final_vars');
        expect(finalVars.result.pythonVariables).toContain('session_id');
        expect(finalVars.result.pythonVariables).toContain('data');
    });
});