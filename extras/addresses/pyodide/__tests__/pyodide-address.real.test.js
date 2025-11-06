/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '../src/pyodide-address.js'), 'utf8');
eval(source);

describe.skip('Pyodide ADDRESS Library Integration Tests', () => {
    jest.setTimeout(60000);

    let handler;

    beforeAll(() => {
        handler = global.ADDRESS_PYODIDE_HANDLER;
    });

    afterAll(() => {
        delete global.PYODIDE_ADDRESS_META;
        delete global.ADDRESS_PYODIDE_HANDLER;
        delete global.ADDRESS_PYODIDE_METHODS;
    });

    test('should execute a simple python script', async () => {
        const result = await handler('run', { code: '1 + 1' });
        expect(result.success).toBe(true);
        expect(result.result).toBe(2);
    });

    test('should handle context variables', async () => {
        await handler('set_context', { key: 'my_rexx_var', value: 10 });
        const result = await handler('run', { code: 'my_rexx_var * 2' });
        expect(result.success).toBe(true);
        expect(result.result).toBe(20);
        await handler('clear_context', {});
    });

    test('should load numpy and perform a calculation', async () => {
        let result = await handler('load_package numpy');
        expect(result.success).toBe(true);

        result = await handler('status', {});
        expect(result.result.loadedPackages).toHaveProperty('numpy');

        result = await handler('run', { code: "import numpy as np; np.sqrt(16)" });
        expect(result.success).toBe(true);
        expect(result.result).toBe(4);
    });
});
