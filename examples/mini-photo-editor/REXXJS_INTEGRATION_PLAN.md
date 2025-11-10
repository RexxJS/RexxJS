# RexxJS Integration Plan for Mini Photo Editor

**Original Project**: https://github.com/xdadda/mini-photo-editor
**License**: MIT (Copyright 2025 xdadda)
**Integration Status**: Planning Phase

## Overview

This document outlines how the Mini Photo Editor would be integrated with Tauri and RexxJS following the patterns established in the spreadsheet-poc example.

## Current Architecture

The Mini Photo Editor is a WebGL2-based photo editor built with:

- **Framework**: Custom `@xdadda/mini` reactive framework
- **Rendering**: `@xdadda/mini-gl` WebGL2 library
- **EXIF**: `@xdadda/mini-exif` for metadata parsing
- **Build**: Vite
- **Type**: ES6 modules

### Key Files

- `src/main.js` - Entry point, renders Editor component
- `src/app.js` - Main Editor component with reactive state
- `src/js/tools.js` - Utility functions (readImage, downloadFile, etc.)
- `src/js/zoom_pan.js` - Canvas interaction
- `src/components/` - UI components (cropper, histogram, etc.)
- `src/_*.js` - Photo editing modules (adjustments, filters, blur, etc.)

### State Management

The Editor component maintains state in a `params` object:

```javascript
let params={
    trs: { translateX, translateY, angle, scale, flipv, fliph },
    crop: { currentcrop, glcrop, canvas_angle, ar, arindex },
    lights: { brightness, exposure, gamma, contrast, shadows, highlights, bloom },
    colors: { temperature, tint, vibrance, saturation, sepia },
    effects: { clarity, noise, vignette },
    curve: { curvepoints },
    filters: { opt, mix },
    perspective: { quad, modified },
    blender: { blendmap, blendmix },
    resizer: { width, height },
    blur: { bokehstrength, bokehlensout, gaussianstrength, ... },
    heal: { healmask }
}
```

## Integration Strategy

### Phase 1: Extract Pure Model

Create a `PhotoEditorModel` class that encapsulates all editing state and operations:

**File: `src/photo-editor-model.js`**

```javascript
class PhotoEditorModel {
    constructor() {
        this.image = null;
        this.metadata = null;
        this.params = this.getDefaultParams();
        this.minigl = null;
    }

    getDefaultParams() {
        return {
            trs: { translateX:0, translateY:0, angle:0, scale:0, flipv:0, fliph:0 },
            crop: { currentcrop:0, glcrop:0, canvas_angle:0, ar:0, arindex:0 },
            lights: { brightness:0, exposure:0, gamma:0, contrast:0, shadows:0, highlights:0, bloom:0 },
            colors: { temperature:0, tint:0, vibrance:0, saturation:0, sepia:0 },
            effects: { clarity:0, noise:0, vignette:0 },
            // ... other params
        };
    }

    async loadImage(imageData, filename) {
        // Extract from openInput() function
        // Load image, parse EXIF, initialize WebGL context
        this.image = imageData;
        this.metadata = await this.parseMetadata(imageData);
        return { success: true, metadata: this.metadata };
    }

    setParameter(category, param, value) {
        if (this.params[category] && this.params[category].hasOwnProperty(param)) {
            this.params[category][param] = value;
            return { success: true, value: value };
        }
        throw new Error(`Unknown parameter: ${category}.${param}`);
    }

    getParameter(category, param) {
        if (this.params[category] && this.params[category].hasOwnProperty(param)) {
            return this.params[category][param];
        }
        throw new Error(`Unknown parameter: ${category}.${param}`);
    }

    getAllParameters() {
        return JSON.parse(JSON.stringify(this.params));
    }

    applyFilter(filterName, intensity = 1.0) {
        // Apply predefined filter
        this.params.filters.opt = this.getFilterIndex(filterName);
        this.params.filters.mix = intensity;
        return { success: true, filter: filterName, intensity: intensity };
    }

    exportImage(format = 'jpeg', quality = 0.9) {
        // Extract from downloadImage component
        // Render final image and return blob
        const canvas = this.minigl.canvas;
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, `image/${format}`, quality);
        });
    }

    reset() {
        this.params = this.getDefaultParams();
        return { success: true };
    }
}

export default PhotoEditorModel;
```

### Phase 2: Create RexxJS Adapter

**File: `src/photo-editor-rexx-adapter.js`**

```javascript
class PhotoEditorRexxAdapter {
    constructor(model) {
        this.model = model;
        this.interpreter = null;
    }

    async initializeInterpreter(RexxInterpreter) {
        this.interpreter = new RexxInterpreter(null, {
            output: (text) => { /* suppress output */ }
        });

        // Set up variableResolver for accessing image parameters
        this.interpreter.variableResolver = (name) => {
            // Allow access to parameters like BRIGHTNESS, CONTRAST, etc.
            const parts = name.split('_');
            if (parts.length === 2) {
                const [category, param] = parts;
                const categoryName = category.toLowerCase();
                const paramName = param.toLowerCase();
                try {
                    return this.model.getParameter(categoryName, paramName);
                } catch {
                    return undefined;
                }
            }
            return undefined;
        };

        // Install custom functions
        this.installPhotoFunctions();

        return this.interpreter;
    }

    installPhotoFunctions() {
        this.interpreter.builtinFunctions = this.interpreter.builtinFunctions || {};

        // Image manipulation functions
        this.interpreter.builtinFunctions.SET_BRIGHTNESS = (value) => {
            return this.model.setParameter('lights', 'brightness', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_CONTRAST = (value) => {
            return this.model.setParameter('lights', 'contrast', parseFloat(value));
        };

        this.interpreter.builtinFunctions.SET_SATURATION = (value) => {
            return this.model.setParameter('colors', 'saturation', parseFloat(value));
        };

        this.interpreter.builtinFunctions.APPLY_FILTER = (filterName, intensity = 1.0) => {
            return this.model.applyFilter(filterName, parseFloat(intensity));
        };

        this.interpreter.builtinFunctions.GET_IMAGE_INFO = () => {
            return {
                width: this.model.metadata?.file?.width,
                height: this.model.metadata?.file?.height,
                size: this.model.metadata?.file?.size,
                format: this.model.metadata?.format
            };
        };

        this.interpreter.builtinFunctions.RESET_ALL = () => {
            return this.model.reset();
        };

        // Range functions for batch parameter setting
        this.interpreter.builtinFunctions.ADJUST_LIGHTS = (brightness, contrast, exposure) => {
            const results = [];
            if (brightness !== undefined) results.push(this.model.setParameter('lights', 'brightness', brightness));
            if (contrast !== undefined) results.push(this.model.setParameter('lights', 'contrast', contrast));
            if (exposure !== undefined) results.push(this.model.setParameter('lights', 'exposure', exposure));
            return { success: true, adjusted: results.length };
        };

        this.interpreter.builtinFunctions.ADJUST_COLORS = (temperature, tint, saturation) => {
            const results = [];
            if (temperature !== undefined) results.push(this.model.setParameter('colors', 'temperature', temperature));
            if (tint !== undefined) results.push(this.model.setParameter('colors', 'tint', tint));
            if (saturation !== undefined) results.push(this.model.setParameter('colors', 'saturation', saturation));
            return { success: true, adjusted: results.length };
        };
    }

    async evaluate(expression) {
        const commands = parse(expression);
        const wrappedExpression = `LET RESULT = ${expression}`;
        const wrappedCommands = parse(wrappedExpression);
        await this.interpreter.run(wrappedCommands);
        return this.interpreter.getVariable('RESULT');
    }
}

export default PhotoEditorRexxAdapter;
```

### Phase 3: Create Control Bus

**File: `src/photo-editor-controlbus.js`**

```javascript
class PhotoEditorControlBus {
    constructor(model, adapter, appComponent) {
        this.model = model;
        this.adapter = adapter;
        this.appComponent = appComponent;
        this.enabled = false;

        this.commands = {
            // Image operations
            loadImage: this.handleLoadImage.bind(this),
            exportImage: this.handleExportImage.bind(this),
            getImageInfo: this.handleGetImageInfo.bind(this),

            // Parameter operations
            setParameter: this.handleSetParameter.bind(this),
            getParameter: this.handleGetParameter.bind(this),
            getAllParameters: this.handleGetAllParameters.bind(this),

            // Adjustment operations
            setBrightness: this.handleSetBrightness.bind(this),
            setContrast: this.handleSetContrast.bind(this),
            setSaturation: this.handleSetSaturation.bind(this),
            setExposure: this.handleSetExposure.bind(this),

            // Filter operations
            applyFilter: this.handleApplyFilter.bind(this),
            listFilters: this.handleListFilters.bind(this),

            // Utility operations
            reset: this.handleReset.bind(this),
            evaluate: this.handleEvaluate.bind(this),

            // Introspection
            listCommands: this.handleListCommands.bind(this),
            getVersion: this.handleGetVersion.bind(this)
        };
    }

    enable() {
        if (this.enabled) return;
        this.enabled = true;

        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.handleMessage.bind(this));
        }
    }

    async handleMessage(event) {
        if (!event.data || event.data.type !== 'photoeditor-control') {
            return;
        }

        const { command, params, requestId } = event.data;

        try {
            const result = await this.executeCommand(command, params);
            const response = {
                type: 'photoeditor-control-response',
                requestId: requestId,
                success: true,
                result: result
            };
            event.source.postMessage(response, event.origin);
        } catch (error) {
            const response = {
                type: 'photoeditor-control-response',
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
    async handleLoadImage(params) {
        const { url, name } = params;
        if (!url) throw new Error('Missing parameter: url');
        const result = await this.model.loadImage(url, name);
        if (this.appComponent?.forceUpdate) {
            this.appComponent.forceUpdate();
        }
        return result;
    }

    async handleExportImage(params) {
        const { format = 'jpeg', quality = 0.9 } = params;
        const blob = await this.model.exportImage(format, quality);
        // Convert blob to base64 for transmission
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve({
                    success: true,
                    format: format,
                    size: blob.size,
                    dataUrl: reader.result
                });
            };
            reader.readAsDataURL(blob);
        });
    }

    async handleGetImageInfo(params) {
        return this.adapter.interpreter.builtinFunctions.GET_IMAGE_INFO();
    }

    async handleSetParameter(params) {
        const { category, param, value } = params;
        if (!category || !param || value === undefined) {
            throw new Error('Missing parameters: category, param, value');
        }
        const result = this.model.setParameter(category, param, parseFloat(value));
        if (this.appComponent?.forceUpdate) {
            this.appComponent.forceUpdate();
        }
        return result;
    }

    async handleGetParameter(params) {
        const { category, param } = params;
        if (!category || !param) {
            throw new Error('Missing parameters: category, param');
        }
        const value = this.model.getParameter(category, param);
        return { category, param, value };
    }

    async handleGetAllParameters() {
        return { parameters: this.model.getAllParameters() };
    }

    async handleSetBrightness(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'lights', param: 'brightness', value });
    }

    async handleSetContrast(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'lights', param: 'contrast', value });
    }

    async handleSetSaturation(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'colors', param: 'saturation', value });
    }

    async handleSetExposure(params) {
        const { value } = params;
        if (value === undefined) throw new Error('Missing parameter: value');
        return await this.handleSetParameter({ category: 'lights', param: 'exposure', value });
    }

    async handleApplyFilter(params) {
        const { name, intensity = 1.0 } = params;
        if (!name) throw new Error('Missing parameter: name');
        const result = this.model.applyFilter(name, intensity);
        if (this.appComponent?.forceUpdate) {
            this.appComponent.forceUpdate();
        }
        return result;
    }

    async handleListFilters() {
        return {
            filters: [
                'grayscale', 'sepia', 'vintage', 'chrome', 'fade',
                'instant', 'transfer', 'mono', 'noir', 'process',
                'tonal', 'none'
            ]
        };
    }

    async handleReset(params) {
        const result = this.model.reset();
        if (this.appComponent?.forceUpdate) {
            this.appComponent.forceUpdate();
        }
        return result;
    }

    async handleEvaluate(params) {
        const { expression } = params;
        if (!expression) throw new Error('Missing parameter: expression');
        const result = await this.adapter.evaluate(expression);
        return { result: result };
    }

    async handleListCommands() {
        return { commands: Object.keys(this.commands) };
    }

    async handleGetVersion() {
        return {
            version: '1.0',
            name: 'Mini Photo Editor Control Bus',
            compatibility: 'ARexx-inspired'
        };
    }
}

export default PhotoEditorControlBus;
```

### Phase 4: Example Control Script

**File: `test-photo-editor.rexx`**

```rexx
/* Test photo editor control via RexxJS */

/* Connect to photo editor */
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Load an image */
"loadImage url=file:///path/to/image.jpg name=test.jpg"
IF RC != 0 THEN DO
    SAY "Failed to load image"
    EXIT 1
END

/* Get image information */
LET info = "getImageInfo"
SAY "Image: " || info.width || "x" || info.height
SAY "Format: " || info.format
SAY "Size: " || info.size || " bytes"

/* Apply adjustments */
"setBrightness value=1.2"
"setContrast value=1.1"
"setSaturation value=0.9"
"setExposure value=0.5"

SAY "Applied basic adjustments"

/* Apply a filter */
"applyFilter name=vintage intensity=0.8"
SAY "Applied vintage filter"

/* Get all current parameters */
LET params = "getAllParameters"
SAY "Brightness: " || params.parameters.lights.brightness
SAY "Contrast: " || params.parameters.lights.contrast
SAY "Saturation: " || params.parameters.colors.saturation

/* Use RexxJS expression evaluation */
LET expr_result = "evaluate expression=LIGHTS_BRIGHTNESS * 2"
SAY "Double brightness: " || expr_result.result

/* Export the result */
"exportImage format=jpeg quality=0.9"
SAY "Image exported successfully"

/* Reset to defaults */
"reset"
SAY "Reset to defaults"

SAY "Photo editing complete!"
```

### Phase 5: Batch Processing Example

**File: `batch-edit.rexx`**

```rexx
/* Batch photo editing script */

ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* List of images to process */
LET images = ["photo1.jpg", "photo2.jpg", "photo3.jpg", "photo4.jpg"]

/* Process each image */
DO i = 1 TO ARRAY_LENGTH(array=images)
    LET filename = ARRAY_GET(array=images, index=i-1)
    SAY "Processing: " || filename

    /* Load image */
    "loadImage url=file:///images/" || filename || " name=" || filename

    /* Apply consistent adjustments */
    "setBrightness value=1.15"
    "setContrast value=1.05"
    "setSaturation value=0.95"

    /* Apply vintage filter */
    "applyFilter name=vintage intensity=0.7"

    /* Export with quality settings */
    "exportImage format=jpeg quality=0.85"

    /* Reset for next image */
    "reset"

    SAY "  ✓ Completed: " || filename
END

SAY "Batch processing complete! Processed " || ARRAY_LENGTH(array=images) || " images"
```

## Implementation Checklist

- [ ] Extract pure model from Editor component
- [ ] Create PhotoEditorModel class
- [ ] Create PhotoEditorRexxAdapter with variableResolver
- [ ] Implement custom photo editing functions
- [ ] Create PhotoEditorControlBus with command handlers
- [ ] Create control bus bridge for Tauri HTTP mode
- [ ] Add Tauri backend (Rust) with HTTP server
- [ ] Configure Vite build to copy RexxJS bundle
- [ ] Create package.json with proper scripts
- [ ] Add Tauri configuration
- [ ] Create development launcher script
- [ ] Write unit tests for model
- [ ] Write integration tests for control bus
- [ ] Write end-to-end tests with Rexx scripts
- [ ] Document API and available commands
- [ ] Build distributable binaries

## Challenges

1. **External Dependencies**: The original project depends on `@xdadda/mini` and `@xdadda/mini-gl` which reference local directories. Need to either:
   - Use the published npm packages if available
   - Bundle these dependencies
   - Replace with standard React/Vue

2. **WebGL Context**: The minigl library manages WebGL contexts. Need to ensure proper initialization and cleanup in the model layer.

3. **State Management**: The original uses a custom reactive framework. Need to extract state management into the model layer.

4. **Canvas Rendering**: The GL pipeline needs to be triggered on parameter changes. The control bus must ensure proper rendering updates.

## Benefits of Integration

Once integrated, the Mini Photo Editor will support:

1. **Command-line Batch Processing**: Process hundreds of photos with a single script
2. **CI/CD Integration**: Automated image processing in build pipelines
3. **Workflow Automation**: Chain photo editing with other tools
4. **Programmatic Control**: Full API access for custom applications
5. **ARexx-style IPC**: Classic Amiga-inspired inter-process communication

## References

- **Integration Guide**: `/Rexxjs_App_Integration.md`
- **Spreadsheet POC**: `/examples/spreadsheet-poc/`
- **Original Project**: https://github.com/xdadda/mini-photo-editor
- **Tauri Docs**: https://tauri.app/
- **RexxJS Docs**: `/LLM.md`

---

**Status**: Planning Phase
**Last Updated**: 2025-11-06
**License**: MIT (This integration plan)
**Original Project License**: MIT (Copyright 2025 xdadda)
