'use strict';
/*!
 * RexxJS Native Test Runner
 * Unified test runner with pattern matching and tag filtering
 * Copyright (c) 2025 RexxJS Project | MIT License
 */

const path = require('path');
const fs = require('fs');

const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

function formatErrorWithCausalChain(error, stderr) {
  if (!stderr) return error;
  
  const lines = stderr.split('\n').filter(line => line.trim());
  
  // Find the actual expectation error (the root cause)
  let expectationError = null;
  for (const line of lines) {
    if (line.includes('expected, but') && line.includes('encountered')) {
      expectationError = line.trim();
      break;
    }
  }
  
  // Find INTERPRET context line that shows what file/line triggered this
  let interpretLine = null;
  for (const line of lines) {
    if (line.startsWith('INTERPRET statement: line ') && line.includes('(') && line.includes(')')) {
      // Extract just the useful part: line X ("code") (filename)  
      const match = line.match(/line (\d+) \("([^"]+)"\)$/);
      if (match) {
        const [, lineNum, code] = match;
        // Try to extract filename from earlier context
        let filename = 'unknown';
        for (const contextLine of lines) {
          if (contextLine.includes('.rexx')) {
            const fileMatch = contextLine.match(/([^/\s]+\.rexx)/);
            if (fileMatch) {
              filename = fileMatch[1];
              break;
            }
          }
        }
        interpretLine = `INTERPRET "${code}" (${filename}:${lineNum})`;
      }
    }
  }
  
  // If we found both pieces, create a better error message
  if (expectationError && interpretLine) {
    return `${expectationError}\n    at ${interpretLine}`;
  }
  
  // Fallback: if we at least found the expectation error, show that clearly
  if (expectationError) {
    return expectationError;
  }
  
  return error;
}

function showHelp() {
  console.log(`${Colors.bright}${Colors.blue}🧪 RexxJS Native Test Runner${Colors.reset}`);
  console.log('');
  console.log(`${Colors.bright}Usage:${Colors.reset}`);
  console.log(`  ${Colors.green}./rexxt [options] [patterns...]${Colors.reset}`);
  console.log('');

  console.log(`${Colors.bright}Options:${Colors.reset}`);
  console.log(`  ${Colors.green}--navigate${Colors.reset}                    - Launch TUI navigator only`);
  console.log(`  ${Colors.green}--run-and-navigate${Colors.reset}            - Run tests then launch navigator`);
  console.log(`  ${Colors.green}--pattern <glob>${Colors.reset}              - Test file pattern (can specify multiple)`);
  console.log(`  ${Colors.green}--tags <tags>${Colors.reset}                 - Filter by tags (comma-separated)`);
  console.log(`  ${Colors.green}--honor-skip${Colors.reset}                  - Honor @skip annotations (default: true)`);
  console.log(`  ${Colors.green}--no-honor-skip${Colors.reset}               - Run all tests, ignoring @skip annotations`);
  console.log(`  ${Colors.green}--verbose, -v${Colors.reset}                 - Verbose output`);
  console.log(`  ${Colors.green}--verbose-output${Colors.reset}              - Show all SAY output from scripts`);
  console.log(`  ${Colors.green}--live-output${Colors.reset}                 - Show SAY output in real-time without debug info`);
  console.log(`  ${Colors.green}--show-passing-expectations${Colors.reset}   - Show detailed info for passing expectations`);
  console.log(`  ${Colors.green}--rerun-failures-with-verbose${Colors.reset}  - Rerun failed tests with verbose output`);
  console.log(`  ${Colors.green}--timeout <ms>${Colors.reset}                - Test timeout (default: 30000)`);
  console.log(`  ${Colors.green}--help, -h${Colors.reset}                    - Show this help`);
  console.log('');
  
  console.log(`${Colors.bright}Examples:${Colors.reset}`);
  console.log(`  ${Colors.cyan}./rexxt${Colors.reset}                                    - Run all .rexx files in current directory`);
  console.log(`  ${Colors.cyan}./rexxt tests/math-tests.rexx${Colors.reset}             - Run specific test file`);
  console.log(`  ${Colors.cyan}./rexxt --pattern "tests/*-specs.rexx"${Colors.reset}    - Run files matching pattern`);
  console.log(`  ${Colors.cyan}./rexxt --tags math,basic${Colors.reset}                 - Run tests with specific tags`);
  console.log(`  ${Colors.cyan}./rexxt --no-honor-skip tests/math-tests.rexx${Colors.reset} - Run all tests, ignoring @skip`);
  console.log(`  ${Colors.cyan}./rexxt --verbose-output tests/math-tests.rexx${Colors.reset} - Show all script output`);
  console.log(`  ${Colors.cyan}./rexxt --live-output tests/debug.rexx${Colors.reset}       - Show just SAY output live`);
  console.log(`  ${Colors.cyan}./rexxt --rerun-failures-with-verbose tests/*.rexx${Colors.reset} - Debug failed tests`);
  console.log(`  ${Colors.cyan}./rexxt --run-and-navigate tests/*.rexx${Colors.reset}   - Run tests then browse results`);
  console.log(`  ${Colors.cyan}./rexxt --navigate${Colors.reset}                        - Browse previous test results`);
  console.log('');

  console.log(`${Colors.bright}Test Annotations:${Colors.reset}`);
  console.log(`${Colors.dim}  Add /* @test-tags math, integration */ at the top of test files${Colors.reset}`);
  console.log(`${Colors.dim}  Add /* @skip */ or /* @skip reason */ before test subroutines to skip them${Colors.reset}`);
  console.log(`${Colors.dim}  Add /* @requires docker */ before tests that need specific capabilities${Colors.reset}`);
  console.log('');
  
  console.log(`${Colors.bright}File Conventions:${Colors.reset}`);
  console.log(`${Colors.dim}  Any .rexx file can be a test file${Colors.reset}`);
  console.log(`${Colors.dim}  Use CALL *Test subroutines and ADDRESS EXPECTATIONS for testing${Colors.reset}`);
  console.log('');
  
  console.log(`${Colors.dim}For detailed documentation, see existing test files in tests/ directory${Colors.reset}`);
}

function parseTestTags(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').slice(0, 10); // Check first 10 lines for metadata

    for (const line of lines) {
      const tagMatch = line.match(/\/\*\s*@test-tags\s+([^*]+)\s*\*\//);
      if (tagMatch) {
        return tagMatch[1].split(',').map(tag => tag.trim()).filter(Boolean);
      }
    }
  } catch (error) {
    // Ignore file read errors
  }
  return [];
}

function parseSkippedTests(filePath) {
  // Parse test file for @skip annotations before test subroutines
  // Returns a Map of test name -> skip reason
  const skippedTests = new Map();

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for @skip annotation
      const skipMatch = line.match(/\/\*\s*@skip\s*([^*]*)\s*\*\//);
      if (skipMatch) {
        const skipReason = skipMatch[1].trim() || 'No reason provided';

        // Look ahead for the test subroutine definition
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim();

          // Skip empty lines and comments
          if (!nextLine || nextLine.startsWith('//') || nextLine.startsWith('--')) {
            continue;
          }

          // Check for test subroutine definition (ends with Test:)
          const testMatch = nextLine.match(/^(\w+Test):/i);
          if (testMatch) {
            const testName = testMatch[1];
            skippedTests.set(testName.toUpperCase(), skipReason);
            break;
          }

          // If we hit non-comment content that's not a test, stop looking
          break;
        }
      }
    }
  } catch (error) {
    // Ignore file read errors
  }

  return skippedTests;
}

function parseTestRequirements(filePath) {
  // Parse test file for @requires annotations before test subroutines
  // Returns a Map of test name -> array of required capabilities
  const testRequirements = new Map();

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for @requires annotation
      const requiresMatch = line.match(/\/\*\s*@requires\s+([^*]+)\s*\*\//);
      if (requiresMatch) {
        // Parse comma-separated list of requirements
        const requirements = requiresMatch[1]
          .split(',')
          .map(req => req.trim())
          .filter(Boolean);

        // Look ahead for the test subroutine definition
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim();

          // Skip empty lines and comments
          if (!nextLine || nextLine.startsWith('//') || nextLine.startsWith('--')) {
            continue;
          }

          // Check for test subroutine definition (ends with Test:)
          const testMatch = nextLine.match(/^(\w+Test):/i);
          if (testMatch) {
            const testName = testMatch[1];
            testRequirements.set(testName.toUpperCase(), requirements);
            break;
          }

          // If we hit non-comment content that's not a test, stop looking
          break;
        }
      }
    }
  } catch (error) {
    // Ignore file read errors
  }

  return testRequirements;
}

// Static analysis functions removed - test counting now done at runtime by TestRexxInterpreter

function findTestFilesSync(dir, patterns = [], found = []) {
  if (!fs.existsSync(dir)) return found;
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    // Skip ignored directories
    if (item.isDirectory()) {
      if (item.name === 'node_modules' || item.name === '.git') {
        continue;
      }
      findTestFilesSync(fullPath, patterns, found);
    } else if (item.isFile() && item.name.endsWith('.rexx')) {
      // Include all .rexx files - trust user's globbing/patterns
      found.push(fullPath);
    }
  }
  
  return found;
}

async function findTestFiles(patterns, tags) {
  let files = [];
  
  if (patterns.length === 0) {
    // Default: search for test files in current directory and tests/ subdirectory
    files = findTestFilesSync('.');
  } else {
    // Handle specific patterns/files
    for (const pattern of patterns) {
      if (fs.existsSync(pattern)) {
        if (fs.statSync(pattern).isFile()) {
          files.push(pattern);
        } else if (fs.statSync(pattern).isDirectory()) {
          files.push(...findTestFilesSync(pattern));
        }
      } else {
        // Simple glob-like matching for basic patterns
        const dir = pattern.includes('/') ? path.dirname(pattern) : '.';
        const basename = path.basename(pattern);
        
        if (fs.existsSync(dir)) {
          const dirFiles = findTestFilesSync(dir);
          const matchingFiles = dirFiles.filter(file => {
            const filename = path.basename(file);
            // Simple pattern matching (supports * as wildcard)
            const regex = new RegExp('^' + basename.replace(/\*/g, '.*') + '$');
            return regex.test(filename);
          });
          files.push(...matchingFiles);
        }
      }
    }
  }
  
  // Remove duplicates
  files = [...new Set(files)];
  
  // Filter by tags if specified
  if (tags.length > 0) {
    files = files.filter(file => {
      const fileTags = parseTestTags(file);
      return tags.some(tag => fileTags.includes(tag));
    });
  }
  
  return files.sort();
}

function parseTestOutput(text, testResults) {
  // Parse expectation-based test output patterns
  
  // Tests should only be counted when CALL *Test subroutines are executed
  
  // Track Test subroutine completion patterns to count passed tests
  // Look for patterns like "✓ Simple nested loops:" indicating a Test subroutine completed
  const testCompletionMatch = text.match(/^   ✓\s+(.+):/);
  if (testCompletionMatch) {
    // Count this as a passed test (CALL *Test subroutine completion)
    testResults.passedTests++;
    return;
  }
  
  // Parse expectation success patterns - look for successful ADDRESS EXPECTATIONS calls
  if (text === 'Expectation passed' || 
      text.includes('✅ Expectation passed:') || 
      text.includes('✅ PASS:') || 
      text.includes('PASS:') ||
      (text.includes('should be') && !text.includes('FAIL'))) {
    
    // Count total expectations that actually executed
    testResults.totalExpectations = (testResults.totalExpectations || 0) + 1;
    testResults.passedExpectations = (testResults.passedExpectations || 0) + 1;
    return;
  }
  
  // Parse expectation failure patterns  
  if (text === 'Expectation failed' || text.startsWith('Expectation failed:') || text.includes('❌ Expectation failed:') || text.includes('❌ FAIL:') || text.includes('FAIL:')) {
    
    // Count total expectations that actually executed (even failures)
    testResults.totalExpectations = (testResults.totalExpectations || 0) + 1;
    testResults.failedExpectations = (testResults.failedExpectations || 0) + 1;
    return;
  }
  
}

async function runTestFile(filePath, options = {}) {
  // Read the test file and do static analysis outside try block so it's available in catch
  if (!fs.existsSync(filePath)) {
    return { code: 1, error: `Test file not found: ${filePath}` };
  }

  const rexxCode = fs.readFileSync(filePath, 'utf8');

  // Parse skip annotations from the test file
  const skippedTests = parseSkippedTests(filePath);

  // Parse requirement annotations from the test file
  const testRequirements = parseTestRequirements(filePath);

  // Clear expectation and test counters before running this file
  const expectationCounterFile = '.rexxt-expectations-count.tmp';
  const testCounterFile = '.rexxt-test-count.tmp';
  try {
    if (fs.existsSync(expectationCounterFile)) {
      fs.unlinkSync(expectationCounterFile);
    }
    if (fs.existsSync(testCounterFile)) {
      fs.unlinkSync(testCounterFile);
    }
  } catch (error) {
    // Ignore cleanup errors
  }

  // Test counting will be done at runtime by the TestRexxInterpreter
  const testSubroutines = [];
  const testCallCount = 0;

  try {
    // Import the executor
    const { executeScript } = require('./executor.js');
    
    // Capture output from SAY statements
    let capturedOutput = [];
    let testResults = {
      totalTests: testCallCount, // Use actual CALL count instead of runtime parsing
      passedTests: 0,
      failedTests: 0,
      totalExpectations: 0
    };
    
    // Create output handler for SAY statements
    const outputHandler = {
      output: (text) => {
        capturedOutput.push(text);
        
        // Parse test structure from SAY output
        parseTestOutput(text, testResults);
        
        if (options.verbose || options.verboseOutput || options.liveOutput) {
          console.log(text);
        }
      }
    };
    
    const { ADDRESS_EXPECTATIONS_HANDLER } = require('./expectations-address.js');

    // Create a test address sender that handles ADDRESS commands
    class TestAddressSender {
      constructor() {
        this.interpreter = null; // Will be set by the interpreter
      }
      
      setInterpreter(interpreter) {
        this.interpreter = interpreter;
      }
      
      async send(address, command, params = {}) {
        // Handle default ADDRESS calls
        if (address.toUpperCase() === 'EXPECTATIONS') {
          const result = await ADDRESS_EXPECTATIONS_HANDLER(command, params);
          if (!result.success) {
            // In a real script, this would set RC and continue.
            // For the test runner, we want to stop execution on failure.
            console.error(`Expectation failed: ${result.error}`);
            process.exit(1);
          }
          return result;
        }
        if (address === 'default') {
          return { status: 'ignored', result: 'Default ADDRESS call ignored' };
        }
        
        // Check if the interpreter has registered this ADDRESS target
        if (this.interpreter && this.interpreter.addressTargets) {
          if (this.interpreter.addressTargets.has(address)) {
            const target = this.interpreter.addressTargets.get(address);
            if (target && target.handler) {
              return await target.handler(command, params);
            }
          }
        }
        
        // For other addresses, throw error like CLI fallback handler
        const error = new Error(`ADDRESS handler '${address}' not found in test mode.`);
        error.address = address;
        error.command = command;
        error.params = params;
        throw error;
      }
    }
    
    const testAddressSender = new TestAddressSender();
    
    // Import TestRexxInterpreter for test execution with enhanced test functions
    const { TestRexxInterpreter } = require('./test-interpreter.js');
    const { parse } = require('./parser');
    
    const commands = parse(rexxCode);
    
    // Debug: Show what the parser actually generated for debugging (but not for live-output)
    if ((options.verbose || options.verboseOutput) && !options.liveOutput) {
      console.log('🔍 Parser generated commands:');
      commands.slice(0, 10).forEach((cmd, i) => {
        console.log(`  ${i+1}. ${cmd.type}: ${JSON.stringify(cmd).substring(0, 100)}...`);
      });
      if (commands.length > 10) {
        console.log(`  ... and ${commands.length - 10} more commands`);
      }
      console.log('');
    }
    
    // Pass .*Test$ as default argument when no script arguments provided
    const scriptArgs = options.scriptArgs && options.scriptArgs.length > 0 ? options.scriptArgs : ['.*Test$'];

    // Merge skip information, requirements, and honor-skip flag into options
    const testOptions = {
      ...options,
      skippedTests: skippedTests,
      testRequirements: testRequirements,
      honorSkip: options.honorSkip !== false // Default to true
    };

    const interpreter = new TestRexxInterpreter(testAddressSender, {}, outputHandler, scriptArgs, testOptions);

    // Set the interpreter reference in the address sender so it can check registered ADDRESS targets
    testAddressSender.setInterpreter(interpreter);

    await interpreter.run(commands, rexxCode, filePath);
    
    // Read actual expectation count from temp file
    let actualExpectationCount = 0;
    try {
      if (fs.existsSync(expectationCounterFile)) {
        const content = fs.readFileSync(expectationCounterFile, 'utf8').trim();
        actualExpectationCount = parseInt(content) || 0;
        // Clean up temp file
        fs.unlinkSync(expectationCounterFile);
      }
    } catch (error) {
      // If we can't read the count, leave it as 0
    }

    // Read actual test count from temp file
    let actualTestCount = 0;
    try {
      if (fs.existsSync(testCounterFile)) {
        const content = fs.readFileSync(testCounterFile, 'utf8').trim();
        actualTestCount = parseInt(content) || 0;
        // Clean up temp file
        fs.unlinkSync(testCounterFile);
      }
    } catch (error) {
      // If we can't read the count, leave it as 0
    }

    // Read actual test results from temp file
    const testResultsFile = '.rexxt-test-results.tmp';
    let actualTestResults = null;
    try {
      if (fs.existsSync(testResultsFile)) {
        const content = fs.readFileSync(testResultsFile, 'utf8');
        actualTestResults = JSON.parse(content);
        // Clean up temp file
        fs.unlinkSync(testResultsFile);
      }
    } catch (error) {
      // If we can't read test results, use defaults
    }

    // Update testResults with actual counts
    if (actualTestResults) {
      testResults = {
        ...actualTestResults,
        totalTests: actualTestCount,
        passedTests: actualTestCount, // All executed tests passed (if we got here)
        totalExpectations: actualExpectationCount,
        passedExpectations: actualExpectationCount // All executed expectations passed
      };
    } else {
      testResults.totalTests = actualTestCount;
      testResults.passedTests = actualTestCount;
      testResults.totalExpectations = actualExpectationCount;
      testResults.passedExpectations = actualExpectationCount;
    }

    return { 
      code: 0, 
      stdout: capturedOutput.join('\n'),
      stderr: '',
      testResults: testResults,
      expectationCount: actualExpectationCount,
      testSubroutines: testSubroutines
    };
    
  } catch (error) {
    // Even on failure, return static test count so failed tests are included in totals
    return { 
      code: 1, 
      error: error.message,
      stdout: '',
      stderr: error.stack || error.message,
      testResults: {
        totalTests: testCallCount, // Include static test count for failed files
        passedTests: 0,
        failedTests: testCallCount, // All tests in failed file are considered failed
        totalExpectations: 0,
        passedExpectations: 0,
        failedExpectations: 0
      }
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Show help if no args or help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  // Navigate only mode
  if (args.includes('--navigate') && !args.includes('--run-and-navigate')) {
    const navigatorPath = path.join(__dirname, 'tools', 'test-navigator.js');
    const { spawn } = require('child_process');
    
    const child = spawn('node', [navigatorPath], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    return new Promise((resolve) => {
      child.on('close', (code) => {
        process.exit(code);
      });
    });
  }
  
  // Parse options
  const options = {
    patterns: [],
    tags: [],
    verbose: false,
    verboseOutput: args.includes('--verbose-output'),
    liveOutput: args.includes('--live-output'),
    showPassingExpectations: args.includes('--show-passing-expectations'),
    rerunFailuresWithVerbose: args.includes('--rerun-failures-with-verbose'),
    timeout: 30000,
    runAndNavigate: args.includes('--run-and-navigate'),
    honorSkip: !args.includes('--no-honor-skip'), // Default: true (honor @skip)
    scriptArgs: []
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--pattern' && i + 1 < args.length) {
      options.patterns.push(args[++i]);
    } else if (arg === '--tags' && i + 1 < args.length) {
      options.tags = args[++i].split(',').map(t => t.trim());
    } else if (arg === '--timeout' && i + 1 < args.length) {
      options.timeout = parseInt(args[++i]) || 30000;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--verbose-output') {
      options.verboseOutput = true;
    } else if (arg === '--live-output') {
      options.liveOutput = true;
    } else if (!arg.startsWith('--') && arg.endsWith('.rexx')) {
      options.patterns.push(arg);
    } else if (!arg.startsWith('--')) {
      options.scriptArgs.push(arg);
    }
  }
  
  // Find test files
  const testFiles = await findTestFiles(options.patterns, options.tags);
  
  if (testFiles.length === 0) {
    console.log(`${Colors.yellow}ℹ️  No test files found${Colors.reset}`);
    if (options.patterns.length > 0) {
      console.log(`${Colors.dim}Patterns: ${options.patterns.join(', ')}${Colors.reset}`);
    }
    if (options.tags.length > 0) {
      console.log(`${Colors.dim}Tags: ${options.tags.join(', ')}${Colors.reset}`);
    }
    console.log(`${Colors.dim}Looking for .rexx files...${Colors.reset}`);
    return;
  }
  
  console.log(`${Colors.blue}🧪 Running ${testFiles.length} test file(s)${Colors.reset}`);
  if (options.tags.length > 0) {
    console.log(`${Colors.dim}Tags: ${options.tags.join(', ')}${Colors.reset}`);
  }
  
  // Show subset mode indication if specific scriptArgs were provided
  if (options.scriptArgs && options.scriptArgs.length > 0) {
    console.log(`${Colors.yellow}🔍 Subset mode: filtering tests matching pattern "${options.scriptArgs.join(' ')}"${Colors.reset}`);
  }
  
  console.log('');
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalFiles = 0;
  let anyNavigated = false;
  let allTestResults = [];
  let fileResults = []; // Track raw results for expectation counting
  let failedFiles = []; // Track failed files for rerun feature
  const startTime = new Date().toISOString();
  
  for (const testFile of testFiles) {
    totalFiles++;
    const fileTags = parseTestTags(testFile);
    
    console.log(`${Colors.cyan}📄 ${testFile}${Colors.reset}`);
    if (fileTags.length > 0) {
      console.log(`   ${Colors.dim}🏷️  ${fileTags.join(', ')}${Colors.reset}`);
    }
    
    const result = await runTestFile(testFile, options);
    fileResults.push(result); // Store raw result for later analysis
    
    if (result.code === 0) {
      // Show test execution results from runtime (only if tests were actually executed)
      if (result.testResults && result.testResults.tests && result.testResults.tests.length > 0) {
        const testCount = result.testResults.tests.length;
        console.log(`   ${Colors.cyan}📦 ${testCount} test${testCount === 1 ? '' : 's'} executed${Colors.reset}`);
      }
      
      // Show detailed test/expectation counts
      if (result.testResults) {
        const testCount = result.testResults.totalTests;
        const expectationCount = result.testResults.totalExpectations || 0;
        const passedExpectations = result.testResults.passedTests || 0;
        
        let summaryParts = [];
        if (testCount > 0) {
          summaryParts.push(`${testCount} test${testCount === 1 ? '' : 's'}`);
        }
        // Use pre-counted expectations from source if runtime count is 0
        const actualExpectationCount = expectationCount || result.expectationCount || 0;
        if (actualExpectationCount > 0) {
          summaryParts.push(`${actualExpectationCount} expectation${actualExpectationCount === 1 ? '' : 's'}`);
        }
        
        const summaryText = summaryParts.length > 0 ? ` (${summaryParts.join(', ')})` : '';
        console.log(`   ${Colors.green}✅ Success${summaryText}${Colors.reset}`);
      } else if (result.testSubroutines && result.testSubroutines.length > 0) {
        const totalTests = result.testSubroutines.reduce((acc, sub) => acc + sub.testCount, 0);
        const totalExpectations = result.testSubroutines.reduce((acc, sub) => acc + sub.expectationCount, 0);
        
        let summaryParts = [];
        summaryParts.push(`${result.testSubroutines.length} test group${result.testSubroutines.length === 1 ? '' : 's'}`);
        if (totalTests > 0) {
          summaryParts.push(`${totalTests} test${totalTests === 1 ? '' : 's'}`);
        }
        if (totalExpectations > 0) {
          summaryParts.push(`${totalExpectations} expectation${totalExpectations === 1 ? '' : 's'}`);
        }
        
        const summaryText = summaryParts.length > 0 ? ` (${summaryParts.join(', ')})` : '';
        console.log(`   ${Colors.green}✅ Success${summaryText}${Colors.reset}`);
      } else {
        console.log(`   ${Colors.green}✅ Success${Colors.reset}`);
      }
      totalPassed++;
    } else {
      console.log(`   ${Colors.red}❌ Failed (code: ${result.code})${Colors.reset}`);
      totalFailed++;
      failedFiles.push(testFile); // Track failed file for potential rerun
      
      if (result.error) {
        const formattedError = formatErrorWithCausalChain(result.error, result.stderr);
        console.log(`   ${Colors.red}Error: ${formattedError}${Colors.reset}`);
      }
      
      if (result.stderr && result.stderr !== result.error) {
        console.log(`   ${Colors.red}Stack trace:${Colors.reset}`);
        const stackLines = result.stderr.split('\n');
        stackLines.slice(0, 5).forEach(line => {
          if (line.trim()) {
            console.log(`   ${Colors.dim}${line}${Colors.reset}`);
          }
        });
        if (stackLines.length > 5) {
          console.log(`   ${Colors.dim}... (${stackLines.length - 5} more lines)${Colors.reset}`);
        }
      }
      
      // Show static analysis even for failed tests
      if (result.testSubroutines && result.testSubroutines.length > 0) {
        console.log(`   ${Colors.yellow}📊 Detected test structure:${Colors.reset}`);
        for (const subroutine of result.testSubroutines) {
          let displayName = subroutine.name;
          if (displayName.endsWith('Tests')) {
            displayName = displayName.slice(0, -5);
          } else if (displayName.endsWith('Test')) {
            displayName = displayName.slice(0, -4);
          }
          displayName = displayName.replace(/([A-Z])/g, ' $1').trim();
          
          let parts = [];
          if (subroutine.testCount > 0) {
            parts.push(`${subroutine.testCount} ${displayName} test${subroutine.testCount === 1 ? '' : 's'}`);
          }
          if (subroutine.expectationCount > 0) {
            parts.push(`${subroutine.expectationCount} expectation${subroutine.expectationCount === 1 ? '' : 's'}`);
          }
          
          console.log(`   ${Colors.yellow}   📦 ${parts.join(', ')}${Colors.reset}`);
        }
      }
    }
    
    // Collect test results for JSON generation
    if (result.testResults) {
      allTestResults.push({
        file: testFile,
        tags: fileTags,
        ...result.testResults
      });
    }
    
    console.log('');
  }
  
  // Rerun failed tests with verbose output if requested
  if (options.rerunFailuresWithVerbose && failedFiles.length > 0) {
    console.log(`${Colors.yellow}🔄 Rerunning ${failedFiles.length} failed test${failedFiles.length === 1 ? '' : 's'} with verbose output...${Colors.reset}`);
    console.log('');
    
    for (const failedFile of failedFiles) {
      console.log(`${Colors.cyan}🔍 Verbose rerun: ${failedFile}${Colors.reset}`);
      console.log(`${Colors.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Colors.reset}`);
      
      // Run with verbose output enabled
      const verboseOptions = {
        ...options,
        verbose: true,
        verboseOutput: true
      };
      
      const result = await runTestFile(failedFile, verboseOptions);
      
      if (result.code === 0) {
        console.log(`${Colors.green}✅ Passed on rerun${Colors.reset}`);
      } else {
        console.log(`${Colors.red}❌ Still failing${Colors.reset}`);
        
        if (result.error) {
          const formattedError = formatErrorWithCausalChain(result.error, result.stderr);
          console.log(`${Colors.red}Error: ${formattedError}${Colors.reset}`);
        }
        
        if (result.stderr && result.stderr !== result.error) {
          console.log(`${Colors.red}Full stack trace:${Colors.reset}`);
          const stackLines = result.stderr.split('\n');
          stackLines.forEach(line => {
            if (line.trim()) {
              console.log(`${Colors.dim}${line}${Colors.reset}`);
            }
          });
        }
      }
      
      console.log(`${Colors.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Colors.reset}`);
      console.log('');
    }
  }
  
  // Generate test-results.json file for TUI navigator
  const endTime = new Date().toISOString();
  const jsonReport = {
    startTime,
    endTime,
    totalTests: allTestResults.reduce((acc, file) => acc + file.totalTests, 0),
    passedTests: allTestResults.reduce((acc, file) => acc + file.passedTests, 0),
    failedTests: allTestResults.reduce((acc, file) => acc + file.failedTests, 0),
    files: allTestResults,
    hierarchy: generateHierarchyFromResults(allTestResults)
  };
  
  // Write results to JSON file
  try {
    fs.writeFileSync('./test-results.json', JSON.stringify(jsonReport, null, 2));
    console.log(`${Colors.dim}📊 Test results saved to: test-results.json${Colors.reset}`);
  } catch (error) {
    console.log(`${Colors.yellow}⚠️  Could not save test results: ${error.message}${Colors.reset}`);
  }
  
  // Launch navigator if requested
  if (options.runAndNavigate && !anyNavigated) {
    anyNavigated = true;
    console.log('');
    console.log(`${Colors.blue}🚀 Launching Test Navigator...${Colors.reset}`);
    
    const navigatorPath = path.join(__dirname, 'tools', 'test-navigator.js');
    const { spawn } = require('child_process');
    
    const navChild = spawn('node', [navigatorPath], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    await new Promise((resolve) => {
      navChild.on('close', resolve);
    });
  }
  
  // Calculate test statistics
  const totalIndividualTests = allTestResults.reduce((acc, file) => acc + file.totalTests, 0);
  const totalIndividualPassed = allTestResults.reduce((acc, file) => acc + file.passedTests, 0);
  const totalIndividualFailed = allTestResults.reduce((acc, file) => acc + file.failedTests, 0);
  const totalIndividualSkipped = allTestResults.reduce((acc, file) => acc + (file.skippedTests || 0), 0);

  // Final summary
  console.log(`${Colors.bright}🏁 Summary:${Colors.reset}`);
  console.log(`   ${Colors.cyan}${totalFiles} test source${totalFiles === 1 ? '' : 's'} executed${Colors.reset} (${Colors.green}${totalPassed} passed${Colors.reset}${totalFailed > 0 ? `, ${Colors.red}${totalFailed} failed${Colors.reset}` : ''})`);

  // Calculate totals from actual runtime execution
  const totalExecutedExpectations = allTestResults.reduce((acc, file) => acc + (file.totalExpectations || 0), 0);
  const totalPassedExpectations = allTestResults.reduce((acc, file) => acc + (file.passedExpectations || 0), 0);
  const totalFailedExpectations = allTestResults.reduce((acc, file) => acc + (file.failedExpectations || 0), 0);

  // Note: No separate "test runs" concept - we only show CALL *Test executions

  // Calculate test execution totals (for CALL *Test subroutines)
  const totalExecutedTests = allTestResults.reduce((acc, file) => acc + (file.totalTests || 0), 0);
  const totalPassedTestSubroutines = allTestResults.reduce((acc, file) => acc + (file.passedTestSubroutines || 0), 0);
  const totalFailedTestSubroutines = totalExecutedTests - totalPassedTestSubroutines;

  // Show individual tests within organized structures
  if (totalIndividualTests > 0) {
    const testsPassed = totalIndividualTests - totalIndividualFailed - totalIndividualSkipped;
    let testSummary = `   ${Colors.cyan}${totalIndividualTests} test${totalIndividualTests === 1 ? '' : 's'}${Colors.reset} (${Colors.green}${testsPassed} passed${Colors.reset}`;
    if (totalIndividualFailed > 0) {
      testSummary += `, ${Colors.red}${totalIndividualFailed} failed${Colors.reset}`;
    }
    if (totalIndividualSkipped > 0) {
      testSummary += `, ${Colors.yellow}${totalIndividualSkipped} skipped${Colors.reset}`;
    }
    testSummary += ')';
    console.log(testSummary);
  } else if (totalExecutedTests > 0) {
    // Show test subroutine execution when no organized structure
    const testSubroutinesPassed = totalPassedTestSubroutines;
    const testSubroutinesFailed = totalExecutedTests - totalPassedTestSubroutines;
    console.log(`   ${Colors.cyan}${totalExecutedTests} test${totalExecutedTests === 1 ? '' : 's'}${Colors.reset} (${Colors.green}${testSubroutinesPassed} passed${Colors.reset}${testSubroutinesFailed > 0 ? `, ${Colors.red}${testSubroutinesFailed} failed${Colors.reset}` : ''})`);
  }
  
  // Always show expectations (even if 0)
  const expectationSummary = `   ${Colors.cyan}${totalExecutedExpectations} expectation${totalExecutedExpectations === 1 ? '' : 's'} executed${Colors.reset}${totalPassedExpectations > 0 || totalFailedExpectations > 0 ? ` (${Colors.green}${totalPassedExpectations} passed${Colors.reset}${totalFailedExpectations > 0 ? `, ${Colors.red}${totalFailedExpectations} failed${Colors.reset}` : ''})` : ''}`;
  console.log(expectationSummary);
  
  if (totalFailed > 0) {
    process.exit(1);
  }
}

function camelCaseToEnglish(camelCaseStr) {
  return camelCaseStr
    // Add space before uppercase letters that follow lowercase letters or digits
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    // Handle sequences of uppercase letters (like "XMLHttpRequest" -> "XML Http Request")
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim();
}

function extractTestNamesFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const testNames = [];
    
    // Look for subroutine definitions that end with 'Test:'
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+Test):/);
      if (match) {
        const testName = match[1];
        const englishName = camelCaseToEnglish(testName);
        testNames.push(englishName);
      }
    }
    
    return testNames;
  } catch (error) {
    return [];
  }
}

function generateHierarchyFromResults(allTestResults) {
  const hierarchy = [];
  
  for (const fileResult of allTestResults) {
    const fileNode = {
      type: 'file',
      name: fileResult.file,
      tags: fileResult.tags,
      children: []
    };
    
    // Add individual tests as children if they exist
    if (fileResult.tests && fileResult.tests.length > 0) {
      fileNode.children = fileResult.tests.map(test => ({
        type: 'test',
        name: test.name || 'Unnamed Test',
        passed: test.passed !== false, // Default to true unless explicitly false
        status: test.passed !== false ? 'passed' : 'failed',
        error: test.error || null,
        startTime: test.startTime || null,
        endTime: test.endTime || null,
        output: test.output || []
      }));
    } else {
      // If no individual test data, create virtual test entries based on totalTests
      if (fileResult.totalTests > 0) {
        // Try to extract test subroutine names from the source file
        const testNames = extractTestNamesFromFile(fileResult.file);
        
        if (testNames.length >= fileResult.totalTests) {
          // Use actual test names from source
          for (let i = 0; i < fileResult.totalTests; i++) {
            fileNode.children.push({
              type: 'test',
              name: testNames[i] || `Test ${i + 1}`,
              passed: i < fileResult.passedTests,
              status: i < fileResult.passedTests ? 'passed' : 'failed',
              error: null,
              startTime: null,
              endTime: null,
              output: []
            });
          }
        } else {
          // Fall back to generic names
          for (let i = 0; i < fileResult.totalTests; i++) {
            fileNode.children.push({
              type: 'test',
              name: `Test ${i + 1}`,
              passed: i < fileResult.passedTests,
              status: i < fileResult.passedTests ? 'passed' : 'failed',
              error: null,
              startTime: null,
              endTime: null,
              output: []
            });
          }
        }
      }
    }

    hierarchy.push(fileNode);
  }
  
  return hierarchy;
}

if (require.main === module) {
  main().catch(error => {
    console.error(`${Colors.red}Fatal error: ${error.message}${Colors.reset}`);
    process.exit(1);
  });
}

module.exports = { main };