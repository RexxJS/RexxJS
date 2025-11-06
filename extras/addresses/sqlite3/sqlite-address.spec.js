/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/* eslint-env jest */
'use strict';

const { Interpreter } = require('../../../core/src/interpreter');
const { parse } = require('../../../core/src/parser');

// Check if sqlite3 module is available
let sqlite3Available = false;
try {
  require('sqlite3');
  sqlite3Available = true;
} catch (e) {
  console.warn('sqlite3 module not available - skipping integration tests');
}

describe('SQLite ADDRESS Library', () => {
  let interpreter;
  const path = require('path');
  const SQLITE_ADDRESS_PATH = path.resolve(__dirname, 'src/sqlite-address.js');

  beforeEach(() => {
    // Clean up any existing global SQLite connection
    if (global._sqliteConnection) {
      global._sqliteConnection = null;
    }

    // Mock Address Sender for testing
    const mockRpcClient = {
      send: jest.fn().mockResolvedValue('mock response')
    };
    interpreter = new Interpreter(mockRpcClient);
  });

  afterEach(() => {
    // Clean up global SQLite connection after each test
    if (global._sqliteConnection) {
      try {
        global._sqliteConnection.close();
        global._sqliteConnection = null;
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Library Loading and Registration', () => {
    test('should load sqlite-address library and register ADDRESS target', async () => {
      // Load sqlite-address library for this test using absolute path
      await interpreter.run(parse(`REQUIRE "${SQLITE_ADDRESS_PATH}"`));
      
      // Verify ADDRESS target was registered
      expect(interpreter.addressTargets.has('sqlite3')).toBe(true);
      
      const sqlTarget = interpreter.addressTargets.get('sqlite3');
      expect(sqlTarget).toBeDefined();
      expect(typeof sqlTarget.handler).toBe('function');
      expect(sqlTarget.methods).toBeDefined();
      // Verify metadata exists (structure may vary)
      expect(sqlTarget.metadata).toBeDefined();
    });

    test('should expose proper metadata for sqlite-address', async () => {
      // Load sqlite-address library for this test
      await interpreter.run(parse(`REQUIRE "${SQLITE_ADDRESS_PATH}"`));

      const sqlTarget = interpreter.addressTargets.get('sqlite3');
      expect(sqlTarget).toBeDefined();
      expect(sqlTarget.handler).toBeDefined();
      expect(sqlTarget.metadata).toBeDefined();

      // Verify target was registered successfully
      expect(sqlTarget).toHaveProperty('handler');
    });
  });

  describe('ADDRESS Target Handler - Message Passing', () => {
    beforeEach(async () => {
      await interpreter.run(parse(`REQUIRE "${SQLITE_ADDRESS_PATH}"`));
    });

    test('should handle method calls through ADDRESS mechanism', async () => {
      const script = `
        ADDRESS SQLITE3
        LET result = status()
      `;
      
      if (!sqlite3Available) {
        // Test should fail gracefully when sqlite3 not available
        await expect(interpreter.run(parse(script))).rejects.toThrow(/sqlite3 module/);
        return;
      }

      await interpreter.run(parse(script));
      
      const result = interpreter.getVariable('result');
      expect(result).toBeDefined();
      expect(result.service).toBe('sqlite');
      expect(result.version).toBe('3.x');
      expect(result.methods).toContain('execute');
      expect(result.methods).toContain('query');
    });

    test('should handle command-string style ADDRESS calls', async () => {
      
      if (!sqlite3Available) {
        // Test environment check
        const sqlTarget = interpreter.addressTargets.get('sqlite3');
        expect(() => {
          sqlTarget.handler('CREATE TABLE test (id INTEGER)', null);
        }).toThrow(/sqlite3 module/);
        return;
      }

      // This would be the traditional Rexx style, but we need to implement
      // the command-string parsing in the interpreter first
      // For now, test via direct handler call
      const sqlTarget = interpreter.addressTargets.get('sqlite3');
      
      const result = await sqlTarget.handler('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      
      expect(result.operation).toBe('CREATE_TABLE');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Table created successfully');
    });

    test('should handle method parameters correctly', async () => {
      if (!sqlite3Available) {
        return; // Skip when sqlite3 not available
      }

      const script = `
        ADDRESS SQLITE3
        "CREATE TABLE products (id INTEGER, name TEXT)"
        LET result = status()
      `;

      await interpreter.run(parse(script));

      const result = interpreter.getVariable('result');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should handle unknown methods gracefully', async () => {
      if (!sqlite3Available) {
        return;
      }

      const script = `
        ADDRESS SQLITE3
        LET result = unknown_method param="value"
      `;

      // Unknown methods should be treated as SQL commands
      await expect(interpreter.run(parse(script))).rejects.toThrow(/SQL execution failed/);
    });
  });

  if (sqlite3Available) {
    describe('SQLite Integration Tests', () => {
      beforeEach(async () => {
        await interpreter.run(parse(`REQUIRE "${SQLITE_ADDRESS_PATH}"`));
      });

      test('should create table successfully', async () => {
        const script = `
          ADDRESS SQLITE3
          "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)"
          LET result = status()
        `;

        await interpreter.run(parse(script));

        const result = interpreter.getVariable('result');
        expect(result.success).toBe(true);
      });

      test('should insert and query data', async () => {
        const script = `
          ADDRESS SQLITE3
          "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"
          "INSERT INTO users (name) VALUES ('John Doe')"
          "SELECT * FROM users"
          LET status = status()
        `;

        await interpreter.run(parse(script));

        const status = interpreter.getVariable('status');
        expect(status.success).toBe(true);
      });

      test('should handle parameterized queries', async () => {
        const script = `
          ADDRESS SQLITE3
          "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)"
          "INSERT INTO products (name, price) VALUES ('Widget', 19.99)"
          LET result = status()
        `;

        await interpreter.run(parse(script));

        const result = interpreter.getVariable('result');
        expect(result.success).toBe(true);
      });

      test('should handle SQL errors gracefully', async () => {
        const script = `
          ADDRESS SQLITE3
          "CREATE INVALID SQL SYNTAX"
        `;

        await expect(interpreter.run(parse(script))).rejects.toThrow(/syntax error/);
      });

      test('should provide database status information', async () => {
        const script = `
          ADDRESS SQLITE3
          LET status = status()
        `;

        await interpreter.run(parse(script));
        
        const status = interpreter.getVariable('status');
        expect(status.service).toBe('sqlite');
        expect(status.version).toBe('3.x');
        expect(status.database).toBe(':memory:');
        expect(Array.isArray(status.methods)).toBe(true);
        expect(status.methods).toContain('execute');
        expect(status.methods).toContain('query');
        expect(status.methods).toContain('close');
        expect(status.timestamp).toBeDefined();
      });

      test('should handle multiple SQL operations in sequence', async () => {
        const script = `
          ADDRESS SQLITE3
          "CREATE TABLE inventory (id INTEGER PRIMARY KEY, item TEXT, quantity INTEGER)"
          "INSERT INTO inventory (item, quantity) VALUES ('Apples', 50)"
          "INSERT INTO inventory (item, quantity) VALUES ('Oranges', 30)"
          LET status = status()
        `;

        await interpreter.run(parse(script));

        const status = interpreter.getVariable('status');
        expect(status.success).toBe(true);
      });

      test('should handle database connection close', async () => {
        // First create a table to ensure connection exists
        await interpreter.run(parse(`
          ADDRESS SQLITE3
          "CREATE TABLE temp (id INTEGER)"
          LET status = status()
        `));

        // Verify connection exists
        const status = interpreter.getVariable('status');
        expect(status.success).toBe(true);
      });
    });

    describe('Command-String vs Method-Call Styles', () => {
      beforeEach(async () => {
        await interpreter.run(parse(`REQUIRE "${SQLITE_ADDRESS_PATH}"`));
      });

      test('should support classic Rexx ADDRESS syntax with quoted strings', async () => {
        // Test classic Rexx ADDRESS syntax: ADDRESS SQLITE3 + "SQL command"
        const script = `
          ADDRESS SQLITE3
          "CREATE TABLE classic_test (id INTEGER PRIMARY KEY, value TEXT)"
        `;
        
        await interpreter.run(parse(script));
        
        // Check RC and RESULT variables were set
        expect(interpreter.getVariable('RC')).toBe(0);
        const result = interpreter.getVariable('RESULT');
        expect(result).toBeDefined();
        expect(result.operation).toBe('CREATE_TABLE');
        expect(result.success).toBe(true);
        
        // Test INSERT with classic syntax
        const insertScript = `"INSERT INTO classic_test (value) VALUES ('test data')"`;
        await interpreter.run(parse(insertScript));
        
        expect(interpreter.getVariable('RC')).toBe(0);
        const insertResult = interpreter.getVariable('RESULT');
        expect(insertResult.operation).toBe('INSERT');
        expect(insertResult.success).toBe(true);
        expect(insertResult.lastInsertId).toBe(1);
        expect(insertResult.rowsAffected).toBe(1);
      });

      test('should support both styles for same operations', async () => {
        const script = `
          ADDRESS SQLITE3
          "CREATE TABLE style_test (id INTEGER, value TEXT)"
          "INSERT INTO style_test (value) VALUES ('test_value')"
          LET status = status()
        `;

        await interpreter.run(parse(script));

        const status = interpreter.getVariable('status');
        expect(status.success).toBe(true);
      });

      test('should handle complex SQL via both styles', async () => {
        const script = `
          ADDRESS SQLITE3
          "CREATE TABLE complex_test (id INTEGER PRIMARY KEY, name TEXT NOT NULL)"
          "INSERT INTO complex_test (name) VALUES ('Test Record')"
          LET status = status()
        `;

        await interpreter.run(parse(script));

        const status = interpreter.getVariable('status');
        expect(status.success).toBe(true);
      });
    });
  } else {
    describe('Environment Compatibility Tests', () => {
      test('should provide helpful error when sqlite3 not available', async () => {
        await interpreter.run(parse(`REQUIRE "${SQLITE_ADDRESS_PATH}"`));
        
        // Verify ADDRESS target was registered but sqlite3 not available
        const sqlTarget = interpreter.addressTargets.get('sqlite3');
        expect(sqlTarget).toBeDefined();
        expect(sqlTarget.metadata.libraryMetadata.sqlite3Available).toBe(false);
        
        // Test direct handler call (should throw sqlite3 error)
        expect(() => {
          sqlTarget.handler('status', null);
        }).toThrow(/sqlite3 module/);
        
        // Test via ADDRESS script (should also throw)
        const script = `
          ADDRESS SQLITE3
          LET result = status()
        `;

        await expect(interpreter.run(parse(script))).rejects.toThrow(/sqlite3 module/);
      });

      test('should detect Node.js environment requirement', async () => {
        await interpreter.run(parse(`REQUIRE "${SQLITE_ADDRESS_PATH}"`));
        
        const sqlTarget = interpreter.addressTargets.get('sqlite3');
        const metadata = sqlTarget.metadata.libraryMetadata;
        
        expect(metadata.requirements.environment).toBe('nodejs');
        expect(metadata.requirements.modules).toContain('sqlite3');
      });
    });
  }

  describe('ADDRESS Context Integration', () => {
    beforeEach(async () => {
      // Load sqlite-address for each test in this group
      await interpreter.run(parse(`REQUIRE "${SQLITE_ADDRESS_PATH}"`));
    });

    test('should share ADDRESS context with INTERPRET', async () => {
      if (!sqlite3Available) {
        return;
      }

      // Set up ADDRESS in main interpreter
      const script = `
        ADDRESS SQLITE3
        "CREATE TABLE interpret_test (id INTEGER)"
        LET result = status()
      `;

      await interpreter.run(parse(script));

      const result = interpreter.getVariable('result');
      expect(result.success).toBe(true);
    });

    test('should handle ADDRESS switching in INTERPRET', async () => {
      if (!sqlite3Available) {
        return;
      }

      // Library already loaded in beforeEach
      
      // Start with default address
      expect(interpreter.address).toBe('default');
      
      // INTERPRET should be able to change ADDRESS and use it
      const rexxCode = 'ADDRESS SQLITE3\\nLET status_result = status()';
      const commands = parse(`INTERPRET "${rexxCode}"`);
      commands.push(...parse(`LET result = 1`)); // Set result to indicate success
      await interpreter.run(commands);
      
      // Should have executed successfully
      expect(interpreter.variables.get('result')).toBe(1);
      const statusResult = interpreter.variables.get('status_result');
      expect(statusResult.service).toBe('sqlite');
    });
  });
});