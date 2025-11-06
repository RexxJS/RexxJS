/**
 * SpreadsheetModel - Core spreadsheet logic (no DOM, pure JS)
 *
 * Responsibilities:
 * - Cell storage and retrieval
 * - A1-style addressing (A1, B2, AA10, etc.)
 * - Track cell values vs expressions
 * - Dependency tracking for recalculation
 * - Evaluation order resolution
 */

class SpreadsheetModel {
    constructor(rows = 100, cols = 26) {
        this.rows = rows;
        this.cols = cols;
        this.cells = new Map(); // key: "A1", value: {value, expression, dependencies}
        this.dependents = new Map(); // key: "A1", value: Set of cells that depend on A1
        this.evaluationInProgress = new Set(); // For circular reference detection
        this.setupScript = ''; // Page-level RexxJS code (REQUIRE statements, etc.)
    }

    /**
     * Convert column letter(s) to number (A=1, B=2, ..., Z=26, AA=27, etc.)
     */
    static colLetterToNumber(col) {
        col = col.toUpperCase();
        let result = 0;
        for (let i = 0; i < col.length; i++) {
            result = result * 26 + (col.charCodeAt(i) - 64);
        }
        return result;
    }

    /**
     * Convert column number to letter(s) (1=A, 2=B, ..., 26=Z, 27=AA, etc.)
     */
    static colNumberToLetter(num) {
        let result = '';
        while (num > 0) {
            let remainder = (num - 1) % 26;
            result = String.fromCharCode(65 + remainder) + result;
            num = Math.floor((num - 1) / 26);
        }
        return result;
    }

    /**
     * Parse cell reference like "A1" into {col: "A", row: 1}
     */
    static parseCellRef(ref) {
        const match = ref.match(/^([A-Z]+)(\d+)$/i);
        if (!match) {
            throw new Error(`Invalid cell reference: ${ref}`);
        }
        return {
            col: match[1].toUpperCase(),
            row: parseInt(match[2], 10)
        };
    }

    /**
     * Format cell reference from {col, row}
     */
    static formatCellRef(col, row) {
        if (typeof col === 'number') {
            col = SpreadsheetModel.colNumberToLetter(col);
        }
        return `${col}${row}`;
    }

    /**
     * Get cell data
     */
    getCell(ref) {
        if (typeof ref === 'object') {
            ref = SpreadsheetModel.formatCellRef(ref.col, ref.row);
        }
        return this.cells.get(ref) || { value: '', expression: null, dependencies: [] };
    }

    /**
     * Get cell value (computed result)
     */
    getCellValue(ref) {
        return this.getCell(ref).value;
    }

    /**
     * Get cell expression (formula)
     */
    getCellExpression(ref) {
        return this.getCell(ref).expression;
    }

    /**
     * Set cell content
     * If content starts with '=', treat as expression
     * Otherwise, treat as literal value
     */
    setCell(ref, content, rexxInterpreter = null, metadata = {}) {
        if (typeof ref === 'object') {
            ref = SpreadsheetModel.formatCellRef(ref.col, ref.row);
        }

        // Clear old dependencies
        const oldCell = this.cells.get(ref);
        if (oldCell && oldCell.dependencies) {
            oldCell.dependencies.forEach(dep => {
                const depSet = this.dependents.get(dep);
                if (depSet) {
                    depSet.delete(ref);
                }
            });
        }

        if (content === '' || content === null || content === undefined) {
            // Clear cell
            this.cells.delete(ref);
            this.propagateChanges(ref, rexxInterpreter);
            return;
        }

        const isExpression = typeof content === 'string' && content.trim().startsWith('=');

        if (isExpression) {
            // Store expression, evaluate later
            const expression = content.trim().substring(1).trim();
            this.cells.set(ref, {
                value: '',
                expression: expression,
                dependencies: [],
                error: null,
                comment: metadata.comment || oldCell?.comment || '',
                format: metadata.format || oldCell?.format || ''
            });

            // Evaluate the expression
            if (rexxInterpreter) {
                this.evaluateCell(ref, rexxInterpreter);
            }
        } else {
            // Literal value
            this.cells.set(ref, {
                value: content,
                expression: null,
                dependencies: [],
                error: null,
                comment: metadata.comment || oldCell?.comment || '',
                format: metadata.format || oldCell?.format || ''
            });
        }

        // Propagate to dependent cells
        this.propagateChanges(ref, rexxInterpreter);
    }

    /**
     * Evaluate a cell's expression using RexxJS
     */
    async evaluateCell(ref, rexxInterpreter) {
        const cell = this.cells.get(ref);
        if (!cell || !cell.expression) {
            return;
        }

        // Check for circular references
        if (this.evaluationInProgress.has(ref)) {
            cell.error = 'Circular reference';
            cell.value = '#CIRCULAR!';
            return;
        }

        this.evaluationInProgress.add(ref);

        try {
            // Extract cell references from expression
            const dependencies = this.extractCellReferences(cell.expression);
            cell.dependencies = dependencies;

            // Update dependents map
            dependencies.forEach(dep => {
                if (!this.dependents.has(dep)) {
                    this.dependents.set(dep, new Set());
                }
                this.dependents.get(dep).add(ref);
            });

            // Evaluate expression via RexxJS
            const result = await rexxInterpreter.evaluate(cell.expression, this);
            cell.value = result;
            cell.error = null;
        } catch (error) {
            cell.error = error.message;
            cell.value = '#ERROR!';
        } finally {
            this.evaluationInProgress.delete(ref);
        }
    }

    /**
     * Extract cell references from an expression
     * Matches patterns like A1, B2, AA10, etc.
     */
    extractCellReferences(expression) {
        const cellRefPattern = /\b([A-Z]+\d+)\b/g;
        const matches = expression.match(cellRefPattern);
        return matches ? [...new Set(matches)] : [];
    }

    /**
     * Propagate changes to dependent cells
     */
    async propagateChanges(ref, rexxInterpreter) {
        const deps = this.dependents.get(ref);
        if (!deps || !rexxInterpreter) {
            return;
        }

        for (const depRef of deps) {
            await this.evaluateCell(depRef, rexxInterpreter);
            await this.propagateChanges(depRef, rexxInterpreter);
        }
    }

    /**
     * Get all non-empty cells
     */
    getAllCells() {
        const result = [];
        for (const [ref, cell] of this.cells.entries()) {
            result.push({ ref, ...cell });
        }
        return result;
    }

    /**
     * Set cell metadata (comment, format)
     */
    setCellMetadata(ref, metadata) {
        if (typeof ref === 'object') {
            ref = SpreadsheetModel.formatCellRef(ref.col, ref.row);
        }

        const cell = this.cells.get(ref);
        if (!cell) {
            // Create empty cell with metadata
            this.cells.set(ref, {
                value: '',
                expression: null,
                dependencies: [],
                error: null,
                comment: metadata.comment || '',
                format: metadata.format || ''
            });
        } else {
            // Update existing cell
            if (metadata.comment !== undefined) {
                cell.comment = metadata.comment;
            }
            if (metadata.format !== undefined) {
                cell.format = metadata.format;
            }
        }
    }

    /**
     * Get setup script
     */
    getSetupScript() {
        return this.setupScript;
    }

    /**
     * Set setup script
     */
    setSetupScript(script) {
        this.setupScript = script || '';
    }

    /**
     * Export to JSON
     */
    toJSON() {
        const data = {
            setupScript: this.setupScript,
            cells: {}
        };

        for (const [ref, cell] of this.cells.entries()) {
            const cellData = {};

            if (cell.expression) {
                cellData.content = '=' + cell.expression;
            } else if (cell.value !== '') {
                cellData.content = cell.value;
            }

            // Add metadata if present
            if (cell.comment) {
                cellData.comment = cell.comment;
            }
            if (cell.format) {
                cellData.format = cell.format;
            }

            // Only store if there's content or metadata
            if (cellData.content || cellData.comment || cellData.format) {
                // If only content, store as string for backward compatibility
                if (Object.keys(cellData).length === 1 && cellData.content) {
                    data.cells[ref] = cellData.content;
                } else {
                    data.cells[ref] = cellData;
                }
            }
        }
        return data;
    }

    /**
     * Import from JSON
     */
    fromJSON(data, rexxInterpreter = null) {
        this.cells.clear();
        this.dependents.clear();
        this.evaluationInProgress.clear();

        // Handle both old format (flat) and new format (with setupScript)
        if (data.setupScript !== undefined) {
            this.setupScript = data.setupScript || '';
            const cells = data.cells || {};
            for (const [ref, cellData] of Object.entries(cells)) {
                // Handle both string format and object format
                if (typeof cellData === 'string') {
                    // Old format: just content
                    this.setCell(ref, cellData, rexxInterpreter);
                } else {
                    // New format: object with content and metadata
                    const metadata = {
                        comment: cellData.comment || '',
                        format: cellData.format || ''
                    };
                    this.setCell(ref, cellData.content || '', rexxInterpreter, metadata);
                }
            }
        } else {
            // Old format - all entries are cells
            this.setupScript = '';
            for (const [ref, content] of Object.entries(data)) {
                this.setCell(ref, content, rexxInterpreter);
            }
        }
    }
}

// Export for Node.js (Jest) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpreadsheetModel;
}
