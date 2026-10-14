/**
 * NumPy-inspired RENDER function
 * 
 * Universal rendering system for NumPy-inspired data structures
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Import the numpy functions for access to helpers
const numpyFunctions = (typeof require !== 'undefined') ? require('./numpy.js') : (typeof window !== 'undefined' ? window.numpy || {} : {});

// Set up suggestRender function in numpy module to avoid circular dependency
if (numpyFunctions && typeof numpyFunctions === 'object') {
  // This will be set on the numpy module's internal suggestRender variable
  const setSuggestRenderInNumpy = (renderFn) => {
    if (typeof require !== 'undefined') {
      // In Node.js, we need to access the module's internal variable
      // This is a bit hacky but necessary to avoid circular imports
      const numpyModule = require('./numpy.js');
      if (numpyModule.setSuggestRender) {
        numpyModule.setSuggestRender(renderFn);
      }
    }
  };
}

/**
 * Universal RENDER function for NumPy-inspired data structures
 * Automatically detects data type and creates appropriate visualization
 * 
 * @param {Object} params - Render parameters
 * @param {*} params.data - Data to render (histogram, matrix, eigenvalue result, etc.)
 * @param {string} params.output - Output target ('auto', file path, or DOM selector)
 * @param {number} params.width - Canvas width (default: 800)
 * @param {number} params.height - Canvas height (default: 600)
 * @param {string} params.title - Plot title
 * @param {string} params.colormap - Color scheme ('viridis', 'hot', 'cool', 'grayscale')
 * @returns {string} Output identifier (file path or DOM element ID)
 */
const RENDER = (options = {}) => {
    // Handle case where options is passed as first parameter from parameter converter
    if (arguments.length === 1 && typeof options === 'object' && !Array.isArray(options) && !options.hist && !options.eigenvalues) {
        // This is the params object from parameter converter
    } else {
        // Direct call - wrap in object for consistent handling
        options = arguments.length === 1 ? options : { data: options };
    }
    
    // Debug: see what we get from HISTOGRAM function
    
    // Parameter parsing and defaults - match r-graphics pattern  
    let data = options.plot || options.data;
    // Check if plot parameter exists at any level
    const isPlotParameter = !!options.plot || (options.data && !!options.data.plot);
    
    // If data is not found in expected parameters, check if options itself is data
    // This handles cases where RexxJS passes the data object directly as options
    if (!data && (options.bins || options.counts || options.hist || options.eigenvalues || options.values || Array.isArray(options))) {
        data = options;
    }
    
    // Handle double-wrapped data from parameter converter
    if (data && data.data && (data.data.hist || data.data.eigenvalues || data.data.bins || data.data.values || Array.isArray(data.data))) {
        data = data.data;
    }
    
    // Handle case where the entire object is passed but we need to extract the data part
    if (!data && options.data && (options.data.bins || options.data.counts || options.data.hist || options.data.eigenvalues || options.data.values || Array.isArray(options.data))) {
        data = options.data;
    }
    
    // Handle case where data is nested deeper: options.data.plot
    if (!data && options.data && options.data.plot) {
        data = options.data.plot;
    }
    
    // Handle case where the data itself has a plot property with the actual data
    if (data && data.plot && typeof data.plot === 'object' && (data.plot.bins || data.plot.eigenvalues || Array.isArray(data.plot))) {
        data = data.plot;
    }
    
    // Extract parameters from potentially wrapped structure
    const extractParam = (name, defaultValue) => {
        return options[name] || 
               (options.data && options.data[name]) || 
               defaultValue;
    };
    
    const output = extractParam('output', 'auto');
    const width = extractParam('width', 800);
    const height = extractParam('height', 600);
    const title = extractParam('title', extractParam('main', 'NumPy Visualization'));
    const colormap = extractParam('colormap', extractParam('cmap', 'viridis'));

    if (!data) {
        throw new Error('RENDER: data parameter is required');
    }

    // Detect data structure type and delegate to appropriate renderer
    const dataType = detectDataType(data);
    
    switch (dataType) {
        case 'histogram':
            return renderHistogram(data, { output, width, height, title, isPlotParameter });
        case 'histogram2d':
            return renderHistogram2D(data, { output, width, height, title, colormap });
        case 'matrix':
            return renderMatrix(data, { output, width, height, title, colormap });
        case 'eigenvalue':
            return renderEigenvalues(data, { output, width, height, title, isPlotParameter });
        case 'unique_counts':
            return renderUniqueCounts(data, { output, width, height, title, isPlotParameter });
        case 'array_1d':
            return renderArray1D(data, { output, width, height, title, isPlotParameter });
        case 'array_2d':
            return renderMatrix(data, { output, width, height, title, colormap });
        default:
            throw new Error(`RENDER: Unsupported data type '${dataType}'. Supported types: histogram, histogram2d, matrix, eigenvalue, unique_counts, array_1d, array_2d`);
    }
}

/**
 * Detect the type of data structure to determine rendering approach
 */
function detectDataType(data) {
    // Check for histogram object
    if (data && typeof data === 'object' && data.bins && data.counts) {
        return 'histogram';
    }
    
    // Check for histogram2d object
    if (data && typeof data === 'object' && data.hist && data.xEdges && data.yEdges) {
        return 'histogram2d';
    }
    
    // Check for eigenvalue object
    if (data && typeof data === 'object' && data.eigenvalues && data.eigenvectors) {
        return 'eigenvalue';
    }
    
    // Check for unique result object (from UNIQUE function with return_counts=true)
    if (data && typeof data === 'object' && data.values && data.counts && 
        Array.isArray(data.values) && Array.isArray(data.counts)) {
        return 'unique_counts';
    }
    
    // Check for arrays
    if (Array.isArray(data)) {
        if (data.length > 0 && Array.isArray(data[0])) {
            return 'array_2d'; // 2D array -> matrix heatmap
        } else {
            return 'array_1d'; // 1D array -> line plot
        }
    }
    
    return 'unknown';
}

/**
 * Render 1D histogram
 */
function renderHistogram(data, options) {
    const canvas = createCanvas(options.width, options.height);
    if (!canvas) {
        // Canvas not available, return the output filename that caller expects
        return options.output;
    }
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, options.width, options.height);
    
    const { bins, counts } = data;
    const maxCount = Math.max(...counts);
    
    // Set up margins and dimensions
    const margin = { top: 60, right: 30, bottom: 80, left: 80 };
    const plotWidth = options.width - margin.left - margin.right;
    const plotHeight = options.height - margin.top - margin.bottom;
    
    // Draw title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(options.title, options.width / 2, 30);
    
    // Draw bars
    const barWidth = plotWidth / counts.length;
    ctx.fillStyle = 'steelblue';
    
    for (let i = 0; i < counts.length; i++) {
        const barHeight = (counts[i] / maxCount) * plotHeight;
        const x = margin.left + i * barWidth;
        const y = margin.top + plotHeight - barHeight;
        
        ctx.fillRect(x, y, barWidth * 0.8, barHeight);
    }
    
    // Draw axes
    drawAxes(ctx, margin, plotWidth, plotHeight, bins, maxCount);
    
    return saveCanvas(canvas, options.isPlotParameter ? 'auto' : options.output, 'numpy-histogram');
}

/**
 * Render 2D histogram as heatmap
 */
function renderHistogram2D(data, options) {
    const canvas = createCanvas(options.width, options.height);
    if (!canvas) {
        // Canvas not available, return the output filename that caller expects
        return options.output;
    }
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, options.width, options.height);
    
    const { hist, xEdges, yEdges } = data;
    
    // Set up margins
    const margin = { top: 60, right: 30, bottom: 80, left: 80 };
    const plotWidth = options.width - margin.left - margin.right;
    const plotHeight = options.height - margin.top - margin.bottom;
    
    // Draw title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(options.title, options.width / 2, 30);
    
    // Find max value for normalization
    const maxVal = Math.max(...hist.flat());
    
    // Draw heatmap
    const cellWidth = plotWidth / hist[0].length;
    const cellHeight = plotHeight / hist.length;
    
    for (let i = 0; i < hist.length; i++) {
        for (let j = 0; j < hist[i].length; j++) {
            const value = hist[i][j];
            const intensity = value / maxVal;
            const color = getColormapColor(intensity, options.colormap);
            
            ctx.fillStyle = color;
            ctx.fillRect(
                margin.left + j * cellWidth,
                margin.top + i * cellHeight,
                cellWidth,
                cellHeight
            );
        }
    }
    
    return saveCanvas(canvas, options.output, 'numpy-histogram2d');
}

/**
 * Render matrix as heatmap
 */
function renderMatrix(data, options) {
    const canvas = createCanvas(options.width, options.height);
    if (!canvas) {
        // Canvas not available, return the output filename that caller expects
        return options.output;
    }
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, options.width, options.height);
    
    // Set up margins
    const margin = { top: 60, right: 80, bottom: 80, left: 80 };
    const plotWidth = options.width - margin.left - margin.right;
    const plotHeight = options.height - margin.top - margin.bottom;
    
    // Draw title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(options.title, options.width / 2, 30);
    
    // Flatten matrix to find min/max for normalization
    const flatData = data.flat();
    const minVal = Math.min(...flatData);
    const maxVal = Math.max(...flatData);
    const range = maxVal - minVal;
    
    // Draw matrix cells
    const cellWidth = plotWidth / data[0].length;
    const cellHeight = plotHeight / data.length;
    
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            const value = data[i][j];
            const intensity = range > 0 ? (value - minVal) / range : 0.5;
            const color = getColormapColor(intensity, options.colormap);
            
            ctx.fillStyle = color;
            ctx.fillRect(
                margin.left + j * cellWidth,
                margin.top + i * cellHeight,
                cellWidth,
                cellHeight
            );
            
            // Draw value text for small matrices
            if (data.length <= 10 && data[0].length <= 10) {
                ctx.fillStyle = intensity > 0.5 ? 'white' : 'black';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    value.toFixed(2),
                    margin.left + j * cellWidth + cellWidth / 2,
                    margin.top + i * cellHeight + cellHeight / 2 + 4
                );
            }
        }
    }
    
    // Draw colorbar
    drawColorbar(ctx, options, margin, minVal, maxVal);
    
    return saveCanvas(canvas, options.output, 'numpy-matrix');
}

/**
 * Render eigenvalues as bar plot
 */
function renderEigenvalues(data, options) {
    const canvas = createCanvas(options.width, options.height);
    if (!canvas) {
        // Canvas not available, return the output filename that caller expects
        return options.output;
    }
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, options.width, options.height);
    
    const eigenvalues = data.eigenvalues;
    const maxEigenval = Math.max(...eigenvalues.map(Math.abs));
    
    // Set up margins
    const margin = { top: 60, right: 30, bottom: 80, left: 80 };
    const plotWidth = options.width - margin.left - margin.right;
    const plotHeight = options.height - margin.top - margin.bottom;
    
    // Draw title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(options.title, options.width / 2, 30);
    
    // Draw eigenvalue bars
    const barWidth = plotWidth / eigenvalues.length;
    
    for (let i = 0; i < eigenvalues.length; i++) {
        const eigenval = eigenvalues[i];
        const barHeight = Math.abs(eigenval) / maxEigenval * (plotHeight / 2);
        const x = margin.left + i * barWidth;
        const y = eigenval >= 0 
            ? margin.top + plotHeight / 2 - barHeight
            : margin.top + plotHeight / 2;
        
        ctx.fillStyle = eigenval >= 0 ? 'steelblue' : 'crimson';
        ctx.fillRect(x, y, barWidth * 0.8, barHeight);
        
        // Label eigenvalue
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `λ${i+1}`,
            x + barWidth * 0.4,
            margin.top + plotHeight + 20
        );
    }
    
    // Draw center line
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotHeight / 2);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight / 2);
    ctx.stroke();
    
    return saveCanvas(canvas, options.isPlotParameter ? 'auto' : options.output, 'numpy-eigenvalues');
}

/**
 * Render UNIQUE counts as bar chart
 */
function renderUniqueCounts(data, options) {
    const canvas = createCanvas(options.width, options.height);
    if (!canvas) {
        // Canvas not available, return the output filename that caller expects
        return options.output;
    }
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, options.width, options.height);
    
    const { values, counts } = data;
    const maxCount = Math.max(...counts);
    
    // Set up margins and dimensions
    const margin = { top: 60, right: 30, bottom: 80, left: 80 };
    const plotWidth = options.width - margin.left - margin.right;
    const plotHeight = options.height - margin.top - margin.bottom;
    
    // Draw title
    if (options.title) {
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(options.title, options.width / 2, 30);
    }
    
    // Calculate bar dimensions
    const barWidth = plotWidth / values.length;
    const barSpacing = barWidth * 0.1;
    const actualBarWidth = barWidth - barSpacing;
    
    // Draw bars
    ctx.fillStyle = '#1f77b4'; // Blue color
    for (let i = 0; i < values.length; i++) {
        const barHeight = (counts[i] / maxCount) * plotHeight;
        const x = margin.left + i * barWidth + barSpacing / 2;
        const y = margin.top + plotHeight - barHeight;
        
        ctx.fillRect(x, y, actualBarWidth, barHeight);
        
        // Add value labels on top of bars
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(counts[i].toString(), x + actualBarWidth / 2, y - 5);
        
        // Add category labels on x-axis
        ctx.save();
        ctx.translate(x + actualBarWidth / 2, margin.top + plotHeight + 20);
        ctx.fillText(values[i].toString(), 0, 0);
        ctx.restore();
        
        ctx.fillStyle = '#1f77b4'; // Reset to bar color
    }
    
    // Draw axes
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.stroke();
    
    // X-axis  
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();
    
    // Y-axis labels
    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const y = margin.top + plotHeight - (i / 5) * plotHeight;
        const value = Math.round((i / 5) * maxCount);
        ctx.fillText(value.toString(), margin.left - 10, y + 3);
        
        // Grid lines
        if (i > 0) {
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + plotWidth, y);
            ctx.stroke();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
        }
    }
    
    // Axis labels
    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Unique Values', options.width / 2, options.height - 20);
    
    ctx.save();
    ctx.translate(20, options.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Count', 0, 0);
    ctx.restore();
    
    return saveCanvas(canvas, options.isPlotParameter ? 'auto' : options.output, 'numpy-unique-counts');
}

/**
 * Render 1D array as line plot
 */
function renderArray1D(data, options) {
    const canvas = createCanvas(options.width, options.height);
    if (!canvas) {
        // Canvas not available, return the output filename that caller expects
        return options.output;
    }
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, options.width, options.height);
    
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal;
    
    // Set up margins
    const margin = { top: 60, right: 30, bottom: 80, left: 80 };
    const plotWidth = options.width - margin.left - margin.right;
    const plotHeight = options.height - margin.top - margin.bottom;
    
    // Draw title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(options.title, options.width / 2, 30);
    
    // Draw line plot
    ctx.strokeStyle = 'steelblue';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < data.length; i++) {
        const x = margin.left + (i / (data.length - 1)) * plotWidth;
        const y = range > 0 
            ? margin.top + plotHeight - ((data[i] - minVal) / range) * plotHeight
            : margin.top + plotHeight / 2;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw axes
    drawAxes(ctx, margin, plotWidth, plotHeight, 
             Array.from({length: data.length}, (_, i) => i), maxVal);
    
    return saveCanvas(canvas, options.isPlotParameter ? 'auto' : options.output, 'numpy-array1d');
}

/**
 * Helper functions
 */

function createCanvas(width, height) {
    if (typeof document !== 'undefined') {
        // Browser environment - check for document instead of window
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    } else {
        // Node.js environment
        try {
            const { createCanvas } = require('canvas');
            return createCanvas(width, height);
        } catch (e) {
            // Gracefully handle missing canvas dependency for testing environments
            console.warn('Canvas library not available in Node.js environment. PNG generation skipped.');
            return null; // Return null instead of throwing
        }
    }
}

function getColormapColor(intensity, colormap) {
    // Clamp intensity between 0 and 1
    intensity = Math.max(0, Math.min(1, intensity));
    
    switch (colormap) {
        case 'viridis':
            return viridisColormap(intensity);
        case 'hot':
            return hotColormap(intensity);
        case 'cool':
            return coolColormap(intensity);
        case 'grayscale':
        default:
            const gray = Math.round(intensity * 255);
            return `rgb(${gray},${gray},${gray})`;
    }
}

function viridisColormap(t) {
    // Simplified viridis colormap
    const r = Math.round(255 * (0.267004 + t * (0.127568 + t * (-0.24506 + t * 0.163625))));
    const g = Math.round(255 * (0.004874 + t * (0.998374 + t * (-0.956945 + t * 0.406570))));
    const b = Math.round(255 * (0.329415 + t * (0.429201 + t * (-0.168498 + t * 0.000110))));
    return `rgb(${r},${g},${b})`;
}

function hotColormap(t) {
    const r = Math.round(255 * Math.min(1, t * 3));
    const g = Math.round(255 * Math.max(0, Math.min(1, t * 3 - 1)));
    const b = Math.round(255 * Math.max(0, Math.min(1, t * 3 - 2)));
    return `rgb(${r},${g},${b})`;
}

function coolColormap(t) {
    const r = Math.round(255 * t);
    const g = Math.round(255 * (1 - t));
    const b = 255;
    return `rgb(${r},${g},${b})`;
}

function drawAxes(ctx, margin, plotWidth, plotHeight, xValues, maxY) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();
    
    // Y-axis labels
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const y = margin.top + plotHeight - (i / 5) * plotHeight;
        const value = (i / 5) * maxY;
        ctx.fillText(value.toFixed(1), margin.left - 10, y + 4);
    }
}

function drawColorbar(ctx, options, margin, minVal, maxVal) {
    const colorbarWidth = 20;
    const colorbarHeight = options.height - margin.top - margin.bottom;
    const colorbarX = options.width - margin.right + 20;
    
    // Draw colorbar
    for (let i = 0; i < colorbarHeight; i++) {
        const intensity = 1 - (i / colorbarHeight);
        const color = getColormapColor(intensity, options.colormap);
        ctx.fillStyle = color;
        ctx.fillRect(colorbarX, margin.top + i, colorbarWidth, 1);
    }
    
    // Colorbar border
    ctx.strokeStyle = 'black';
    ctx.strokeRect(colorbarX, margin.top, colorbarWidth, colorbarHeight);
    
    // Colorbar labels
    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(maxVal.toFixed(2), colorbarX + colorbarWidth + 5, margin.top + 4);
    ctx.fillText(minVal.toFixed(2), colorbarX + colorbarWidth + 5, margin.top + colorbarHeight);
}

function saveCanvas(canvas, output, defaultName) {
    if (output === 'auto') {
        // Determine output based on environment
        if (typeof document !== 'undefined') {
            // Browser: add to DOM
            const containerId = `numpy-plot-${Date.now()}`;
            canvas.id = containerId;
            
            // Try to find existing container or create new one
            let container = document.getElementById('numpy-plots');
            if (!container) {
                container = document.createElement('div');
                container.id = 'numpy-plots';
                container.style.cssText = 'margin: 10px; padding: 10px; border: 1px solid #ccc;';
                document.body.appendChild(container);
            }
            
            container.appendChild(canvas);
            return `#${containerId}`;
        } else {
            // Node.js: save to file
            output = `./images/${defaultName}-${Date.now()}.png`;
        }
    }
    
    if (typeof document === 'undefined' && output.includes('.')) {
        // Node.js file save
        const fs = require('fs');
        const path = require('path');
        const buffer = canvas.toBuffer('image/png');
        // The folder may not be there yet (./images, by default)
        fs.mkdirSync(path.dirname(output), { recursive: true });
        fs.writeFileSync(output, buffer);
        return output;
    } else if (typeof document !== 'undefined') {
        // Browser DOM manipulation
        if (output.startsWith('#') || output.startsWith('.')) {
            const target = document.querySelector(output);
            if (target) {
                target.appendChild(canvas);
                return output;
            }
        }
        
        // Fallback: add to body with ID
        canvas.id = output;
        document.body.appendChild(canvas);
        return output;
    }
    
    return 'rendered';
}

/**
 * Suggest render function for universal REPL integration
 */
function suggestRender(plotData, options = {}) {
    if (typeof window !== 'undefined' && window.rexxjs) {
        window.rexxjs.suggestedRenderFunction = () => {
            return RENDER({
                data: plotData,
                output: window.rexxjs.renderTarget || 'auto',
                width: options.width || 800,
                height: options.height || 600,
                title: options.title || options.main || 'NumPy Visualization'
            });
        };
    }
}

// Set up the suggestRender function in numpy module
if (numpyFunctions && numpyFunctions.setSuggestRender) {
    numpyFunctions.setSuggestRender(suggestRender);
}

// Export for Node.js and browser
const numpyRender = {
    RENDER,
    suggestRender,
    // Individual renderers for direct access
    renderHistogram,
    renderHistogram2D, 
    renderMatrix,
    renderEigenvalues,
    renderArray1D
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = numpyRender;
} else if (typeof window !== 'undefined') {
    Object.assign(window, numpyRender);
    window.numpyRender = numpyRender;
}