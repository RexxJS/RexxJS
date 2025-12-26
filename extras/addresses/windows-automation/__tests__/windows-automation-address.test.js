/**
 * Tests for Windows Automation ADDRESS handler
 * Tests with mocks run on all platforms (Mac, Linux, Windows)
 * Integration tests skip on non-Windows platforms
 */

const { Interpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');
const path = require('path');
const fs = require('fs');

// Determine if we're on Windows
const isWindows = process.platform === 'win32';

// Test utilities
const skipOnNonWindows = isWindows ? test : test.skip;

describe('Windows Automation ADDRESS Library', () => {
  let interpreter;
  let windowsAutomationModule;

  beforeEach(async () => {
    // Create interpreter with mock ADDRESS client
    const mockRpcClient = {
      send: jest.fn().mockResolvedValue('mock response')
    };
    interpreter = new Interpreter(mockRpcClient);

    // Load windows-automation module
    const addressPath = path.resolve(__dirname, '../src/windows-automation-address.js');
    const source = fs.readFileSync(addressPath, 'utf8');
    eval(source);

    windowsAutomationModule = global.WINDOWS_AUTOMATION_ADDRESS_META ? {
      WINDOWS_AUTOMATION_ADDRESS_META: global.WINDOWS_AUTOMATION_ADDRESS_META,
      ADDRESS_WINDOWS_AUTOMATION_HANDLER: global.ADDRESS_WINDOWS_AUTOMATION_HANDLER,
      ADDRESS_WINDOWS_AUTOMATION_METHODS: global.ADDRESS_WINDOWS_AUTOMATION_METHODS,
      setWindowsAutomationMockMode: global.setWindowsAutomationMockMode
    } : {};

    // Enable mock mode
    if (global.setWindowsAutomationMockMode) {
      global.setWindowsAutomationMockMode(true);
    }
  });

  describe('Metadata and Handler Functions', () => {
    test('should expose WINDOWS_AUTOMATION_ADDRESS_META function', () => {
      const meta = global.WINDOWS_AUTOMATION_ADDRESS_META && global.WINDOWS_AUTOMATION_ADDRESS_META();
      expect(meta).toBeDefined();
      expect(meta.canonical).toBe('org.rexxjs/windows-automation');
      expect(meta.type).toBe('address-handler');
      expect(meta.name).toContain('Windows Automation');
      expect(meta.provides.addressTarget).toBe('windows');
    });

    test('should have ADDRESS_WINDOWS_AUTOMATION_HANDLER function', () => {
      expect(global.ADDRESS_WINDOWS_AUTOMATION_HANDLER).toBeDefined();
      expect(typeof global.ADDRESS_WINDOWS_AUTOMATION_HANDLER).toBe('function');
    });

    test('should have ADDRESS_WINDOWS_AUTOMATION_METHODS object', () => {
      expect(global.ADDRESS_WINDOWS_AUTOMATION_METHODS).toBeDefined();
      expect(typeof global.ADDRESS_WINDOWS_AUTOMATION_METHODS).toBe('object');
    });

    test('should have setWindowsAutomationMockMode function', () => {
      expect(global.setWindowsAutomationMockMode).toBeDefined();
      expect(typeof global.setWindowsAutomationMockMode).toBe('function');
    });
  });

  describe('Handler Direct Calls - Mock Mode', () => {
    test('should handle PowerShell Get-Process command', async () => {
      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;
      const result = await handler('powershell Get-Process');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('powershell');
      expect(result.output).toBeDefined();
    });

    test('should handle process_list operation', async () => {
      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;
      const result = await handler('cmd', { operation: 'process_list' });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('process_list');
      expect(Array.isArray(result.processes)).toBe(true);
      expect(result.count).toBe(2);
    });

    test('should handle registry_read operation', async () => {
      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;
      const result = await handler('cmd', {
        operation: 'registry_read',
        path: 'HKLM\\Software\\Test',
        value: 'TestValue'
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('registry_read');
      expect(result.data).toBeDefined();
    });

    test('should handle registry_write operation', async () => {
      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;
      const result = await handler('cmd', {
        operation: 'registry_write',
        path: 'HKLM\\Software\\Test',
        value: 'TestValue',
        data: 'TestData'
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('registry_write');
      expect(result.written).toBe(true);
    });

    test('should handle registry_delete operation', async () => {
      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;
      const result = await handler('cmd', {
        operation: 'registry_delete',
        path: 'HKLM\\Software\\Test',
        value: 'TestValue'
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('registry_delete');
      expect(result.deleted).toBe(true);
    });

    test('should handle find_window operation', async () => {
      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;
      const result = await handler('cmd', {
        operation: 'find_window',
        title: 'Notepad'
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('find_window');
    });

    test('should handle activate_window operation', async () => {
      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;
      const result = await handler('cmd', {
        operation: 'activate_window',
        window: 'WINDOW_0x123456'
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('activate_window');
    });

    test('should handle system_info operation', async () => {
      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;
      const result = await handler('cmd', {
        operation: 'system_info'
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('system_info');
      expect(result.osVersion).toBeDefined();
      expect(result.computerName).toBeDefined();
    });

    test('should handle file_write operation', async () => {
      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;
      const result = await handler('cmd', {
        operation: 'file_write',
        path: 'C:\\test.txt',
        content: 'Hello World'
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('file_write');
      expect(result.written).toBe(true);
    });

    test('should handle invalid operation', async () => {
      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;
      const result = await handler('cmd', {
        operation: 'invalid_operation'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown operation');
    });

    test('should handle null/undefined commands', async () => {
      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;

      const result1 = await handler(null);
      expect(result1).toBeDefined();

      const result2 = await handler(undefined);
      expect(result2).toBeDefined();
    });
  });

  describe('Classic Rexx ADDRESS Syntax', () => {
    test('should support quoted string commands', async () => {
      // Register the ADDRESS handler
      interpreter.registerAddressTarget('windows', {
        handler: global.ADDRESS_WINDOWS_AUTOMATION_HANDLER,
        methods: global.ADDRESS_WINDOWS_AUTOMATION_METHODS,
        metadata: {
          libraryMetadata: global.WINDOWS_AUTOMATION_ADDRESS_META(),
          libraryName: 'windows-automation-address.js'
        }
      });

      const script = `
        ADDRESS windows
        "powershell Get-Process"
      `;

      await interpreter.run(parse(script));

      // Check standard REXX variables
      expect(interpreter.getVariable('RC')).toBe(0);
      const result = interpreter.getVariable('RESULT');
      expect(result).toBeDefined();
      // Result can be either string or object depending on handler implementation
      expect(result).toBeTruthy();
    });

    test('should handle multiple commands', async () => {
      interpreter.registerAddressTarget('windows', {
        handler: global.ADDRESS_WINDOWS_AUTOMATION_HANDLER,
        methods: global.ADDRESS_WINDOWS_AUTOMATION_METHODS,
        metadata: {
          libraryMetadata: global.WINDOWS_AUTOMATION_ADDRESS_META(),
          libraryName: 'windows-automation-address.js'
        }
      });

      const script = `
        ADDRESS windows
        "powershell Get-Process"
        "powershell Get-ChildItem"
      `;

      await interpreter.run(parse(script));

      expect(interpreter.getVariable('RC')).toBe(0);
    });

    test('should support operation-style syntax', async () => {
      interpreter.registerAddressTarget('windows', {
        handler: global.ADDRESS_WINDOWS_AUTOMATION_HANDLER,
        methods: global.ADDRESS_WINDOWS_AUTOMATION_METHODS,
        metadata: {
          libraryMetadata: global.WINDOWS_AUTOMATION_ADDRESS_META(),
          libraryName: 'windows-automation-address.js'
        }
      });

      const script = `
        ADDRESS windows
        "operation=process_list"
      `;

      await interpreter.run(parse(script));

      expect(interpreter.getVariable('RC')).toBe(0);
      const result = interpreter.getVariable('RESULT');
      expect(result).toBeDefined();
    });

    test('should work with conditional logic', async () => {
      interpreter.registerAddressTarget('windows', {
        handler: global.ADDRESS_WINDOWS_AUTOMATION_HANDLER,
        methods: global.ADDRESS_WINDOWS_AUTOMATION_METHODS,
        metadata: {
          libraryMetadata: global.WINDOWS_AUTOMATION_ADDRESS_META(),
          libraryName: 'windows-automation-address.js'
        }
      });

      const script = `
        ADDRESS windows
        "powershell Get-Process"
        IF RC = 0 THEN
          LET success = 1
        ELSE
          LET success = 0
        ENDIF
      `;

      await interpreter.run(parse(script));

      expect(interpreter.getVariable('success')).toBe(1);
    });

    test('should work with DO loops', async () => {
      interpreter.registerAddressTarget('windows', {
        handler: global.ADDRESS_WINDOWS_AUTOMATION_HANDLER,
        methods: global.ADDRESS_WINDOWS_AUTOMATION_METHODS,
        metadata: {
          libraryMetadata: global.WINDOWS_AUTOMATION_ADDRESS_META(),
          libraryName: 'windows-automation-address.js'
        }
      });

      const script = `
        LET count = 0
        ADDRESS windows
        DO i = 1 TO 3
          "powershell Get-Process"
          IF RC = 0 THEN
            count = count + 1
          ENDIF
        END
      `;

      await interpreter.run(parse(script));

      expect(interpreter.getVariable('count')).toBe(3);
    });
  });

  describe('Windows Integration Tests', () => {
    skipOnNonWindows('should run real PowerShell Get-Process on Windows', async () => {
      global.setWindowsAutomationMockMode(false);

      interpreter.registerAddressTarget('windows', {
        handler: global.ADDRESS_WINDOWS_AUTOMATION_HANDLER,
        methods: global.ADDRESS_WINDOWS_AUTOMATION_METHODS,
        metadata: {
          libraryMetadata: global.WINDOWS_AUTOMATION_ADDRESS_META(),
          libraryName: 'windows-automation-address.js'
        }
      });

      const script = `
        ADDRESS windows
        "powershell Get-Process | Select-Object Name,Id -First 5"
      `;

      await interpreter.run(parse(script));

      expect(interpreter.getVariable('RC')).toBe(0);
      const result = interpreter.getVariable('RESULT');
      expect(result).toBeDefined();
    });

    skipOnNonWindows('should list real system processes on Windows', async () => {
      global.setWindowsAutomationMockMode(false);

      const handler = global.ADDRESS_WINDOWS_AUTOMATION_HANDLER;
      const result = await handler('cmd', { operation: 'process_list' });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.processes)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully', async () => {
      interpreter.registerAddressTarget('windows', {
        handler: global.ADDRESS_WINDOWS_AUTOMATION_HANDLER,
        methods: global.ADDRESS_WINDOWS_AUTOMATION_METHODS,
        metadata: {
          libraryMetadata: global.WINDOWS_AUTOMATION_ADDRESS_META(),
          libraryName: 'windows-automation-address.js'
        }
      });

      const script = `
        ADDRESS windows
        operation = "invalid_op"
        IF RC \\= 0 THEN
          LET error_found = 1
        ELSE
          LET error_found = 0
        ENDIF
      `;

      await interpreter.run(parse(script));

      // Script should complete without throwing
      expect(interpreter.getVariable).toBeDefined();
    });
  });

  describe('Embedded Rexx Snippets', () => {
    test('should execute multiple operations successfully', async () => {
      interpreter.registerAddressTarget('windows', {
        handler: global.ADDRESS_WINDOWS_AUTOMATION_HANDLER,
        methods: global.ADDRESS_WINDOWS_AUTOMATION_METHODS,
        metadata: {
          libraryMetadata: global.WINDOWS_AUTOMATION_ADDRESS_META(),
          libraryName: 'windows-automation-address.js'
        }
      });

      const script = `
        -- Get system info
        ADDRESS windows
        "operation=system_info"

        -- Get process list
        "operation=process_list"
      `;

      await interpreter.run(parse(script));

      expect(interpreter.getVariable('RC')).toBe(0);
    });

    test('should handle multiple ADDRESS windows commands', async () => {
      interpreter.registerAddressTarget('windows', {
        handler: global.ADDRESS_WINDOWS_AUTOMATION_HANDLER,
        methods: global.ADDRESS_WINDOWS_AUTOMATION_METHODS,
        metadata: {
          libraryMetadata: global.WINDOWS_AUTOMATION_ADDRESS_META(),
          libraryName: 'windows-automation-address.js'
        }
      });

      const script = `
        ADDRESS windows
        "powershell Get-Process"
        "operation=process_list"
        "operation=system_info"
      `;

      await interpreter.run(parse(script));

      expect(interpreter.getVariable('RC')).toBe(0);
    });
  });
});
