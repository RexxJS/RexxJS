/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

describe('Pyodide ADDRESS Library Tests', () => {
  let mockPyodide;
  let mockPyodideInstance;

  beforeEach(() => {
    mockPyodideInstance = {
      runPythonAsync: jest.fn().mockImplementation(code => {
        if (code.includes('error')) {
          return Promise.reject(new Error('Python error'));
        }
        return Promise.resolve('Success');
      }),
      loadPackage: jest.fn().mockResolvedValue(null),
      version: '0.26.1',
      globals: {
        set: jest.fn(),
      },
      loadedPackages: { numpy: '1.22.0' },
    };

    mockPyodide = {
      loadPyodide: jest.fn().mockResolvedValue(mockPyodideInstance),
      version: '0.26.1'
    };

    jest.doMock('pyodide', () => mockPyodide, { virtual: true });
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve('print("from file")'),
      })
    );
  });

  afterEach(() => {
    jest.resetModules();
    delete global.PYODIDE_ADDRESS_META;
    delete global.ADDRESS_PYODIDE_HANDLER;
    delete global.ADDRESS_PYODIDE_METHODS;
  });

  // Helper to load the module with eval
  const loadModule = () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '../src/pyodide-address.js'), 'utf8');
    eval(source);
  };

  test('should load without errors and define globals', () => {
    loadModule();
    expect(global.PYODIDE_ADDRESS_META).toBeDefined();
    expect(global.ADDRESS_PYODIDE_HANDLER).toBeDefined();
    expect(global.ADDRESS_PYODIDE_METHODS).toBeDefined();
  });

  test('should return correct metadata from PYODIDE_ADDRESS_META', () => {
    loadModule();
    const metadata = global.PYODIDE_ADDRESS_META();
    expect(metadata.type).toBe('address-handler');
    expect(metadata.provides.addressTarget).toBe('pyodide');
    expect(metadata.provides.commandSupport).toBe(true);
  });

  describe('command-string invocation', () => {
    test('should handle load_package command string', async () => {
      loadModule();
      const handler = global.ADDRESS_PYODIDE_HANDLER;
      await handler('load_package numpy, pandas');
      expect(mockPyodideInstance.loadPackage).toHaveBeenCalledWith(['numpy', 'pandas']);
    });
  });

  describe('context management', () => {
    test('should set and use context variables', async () => {
      loadModule();
      const handler = global.ADDRESS_PYODIDE_HANDLER;

      await handler('set_context', { key: 'myVar', value: 42 });
      expect(mockPyodideInstance.globals.set).not.toHaveBeenCalled(); // Context is stored in JS

      await handler('run', { code: 'myVar + 1' });
      expect(mockPyodideInstance.globals.set).toHaveBeenCalledWith('myVar', 42);
    });

    test('should get context variables', async () => {
        loadModule();
        const handler = global.ADDRESS_PYODIDE_HANDLER;
        await handler('set_context', { key: 'myVar', value: 123 });
        const result = await handler('get_context', { key: 'myVar' });
        expect(result.result).toBe(123);
    });

    test('should clear context variables', async () => {
        loadModule();
        const handler = global.ADDRESS_PYODIDE_HANDLER;
        await handler('set_context', { key: 'myVar', value: 123 });
        await handler('clear_context', {});
        const result = await handler('get_context', { key: 'myVar' });
        expect(result.result).toBeUndefined();
    });
  });

  describe('new methods', () => {
    test('run_file should fetch and execute a file', async () => {
        loadModule();
        const handler = global.ADDRESS_PYODIDE_HANDLER;
        await handler('run_file', { file: 'test.py' });
        expect(global.fetch).toHaveBeenCalledWith('test.py');
        expect(mockPyodideInstance.runPythonAsync).toHaveBeenCalledWith('print("from file")');
    });

  });

  describe('status method', () => {
    test('should return detailed status', async () => {
        loadModule();
        const handler = global.ADDRESS_PYODIDE_HANDLER;
        await handler('set_context', { key: 'myVar', value: 123 });
        const result = await handler('status', {});
        expect(result.result.pyodideVersion).toBe('0.26.1');
        expect(result.result.status).toBe('loaded');
        expect(result.result.loadedPackages).toEqual({ numpy: '1.22.0' });
        expect(result.result.contextKeys).toEqual(['myVar']);
    });
  });
});
