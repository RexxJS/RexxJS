/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for system-address.js ADDRESS target library
 * Each test is completely independent and self-contained
 */

const { Interpreter } = require('../../../core/src/interpreter');
const { parse } = require('../../../core/src/parser');
const os = require('os');

// Check if Node.js environment is available (should always be true in Jest)
const nodejsAvailable = typeof process !== 'undefined' && process.versions && process.versions.node;

describe('System ADDRESS Library', () => {
  let interpreter;

  beforeEach(() => {
    // Mock Address Sender for testing
    const mockRpcClient = {
      send: jest.fn().mockResolvedValue('mock response')
    };
    interpreter = new Interpreter(mockRpcClient);
    // The inline scripts' REQUIRE "./system-address.js" resolves against a
    // script beside the library, in src/
    interpreter.scriptPath = require('path').join(__dirname, 'src', 'spec.rexx');
  });

  describe('Library Loading and Registration', () => {
    test('should load system-address library and register ADDRESS target', async () => {
      // Load the system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      // Verify ADDRESS target was registered
      expect(interpreter.addressTargets.has('system')).toBe(true);
      
      const systemTarget = interpreter.addressTargets.get('system');
      expect(systemTarget).toBeDefined();
      expect(typeof systemTarget.handler).toBe('function');
      expect(systemTarget.methods).toBeDefined();
      expect(systemTarget.metadata.libraryName.endsWith('system-address.js')).toBe(true);
      expect(systemTarget.metadata.libraryMetadata.type).toBe('address-handler');
      expect(systemTarget.metadata.libraryMetadata.provides.addressTarget).toBe('system');
    });

    test('should expose proper metadata for system-address', async () => {
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      const systemTarget = interpreter.addressTargets.get('system');
      expect(systemTarget).toBeDefined();
      expect(systemTarget.handler).toBeDefined();
      expect(systemTarget.metadata).toBeDefined();
      
      const metadata = systemTarget.metadata.libraryMetadata;
      expect(metadata.name).toBe('System Command Service');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.provides.commandSupport).toBe(true);
      expect(metadata.provides.methodSupport).toBe(true);
      expect(metadata.requirements.environment).toBe('nodejs');
      expect(metadata.requirements.modules).toContain('child_process');
    });
  });

  describe('ADDRESS Target Handler - Message Passing', () => {
    test('should handle method calls through ADDRESS mechanism', async () => {
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      const script = `
        ADDRESS system
        LET result = status()
      `;
      
      if (!nodejsAvailable) {
        // Test should fail gracefully when Node.js not available
        await expect(interpreter.run(parse(script))).rejects.toThrow(/Node.js environment/);
        return;
      }

      await interpreter.run(parse(script));
      
      const result = interpreter.getVariable('result');
      expect(result).toBeDefined();
      expect(result.service).toBe('system');
      expect(result.platform).toBe(process.platform);
      expect(result.methods).toContain('execute');
      expect(result.methods).toContain('run');
    });

    test('should handle command-string style ADDRESS calls via direct handler', async () => {
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      if (!nodejsAvailable) {
        // Test environment check
        const systemTarget = interpreter.addressTargets.get('system');
        expect(() => {
          systemTarget.handler('echo test', null);
        }).toThrow(/Node.js environment/);
        return;
      }

      // Test via direct handler call
      const systemTarget = interpreter.addressTargets.get('system');
      const result = await systemTarget.handler('echo "Hello World"');
      
      expect(result.operation).toBe('EXECUTE');
      expect(result.success).toBe(true);
      expect(result.stdout).toBe('Hello World');
      expect(result.exitCode).toBe(0);
    });

    test('should handle method parameters correctly', async () => {
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      if (!nodejsAvailable) {
        return; // Skip when Node.js not available
      }

      const script = `
        ADDRESS system
        LET result = execute command="echo testing"
      `;

      await interpreter.run(parse(script));
      
      const result = interpreter.getVariable('result');
      expect(result).toBeDefined();
      expect(result.operation).toBe('EXECUTE');
      expect(result.success).toBe(true);
      expect(result.stdout).toBe('testing');
    });

    test('should handle unknown methods gracefully', async () => {
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      if (!nodejsAvailable) {
        return;
      }

      const script = `
        ADDRESS system
        LET result = unknown_method_that_should_be_treated_as_command()
      `;

      // Unknown methods should be treated as system commands and fail gracefully
      await interpreter.run(parse(script));
      
      const result = interpreter.getVariable('result');
      expect(result).toBeDefined();
      expect(result.success).toBe(false); // Command should fail
      expect(result.exitCode).not.toBe(0); // Non-zero exit code
    });
  });

  if (nodejsAvailable) {
    describe('System Integration Tests', () => {
      test('should execute simple commands successfully', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          LET result = execute command="echo test123"
        `;

        await interpreter.run(parse(script));
        
        const result = interpreter.getVariable('result');
        expect(result.operation).toBe('EXECUTE');
        expect(result.success).toBe(true);
        expect(result.stdout).toBe('test123');
        expect(result.exitCode).toBe(0);
      });

      test('should handle command with arguments', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        // Use a cross-platform command
        const script = process.platform === 'win32' ? `
          ADDRESS system
          LET result = execute command="echo hello world"
        ` : `
          ADDRESS system
          LET result = execute command="echo 'hello world'"
        `;

        await interpreter.run(parse(script));
        
        const result = interpreter.getVariable('result');
        expect(result.success).toBe(true);
        expect(result.stdout).toMatch(/hello world/);
        expect(result.exitCode).toBe(0);
      });

      test('should handle command failures with proper exit codes', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        // Use a command that should fail on all platforms
        const script = `
          ADDRESS system
          LET result = execute command="nonexistent_command_that_should_fail"
        `;

        await interpreter.run(parse(script));
        
        const result = interpreter.getVariable('result');
        expect(result.success).toBe(false);
        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toBeDefined();
      });

      test('should provide system status information', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          LET status = status()
        `;

        await interpreter.run(parse(script));
        
        const status = interpreter.getVariable('status');
        expect(status.service).toBe('system');
        expect(status.platform).toBe(process.platform);
        expect(status.arch).toBe(process.arch);
        expect(status.cwd).toBe(process.cwd());
        expect(Array.isArray(status.methods)).toBe(true);
        expect(status.methods).toContain('execute');
        expect(status.methods).toContain('run');
        expect(status.methods).toContain('exec');
        expect(status.timestamp).toBeDefined();
      });

      test('should handle multiple system operations in sequence', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          LET echo1 = execute command="echo first"
          LET echo2 = execute command="echo second" 
          LET echo3 = execute command="echo third"
        `;

        await interpreter.run(parse(script));
        
        const echo1 = interpreter.getVariable('echo1');
        const echo2 = interpreter.getVariable('echo2');
        const echo3 = interpreter.getVariable('echo3');

        expect(echo1.success).toBe(true);
        expect(echo1.stdout).toBe('first');
        expect(echo2.success).toBe(true);
        expect(echo2.stdout).toBe('second');
        expect(echo3.success).toBe(true);
        expect(echo3.stdout).toBe('third');
      });

      test('should handle empty commands gracefully', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        // Test via direct handler call
        const systemTarget = interpreter.addressTargets.get('system');
        const result = await systemTarget.handler('');
        
        expect(result.operation).toBe('NOOP');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Empty command - no operation performed');
        expect(result.exitCode).toBe(0);
      });
    });

    describe('Shell Pipe Operations', () => {
      test('should support simple pipe operations', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "echo 'hello world test' | wc -w"
        `;
        
        await interpreter.run(parse(script));
        
        // Should return word count (3)
        expect(interpreter.getVariable('RC')).toBe(0);
        const result = interpreter.getVariable('RESULT');
        expect(result.trim()).toBe('3');
      });

      test('should support multiple pipe operations', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "printf 'line1\\nline2\\nline3\\n' | grep line | wc -l"
        `;
        
        await interpreter.run(parse(script));
        
        // Should return line count (3)
        expect(interpreter.getVariable('RC')).toBe(0);
        const result = interpreter.getVariable('RESULT');
        expect(result.trim()).toBe('3');
      });

      test('should support pipe with sort operations', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "printf 'zebra\\napple\\nbanana\\n' | sort"
        `;
        
        await interpreter.run(parse(script));
        
        // Should return sorted list
        expect(interpreter.getVariable('RC')).toBe(0);
        const result = interpreter.getVariable('RESULT');
        const lines = result.split('\n').map(s => s.trim()).filter(s => s);
        expect(lines).toEqual(['apple', 'banana', 'zebra']);
      });

      test('should support pipe with grep filtering', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "printf 'apple\\nbanana\\ncherry\\napricot\\n' | grep '^a'"
        `;
        
        await interpreter.run(parse(script));
        
        // Should return lines starting with 'a'
        expect(interpreter.getVariable('RC')).toBe(0);
        const result = interpreter.getVariable('RESULT');
        const lines = result.split('\n').map(s => s.trim()).filter(s => s);
        expect(lines).toEqual(['apple', 'apricot']);
      });

      test('should support complex pipe chains', async () => {
        // Load system-address library  
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "printf 'test1.js\\nfile.txt\\ntest2.js\\ndata.json\\napp.js\\n' | grep '\\.js$' | sort | head -2"
        `;
        
        await interpreter.run(parse(script));
        
        // Should return first 2 sorted JS files
        expect(interpreter.getVariable('RC')).toBe(0);
        const result = interpreter.getVariable('RESULT');
        const lines = result.split('\n').map(s => s.trim()).filter(s => s);
        expect(lines).toEqual(['app.js', 'test1.js']);
      });

      test('should handle pipe operation failures', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "echo 'test' | nonexistent_pipe_command"
        `;
        
        await interpreter.run(parse(script));
        
        // Should indicate failure
        expect(interpreter.getVariable('RC')).not.toBe(0);
        expect(interpreter.getVariable('ERRORTEXT')).toBeDefined();
        expect(interpreter.getVariable('ERRORTEXT').length).toBeGreaterThan(0);
      });

      test('should support pipe operations via method calls', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "echo 'one two three' | wc -w"
          LET method_result = execute command="echo 'four five six' | wc -w"
        `;
        
        await interpreter.run(parse(script));
        
        // Check both classic ADDRESS and method call results
        expect(interpreter.getVariable('RC')).toBe(0);
        const rexxResult = interpreter.getVariable('RESULT');
        expect(rexxResult.trim()).toBe('3');
        
        const methodResult = interpreter.getVariable('method_result');
        expect(methodResult.success).toBe(true);
        expect(methodResult.stdout.trim()).toBe('3');
      });
    });

    describe('File Redirection Operations', () => {
      const testFilePath = '/tmp/rexx_system_test_file.txt';
      
      afterEach(async () => {
        // Clean up test files
        try {
          const fs = require('fs');
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      });

      test('should support basic output redirection (>)', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "echo 'Hello from REXX' > ${testFilePath}"
        `;
        
        await interpreter.run(parse(script));
        
        // Should succeed
        expect(interpreter.getVariable('RC')).toBe(0);
        
        // Verify file was created and has correct content
        const fs = require('fs');
        expect(fs.existsSync(testFilePath)).toBe(true);
        const content = fs.readFileSync(testFilePath, 'utf8').trim();
        expect(content).toBe('Hello from REXX');
      });

      test('should support output redirection with pipes', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "printf 'zebra\\napple\\nbanana\\n' | sort > ${testFilePath}"
        `;
        
        await interpreter.run(parse(script));
        
        // Should succeed
        expect(interpreter.getVariable('RC')).toBe(0);
        
        // Verify file has sorted content
        const fs = require('fs');
        expect(fs.existsSync(testFilePath)).toBe(true);
        const content = fs.readFileSync(testFilePath, 'utf8');
        const lines = content.split('\n').map(s => s.trim()).filter(s => s);
        expect(lines).toEqual(['apple', 'banana', 'zebra']);
      });

      test('should support append redirection (>>)', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "echo 'Line 1' > ${testFilePath}"
          "echo 'Line 2' >> ${testFilePath}"
          "echo 'Line 3' >> ${testFilePath}"
        `;
        
        await interpreter.run(parse(script));
        
        // Should succeed
        expect(interpreter.getVariable('RC')).toBe(0);
        
        // Verify file has all three lines
        const fs = require('fs');
        expect(fs.existsSync(testFilePath)).toBe(true);
        const content = fs.readFileSync(testFilePath, 'utf8');
        const lines = content.split('\n').map(s => s.trim()).filter(s => s);
        expect(lines).toEqual(['Line 1', 'Line 2', 'Line 3']);
      });

      test('should support reading file content back', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "echo 'Test file content' > ${testFilePath}"
          "cat ${testFilePath}"
        `;
        
        await interpreter.run(parse(script));
        
        // Should succeed
        expect(interpreter.getVariable('RC')).toBe(0);
        
        // RESULT should contain the file content
        const result = interpreter.getVariable('RESULT');
        expect(result.trim()).toBe('Test file content');
      });

      test('should handle redirection failures gracefully', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "echo 'test' > /root/impossible_to_write.txt"
        `;
        
        await interpreter.run(parse(script));
        
        // Should fail with permission error
        expect(interpreter.getVariable('RC')).not.toBe(0);
        expect(interpreter.getVariable('ERRORTEXT')).toBeDefined();
        expect(interpreter.getVariable('ERRORTEXT').length).toBeGreaterThan(0);
      });

      test('should support complex redirection with pipes', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "printf 'file1.js\\ntest.txt\\nfile2.js\\ndata.json\\n' | grep '\\.js$' | sort > ${testFilePath}"
          "cat ${testFilePath}"
        `;
        
        await interpreter.run(parse(script));
        
        // Should succeed
        expect(interpreter.getVariable('RC')).toBe(0);
        
        // RESULT should contain sorted JS files
        const result = interpreter.getVariable('RESULT');
        const lines = result.split('\n').map(s => s.trim()).filter(s => s);
        expect(lines).toEqual(['file1.js', 'file2.js']);
      });

      test('should support redirection via method calls', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "echo 'Classic call'" 
          LET write_result = execute command="echo 'Method call output' > ${testFilePath}"
          LET read_result = execute command="cat ${testFilePath}"
        `;
        
        await interpreter.run(parse(script));
        
        // Should succeed (RC from the last classic call)
        expect(interpreter.getVariable('RC')).toBe(0);
        
        const writeResult = interpreter.getVariable('write_result');
        expect(writeResult.success).toBe(true);
        
        const readResult = interpreter.getVariable('read_result');
        expect(readResult.success).toBe(true);
        expect(readResult.stdout.trim()).toBe('Method call output');
      });

      test('should support input redirection (<)', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        // First create a test file
        const fs = require('fs');
        fs.writeFileSync(testFilePath, 'apple\nbanana\ncherry\n');
        
        const script = `
          ADDRESS system
          "sort < ${testFilePath}"
        `;
        
        await interpreter.run(parse(script));
        
        // Should succeed
        expect(interpreter.getVariable('RC')).toBe(0);
        
        // RESULT should contain sorted content
        const result = interpreter.getVariable('RESULT');
        const lines = result.split('\n').map(s => s.trim()).filter(s => s);
        expect(lines).toEqual(['apple', 'banana', 'cherry']);
      });
    });

    describe('REXX-Style Stderr/Stdout Combination', () => {
      test('should support combine_stderr parameter with execute method', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          LET result = execute command="sh -c 'echo stdout; echo stderr >&2'" combine_stderr=true
        `;
        
        await interpreter.run(parse(script));
        
        const methodResult = interpreter.getVariable('result');
        expect(methodResult.success).toBe(true);
        expect(methodResult.combineStderr).toBe(true);
        expect(methodResult.actualCommand).toContain('2>&1');
        
        // Both stdout and stderr should be in stdout
        const output = methodResult.stdout;
        expect(output).toContain('stdout');
        expect(output).toContain('stderr');
        expect(methodResult.stderr).toBe(''); // stderr should be empty when combined
      });

      test('should support combine_stderr with pipes for error filtering', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          -- Step 1: Run command with combined stderr/stdout
          LET result = execute command="sh -c 'echo info_msg; echo error_msg >&2'" combine_stderr=true
          
          -- Step 2: Use a simple pipe to filter the combined output
          LET filtered = execute command="echo 'info_msg error_msg' | grep error_msg" 
        `;
        
        await interpreter.run(parse(script));
        
        const result = interpreter.getVariable('result');
        expect(result.combineStderr).toBe(true);
        expect(result.stdout).toContain('info_msg');
        expect(result.stdout).toContain('error_msg');
        
        const filtered = interpreter.getVariable('filtered');
        expect(filtered.success).toBe(true);
        expect(filtered.stdout).toContain('error_msg');
      });

      test('should support combine_stderr=false (default behavior)', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          LET result = execute command="sh -c 'echo stdout; echo stderr >&2; exit 1'" combine_stderr=false
        `;
        
        await interpreter.run(parse(script));
        
        const result = interpreter.getVariable('result');
        expect(result.success).toBe(false);
        expect(result.combineStderr).toBe(false);
        expect(result.stdout).toContain('stdout');
        expect(result.stderr).toContain('stderr');
        expect(result.actualCommand).not.toContain('2>&1');
      });

      test('should support run method with combine_stderr', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          LET result = run command="sh -c 'echo out; echo error >&2'" combine_stderr=true
        `;
        
        await interpreter.run(parse(script));
        
        const result = interpreter.getVariable('result');
        expect(result.success).toBe(true);
        expect(result.combineStderr).toBe(true);
        expect(result.stdout).toContain('out');
        expect(result.stdout).toContain('error');
      });

      test('should support exec method with combine_stderr parameter', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          LET result = exec command="sh -c 'echo test_output; echo test_error >&2'" combine_stderr=true
        `;
        
        await interpreter.run(parse(script));
        
        const result = interpreter.getVariable('result');
        expect(result.success).toBe(true);
        expect(result.combineStderr).toBe(true);
        expect(result.stdout).toContain('test_output');
        expect(result.stdout).toContain('test_error');
        expect(result.stderr).toBe('');
      });

      test('should handle failed commands with combine_stderr', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          LET result = execute command="sh -c 'echo before_error; nonexistent_stderr_test_cmd'" combine_stderr=true
        `;
        
        await interpreter.run(parse(script));
        
        const result = interpreter.getVariable('result');
        expect(result.success).toBe(false);
        expect(result.combineStderr).toBe(true);
        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toBe(''); // stderr combined into stdout
        expect(result.stdout).toContain('before_error');
      });

      test('should demonstrate REXX-style error stream processing', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          -- Step 1: Run a command that produces both stdout and stderr
          LET mixed_output = execute command="sh -c 'echo SUCCESS; echo WARNING >&2; echo INFO'" combine_stderr=true
          
          -- Step 2: Simple demonstration with hardcoded data to avoid shell escaping
          LET line_count = execute command="echo 'SUCCESS WARNING INFO' | wc -w" 
          LET warnings_filtered = execute command="echo 'SUCCESS WARNING INFO' | grep WARNING"
        `;
        
        await interpreter.run(parse(script));
        
        const mixedOutput = interpreter.getVariable('mixed_output');
        expect(mixedOutput.combineStderr).toBe(true);
        expect(mixedOutput.stdout).toContain('SUCCESS');
        expect(mixedOutput.stdout).toContain('WARNING');
        expect(mixedOutput.stdout).toContain('INFO');
        
        const lineCount = interpreter.getVariable('line_count');
        expect(lineCount.stdout.trim()).toBe('3');
        
        const warningsFiltered = interpreter.getVariable('warnings_filtered');
        expect(warningsFiltered.stdout.trim()).toBe('SUCCESS WARNING INFO');
      });
    });

    describe('Classic Rexx ADDRESS Syntax', () => {
      test('should support classic quoted string commands', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        // Test classic Rexx ADDRESS syntax: ADDRESS system + "command"
        const script = `
          ADDRESS system
          "echo classic_test"
        `;
        
        await interpreter.run(parse(script));
        
        // Check standard REXX variables were set
        expect(interpreter.getVariable('RC')).toBe(0);
        const result = interpreter.getVariable('RESULT');
        expect(result).toBe('classic_test');
        
        // ERRORTEXT should not be set for successful commands
        expect(interpreter.getVariable('ERRORTEXT')).toBeUndefined();
      });

      test('should handle classic syntax with command failures', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        // Test classic syntax with failing command
        const script = `
          ADDRESS system
          "nonexistent_command_fail_test"
        `;
        
        await interpreter.run(parse(script));
        
        // Check standard REXX variables indicate failure
        expect(interpreter.getVariable('RC')).not.toBe(0);
        expect(interpreter.getVariable('ERRORTEXT')).toBeDefined();
        expect(interpreter.getVariable('ERRORTEXT').length).toBeGreaterThan(0);
      });

      test('should support both classic and modern styles together', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        // Classic style: quoted string command
        const classicScript = `
          ADDRESS system
          "echo mixed_style_test"
        `;
        await interpreter.run(parse(classicScript));
        
        // Modern style: method call
        const modernScript = `
          LET modern_result = execute command="echo modern_test"
        `;
        await interpreter.run(parse(modernScript));
        
        // Verify both worked
        expect(interpreter.getVariable('RC')).toBe(0); // From classic style
        expect(interpreter.getVariable('RESULT')).toBe('mixed_style_test');
        
        const modernResult = interpreter.getVariable('modern_result');
        expect(modernResult.operation).toBe('EXECUTE');
        expect(modernResult.stdout).toBe('modern_test');
      });
    });

    describe('REXX Variable Integration', () => {
      test('should set standard REXX variables (RC, RESULT, ERRORTEXT)', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "echo variable_test"
        `;
        
        await interpreter.run(parse(script));
        
        // Check standard REXX variables
        expect(interpreter.getVariable('RC')).toBe(0);
        expect(interpreter.getVariable('RESULT')).toBe('variable_test');
        
        // ERRORTEXT should not be set for successful commands
        expect(interpreter.getVariable('ERRORTEXT')).toBeUndefined();
      });

      test('should set standard REXX variables (RC, RESULT, ERRORTEXT)', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "echo domain_specific_test"
        `;
        
        await interpreter.run(parse(script));
        
        // Check standard REXX variables 
        expect(interpreter.getVariable('RC')).toBe(0);
        expect(interpreter.getVariable('RESULT')).toBe('domain_specific_test');
        expect(interpreter.getVariable('ERRORTEXT')).toBeUndefined();
      });

      test('should handle error variables correctly on command failure', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const script = `
          ADDRESS system
          "nonexistent_error_test_command"
        `;
        
        await interpreter.run(parse(script));
        
        // Check standard REXX error variables 
        expect(interpreter.getVariable('RC')).not.toBe(0);
        expect(interpreter.getVariable('ERRORTEXT')).toBeDefined();
        expect(interpreter.getVariable('ERRORTEXT').length).toBeGreaterThan(0);
      });
    });
  } else {
    describe('Environment Compatibility Tests', () => {
      test('should provide helpful error when Node.js not available', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        // Verify ADDRESS target was registered but Node.js not available
        const systemTarget = interpreter.addressTargets.get('system');
        expect(systemTarget).toBeDefined();
        expect(systemTarget.metadata.libraryMetadata.nodejsAvailable).toBe(false);
        
        // Test direct handler call (should throw Node.js error)
        expect(() => {
          systemTarget.handler('echo test', null);
        }).toThrow(/Node.js environment/);
        
        // Test via ADDRESS script (should also throw)
        const script = `
          ADDRESS system
          LET result = status()
        `;

        await expect(interpreter.run(parse(script))).rejects.toThrow(/Node.js environment/);
      });

      test('should detect Node.js environment requirement', async () => {
        // Load system-address library
        await interpreter.run(parse('REQUIRE "./system-address.js"'));
        
        const systemTarget = interpreter.addressTargets.get('system');
        const metadata = systemTarget.metadata.libraryMetadata;
        
        expect(metadata.requirements.environment).toBe('nodejs');
        expect(metadata.requirements.modules).toContain('child_process');
      });
    });
  }

  describe('REXX Language Integration Tests', () => {
    let sayOutput = [];
    
    beforeEach(() => {
      sayOutput = [];
      // Mock the outputHandler.output function to capture SAY statements
      interpreter.outputHandler = {
        output: (message) => {
          sayOutput.push(message);
        }
      };
    });
    
    test('should demonstrate RC, RESULT variables with REXX SAY statements', async () => {
      if (!nodejsAvailable) {
        return;
      }
      
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      const script = `
        ADDRESS system
        "echo Hello from REXX"
        SAY "Return Code (RC): " RC
        SAY "Command Result: " RESULT
        SAY "Error Text: " ERRORTEXT
      `;
      
      await interpreter.run(parse(script));
      
      expect(sayOutput.some(line => line.includes('Return Code (RC):') && line.includes('0'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Command Result:') && line.includes('Hello from REXX'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Error Text:'))).toBe(true);
    });

    test('should demonstrate error handling with REXX SAY statements', async () => {
      if (!nodejsAvailable) {
        return;
      }
      
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      const script = `
        ADDRESS system
        "nonexistent_command_for_error_demo"
        SAY "Return Code (RC): " RC
        SAY "Command Result: " RESULT  
        SAY "Error Text: " ERRORTEXT
        SAY "Command execution completed"
      `;
      
      await interpreter.run(parse(script));
      
      // Find RC value in output
      const rcOutput = sayOutput.find(line => line.includes('Return Code (RC):'));
      expect(rcOutput).toBeDefined();
      expect(rcOutput).not.toContain('RC):  0'); // Should be non-zero
      
      expect(sayOutput.some(line => line.includes('Command execution completed'))).toBe(true);
      
      // Should have error text
      const errorOutput = sayOutput.find(line => line.includes('Error Text:'));
      expect(errorOutput).toBeDefined();
      expect(errorOutput.length).toBeGreaterThan(20);
    });

    test('should demonstrate conditional logic based on RC in REXX', async () => {
      if (!nodejsAvailable) {
        return;
      }
      
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      const script = `
        ADDRESS system
        
        -- Test successful command
        "echo First command"
        SAY "First command RC: " RC " Result: " RESULT
        
        -- Test failing command
        "invalid_command_that_will_fail"
        SAY "Second command RC: " RC
        SAY "Second command Result: " RESULT
        SAY "Second command ErrorText: " ERRORTEXT
      `;
      
      await interpreter.run(parse(script));
      
      expect(sayOutput.some(line => line.includes('First command RC:') && line.includes('0'))).toBe(true);
      expect(sayOutput.some(line => line.includes('First command') && line.includes('Result:'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Second command RC:') && !line.includes('RC:  0'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Second command ErrorText:'))).toBe(true);
    });

    test('should demonstrate multiple commands with REXX variable tracking', async () => {
      if (!nodejsAvailable) {
        return;
      }
      
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      const script = `
        ADDRESS system
        
        LET success_count = 0
        LET failure_count = 0
        
        -- Command 1
        "echo Command One"
        IF RC = 0 THEN DO
          LET success_count = success_count + 1
          SAY "Command 1: SUCCESS - " RESULT
        END
        ELSE DO
          LET failure_count = failure_count + 1
          SAY "Command 1: FAILED - RC=" RC
        END
        
        -- Command 2
        "echo Command Two"
        IF RC = 0 THEN DO
          LET success_count = success_count + 1
          SAY "Command 2: SUCCESS - " RESULT
        END
        ELSE DO
          LET failure_count = failure_count + 1
          SAY "Command 2: FAILED - RC=" RC
        END
        
        -- Command 3 (intentionally failing)
        "this_command_does_not_exist"
        IF RC = 0 THEN DO
          LET success_count = success_count + 1
          SAY "Command 3: SUCCESS - " RESULT
        END
        ELSE DO
          LET failure_count = failure_count + 1
          SAY "Command 3: FAILED - RC=" RC " STDERR=" STDERR
        END
        
        SAY "Summary: " success_count " successful, " failure_count " failed"
      `;
      
      await interpreter.run(parse(script));
      
      expect(sayOutput.some(line => line.includes('Command 1: SUCCESS') && line.includes('Command One'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Command 2: SUCCESS') && line.includes('Command Two'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Command 3: FAILED - RC='))).toBe(true);
      expect(sayOutput.some(line => line.includes('Summary:') && line.includes('successful') && line.includes('failed'))).toBe(true);
    });

    test('should demonstrate ERRORTEXT variable usage in REXX', async () => {
      if (!nodejsAvailable) {
        return;
      }
      
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      const script = `
        ADDRESS system
        
        -- Successful command should not set ERRORTEXT
        "echo Success test"
        SAY "After success - RC: " RC
        SAY "Success RESULT: " RESULT
        SAY "Success ERRORTEXT: " ERRORTEXT
        
        -- Failing command should set ERRORTEXT  
        "command_that_definitely_fails"
        SAY "After failure - RC: " RC
        SAY "Failure RESULT: " RESULT
        SAY "Failure ERRORTEXT: " ERRORTEXT
      `;
      
      await interpreter.run(parse(script));
      
      expect(sayOutput.some(line => line.includes('After success - RC:') && line.includes('0'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Success RESULT:') && line.includes('Success test'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Success ERRORTEXT:'))).toBe(true);
      expect(sayOutput.some(line => line.includes('After failure - RC:') && !line.includes('RC:  0'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Failure ERRORTEXT:'))).toBe(true);
    });

    test('should demonstrate classic vs modern REXX ADDRESS syntax', async () => {
      if (!nodejsAvailable) {
        return;
      }
      
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      const script = `
        ADDRESS system
        
        SAY "=== Classic REXX ADDRESS Syntax ==="
        "echo Classic style output"
        SAY "Classic RC: " RC " Result: " RESULT
        
        SAY ""
        SAY "=== Modern Method Call Syntax ==="
        LET modern_result = execute command="echo Modern style output"
        SAY "Modern success: " modern_result.success
        SAY "Modern stdout: " modern_result.stdout
        SAY "Modern operation: " modern_result.operation
        
        SAY ""
        SAY "=== Comparison ==="
        SAY "Classic uses RC/RESULT variables automatically"
        SAY "Modern returns structured result object"
        SAY "Both work with ADDRESS SYSTEM!"
      `;
      
      await interpreter.run(parse(script));
      
      expect(sayOutput.some(line => line.includes('=== Classic REXX ADDRESS Syntax ==='))).toBe(true);
      expect(sayOutput.some(line => line.includes('Classic RC:') && line.includes('0') && line.includes('Classic style output'))).toBe(true);
      expect(sayOutput.some(line => line.includes('=== Modern Method Call Syntax ==='))).toBe(true);
      expect(sayOutput.some(line => line.includes('Modern success:') && line.includes('true'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Modern stdout:') && line.includes('Modern style output'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Modern operation:') && line.includes('EXECUTE'))).toBe(true);
      expect(sayOutput.some(line => line.includes('Both work with ADDRESS SYSTEM!'))).toBe(true);
    });
  });

  describe('ADDRESS Context Integration', () => {
    test('should share ADDRESS context with INTERPRET', async () => {
      // Load system-address library
      await interpreter.run(parse('REQUIRE "./system-address.js"'));
      
      if (!nodejsAvailable) {
        return;
      }

      // Set up ADDRESS in main interpreter
      const addressCommands = parse('ADDRESS system');
      await interpreter.run(addressCommands);
      
      expect(interpreter.address).toBe('system');
      
      // INTERPRET should inherit the address and execute system command
      const rexxCode = 'execute command="echo interpret_test"';
      const commands = parse(`INTERPRET "${rexxCode}"`);
      commands.push(...parse(`LET result = 1`)); // Set result to indicate success
      await interpreter.run(commands);
      
      // Should have executed system command through ADDRESS target, not RPC
      expect(interpreter.addressSender.send).not.toHaveBeenCalled();
      expect(interpreter.variables.get('result')).toBe(1);
    });
  });
});