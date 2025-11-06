/*!
 * rexxjs/pyodide-address v1.2.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=PYODIDE_ADDRESS_META
 */
/**
 * Pyodide ADDRESS Library - Provides Python execution via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 *
 * Usage:
 *   REQUIRE "pyodide-address"
 *   ADDRESS PYODIDE
 *   LET result = run code="print('Hello, World!')"
 *
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

// Import pyodide if available
let pyodide = null;
let pyodideVersion = null;
try {
  if (typeof require !== 'undefined') {
    pyodide = require('pyodide');
    if (pyodide && pyodide.version) {
      pyodideVersion = pyodide.version;
    }
  } else if (typeof window !== 'undefined') {
    // Check for CDN-loaded pyodide (has loadPyodide function)
    if (typeof window.loadPyodide === 'function') {
      pyodide = window; // Use window as pyodide object for CDN version
    } else if (window.pyodide) {
      pyodide = window.pyodide;
      if (pyodide && pyodide.version) {
        pyodideVersion = pyodide.version;
      }
    }
  }
} catch (e) {
  // Pyodide is expected to be loaded externally
}

let pyodideInstance = null;
let pyodideLoadingPromise = null;
const pyodideContext = new Map();

// Function to initialize Pyodide
async function getPyodide() {
    if (pyodideInstance) {
        return pyodideInstance;
    }

    if (pyodideLoadingPromise) {
        return pyodideLoadingPromise;
    }

    // New API (v0.20+)
    console.log("Loading Pyodide...");
    pyodideLoadingPromise = pyodide.loadPyodide();

    pyodideInstance = await pyodideLoadingPromise;
    console.log("Pyodide loaded successfully.");
    pyodideLoadingPromise = null;
    return pyodideInstance;
}


// Pyodide ADDRESS metadata function
function PYODIDE_ADDRESS_META() {
  // Pyodide works in both Node.js and browser environments
  return {
    canonical: "org.rexxjs/pyodide-address",
    type: 'address-handler',
    name: 'Pyodide Execution Service',
    version: '1.2.0',
    description: 'Python execution via ADDRESS interface using Pyodide',
    provides: {
      addressTarget: 'pyodide',
      handlerFunction: 'ADDRESS_PYODIDE_HANDLER',
      commandSupport: true,
      methodSupport: true
    },
    dependencies: {
      "pyodide": "0.28.3"
    },
    envVars: [],
    loaded: true,
    requirements: {
      environment: 'both',  // Works in both Node.js and browser
      modules: ['pyodide']
    },
    pyodideAvailable: typeof pyodide !== 'undefined',
    pyodideVersion: typeof pyodideVersion !== 'undefined' ? pyodideVersion : null
  };
}

// Registry-style detection function for "org.rexxjs/pyodide-address"
function ORG_REXXJS_PYODIDE_ADDRESS_META() {
  return PYODIDE_ADDRESS_META();
}

// ADDRESS target handler function
async function ADDRESS_PYODIDE_HANDLER(method, params) {
  const pyodide = await getPyodide();

  try {
    let result;
    // Handle command-string style
    if (typeof method === 'string' && !params) {
        if (method.trim().startsWith('load_package')) {
            const packages = method.trim().substring('load_package'.length).trim();
            if (!packages) {
                throw new Error('No packages specified for load_package.');
            }
            await pyodide.loadPackage(packages.split(',').map(p => p.trim()));
            return { success: true, output: `Package(s) '${packages}' loaded.` };
        }

        result = await pyodide.runPythonAsync(method);
        return {
            success: true,
            result: result,
            output: result,
            errorCode: 0
        };
    }

    switch (method.toLowerCase()) {
      case 'run':
      case 'exec':
        const code = params.code || params.script;
        if (typeof code !== 'string') {
          throw new Error('The "code" parameter must be a string.');
        }
        // Set context variables
        for (const [key, value] of pyodideContext.entries()) {
          pyodide.globals.set(key, value);
        }
        
        // Capture stdout from print statements
        const captureCode = `
import sys
from io import StringIO

# Capture stdout
old_stdout = sys.stdout
sys.stdout = captured_output = StringIO()

# Execute the user code
${code}

# Get the captured output and restore stdout
captured_text = captured_output.getvalue()
sys.stdout = old_stdout

# Return the captured output
captured_text
`;
        
        result = await pyodide.runPythonAsync(captureCode);
        return {
            success: true,
            result: result,
            output: result || '',
            errorCode: 0
        };
      case 'execute':
        const command = params.command;
        if (typeof command !== 'string') {
          throw new Error('The "command" parameter must be a string.');
        }
        
        // Check if command contains load_package - handle specially for package loading
        if (command.includes('load_package')) {
            // Split into lines and handle load_package lines first
            const lines = command.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const loadPackageLines = lines.filter(line => line.startsWith('load_package'));
            const pythonLines = lines.filter(line => !line.startsWith('load_package'));
            
            // Load packages first
            for (const line of loadPackageLines) {
                const packages = line.substring('load_package'.length).trim();
                if (packages) {
                    await pyodide.loadPackage(packages.split(',').map(p => p.trim()));
                }
            }
            
            // Execute remaining Python code as a single script if any
            if (pythonLines.length > 0) {
                const pythonScript = pythonLines.join('\n');
                // Set context variables
                for (const [key, value] of pyodideContext.entries()) {
                  pyodide.globals.set(key, value);
                }
                result = await pyodide.runPythonAsync(pythonScript);
            } else {
                result = 'Package(s) loaded successfully.';
            }
        } else {
            // No package loading - execute the entire command as multi-line Python script
            // Set context variables
            for (const [key, value] of pyodideContext.entries()) {
              pyodide.globals.set(key, value);
            }
            result = await pyodide.runPythonAsync(command);
        }
        
        return {
            success: true,
            result: result,
            output: result,
            errorCode: 0
        };
      case 'run_file':
        const file = params.file;
        if (typeof file !== 'string') {
          throw new Error('The "file" parameter must be a string.');
        }
        const response = await fetch(file);
        const pythonCode = await response.text();
        result = await pyodide.runPythonAsync(pythonCode);
        return {
            success: true,
            result: result,
            output: result,
            errorCode: 0
        };
      case 'status':
        const loadedPackages = pyodide.loadedPackages;
        const contextKeys = Array.from(pyodideContext.keys());
        return {
            success: true,
            result: {
                pyodideVersion: pyodide.version,
                status: 'loaded',
                loadedPackages: loadedPackages,
                contextKeys: contextKeys
            },
            output: 'loaded',
            errorCode: 0
        };
      case 'set_context':
        const key = params.key;
        const value = params.value;
        if (typeof key !== 'string') {
          throw new Error('The "key" parameter must be a string.');
        }
        pyodideContext.set(key, value);
        return { success: true, output: `Context variable '${key}' set.` };
      case 'get_context':
        const getKey = params.key;
        if (typeof getKey !== 'string') {
          throw new Error('The "key" parameter must be a string.');
        }
        return { success: true, result: pyodideContext.get(getKey) };
      case 'clear_context':
        pyodideContext.clear();
        return { success: true, output: 'Context cleared.' };
      case 'new_session':
      case 'reset_session':
        // Clear Python globals (reset the Python namespace)
        await pyodide.runPythonAsync(`
import sys
# Get all variable names in globals
vars_to_delete = [name for name in globals() if not name.startswith('__')]
# Delete each user-defined variable
for name in vars_to_delete:
    del globals()[name]
`);
        // Clear our context map
        pyodideContext.clear();
        return { success: true, output: 'New Python session started. All variables cleared.' };
      case 'close_session':
        // Clear Python globals
        await pyodide.runPythonAsync(`
import sys
# Get all variable names in globals
vars_to_delete = [name for name in globals() if not name.startswith('__')]
# Delete each user-defined variable  
for name in vars_to_delete:
    del globals()[name]
`);
        // Clear our context map
        pyodideContext.clear();
        return { success: true, output: 'Python session closed. All variables cleared.' };
      case 'list_variables':
      case 'session_info':
        // Get current Python variables
        const pythonVars = await pyodide.runPythonAsync(`
[name for name in globals() if not name.startswith('__')]
`);
        const contextVars = Array.from(pyodideContext.keys());
        return { 
          success: true, 
          result: {
            pythonVariables: pythonVars,
            contextVariables: contextVars,
            totalVariables: pythonVars.length + contextVars.length
          }
        };
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error) {
    return {
        success: false,
        result: null,
        error: error.message,
        output: '',
        errorMessage: error.message,
        errorCode: 1,
    };
  }
}

// ADDRESS target methods metadata
const ADDRESS_PYODIDE_METHODS = {
  run: {
    description: "Execute a Python script.",
    params: ["code"],
    returns: "The result of the Python script."
  },
  exec: {
    description: "Alias for 'run'.",
    params: ["code"],
    returns: "The result of the Python script."
  },
  run_file: {
    description: "Execute a Python script from a file.",
    params: ["file"],
    returns: "The result of the Python script."
  },
  status: {
    description: "Get the status of the Pyodide service.",
    params: [],
    returns: "An object with status information."
  },
  set_context: {
    description: "Set a variable in the Python context.",
    params: ["key", "value"],
    returns: "Status message."
  },
  get_context: {
    description: "Get a variable from the Python context.",
    params: ["key"],
    returns: "The value of the variable."
  },
  clear_context: {
    description: "Clear all variables from the Python context.",
    params: [],
    returns: "Status message."
  },
  new_session: {
    description: "Start a new Python session, clearing all variables.",
    params: [],
    returns: "Status message."
  },
  reset_session: {
    description: "Alias for 'new_session'.",
    params: [],
    returns: "Status message."
  },
  close_session: {
    description: "Close the current Python session, clearing all variables.",
    params: [],
    returns: "Status message."
  },
  list_variables: {
    description: "List all variables in the current Python session.",
    params: [],
    returns: "Object with variable information."
  },
  session_info: {
    description: "Alias for 'list_variables'.",
    params: [],
    returns: "Object with variable information."
  },
  execute: {
    description: "Execute a Python command (used by quoted strings in Rexx).",
    params: ["command"],
    returns: "The result of the Python command."
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.PYODIDE_ADDRESS_META = PYODIDE_ADDRESS_META;
  window.ORG_REXXJS_PYODIDE_ADDRESS_META = ORG_REXXJS_PYODIDE_ADDRESS_META;
  window.ADDRESS_PYODIDE_HANDLER = ADDRESS_PYODIDE_HANDLER;
  window.ADDRESS_PYODIDE_METHODS = ADDRESS_PYODIDE_METHODS;
} else if (typeof global !== 'undefined') {
  global.PYODIDE_ADDRESS_META = PYODIDE_ADDRESS_META;
  global.ORG_REXXJS_PYODIDE_ADDRESS_META = ORG_REXXJS_PYODIDE_ADDRESS_META;
  global.ADDRESS_PYODIDE_HANDLER = ADDRESS_PYODIDE_HANDLER;
  global.ADDRESS_PYODIDE_METHODS = ADDRESS_PYODIDE_METHODS;
}

// Export via CommonJS for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PYODIDE_ADDRESS_META,
    ORG_REXXJS_PYODIDE_ADDRESS_META,
    ADDRESS_PYODIDE_HANDLER,
    ADDRESS_PYODIDE_METHODS
  };
}
