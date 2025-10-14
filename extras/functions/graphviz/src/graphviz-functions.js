/*!
 * graphviz-functions v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=GRAPHVIZ_FUNCTIONS_META
 */
/**
 * Graphviz Functions Library - Provides Graphviz rendering capabilities
 *
 * Usage:
 *   REQUIRE "graphviz-functions"
 *   LET dot = 'digraph { a -> b }'
 *   LET svg = GVZ_DOT(dot)
 */

let graphviz = null;
try {
    if (typeof require !== 'undefined') {
        graphviz = require('graphviz-wasm');
    } else if (typeof window !== 'undefined' && window.graphviz) {
        graphviz = window.graphviz;
    }
} catch (e) {
    // graphviz-wasm is expected to be loaded externally
}

let wasmLoadingPromise = null;
let wasmLoaded = false;

async function loadWASM() {
    if (wasmLoaded) {
        return;
    }

    if (wasmLoadingPromise) {
        return wasmLoadingPromise;
    }

    if (!graphviz) {
        throw new Error('graphviz-wasm is not loaded. Make sure to include it in your environment.');
    }


    wasmLoadingPromise = graphviz.loadWASM();

    await wasmLoadingPromise;

    
    wasmLoaded = true;
    wasmLoadingPromise = null;
}

/**
 * Internal rendering function that interfaces with graphviz-wasm.
 * @param {string} dot - The DOT string to render.
 * @param {string} engine - The layout engine (e.g., 'dot', 'neato').
 * @param {string} format - The output format (e.g., 'svg', 'png').
 * @returns {Promise<string>} A promise that resolves to the rendered output.
 */
async function renderGraphviz(dot, engine, format) {
    if (typeof dot !== 'string') {
        throw new Error(`The first argument must be a DOT string.`);
    }

    await loadWASM();

    try {
        const result = graphviz.layout(dot, format, engine);

        if (typeof window !== 'undefined' && window.rexxjs) {
            // Clear any previous renderer suggestion
            delete window.rexxjs.suggestedRenderFunction;

            // The REPL environment provides a createGraphicsContainer function
            const createGraphicsContainer = window.createGraphicsContainer || (() => {
                const div = document.createElement('div');
                div.className = 'repl-graphics';
                document.body.appendChild(div); // Fallback if not in REPL
                return div;
            });

            if (format === 'svg') {
                window.rexxjs.suggestedRenderFunction = () => {
                    const targetElement = createGraphicsContainer();
                    targetElement.innerHTML = result;
                };
            } else if (format === 'png') {
                window.rexxjs.suggestedRenderFunction = () => {
                    const targetElement = createGraphicsContainer();
                    const img = document.createElement('img');
                    img.src = `data:image/png;base64,${result}`;
                    targetElement.appendChild(img);
                };
            }
        }

        return result;
    } catch (error) {
        console.error(`Error rendering Graphviz DOT string with ${engine}:`, error);
        throw new Error(`Graphviz rendering failed: ${error.message}`);
    }
}

const GRAPHVIZ_FUNCTIONS = {
    'GRAPHVIZ_FUNCTIONS_MAIN': () => GRAPHVIZ_FUNCTIONS_META(),

    'DOT': (dot, options) => renderGraphviz(dot, 'dot', options?.format || 'svg'),
    'NEATO': (dot, options) => renderGraphviz(dot, 'neato', options?.format || 'svg'),
    'FDP': (dot, options) => renderGraphviz(dot, 'fdp', options?.format || 'svg')
};

// Consolidated metadata provider function
function GRAPHVIZ_FUNCTIONS_META() {
    return {
        canonical: "org.rexxjs/graphviz-functions",
        type: "functions-library",
        dependencies: {"graphviz-wasm": "^3.0.2"},
        name: 'Graphviz Functions',
        version: '1.0.0',
        description: 'Provides functions for rendering Graphviz DOT strings.',
        functions: {
            'DOT': {
                description: "Renders a DOT string using the 'dot' engine.",
                params: ["dot_string", {name: "options", optional: true, schema: {format: "output format (e.g., 'svg', 'png')"}}],
                returns: "The rendered output as a string."
            },
            'NEATO': {
                description: "Renders a DOT string using the 'neato' engine.",
                params: ["dot_string", {name: "options", optional: true, schema: {format: "output format (e.g., 'svg', 'png')"}}],
                returns: "The rendered output as a string."
            },
            'FDP': {
                description: "Renders a DOT string using the 'fdp' engine.",
                params: ["dot_string", {name: "options", optional: true, schema: {format: "output format (e.g., 'svg', 'png')"}}],
                returns: "The rendered output as a string."
            }
        },
        detectionFunction: 'GRAPHVIZ_FUNCTIONS_MAIN'
    };
}

// Export for both Node.js and browser in consistent format
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GRAPHVIZ_FUNCTIONS;
    if (typeof global !== 'undefined') {
        global.GRAPHVIZ_FUNCTIONS = GRAPHVIZ_FUNCTIONS;
        global.GRAPHVIZ_FUNCTIONS_META = GRAPHVIZ_FUNCTIONS_META;
    }
} else if (typeof window !== 'undefined') {
    window.GRAPHVIZ_FUNCTIONS = GRAPHVIZ_FUNCTIONS;
    window.GRAPHVIZ_FUNCTIONS_META = GRAPHVIZ_FUNCTIONS_META;
}
