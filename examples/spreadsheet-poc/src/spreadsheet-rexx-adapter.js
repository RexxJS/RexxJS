/**
 * SpreadsheetRexxAdapter - Integration layer between SpreadsheetModel and RexxJS
 *
 * Responsibilities:
 * - Provide cell reference functions to RexxJS (A1(), B2(), etc.)
 * - Create spreadsheet-aware RexxJS interpreter
 * - Support function pipelines (already in RexxJS)
 * - Handle cell range references
 */

class SpreadsheetRexxAdapter {
    constructor(spreadsheetModel) {
        this.model = spreadsheetModel;
        this.interpreter = null;
    }

    /**
     * Initialize RexxJS interpreter with spreadsheet context
     */
    async initializeInterpreter(RexxInterpreter) {
        // Create a custom interpreter that has access to cell references
        const self = this;

        // Create interpreter with custom output handler (suppress output)
        this.interpreter = new RexxInterpreter(null, {
            output: (text) => {
                // Suppress SAY output during cell evaluation
                // console.log('[Cell output]', text);
            }
        });

        // Inject cell reference functions dynamically
        this.injectCellReferenceFunctions();

        return this.interpreter;
    }

    /**
     * Execute setup script (page-level RexxJS code)
     * This runs once when the spreadsheet loads, making REQUIRE'd functions available to all cells
     */
    async executeSetupScript(script) {
        if (!script || script.trim() === '') {
            return { success: true, message: 'No setup script to execute' };
        }

        if (!this.interpreter) {
            throw new Error('Interpreter not initialized');
        }

        try {
            // Parse and execute the setup script
            const commands = parse(script);
            await this.interpreter.run(commands);

            return {
                success: true,
                message: 'Setup script executed successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: `Setup script failed: ${error.message}`
            };
        }
    }

    /**
     * Inject cell reference functions (A1, B2, etc.) into RexxJS context
     * Sets up a variable_missing callback to resolve cell references on-demand
     */
    injectCellReferenceFunctions() {
        const self = this;

        // Set up a variable resolver callback for missing variables
        this.interpreter.variableResolver = function(name) {
            // Check if it's a cell reference pattern (A1, B2, AA10, etc.)
            if (/^[A-Z]+\d+$/.test(name)) {
                const value = self.model.getCellValue(name);
                // Try to parse as number if possible
                const numValue = parseFloat(value);
                return isNaN(numValue) ? value : numValue;
            }

            // Not a cell reference - return undefined to let normal error handling occur
            return undefined;
        };
    }

    /**
     * Get a range of cells as an array
     * Example: A1:A5 returns [A1, A2, A3, A4, A5]
     */
    getCellRange(rangeRef) {
        const [start, end] = rangeRef.split(':');
        const startParsed = SpreadsheetModel.parseCellRef(start);
        const endParsed = SpreadsheetModel.parseCellRef(end);

        const startCol = SpreadsheetModel.colLetterToNumber(startParsed.col);
        const endCol = SpreadsheetModel.colLetterToNumber(endParsed.col);
        const startRow = startParsed.row;
        const endRow = endParsed.row;

        const values = [];

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const ref = SpreadsheetModel.formatCellRef(col, row);
                const value = this.model.getCellValue(ref);
                const numValue = parseFloat(value);
                values.push(isNaN(numValue) ? value : numValue);
            }
        }

        return values;
    }

    /**
     * Extract cell references from an expression
     * Returns array of cell references like ['A1', 'B2', 'C3']
     */
    extractCellReferences(expression) {
        const cellRefPattern = /\b([A-Z]+\d+)\b/g;
        const matches = expression.match(cellRefPattern);
        return matches ? [...new Set(matches)] : [];
    }

    /**
     * Evaluate a RexxJS expression in the spreadsheet context
     */
    async evaluate(expression, spreadsheetModel) {
        if (!this.interpreter) {
            throw new Error('Interpreter not initialized');
        }

        try {
            // NO PRE-INJECTION! Cell references are resolved lazily via variableResolver callback
            // This is more efficient and allows first-class interop

            // Parse and run the expression
            const commands = parse(expression);

            // Create a variable to capture the result
            // We'll wrap the expression to return a value
            let result;

            // If expression is a single line without LET, wrap it
            if (commands.length === 1 && !expression.trim().startsWith('LET')) {
                // It's an expression to evaluate
                const wrappedExpression = `LET CELLRESULT = ${expression}`;
                const wrappedCommands = parse(wrappedExpression);
                await this.interpreter.run(wrappedCommands);
                result = this.interpreter.getVariable('CELLRESULT');
            } else {
                // It's a statement or multi-line script
                await this.interpreter.run(commands);
                // Try to get result from a RESULT variable if set
                result = this.interpreter.getVariable('RESULT') || '';
            }

            return result;
        } catch (error) {
            throw new Error(`Expression error: ${error.message}`);
        }
    }

    /**
     * Create spreadsheet-specific functions for RexxJS
     * These can be loaded via REQUIRE or injected
     */
    getSpreadsheetFunctions() {
        const self = this;

        return {
            // SUM a range of cells
            SUM_RANGE: function(rangeRef) {
                const values = self.getCellRange(rangeRef);
                return values.reduce((sum, val) => {
                    const num = parseFloat(val);
                    return sum + (isNaN(num) ? 0 : num);
                }, 0);
            },

            // AVERAGE a range of cells
            AVERAGE_RANGE: function(rangeRef) {
                const values = self.getCellRange(rangeRef);
                const numbers = values.filter(v => !isNaN(parseFloat(v)));
                if (numbers.length === 0) return 0;
                const sum = numbers.reduce((s, v) => s + parseFloat(v), 0);
                return sum / numbers.length;
            },

            // COUNT non-empty cells in range
            COUNT_RANGE: function(rangeRef) {
                const values = self.getCellRange(rangeRef);
                return values.filter(v => v !== '' && v !== null && v !== undefined).length;
            },

            // MIN value in range
            MIN_RANGE: function(rangeRef) {
                const values = self.getCellRange(rangeRef);
                const numbers = values.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
                return numbers.length > 0 ? Math.min(...numbers) : 0;
            },

            // MAX value in range
            MAX_RANGE: function(rangeRef) {
                const values = self.getCellRange(rangeRef);
                const numbers = values.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
                return numbers.length > 0 ? Math.max(...numbers) : 0;
            },

            // Get cell value by reference
            CELL: function(ref) {
                const value = self.model.getCellValue(ref);
                const numValue = parseFloat(value);
                return isNaN(numValue) ? value : numValue;
            },

            // Get current row (useful in array formulas)
            ROW: function(ref) {
                const parsed = SpreadsheetModel.parseCellRef(ref);
                return parsed.row;
            },

            // Get current column (useful in array formulas)
            COLUMN: function(ref) {
                const parsed = SpreadsheetModel.parseCellRef(ref);
                return SpreadsheetModel.colLetterToNumber(parsed.col);
            }
        };
    }

    /**
     * Install spreadsheet functions into the interpreter
     */
    installSpreadsheetFunctions() {
        const functions = this.getSpreadsheetFunctions();

        // Register functions in the interpreter's builtin functions
        // This makes them available for function calls
        if (!this.interpreter.builtinFunctions) {
            this.interpreter.builtinFunctions = {};
        }

        Object.entries(functions).forEach(([name, func]) => {
            // Register in builtin functions
            this.interpreter.builtinFunctions[name] = func;
        });
    }
}

// Export for Node.js (Jest), ES6 modules, and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpreadsheetRexxAdapter;
}

export default SpreadsheetRexxAdapter;
