/*!
 * Spreadsheet Functions Library for RexxJS
 * Provides Excel-like range functions for spreadsheet formulas
 * @rexxjs-meta=SPREADSHEET_FUNCTIONS_META
 */

// Get the spreadsheet adapter from global context (set by the app)
function getAdapter() {
    if (typeof window !== 'undefined' && window.spreadsheetAdapter) {
        return window.spreadsheetAdapter;
    }
    throw new Error('Spreadsheet adapter not available');
}

// SUM a range of cells
function SUM_RANGE(rangeRef) {
    const adapter = getAdapter();
    const values = adapter.getCellRange(rangeRef);
    return values.reduce((sum, val) => {
        const num = parseFloat(val);
        return sum + (isNaN(num) ? 0 : num);
    }, 0);
}

// AVERAGE a range of cells
function AVERAGE_RANGE(rangeRef) {
    const adapter = getAdapter();
    const values = adapter.getCellRange(rangeRef);
    const numbers = values.filter(v => !isNaN(parseFloat(v)));
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((s, v) => s + parseFloat(v), 0);
    return sum / numbers.length;
}

// COUNT non-empty cells in range
function COUNT_RANGE(rangeRef) {
    const adapter = getAdapter();
    const values = adapter.getCellRange(rangeRef);
    return values.filter(v => v !== '' && v !== null && v !== undefined).length;
}

// MIN value in range
function MIN_RANGE(rangeRef) {
    const adapter = getAdapter();
    const values = adapter.getCellRange(rangeRef);
    const numbers = values.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
    return numbers.length > 0 ? Math.min(...numbers) : 0;
}

// MAX value in range
function MAX_RANGE(rangeRef) {
    const adapter = getAdapter();
    const values = adapter.getCellRange(rangeRef);
    const numbers = values.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
    return numbers.length > 0 ? Math.max(...numbers) : 0;
}

// Get cell value by reference
function CELL(ref) {
    const adapter = getAdapter();
    const value = adapter.model.getCellValue(ref);
    const numValue = parseFloat(value);
    return isNaN(numValue) ? value : numValue;
}

// RexxJS library metadata function
function SPREADSHEET_FUNCTIONS_META() {
    return {
        name: 'spreadsheet-functions',
        version: '1.0.0',
        type: 'functions',
        description: 'Spreadsheet range functions for RexxJS',
        functions: [
            'SUM_RANGE',
            'AVERAGE_RANGE',
            'COUNT_RANGE',
            'MIN_RANGE',
            'MAX_RANGE',
            'CELL'
        ]
    };
}

// Export for Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUM_RANGE,
        AVERAGE_RANGE,
        COUNT_RANGE,
        MIN_RANGE,
        MAX_RANGE,
        CELL,
        SPREADSHEET_FUNCTIONS_META
    };
}

// Export for browser/window (required for RexxJS REQUIRE in web mode)
if (typeof window !== 'undefined') {
    window.SUM_RANGE = SUM_RANGE;
    window.AVERAGE_RANGE = AVERAGE_RANGE;
    window.COUNT_RANGE = COUNT_RANGE;
    window.MIN_RANGE = MIN_RANGE;
    window.MAX_RANGE = MAX_RANGE;
    window.CELL = CELL;
    window.SPREADSHEET_FUNCTIONS_META = SPREADSHEET_FUNCTIONS_META;
}
