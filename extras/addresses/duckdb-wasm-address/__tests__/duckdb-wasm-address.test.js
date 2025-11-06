/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

describe('DuckDB-WASM ADDRESS Library Tests', () => {
    let mockDuckDB;
    let mockDbInstance;
    let mockConnection;

    beforeEach(() => {
        mockConnection = {
            query: jest.fn().mockImplementation(sql => {
                if (sql.includes('error')) {
                    return Promise.reject(new Error('SQL error'));
                }
                const mockData = [{ 'col1': 42 }];
                return Promise.resolve({
                    toArray: () => mockData.map(row => ({ toJSON: () => row }))
                });
            })
        };

        mockDbInstance = {
            connect: jest.fn().mockResolvedValue(mockConnection),
            instantiate: jest.fn().mockResolvedValue(null),
            getVersion: jest.fn().mockResolvedValue('1.28.0'),
            getFeatureFlags: jest.fn().mockResolvedValue({}),
            registerFileURL: jest.fn().mockResolvedValue(null)
        };

        mockDuckDB = {
            getJsDelivrBundles: jest.fn().mockReturnValue({}),
            selectBundle: jest.fn().mockResolvedValue({
                mainModule: 'module',
                mainWorker: 'worker'
            }),
            ConsoleLogger: jest.fn(),
            AsyncDuckDB: jest.fn().mockImplementation(() => mockDbInstance),
            DuckDBDataProtocol: { HTTP: 0 } // Fix: Add this property
        };

        jest.doMock('@duckdb/duckdb-wasm', () => mockDuckDB, { virtual: true });
        global.Worker = jest.fn();
    });

    afterEach(() => {
        jest.resetModules();
        delete global.DUCKDB_WASM_ADDRESS_META;
        delete global.ADDRESS_DUCKDB_WASM_HANDLER;
        delete global.ADDRESS_DUCKDB_WASM_METHODS;
    });

    const loadModule = () => {
        const fs = require('fs');
        const path = require('path');
        const source = fs.readFileSync(path.join(__dirname, '../src/duckdb-wasm-address.js'), 'utf8');
        eval(source);
    };

    test('should load without errors and define globals', () => {
        loadModule();
        expect(global.DUCKDB_WASM_ADDRESS_META).toBeDefined();
        expect(global.ADDRESS_DUCKDB_WASM_HANDLER).toBeDefined();
        expect(global.ADDRESS_DUCKDB_WASM_METHODS).toBeDefined();
    });

    test('should return correct metadata from DUCKDB_WASM_ADDRESS_META', () => {
        loadModule();
        const metadata = global.DUCKDB_WASM_ADDRESS_META();
        expect(metadata.type).toBe('address-handler');
        expect(metadata.provides.addressTarget).toBe('duckdb');
        expect(metadata.provides.commandSupport).toBe(true);
    });

    describe('query method', () => {
        test('should execute a query and return results', async () => {
            loadModule();
            const handler = global.ADDRESS_DUCKDB_WASM_HANDLER;
            const result = await handler('query', { sql: 'SELECT 42;' });

            expect(mockConnection.query).toHaveBeenCalledWith('SELECT 42;');
            expect(result.success).toBe(true);
            expect(result.result).toEqual([{ 'col1': 42 }]);
        });

        test('should handle SQL errors gracefully', async () => {
            loadModule();
            const handler = global.ADDRESS_DUCKDB_WASM_HANDLER;
            const result = await handler('query', { sql: 'SELECT error;' });
            expect(result.success).toBe(false);
            expect(result.error).toBe('SQL error');
        });
    });

    describe('command-string invocation', () => {
        test('should execute a simple command string', async () => {
            loadModule();
            const handler = global.ADDRESS_DUCKDB_WASM_HANDLER;
            await handler('SELECT 1;');
            expect(mockConnection.query).toHaveBeenCalledWith('SELECT 1;');
        });
    });

    describe('status method', () => {
        test('should return detailed status', async () => {
            loadModule();
            const handler = global.ADDRESS_DUCKDB_WASM_HANDLER;
            const result = await handler('status', {});
            expect(result.success).toBe(true);
            expect(result.result.version).toBe('1.28.0');
            expect(result.result.connection).toBe('connected');
        });
    });

    describe('register_file_url method', () => {
        test('should call registerFileURL with correct parameters', async () => {
            loadModule();
            const handler = global.ADDRESS_DUCKDB_WASM_HANDLER;
            await handler('register_file_url', { name: 'test.csv', url: '/test.csv' });
            expect(mockDbInstance.registerFileURL).toHaveBeenCalledWith('test.csv', '/test.csv', 0, false);
        });
    });
});
