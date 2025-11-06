/**
 * Spreadsheet ADDRESS Handler
 *
 * This handler allows external REXX scripts to control the spreadsheet
 * by sending REXX code to be executed in the browser's interpreter.
 */

export function createSpreadsheetAddressHandler(model, adapter) {
    return {
        metadata: {
            name: 'SPREADSHEET',
            version: '1.0.0',
            description: 'Spreadsheet control via REXX commands',
            libraryMetadata: {
                interpreterHandlesInterpolation: false
            }
        },

        handler: async function(commandString, context, sourceContext) {
            const interpreter = sourceContext?.interpreter || adapter.interpreter;

            // The command string is REXX code to be executed
            // It has access to: model, adapter, and the spreadsheet functions

            try {
                // Parse and execute the REXX command
                const commands = parse(commandString);
                await interpreter.run(commands);

                // Get the RESULT variable if set
                const result = interpreter.getVariable('RESULT');
                const rc = interpreter.getVariable('RC') || 0;

                return {
                    success: rc === 0,
                    result: result,
                    errorCode: rc
                };
            } catch (error) {
                return {
                    success: false,
                    errorMessage: error.message,
                    errorCode: 1
                };
            }
        },

        methods: ['execute', 'setCell', 'getCell', 'getCellValue']
    };
}
