/**
 * SpreadsheetLoader - Load spreadsheet data from various sources
 *
 * Responsibilities:
 * - Load spreadsheet data from URLs (web mode)
 * - Load spreadsheet data from filesystem (Tauri mode)
 * - Parse spreadsheet JSON format
 * - Apply data to SpreadsheetModel
 */

class SpreadsheetLoader {
    /**
     * Load spreadsheet from URL (web mode)
     * @param {string} url - URL to fetch spreadsheet data from
     * @returns {Promise<Object>} - Spreadsheet data object
     */
    static async loadFromURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return this.validateSpreadsheetData(data);
        } catch (error) {
            throw new Error(`Failed to load spreadsheet from URL: ${error.message}`);
        }
    }

    /**
     * Load spreadsheet from filesystem (Tauri mode)
     * @param {string} filePath - Path to spreadsheet file
     * @returns {Promise<Object>} - Spreadsheet data object
     */
    static async loadFromFile(filePath) {
        // Check if we're in Tauri environment
        if (typeof window.__TAURI__ === 'undefined') {
            throw new Error('File loading is only available in Tauri mode');
        }

        try {
            const { readTextFile } = window.__TAURI__.fs;
            const contents = await readTextFile(filePath);
            const data = JSON.parse(contents);
            return this.validateSpreadsheetData(data);
        } catch (error) {
            throw new Error(`Failed to load spreadsheet from file: ${error.message}`);
        }
    }

    /**
     * Save spreadsheet to filesystem (Tauri mode)
     * @param {string} filePath - Path to save to
     * @param {Object} data - Spreadsheet data
     * @returns {Promise<void>}
     */
    static async saveToFile(filePath, data) {
        if (typeof window.__TAURI__ === 'undefined') {
            throw new Error('File saving is only available in Tauri mode');
        }

        try {
            const { writeTextFile } = window.__TAURI__.fs;
            const contents = JSON.stringify(data, null, 2);
            await writeTextFile(filePath, contents);
        } catch (error) {
            throw new Error(`Failed to save spreadsheet to file: ${error.message}`);
        }
    }

    /**
     * Validate and normalize spreadsheet data
     * @param {Object} data - Raw spreadsheet data
     * @returns {Object} - Validated data
     */
    static validateSpreadsheetData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid spreadsheet data: must be an object');
        }

        // Ensure required fields
        const validated = {
            name: data.name || 'Untitled',
            version: data.version || '1.0',
            cells: data.cells || {},
            setupScript: data.setupScript || '',
            metadata: data.metadata || {}
        };

        // Validate cells structure
        if (typeof validated.cells !== 'object') {
            throw new Error('Invalid cells data: must be an object');
        }

        return validated;
    }

    /**
     * Export spreadsheet model to data object
     * @param {SpreadsheetModel} model - Spreadsheet model instance
     * @param {string} name - Spreadsheet name
     * @returns {Object} - Spreadsheet data ready for export
     */
    static exportModelData(model, name = 'Untitled') {
        const cells = {};

        // Export all non-empty cells
        for (const [ref, cellData] of model.cells.entries()) {
            if (cellData.value !== '' || cellData.expression) {
                cells[ref] = {
                    value: cellData.value,
                    expression: cellData.expression || null,
                    format: cellData.format || null,
                    comment: cellData.comment || null
                };
            }
        }

        return {
            name: name,
            version: '1.0',
            cells: cells,
            setupScript: model.setupScript || '',
            metadata: {
                rows: model.rows,
                cols: model.cols,
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            }
        };
    }

    /**
     * Import data into spreadsheet model
     * @param {SpreadsheetModel} model - Target spreadsheet model
     * @param {Object} data - Spreadsheet data to import
     * @param {Object} adapter - RexxJS adapter for evaluation
     * @returns {Promise<void>}
     */
    static async importIntoModel(model, data, adapter = null) {
        // Clear existing cells
        model.cells.clear();
        model.dependents.clear();

        // Set setup script
        if (data.setupScript) {
            model.setupScript = data.setupScript;

            // Execute setup script if adapter is available
            if (adapter && adapter.interpreter) {
                try {
                    await adapter.executeSetupScript(data.setupScript);
                } catch (error) {
                    console.warn('Setup script execution failed:', error);
                }
            }
        }

        // Import cells
        for (const [ref, cellData] of Object.entries(data.cells)) {
            // Reconstruct cell content (with = prefix for expressions)
            const content = cellData.expression
                ? '=' + cellData.expression
                : cellData.value;

            // Set cell with metadata
            const metadata = {
                format: cellData.format || null,
                comment: cellData.comment || null
            };

            if (adapter) {
                model.setCell(ref, content, adapter.interpreter, metadata);
            } else {
                // Just set literal values if no adapter
                model.cells.set(ref, {
                    value: cellData.value || '',
                    expression: cellData.expression || null,
                    dependencies: [],
                    format: cellData.format || null,
                    comment: cellData.comment || null
                });
            }
        }
    }

    /**
     * Parse hash parameter to determine load source
     * Supports formats:
     * - #Sheet1 - Just a sheet name
     * - #load=path/to/file.json - Load from relative URL
     * - #load=/absolute/path.json - Load from absolute URL
     * @param {string} hash - Hash string (without #)
     * @returns {Object} - {type: 'name'|'url'|'file', value: string}
     */
    static parseHashParameter(hash) {
        if (!hash) {
            return { type: 'name', value: 'Sheet1' };
        }

        // Check for load= parameter
        if (hash.startsWith('load=')) {
            const path = hash.substring(5);

            // Determine if it's a URL or file path
            if (path.startsWith('http://') || path.startsWith('https://')) {
                return { type: 'url', value: path };
            } else if (path.startsWith('/') || path.match(/^[A-Za-z]:\\/)) {
                // Absolute path - could be file or URL
                return { type: 'url', value: path };
            } else {
                // Relative path - treat as URL relative to current page
                return { type: 'url', value: path };
            }
        }

        // Just a sheet name
        return { type: 'name', value: hash };
    }
}

// Export as ES module
export default SpreadsheetLoader;

// Also export for use in browser global scope if needed
if (typeof window !== 'undefined') {
    window.SpreadsheetLoader = SpreadsheetLoader;
}
