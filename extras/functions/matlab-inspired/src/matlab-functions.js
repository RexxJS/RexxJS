/*!
 * matlab-functions v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=MATLAB_FUNCTIONS_META
 */
/**
 * MATLAB-inspired Functions Library - Provides plotting capabilities
 *
 * Usage:
 *   REQUIRE "matlab-functions"
 *   LET data = '[1, 2, 3, 4, 5]'
 *   LET svg = PLOT(data)
 */

const MATLAB_FUNCTIONS = {
    'MATLAB_FUNCTIONS_MAIN': () => MATLAB_FUNCTIONS_META(),

    /**
     * LINSPACE - Generate linearly spaced vector
     * Creates a vector of n evenly spaced points between start and end
     */
    'LINSPACE': (start, end, n = 100) => {
        const s = parseFloat(start);
        const e = parseFloat(end);
        const num = parseInt(n);

        if (isNaN(s) || isNaN(e) || isNaN(num)) {
            throw new Error('LINSPACE requires numeric arguments');
        }
        if (num < 2) {
            throw new Error('LINSPACE requires n >= 2');
        }

        const step = (e - s) / (num - 1);
        const result = [];
        for (let i = 0; i < num; i++) {
            result.push(s + step * i);
        }
        return result;
    },

    /**
     * LOGSPACE - Generate logarithmically spaced vector
     * Creates a vector of n logarithmically spaced points between 10^start and 10^end
     */
    'LOGSPACE': (start, end, n = 50) => {
        const s = parseFloat(start);
        const e = parseFloat(end);
        const num = parseInt(n);

        if (isNaN(s) || isNaN(e) || isNaN(num)) {
            throw new Error('LOGSPACE requires numeric arguments');
        }
        if (num < 2) {
            throw new Error('LOGSPACE requires n >= 2');
        }

        const step = (e - s) / (num - 1);
        const result = [];
        for (let i = 0; i < num; i++) {
            result.push(Math.pow(10, s + step * i));
        }
        return result;
    },

    /**
     * ZEROS - Create array of zeros
     */
    'ZEROS': (rows, cols = null) => {
        const r = parseInt(rows);
        if (isNaN(r) || r < 1) {
            throw new Error('ZEROS requires positive integer rows');
        }

        if (cols === null) {
            // Return 1D array
            return new Array(r).fill(0);
        }

        const c = parseInt(cols);
        if (isNaN(c) || c < 1) {
            throw new Error('ZEROS requires positive integer cols');
        }

        // Return 2D array
        const result = [];
        for (let i = 0; i < r; i++) {
            result.push(new Array(c).fill(0));
        }
        return result;
    },

    /**
     * ONES - Create array of ones
     */
    'ONES': (rows, cols = null) => {
        const r = parseInt(rows);
        if (isNaN(r) || r < 1) {
            throw new Error('ONES requires positive integer rows');
        }

        if (cols === null) {
            // Return 1D array
            return new Array(r).fill(1);
        }

        const c = parseInt(cols);
        if (isNaN(c) || c < 1) {
            throw new Error('ONES requires positive integer cols');
        }

        // Return 2D array
        const result = [];
        for (let i = 0; i < r; i++) {
            result.push(new Array(c).fill(1));
        }
        return result;
    },

    /**
     * EYE - Create identity matrix
     */
    'EYE': (n, m = null) => {
        const rows = parseInt(n);
        if (isNaN(rows) || rows < 1) {
            throw new Error('EYE requires positive integer dimension');
        }

        const cols = m === null ? rows : parseInt(m);
        if (isNaN(cols) || cols < 1) {
            throw new Error('EYE requires positive integer dimensions');
        }

        const result = [];
        for (let i = 0; i < rows; i++) {
            const row = new Array(cols).fill(0);
            if (i < cols) {
                row[i] = 1;
            }
            result.push(row);
        }
        return result;
    },

    /**
     * DIAG - Extract diagonal or create diagonal matrix
     */
    'DIAG': (input) => {
        if (Array.isArray(input)) {
            // Check if it's a 2D array (matrix)
            if (Array.isArray(input[0])) {
                // Extract diagonal from matrix
                const result = [];
                const size = Math.min(input.length, input[0].length);
                for (let i = 0; i < size; i++) {
                    result.push(input[i][i]);
                }
                return result;
            } else {
                // Create diagonal matrix from vector
                const n = input.length;
                const result = [];
                for (let i = 0; i < n; i++) {
                    const row = new Array(n).fill(0);
                    row[i] = input[i];
                    result.push(row);
                }
                return result;
            }
        }
        throw new Error('DIAG requires an array');
    },

    /**
     * RESHAPE - Reshape array to specified dimensions
     */
    'RESHAPE': (array, rows, cols) => {
        if (!Array.isArray(array)) {
            throw new Error('RESHAPE requires an array as first argument');
        }

        const r = parseInt(rows);
        const c = parseInt(cols);

        if (isNaN(r) || isNaN(c) || r < 1 || c < 1) {
            throw new Error('RESHAPE requires positive integer dimensions');
        }

        // Flatten input if needed
        let flat = array;
        if (Array.isArray(array[0])) {
            flat = array.flat();
        }

        if (flat.length !== r * c) {
            throw new Error(`RESHAPE requires ${r * c} elements, got ${flat.length}`);
        }

        const result = [];
        for (let i = 0; i < r; i++) {
            result.push(flat.slice(i * c, (i + 1) * c));
        }
        return result;
    },

    /**
     * TRANSPOSE - Transpose a matrix
     */
    'TRANSPOSE': (matrix) => {
        if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) {
            throw new Error('TRANSPOSE requires a 2D array');
        }

        const rows = matrix.length;
        const cols = matrix[0].length;
        const result = [];

        for (let j = 0; j < cols; j++) {
            const row = [];
            for (let i = 0; i < rows; i++) {
                row.push(matrix[i][j]);
            }
            result.push(row);
        }
        return result;
    },

    /**
     * SIZE - Return dimensions of array
     */
    'SIZE': (array, dim = null) => {
        if (!Array.isArray(array)) {
            throw new Error('SIZE requires an array');
        }

        if (Array.isArray(array[0])) {
            // 2D array
            const rows = array.length;
            const cols = array[0].length;

            if (dim === null) {
                return [rows, cols];
            }
            const d = parseInt(dim);
            if (d === 1) return rows;
            if (d === 2) return cols;
            throw new Error('SIZE dimension must be 1 or 2 for 2D arrays');
        } else {
            // 1D array
            if (dim === null) {
                return [array.length];
            }
            const d = parseInt(dim);
            if (d === 1) return array.length;
            throw new Error('SIZE dimension out of range for 1D array');
        }
    },

    /**
     * LENGTH - Return length of largest dimension
     */
    'LENGTH': (array) => {
        if (!Array.isArray(array)) {
            throw new Error('LENGTH requires an array');
        }

        if (Array.isArray(array[0])) {
            return Math.max(array.length, array[0].length);
        }
        return array.length;
    },

    /**
     * NUMEL - Return total number of elements
     */
    'NUMEL': (array) => {
        if (!Array.isArray(array)) {
            throw new Error('NUMEL requires an array');
        }

        if (Array.isArray(array[0])) {
            return array.length * array[0].length;
        }
        return array.length;
    },

    'PLOT': (data, options) => {
        let parsedData;
        try {
            if (typeof data === 'string') {
                parsedData = JSON.parse(data);
            } else if (Array.isArray(data)) {
                parsedData = data;
            } else {
                throw new Error('Data must be a JSON string or an array.');
            }
        } catch (e) {
            throw new Error('Invalid data format. Please provide a valid JSON array string.');
        }

        if (!Array.isArray(parsedData) || parsedData.some(isNaN)) {
            throw new Error('Data must be an array of numbers.');
        }

        const width = 200;
        const height = 100;
        const padding = 20;

        const maxX = parsedData.length - 1;
        const maxVal = Math.max(...parsedData);
        const minVal = Math.min(...parsedData);

        const scaleX = (width - 2 * padding) / (maxX || 1);
        const scaleY = (height - 2 * padding) / ((maxVal - minVal) || 1);

        const points = parsedData.map((d, i) => {
            const x = i * scaleX + padding;
            const y = height - padding - ((d - minVal) * scaleY);
            return `${x},${y}`;
        }).join(' ');

        const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <polyline points="${points}" fill="none" stroke="blue" stroke-width="2" />
</svg>
`;
        return svg;
    }
};

// Consolidated metadata provider function
function MATLAB_FUNCTIONS_META() {
    return {
        canonical: "org.rexxjs/matlab-functions",
        type: "functions-library",
        dependencies: {},
        name: 'MATLAB-inspired Functions',
        version: '1.0.0',
        description: 'Provides functions for plotting data.',
        functions: {
            'LINSPACE': {
                description: "Generate linearly spaced vector between start and end",
                params: ["start", "end", {name: "n", optional: true, default: 100}],
                returns: "Array of n evenly spaced values"
            },
            'LOGSPACE': {
                description: "Generate logarithmically spaced vector between 10^start and 10^end",
                params: ["start", "end", {name: "n", optional: true, default: 50}],
                returns: "Array of n logarithmically spaced values"
            },
            'ZEROS': {
                description: "Create array of zeros",
                params: ["rows", {name: "cols", optional: true}],
                returns: "1D or 2D array filled with zeros"
            },
            'ONES': {
                description: "Create array of ones",
                params: ["rows", {name: "cols", optional: true}],
                returns: "1D or 2D array filled with ones"
            },
            'EYE': {
                description: "Create identity matrix",
                params: ["n", {name: "m", optional: true}],
                returns: "Identity matrix of size n×m (or n×n if m not specified)"
            },
            'DIAG': {
                description: "Extract diagonal or create diagonal matrix",
                params: ["input"],
                returns: "Vector (if input is matrix) or diagonal matrix (if input is vector)"
            },
            'RESHAPE': {
                description: "Reshape array to specified dimensions",
                params: ["array", "rows", "cols"],
                returns: "Reshaped 2D array"
            },
            'TRANSPOSE': {
                description: "Transpose a matrix",
                params: ["matrix"],
                returns: "Transposed matrix"
            },
            'SIZE': {
                description: "Return dimensions of array",
                params: ["array", {name: "dim", optional: true}],
                returns: "Array of dimensions or single dimension if dim specified"
            },
            'LENGTH': {
                description: "Return length of largest dimension",
                params: ["array"],
                returns: "Length of largest dimension"
            },
            'NUMEL': {
                description: "Return total number of elements",
                params: ["array"],
                returns: "Total number of elements"
            },
            'PLOT': {
                description: "Renders a plot of the given data.",
                params: ["data", {name: "options", optional: true, schema: {}}],
                returns: "The rendered plot as an SVG string."
            }
        },
        detectionFunction: 'MATLAB_FUNCTIONS_MAIN'
    };
}

// Export for both Node.js and browser in consistent format
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MATLAB_FUNCTIONS;
    if (typeof global !== 'undefined') {
        global.MATLAB_FUNCTIONS = MATLAB_FUNCTIONS;
        global.MATLAB_FUNCTIONS_META = MATLAB_FUNCTIONS_META;
    }
} else if (typeof window !== 'undefined') {
    window.MATLAB_FUNCTIONS = MATLAB_FUNCTIONS;
    window.MATLAB_FUNCTIONS_META = MATLAB_FUNCTIONS_META;
}
