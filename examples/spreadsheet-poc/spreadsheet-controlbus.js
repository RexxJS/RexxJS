/**
 * SpreadsheetControlBus - Remote control interface for spreadsheet
 *
 * Responsibilities:
 * - Listen for remote commands via postMessage (web mode)
 * - Listen for remote commands via HTTP (Tauri mode)
 * - Execute commands on spreadsheet model
 * - Return results to caller
 *
 * Inspired by Amiga's ARexx system for cross-application scripting
 */

class SpreadsheetControlBus {
    constructor(model, adapter, appComponent) {
        this.model = model;
        this.adapter = adapter;
        this.appComponent = appComponent;
        this.enabled = false;
        this.requestId = 0;
        this.pendingRequests = new Map();

        // Available commands
        this.commands = {
            // Cell operations
            getCell: this.handleGetCell.bind(this),
            setCell: this.handleSetCell.bind(this),
            getCellValue: this.handleGetCellValue.bind(this),
            getCellExpression: this.handleGetCellExpression.bind(this),

            // Bulk operations
            getCells: this.handleGetCells.bind(this),
            setCells: this.handleSetCells.bind(this),

            // Sheet operations
            clear: this.handleClear.bind(this),
            export: this.handleExport.bind(this),
            import: this.handleImport.bind(this),

            // Metadata operations
            getSheetName: this.handleGetSheetName.bind(this),
            setSheetName: this.handleSetSheetName.bind(this),

            // Evaluation operations
            evaluate: this.handleEvaluate.bind(this),
            recalculate: this.handleRecalculate.bind(this),

            // Setup script
            getSetupScript: this.handleGetSetupScript.bind(this),
            setSetupScript: this.handleSetSetupScript.bind(this),
            executeSetupScript: this.handleExecuteSetupScript.bind(this),

            // Introspection
            listCommands: this.handleListCommands.bind(this),
            getVersion: this.handleGetVersion.bind(this)
        };
    }

    /**
     * Enable control bus listening
     */
    enable() {
        if (this.enabled) {
            return;
        }

        this.enabled = true;

        // Listen for postMessage events (web mode)
        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.handleMessage.bind(this));
            console.log('SpreadsheetControlBus: Enabled (web mode)');
        }

        // For Tauri mode, HTTP endpoints are handled by Rust backend
    }

    /**
     * Disable control bus listening
     */
    disable() {
        if (!this.enabled) {
            return;
        }

        this.enabled = false;

        if (typeof window !== 'undefined') {
            window.removeEventListener('message', this.handleMessage.bind(this));
            console.log('SpreadsheetControlBus: Disabled');
        }
    }

    /**
     * Handle incoming postMessage
     */
    async handleMessage(event) {
        // Validate message structure
        if (!event.data || typeof event.data !== 'object') {
            return;
        }

        const { type, command, params, requestId } = event.data;

        // Only handle spreadsheet-control messages
        if (type !== 'spreadsheet-control') {
            return;
        }

        console.log('ControlBus received:', command, params);

        try {
            // Execute command
            const result = await this.executeCommand(command, params);

            // Send response
            const response = {
                type: 'spreadsheet-control-response',
                requestId: requestId,
                success: true,
                result: result
            };

            // Send back to caller
            if (event.source) {
                event.source.postMessage(response, event.origin);
            }
        } catch (error) {
            // Send error response
            const response = {
                type: 'spreadsheet-control-response',
                requestId: requestId,
                success: false,
                error: error.message
            };

            if (event.source) {
                event.source.postMessage(response, event.origin);
            }
        }
    }

    /**
     * Execute a command
     */
    async executeCommand(command, params = {}) {
        const handler = this.commands[command];

        if (!handler) {
            throw new Error(`Unknown command: ${command}`);
        }

        return await handler(params);
    }

    // Command handlers

    async handleGetCell(params) {
        const { ref } = params;
        if (!ref) {
            throw new Error('Missing required parameter: ref');
        }

        const cell = this.model.getCell(ref);
        return {
            ref: ref,
            value: cell.value,
            expression: cell.expression,
            format: cell.format,
            comment: cell.comment
        };
    }

    async handleSetCell(params) {
        const { ref, content } = params;
        if (!ref || content === undefined) {
            throw new Error('Missing required parameters: ref, content');
        }

        await this.model.setCell(ref, content, this.adapter.interpreter);

        // Trigger UI update if appComponent is available
        if (this.appComponent && this.appComponent.forceUpdate) {
            this.appComponent.forceUpdate();
        }

        return { success: true, ref: ref };
    }

    async handleGetCellValue(params) {
        const { ref } = params;
        if (!ref) {
            throw new Error('Missing required parameter: ref');
        }

        return { value: this.model.getCellValue(ref) };
    }

    async handleGetCellExpression(params) {
        const { ref } = params;
        if (!ref) {
            throw new Error('Missing required parameter: ref');
        }

        return { expression: this.model.getCellExpression(ref) };
    }

    async handleGetCells(params) {
        const { range } = params;
        if (!range) {
            throw new Error('Missing required parameter: range (e.g., "A1:B5")');
        }

        // Parse range
        const [start, end] = range.split(':');
        const startParsed = SpreadsheetModel.parseCellRef(start);
        const endParsed = SpreadsheetModel.parseCellRef(end);

        const cells = {};
        const startCol = SpreadsheetModel.colLetterToNumber(startParsed.col);
        const endCol = SpreadsheetModel.colLetterToNumber(endParsed.col);

        for (let row = startParsed.row; row <= endParsed.row; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const ref = SpreadsheetModel.formatCellRef(col, row);
                const cell = this.model.getCell(ref);
                cells[ref] = {
                    value: cell.value,
                    expression: cell.expression
                };
            }
        }

        return { cells };
    }

    async handleSetCells(params) {
        const { cells } = params;
        if (!cells || typeof cells !== 'object') {
            throw new Error('Missing required parameter: cells (object mapping refs to content)');
        }

        const results = [];
        for (const [ref, content] of Object.entries(cells)) {
            await this.model.setCell(ref, content, this.adapter.interpreter);
            results.push({ ref, success: true });
        }

        // Trigger UI update
        if (this.appComponent && this.appComponent.forceUpdate) {
            this.appComponent.forceUpdate();
        }

        return { results };
    }

    async handleClear(params) {
        this.model.cells.clear();
        this.model.dependents.clear();

        // Trigger UI update
        if (this.appComponent && this.appComponent.forceUpdate) {
            this.appComponent.forceUpdate();
        }

        return { success: true };
    }

    async handleExport(params) {
        const name = params.name || 'Spreadsheet';
        return SpreadsheetLoader.exportModelData(this.model, name);
    }

    async handleImport(params) {
        const { data } = params;
        if (!data) {
            throw new Error('Missing required parameter: data');
        }

        await SpreadsheetLoader.importIntoModel(this.model, data, this.adapter);

        // Trigger UI update
        if (this.appComponent && this.appComponent.forceUpdate) {
            this.appComponent.forceUpdate();
        }

        return { success: true };
    }

    async handleGetSheetName(params) {
        return { name: this.appComponent ? this.appComponent.state.sheetName : 'Sheet1' };
    }

    async handleSetSheetName(params) {
        const { name } = params;
        if (!name) {
            throw new Error('Missing required parameter: name');
        }

        if (this.appComponent && this.appComponent.setState) {
            this.appComponent.setState({ sheetName: name });
        }

        return { success: true, name: name };
    }

    async handleEvaluate(params) {
        const { expression } = params;
        if (!expression) {
            throw new Error('Missing required parameter: expression');
        }

        try {
            const result = await this.adapter.evaluateExpression(expression);
            return { result: result };
        } catch (error) {
            throw new Error(`Evaluation failed: ${error.message}`);
        }
    }

    async handleRecalculate(params) {
        // Force recalculation of all cells
        const allRefs = Array.from(this.model.cells.keys());

        for (const ref of allRefs) {
            const cell = this.model.getCell(ref);
            if (cell.expression) {
                await this.model.setCell(ref, '=' + cell.expression, this.adapter.interpreter);
            }
        }

        // Trigger UI update
        if (this.appComponent && this.appComponent.forceUpdate) {
            this.appComponent.forceUpdate();
        }

        return { success: true, recalculated: allRefs.length };
    }

    async handleGetSetupScript(params) {
        return { setupScript: this.model.setupScript || '' };
    }

    async handleSetSetupScript(params) {
        const { script } = params;
        if (script === undefined) {
            throw new Error('Missing required parameter: script');
        }

        this.model.setupScript = script;
        return { success: true };
    }

    async handleExecuteSetupScript(params) {
        const { script } = params;
        const scriptToExecute = script || this.model.setupScript;

        if (!scriptToExecute) {
            throw new Error('No setup script to execute');
        }

        const result = await this.adapter.executeSetupScript(scriptToExecute);
        return result;
    }

    async handleListCommands(params) {
        return {
            commands: Object.keys(this.commands),
            version: '1.0'
        };
    }

    async handleGetVersion(params) {
        return {
            version: '1.0',
            name: 'RexxJS Spreadsheet Control Bus',
            compatibility: 'ARexx-inspired'
        };
    }
}

// Export for use in both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpreadsheetControlBus;
}
if (typeof window !== 'undefined') {
    window.SpreadsheetControlBus = SpreadsheetControlBus;
}
