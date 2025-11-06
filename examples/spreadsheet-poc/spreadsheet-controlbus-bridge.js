/**
 * SpreadsheetControlBus Bridge - Auto-enable control bus for the app
 *
 * This script automatically detects when the spreadsheet app is loaded
 * and enables the control bus without requiring React component modifications
 */

(function() {
    let controlBus = null;
    let checkInterval = null;

    function tryEnableControlBus() {
        // Check if all required globals are available
        if (!window.SpreadsheetControlBus || !window.SpreadsheetModel) {
            return false;
        }

        // Try to find the app's model and adapter in the window
        // They might be exposed by the App component
        const model = window.__spreadsheetModel;
        const adapter = window.__spreadsheetAdapter;
        const app = window.__spreadsheetApp;

        if (!model || !adapter) {
            return false;
        }

        // Create and enable control bus
        controlBus = new SpreadsheetControlBus(model, adapter, app);
        controlBus.enable();

        // Expose globally for debugging
        window.__controlBus = controlBus;

        console.log('✓ Control bus enabled successfully');
        return true;
    }

    // Wait for app to be ready
    window.addEventListener('DOMContentLoaded', () => {
        // Try immediately
        if (tryEnableControlBus()) {
            return;
        }

        // If not ready, poll every 500ms for up to 10 seconds
        let attempts = 0;
        checkInterval = setInterval(() => {
            attempts++;

            if (tryEnableControlBus()) {
                clearInterval(checkInterval);
            } else if (attempts >= 20) {
                // Give up after 10 seconds
                clearInterval(checkInterval);
                console.warn('Could not enable control bus - app not ready');
            }
        }, 500);
    });

    // Expose a manual enable function
    window.enableSpreadsheetControlBus = function() {
        if (controlBus) {
            console.log('Control bus already enabled');
            return controlBus;
        }

        if (tryEnableControlBus()) {
            return controlBus;
        } else {
            throw new Error('Cannot enable control bus - required components not available');
        }
    };
})();
