# Spreadsheet File Loading

## File Format

The RexxJS Spreadsheet uses a **custom JSON format** (`.json` extension) with the following structure:

```json
{
  "name": "My Spreadsheet",
  "version": "1.0",
  "setupScript": "-- RexxJS code that runs once on load\nLET TAX_RATE = 0.08\nREQUIRE \"path/to/library.js\"",
  "cells": {
    "A1": {
      "value": "Hello",
      "expression": null,
      "format": null,
      "comment": "A simple text cell"
    },
    "B1": {
      "value": "HELLO",
      "expression": "UPPER(A1)",
      "format": null,
      "comment": null
    },
    "C1": {
      "value": "120",
      "expression": "100 + 20",
      "format": "currency",
      "comment": "Result of calculation"
    }
  },
  "metadata": {
    "rows": 100,
    "cols": 26,
    "created": "2025-11-05T18:00:00.000Z",
    "modified": "2025-11-05T18:00:00.000Z"
  }
}
```

### Key Fields

- **`name`**: Display name for the spreadsheet
- **`version`**: Format version (currently "1.0")
- **`setupScript`**: RexxJS code executed once when the file loads
  - Perfect for loading function libraries with `REQUIRE` statements
  - Define global variables (e.g., `LET TAX_RATE = 0.08`)
- **`cells`**: Object with cell references as keys
  - **`value`**: The computed/displayed value
  - **`expression`**: The RexxJS formula (without the `=` prefix)
  - **`format`**: Optional format specification
  - **`comment`**: Optional cell comment
- **`metadata`**: Spreadsheet dimensions and timestamps

## Loading Files in Tauri Mode

### Option 1: With File Path (Recommended)

Load a specific spreadsheet file on startup:

```bash
# Pass file path as first argument
npm run tauri:dev:file /path/to/my-spreadsheet.json

# Or with relative path
npm run tauri:dev:file ./sample-budget.json

# Or absolute path
npm run tauri:dev:file ~/Documents/budget-2025.json
```

### Option 2: Without File Path

Launch with sample data (useful for testing):

```bash
npm run tauri:dev
```

This loads the default sample data programmatically.

## Loading Files in Web Mode

### Via URL Hash Parameter

```bash
# Start Vite dev server
npm run dev:vite

# Then open in browser with hash parameter:
http://localhost:5173/#load=sample-budget.json
http://localhost:5173/#load=/absolute/path/to/file.json
http://localhost:5173/#load=https://example.com/spreadsheet.json
```

**Note**: Web mode has same-origin restrictions - files must be served from the same domain or via CORS-enabled endpoints.

## Creating New Spreadsheet Files

### From the UI

1. Build your spreadsheet in the app
2. Use the Control Bus to export: (Documentation for this coming soon)
   ```javascript
   window.SpreadsheetControlBus.export()
   ```
3. Save the returned JSON to a `.json` file

### Manually

Create a JSON file following the format above. Minimal example:

```json
{
  "name": "New Sheet",
  "version": "1.0",
  "cells": {
    "A1": { "value": "Hello", "expression": null }
  },
  "metadata": {
    "rows": 100,
    "cols": 26
  }
}
```

## Example Files

- **`sample-budget.json`**: Budget spreadsheet with tax calculations
  - Demonstrates `setupScript` with global variables
  - Shows cell dependencies and formulas
  - Uses `SUM_RANGE()` function

## Technical Details

- **File Extension**: `.json` (plain JSON)
- **Encoding**: UTF-8
- **Max File Size**: Limited by Tauri filesystem API (typically 100MB+)
- **Cell References**: Standard Excel notation (A1, B2, AA100, etc.)
- **Formula Syntax**: RexxJS expressions (not Excel formulas)
  - Use `UPPER(A1)` not `=UPPER(A1)`
  - Use `SUM_RANGE("A1:A10")` not `SUM(A1:A10)`

## Troubleshooting

### "Failed to load spreadsheet from file"
- Check that the file path is correct and absolute
- Ensure the JSON is valid (use a JSON validator)
- Verify Tauri has filesystem permissions (should be automatic)

### "setupScript execution failed"
- Check for syntax errors in the RexxJS code
- Ensure `REQUIRE` paths are correct and accessible
- Look at console logs for detailed error messages

### File not loading in web mode
- Check browser console for CORS errors
- Ensure the file is served from the same origin
- Try using `npm run dev:vite` and the hash parameter method
