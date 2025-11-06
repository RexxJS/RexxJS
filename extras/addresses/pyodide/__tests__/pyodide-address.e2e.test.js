/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const fs = require('fs');
const path = require('path');
const { Interpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');

// Load the pyodide address handler
const source = fs.readFileSync(path.join(__dirname, '../src/pyodide-address.js'), 'utf8');
eval(source);

describe.skip('Pyodide ADDRESS Library E2E Tests', () => {
    jest.setTimeout(60000); // 60s timeout for Pyodide loading

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

    test('should execute a Rexx script (line by line) that uses ADDRESS PYODIDE to calculate 2**8', async () => {
        const script = `
            ADDRESS PYODIDE
            "load_package numpy"
            "two = 2"
            "eight = 8"
            LET my_result = run code="two**eight"
        `;
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('my_result');
        expect(result.result).toBe(256);
    });

    test('should execute a Rexx script that uses ADDRESS PYODIDE to calculate 2**8', async () => {
        // Add debug logging
        const originalSend = interpreter.addressSender.send;
        interpreter.addressSender.send = async (namespace, method, params) => {
            console.log(`ADDRESS call: ${namespace}.${method}`, params);
            const result = await originalSend(namespace, method, params);
            console.log(`ADDRESS result:`, result);
            return result;
        };

        const script = `
            ADDRESS PYODIDE
            <<PYSCRIPT 
            load_package numpy
            three = 3
            two = 2
            PYSCRIPT
            LET my_result = run code="three**two"
        `;
        console.log('Parsed commands:', JSON.stringify(parse(script), null, 2));
        const commands = parse(script);
        await interpreter.run(commands);

        const result = interpreter.getVariable('my_result');
        console.log('Final result:', result);
        expect(result.result).toBe(9);
    });
});
