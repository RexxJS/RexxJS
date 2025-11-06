# Tauri Desktop Application Setup

This document explains how the Tauri desktop application support was added to the RexxJS Spreadsheet POC.

## Architecture

The spreadsheet app now supports two deployment modes:

### Web Deployment (Original)
- **File**: `index.html`
- **Dependencies**: Loads React, Babel, and RexxJS from CDN or local files
- **Usage**: Open directly in browser via HTTP server

### Desktop Deployment (New - Tauri)
- **Build Tool**: Vite (for bundling React/JSX)
- **Entry Point**: `index-bundled.html`
- **Main Module**: `src/main.jsx`
- **Platform**: Tauri v2 (supports Mac, Windows, Linux)

## Directory Structure

```
examples/spreadsheet-poc/
├── index.html                    # Original web version
├── index-bundled.html            # Tauri/Vite entry point
├── package.json                  # NPM config with Tauri scripts
├── vite.config.js                # Vite build configuration
├── spreadsheet-*.js/css          # Original standalone files (for web)
│
├── src/                          # ES6 modules (for Tauri/Vite build)
│   ├── main.jsx                  # App entry point
│   ├── SpreadsheetApp.jsx        # Main React component
│   ├── spreadsheet-model.js      # Spreadsheet logic
│   └── spreadsheet-rexx-adapter.js  # RexxJS integration
│
├── src-tauri/                    # Tauri configuration
│   ├── tauri.conf.json           # Tauri app config
│   ├── Cargo.toml                # Rust dependencies
│   └── src/                      # Rust backend code
│       └── main.rs
│
├── dist/                         # Vite build output (created by build)
│   ├── index-bundled.html
│   ├── assets/                   # Bundled JS/CSS
│   └── rexxjs.bundle.js          # Copied from core/src/repl/dist/
│
└── tests/                        # Test files (moved from core/)
    ├── spreadsheet-model.spec.js  # Jest unit tests
    └── spreadsheet-poc.spec.js    # Playwright UI tests
```

## Build Process

### 1. RexxJS Bundle
The RexxJS interpreter must be built first:
```bash
cd core/src/repl
npm install
npm run build
# Creates: core/src/repl/dist/rexxjs.bundle.js
```

### 2. Vite Build
Vite bundles the React app and copies the RexxJS bundle:
```bash
cd examples/spreadsheet-poc
npm install
npm run build
# Creates: dist/ directory with bundled app
```

The Vite config includes a custom plugin that copies the RexxJS bundle from `core/src/repl/dist/` to `dist/`.

### 3. Tauri Build
Tauri packages the web app as a native application:
```bash
npm run tauri:build
# Creates platform-specific installers in src-tauri/target/release/bundle/
```

## Key Implementation Details

### Module System
- **Original (Web)**: Uses global `window.SpreadsheetModel`, `window.RexxInterpreter`
- **Bundled (Tauri)**: Uses ES6 imports, but exports to `window` for compatibility

Both models and adapters support dual export:
```javascript
// ES6 export for Vite
export default SpreadsheetModel;

// CommonJS export for Jest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpreadsheetModel;
}
```

### React Components
- **Original**: JSX transformed in-browser by Babel Standalone
- **Bundled**: JSX pre-compiled by Vite during build

The main `SpreadsheetApp.jsx` was modified to:
1. Import React hooks instead of destructuring from global `React`
2. Export the component instead of rendering it directly
3. Let `main.jsx` handle initialization and rendering

### RexxJS Loading
Both versions load RexxJS bundle differently:

**Web version** (`index.html`):
```javascript
const rexxScriptPath = '../../core/src/repl/dist/rexxjs.bundle.js';
```

**Tauri version** (`index-bundled.html`):
```javascript
const rexxScriptPath = './rexxjs.bundle.js'; // From dist/ folder
```

## Development Workflow

### Web Development
```bash
# Terminal 1: Serve files
npx http-server -p 8082 -c-1

# Terminal 2: Open browser
# Navigate to: http://localhost:8082/examples/spreadsheet-poc/index.html
```

### Tauri Development
```bash
# Terminal 1: Start Vite dev server + Tauri
cd examples/spreadsheet-poc
npm run tauri:dev

# Hot reload enabled - changes reflect automatically
```

## Testing

### Unit Tests (Jest)
Located in `tests/spreadsheet-model.spec.js`:
```bash
cd examples/spreadsheet-poc
# Note: Currently run from core/
cd ../../core
npm test -- --testPathPattern=spreadsheet-model
```

### UI Tests (Playwright)
Located in `tests/spreadsheet-poc.spec.js`:
```bash
cd examples/spreadsheet-poc
# Note: Run from project root
cd ../..
PLAYWRIGHT_HTML_OPEN=never npx playwright test examples/spreadsheet-poc/tests/
```

## Changes from Original

1. **Added Files**:
   - `package.json` - NPM configuration
   - `vite.config.js` - Vite build config
   - `index-bundled.html` - Tauri entry point
   - `src/main.jsx` - App initialization
   - `src/SpreadsheetApp.jsx` - Component export version
   - `src-tauri/` - Tauri project files

2. **Modified Files**:
   - `README.md` - Added Tauri instructions
   - `src/spreadsheet-model.js` - Added ES6 export
   - `src/spreadsheet-rexx-adapter.js` - Added ES6 export

3. **Moved Files**:
   - `core/tests/spreadsheet-model.spec.js` → `tests/`
   - `core/tests/web/spreadsheet-poc.spec.js` → `tests/`

## Platform-Specific Builds

When you run `npm run tauri:build`, it creates installers for your current platform:

- **macOS**: `.dmg` disk image, `.app` bundle
- **Windows**: `.msi` installer, `.exe` executable
- **Linux**: `.deb` package, `.AppImage` portable app

Cross-compilation requires platform-specific setup (see Tauri documentation).

## Future Enhancements

Potential improvements enabled by Tauri:

1. **File System Access**: Save/load spreadsheets to local files
2. **Native Menus**: File, Edit, View menus
3. **System Integration**: Drag-and-drop, file associations
4. **Performance**: Native execution vs browser sandbox
5. **Auto-updates**: Built-in update mechanism
6. **Offline Mode**: No internet required

## Troubleshooting

### RexxJS Bundle Not Found
**Error**: "RexxJS bundle not found"
**Solution**: Build the bundle first: `cd core/src/repl && npm run build`

### Vite Build Fails
**Error**: Module not found errors
**Solution**: Ensure all imports use relative paths and files exist in `src/`

### Tauri Dev Won't Start
**Error**: Rust compiler not found
**Solution**: Install Rust: https://www.rust-lang.org/tools/install

### Tests Can't Find Spreadsheet Files
**Error**: Test files not found
**Solution**: Tests were moved to `examples/spreadsheet-poc/tests/`

## References

- [Tauri Documentation](https://tauri.app/)
- [Vite Documentation](https://vitejs.dev/)
- [RexxJS Documentation](../../README.md)
