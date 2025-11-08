# RexxJS App Integration Patterns

This guide covers the general architecture and patterns for integrating RexxJS into desktop and web applications. These patterns are applicable to any application that wants to expose scriptable control via RexxJS.

## Overview

RexxJS can be integrated into applications through a layered architecture:

1. **Pure Model Layer** - Application state and operations independent of any UI
2. **RexxJS Adapter** - Bridges the model to the REXX interpreter
3. **Control Bus** - Remote command interface (HTTP, postMessage, etc.)
4. **Transport Backend** - Server infrastructure (Tauri, HTTP, WebSocket, etc.)

This separation allows the same application logic to be controlled via:
- Interactive UI
- RexxJS scripts (local or remote)
- ARexx-style inter-process communication
- Command-line batch processing
- CI/CD automation

## Architecture Pattern

```
External Rexx Script
    ↓ HTTP/postMessage/IPC
Transport Backend (Tauri, HTTP Server, etc.)
    ↓
Control Bus (Command dispatcher)
    ↓ Method calls
RexxJS Adapter (Variable resolver + custom functions)
    ↓
Pure Model (State + operations)
    ↓
Application Logic
```

## Phase 1: Extract Pure Model

Extract application logic into a model class with no UI dependencies:

```javascript
class AppModel {
    constructor() {
        this.state = this.getDefaultState();
    }

    getDefaultState() {
        return {
            // Application-specific state
        };
    }

    // Core operations
    async loadResource(resourcePath) {
        // Load and initialize
    }

    setParameter(category, param, value) {
        if (this.state[category]?.[param] !== undefined) {
            this.state[category][param] = value;
            return { success: true, value };
        }
        throw new Error(`Unknown parameter: ${category}.${param}`);
    }

    getParameter(category, param) {
        const value = this.state[category]?.[param];
        if (value === undefined) {
            throw new Error(`Unknown parameter: ${category}.${param}`);
        }
        return value;
    }

    getAllState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    reset() {
        this.state = this.getDefaultState();
        return { success: true };
    }

    // Export for serialization
    exportState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    // Import for restoration
    importState(stateData) {
        this.state = JSON.parse(JSON.stringify(stateData));
        return { success: true };
    }
}

export default AppModel;
```

**Key Principles:**
- No UI framework dependencies (React, Vue, etc.)
- No direct DOM manipulation
- Synchronous or Promise-based async operations
- Clear separation between model and presentation
- Encapsulate all state in the model

## Phase 2: Create RexxJS Adapter

Connect the model to the REXX interpreter with a variable resolver and custom functions:

```javascript
class AppRexxAdapter {
    constructor(model) {
        this.model = model;
        this.interpreter = null;
    }

    async initializeInterpreter(RexxInterpreter, parse) {
        this.interpreter = new RexxInterpreter(null, {
            output: (text) => { /* suppress or redirect */ }
        });

        // Set up variable resolver for accessing model parameters
        this.interpreter.variableResolver = (name) => {
            // Parse variable names like CATEGORY_PARAM
            const parts = name.split('_');
            if (parts.length >= 2) {
                const category = parts[0].toLowerCase();
                const param = parts.slice(1).join('_').toLowerCase();
                try {
                    return this.model.getParameter(category, param);
                } catch {
                    return undefined;
                }
            }
            return undefined;
        };

        // Install custom functions
        this.installCustomFunctions();

        return this.interpreter;
    }

    installCustomFunctions() {
        const funcs = this.interpreter.builtinFunctions || {};

        // Parameter access functions
        funcs.SET_PARAMETER = (category, param, value) => {
            return this.model.setParameter(category, param, value);
        };

        funcs.GET_PARAMETER = (category, param) => {
            return this.model.getParameter(category, param);
        };

        funcs.GET_ALL_STATE = () => {
            return this.model.getAllState();
        };

        // State management functions
        funcs.RESET = () => {
            return this.model.reset();
        };

        funcs.EXPORT_STATE = () => {
            return this.model.exportState();
        };

        funcs.IMPORT_STATE = (stateData) => {
            return this.model.importState(stateData);
        };

        // Application-specific functions go here
        // e.g., funcs.APPLY_FILTER, funcs.SET_BRIGHTNESS, etc.

        this.interpreter.builtinFunctions = funcs;
    }

    async evaluate(expression) {
        const wrappedExpression = `LET RESULT = ${expression}`;
        const commands = this.interpreter.parse(wrappedExpression);
        await this.interpreter.run(commands);
        return this.interpreter.getVariable('RESULT');
    }
}

export default AppRexxAdapter;
```

**Key Features:**
- Variable resolver for dynamic parameter access
- Custom functions for model operations
- Support for expression evaluation
- Application-specific extensions

## Phase 3: Create Control Bus

Implement a command dispatcher that handles remote requests:

```javascript
class AppControlBus {
    constructor(model, adapter, uiComponent) {
        this.model = model;
        this.adapter = adapter;
        this.uiComponent = uiComponent;
        this.enabled = false;

        // Define command handlers
        this.commands = {
            // State operations
            getState: this.handleGetState.bind(this),
            setState: this.handleSetState.bind(this),
            getParameter: this.handleGetParameter.bind(this),
            setParameter: this.handleSetParameter.bind(this),
            reset: this.handleReset.bind(this),

            // Resource operations
            load: this.handleLoad.bind(this),
            export: this.handleExport.bind(this),
            import: this.handleImport.bind(this),

            // Script evaluation
            evaluate: this.handleEvaluate.bind(this),

            // Introspection
            listCommands: this.handleListCommands.bind(this),
            getVersion: this.handleGetVersion.bind(this)
        };
    }

    enable() {
        if (this.enabled) return;
        this.enabled = true;

        // Set up message handler for postMessage-based control
        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.handleMessage.bind(this));
        }
    }

    async handleMessage(event) {
        if (!event.data || event.data.type !== 'app-control') {
            return;
        }

        const { command, params, requestId } = event.data;

        try {
            const result = await this.executeCommand(command, params);
            const response = {
                type: 'app-control-response',
                requestId: requestId,
                success: true,
                result: result
            };
            event.source.postMessage(response, event.origin);
        } catch (error) {
            const response = {
                type: 'app-control-response',
                requestId: requestId,
                success: false,
                error: error.message
            };
            event.source.postMessage(response, event.origin);
        }
    }

    async executeCommand(command, params = {}) {
        const handler = this.commands[command];
        if (!handler) {
            throw new Error(`Unknown command: ${command}`);
        }
        return await handler(params);
    }

    // Command handlers
    async handleGetState() {
        return { state: this.model.getAllState() };
    }

    async handleSetParameter(params) {
        const { category, param, value } = params;
        if (!category || !param || value === undefined) {
            throw new Error('Missing parameters: category, param, value');
        }
        const result = this.model.setParameter(category, param, value);
        this.triggerUIUpdate();
        return result;
    }

    async handleGetParameter(params) {
        const { category, param } = params;
        if (!category || !param) {
            throw new Error('Missing parameters: category, param');
        }
        return { value: this.model.getParameter(category, param) };
    }

    async handleLoad(params) {
        const { resourcePath } = params;
        if (!resourcePath) throw new Error('Missing parameter: resourcePath');
        const result = await this.model.loadResource(resourcePath);
        this.triggerUIUpdate();
        return result;
    }

    async handleExport() {
        return { state: this.model.exportState() };
    }

    async handleImport(params) {
        const { state } = params;
        if (!state) throw new Error('Missing parameter: state');
        const result = this.model.importState(state);
        this.triggerUIUpdate();
        return result;
    }

    async handleReset() {
        const result = this.model.reset();
        this.triggerUIUpdate();
        return result;
    }

    async handleEvaluate(params) {
        const { expression } = params;
        if (!expression) throw new Error('Missing parameter: expression');
        const result = await this.adapter.evaluate(expression);
        return { result };
    }

    async handleListCommands() {
        return { commands: Object.keys(this.commands) };
    }

    async handleGetVersion() {
        return {
            version: '1.0',
            name: 'App Control Bus',
            compatibility: 'ARexx-inspired'
        };
    }

    triggerUIUpdate() {
        // Notify UI of state changes
        if (this.uiComponent?.forceUpdate) {
            this.uiComponent.forceUpdate();
        }
        if (this.uiComponent?.update) {
            this.uiComponent.update();
        }
    }
}

export default AppControlBus;
```

**Key Features:**
- Command dispatcher pattern
- postMessage-based communication
- Async/await support
- Error handling with descriptive messages
- UI update triggering

## Phase 4: HTTP Backend (Tauri or Node.js)

For desktop applications, create an HTTP backend to handle external scripts:

### Rust (Tauri) Example

```rust
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;
use std::sync::Arc;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Command {
    pub command: String,
    pub params: serde_json::Value,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Response {
    pub success: bool,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
}

pub struct AppState {
    pending_commands: Arc<Mutex<Vec<Command>>>,
    last_result: Arc<Mutex<Option<Response>>>,
}

#[tauri::command]
pub async fn handle_app_control(
    command: String,
    params: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<Response, String> {
    // Forward command to control bus via postMessage
    // Wait for result from browser via /api/result endpoint
    Ok(Response {
        success: true,
        result: Some(serde_json::json!({})),
        error: None,
    })
}
```

### Key Features:
- Bearer token authentication
- Command queueing
- COMET-style long polling
- Result collection
- Cross-origin request handling

## Phase 5: Integration Examples

### Example 1: Using RexxJS to Control App Programmatically

```rexx
/* Load application */
ADDRESS "http://localhost:8083/api/app" AUTH "dev-token" AS MYAPP

/* Load a resource */
"load resourcePath=/path/to/file.data"

/* Access and modify parameters via variable resolver */
SAY "Current brightness: " || LIGHTS_BRIGHTNESS

/* Set parameters */
"setParameter category=lights param=brightness value=0.5"

/* Apply effects */
"setParameter category=effects param=vignette value=0.3"

/* Export state */
LET exported = "export"
```

### Example 2: Batch Processing Script

```rexx
/* Process multiple resources */
ADDRESS "http://localhost:8083/api/app" AUTH "dev-token" AS MYAPP

LET resources = ["/path/to/file1", "/path/to/file2", "/path/to/file3"]

DO i = 1 TO ARRAY_LENGTH(array=resources)
    LET resource = ARRAY_GET(array=resources, index=i-1)
    SAY "Processing: " || resource

    /* Load resource */
    "load resourcePath=" || resource

    /* Apply standard adjustments */
    "setParameter category=lights param=brightness value=1.1"
    "setParameter category=effects param=clarity value=0.4"

    /* Export result */
    LET result = "export"

    SAY "  ✓ Completed: " || resource
END

SAY "Batch processing complete!"
```

### Example 3: CI/CD Integration

```yaml
# GitHub Actions workflow
- name: Process resources with RexxJS
  run: |
    # Start app with control bus
    ./app-backend --control-bus &
    sleep 2

    # Run RexxJS batch script
    cd scripts
    rexx batch-process.rexx
```

## Testing Strategy

### Unit Testing

Test the model in isolation with Jest:

```javascript
describe('AppModel', () => {
    let model;

    beforeEach(() => {
        model = new AppModel();
    });

    test('should initialize with default state', () => {
        expect(model.state.lights.brightness).toBe(0);
    });

    test('should set and get parameters', () => {
        model.setParameter('lights', 'brightness', 0.5);
        expect(model.getParameter('lights', 'brightness')).toBe(0.5);
    });

    test('should reset to default state', () => {
        model.setParameter('lights', 'brightness', 0.5);
        model.reset();
        expect(model.getParameter('lights', 'brightness')).toBe(0);
    });
});
```

### Integration Testing

Test with RexxJS scripts using Rexxt:

```rexx
/* test-app-integration.rexx */

ADDRESS "http://localhost:8083/api/app" AUTH "dev-token" AS MYAPP

/* Test 1: Version check */
ADDRESS TEST
EXPECT getVersion.version EQUALS "1.0"

/* Test 2: Reset functionality */
"reset"
LET state = "getState"
EXPECT state.state.lights.brightness EQUALS 0

/* Test 3: Parameter setting */
"setParameter category=lights param=brightness value=0.5"
LET value = "getParameter category=lights param=brightness"
EXPECT value.value EQUALS 0.5

SAY "All integration tests passed!"
```

## Security Considerations

1. **Authentication**: Always use bearer tokens or similar mechanisms
2. **Authorization**: Validate commands against a whitelist
3. **Rate Limiting**: Implement rate limits on API endpoints
4. **Input Validation**: Validate all parameters from external sources
5. **Sandboxing**: Run scripts in isolated processes when possible

```javascript
// Example: Simple token validation
const validTokens = new Set(['dev-token-12345', 'prod-token-xyz']);

function validateAuth(authHeader) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !validTokens.has(token)) {
        throw new Error('Invalid authentication token');
    }
}

// Example: Command whitelist
const allowedCommands = new Set([
    'getState',
    'setParameter',
    'getParameter',
    'load',
    'export',
    'reset'
]);

function validateCommand(command) {
    if (!allowedCommands.has(command)) {
        throw new Error(`Command not allowed: ${command}`);
    }
}
```

## Best Practices

1. **Keep Model Pure**: Don't embed HTTP or UI logic in the model
2. **Use Variable Resolver**: Expose frequently-accessed parameters via variable resolver for cleaner REXX code
3. **Provide Custom Functions**: Create REXX functions that wrap complex model operations
4. **Error Handling**: Return clear error messages that help developers debug issues
5. **Versioning**: Include version information in API responses for compatibility checking
6. **Documentation**: Document all available commands and parameters
7. **Testing**: Write tests for both model operations and integration points
8. **State Serialization**: Support import/export for state persistence and batching

## References

- [RexxJS LLM Guide](./LLM.md) - Comprehensive RexxJS documentation
- [Variable Resolver](./variable-resolver.md) - Details on dynamic variable resolution
- [Control Bus](./22-control-bus.md) - Advanced control bus patterns
- [REQUIRE System](./23-require-system.md) - Module loading in RexxJS
- [Testing with Rexxt](./32-testing-rexxt.md) - RexxJS testing framework

## Example Applications

The RexxJS project includes full working examples:

- **Mini Photo Editor** - WebGL2 photo editor with Tauri integration
- **Spreadsheet POC** - Google Sheets integration with REXX control
- See `examples/` directory for source code and integration details

---

**Version**: 1.0
**Last Updated**: 2025-11-08
**Status**: Stable
