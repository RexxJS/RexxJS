/**
 * R Visualization & Graphics Functions
 * Comprehensive plotting capabilities, statistical plots, and data visualization utilities
 * 
 * @REXX_LIBRARY_METADATA
 * @name: r-graphics-functions
 * @version: 1.0.0
 * @description: R Graphics and Visualization Functions
 * @type: library
 * @detection_function: GRAPHICS_FUNCTIONS_MAIN
 * @functions: HISTOGRAM,HIST,PLOT,SCATTER,BOXPLOT,BARPLOT,PIE,DENSITY,QQPLOT,PAIRS,HEATMAP,CONTOUR,ABLINE,PAR,RENDER
 * @dependencies: []
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Import browser histogram rendering functions to include them in the bundle
try {
  if (typeof window !== 'undefined') {
    // In browser environment, import the renderer functions
    const rendererModule = require('../histogram-browser-renderer.js');
    if (rendererModule) {
      // Make renderer functions globally available
      Object.assign(window, rendererModule);
    }
  }
} catch (e) {
  // Ignore import errors - renderer functions may not be available in all environments
}

// Helper function to suggest render to REPL
function suggestRender(plotData, options = {}) {
  if (typeof window !== 'undefined' && window.rexxjs) {
    window.rexxjs.suggestedRenderFunction = () => {
      return rGraphicsFunctions.RENDER({
        plot: plotData,
        output: window.rexxjs.renderTarget || 'auto',
        width: options.width || 800,
        height: options.height || 600
      });
    };
  }
}

// Helper function to render plot to DOM
function renderPlotToDOM(plotData, output, options = {}) {
  const { width = 800, height = 600, format = 'png' } = options;
  
  // Special handling for 'auto' output - create a new element in REPL
  if (output === 'auto' && typeof window !== 'undefined') {
    // Create a unique container
    const containerId = 'repl-plot-' + Date.now();
    const container = document.createElement('div');
    container.id = containerId;
    container.style.margin = '10px 0';
    
    // Find the REPL history element or body
    const replHistory = document.getElementById('repl-history');
    if (replHistory) {
      replHistory.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
    
    output = '#' + containerId;
  }
  
  // Actual canvas rendering implementation
  if (typeof document !== 'undefined') {
    const targetElement = typeof output === 'string' ? 
      (output.startsWith('#') ? document.querySelector(output) : document.getElementById(output)) :
      output;
      
    if (targetElement) {
      // Create container for the plot
      const plotContainer = document.createElement('div');
      plotContainer.style.cssText = `
        border: 2px solid #4CAF50;
        border-radius: 8px;
        padding: 20px;
        margin: 10px 0;
        background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
        font-family: monospace;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;
      
      // Add plot title
      const plotType = plotData.type || 'plot';
      const title = (plotData.options && plotData.options.main) || `${plotType.toUpperCase()} Visualization`;
      
      const titleDiv = document.createElement('div');
      titleDiv.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin-bottom: 15px;
        text-align: center;
      `;
      titleDiv.textContent = `📊 ${title}`;
      plotContainer.appendChild(titleDiv);
      
      // Create canvas element
      const canvasId = 'canvas-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const canvas = document.createElement('canvas');
      canvas.id = canvasId;
      canvas.width = width;
      canvas.height = height;
      canvas.style.cssText = `
        display: block;
        margin: 0 auto;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
      `;
      
      plotContainer.appendChild(canvas);
      
      try {
        // Render based on plot type using browser renderers
        if (typeof renderPlotToCanvas === 'function') {
          // Use the universal renderer if available
          renderPlotToCanvas(plotData, canvasId, { margin: options.margin });
        } else if (plotData.type === 'hist' && typeof renderHistogramToCanvas === 'function') {
          // Use specific histogram renderer
          renderHistogramToCanvas(plotData, canvasId, { margin: options.margin });
        } else {
          // Fallback: create error message
          const context = canvas.getContext('2d');
          context.fillStyle = 'white';
          context.fillRect(0, 0, width, height);
          context.fillStyle = 'red';
          context.font = '16px Arial';
          context.textAlign = 'center';
          context.fillText(`${plotData.type} renderer not available`, width / 2, height / 2);
          context.font = '12px Arial';
          context.fillText('Make sure histogram-browser-renderer.js is loaded', width / 2, height / 2 + 25);
        }
        
        // Add plot info below canvas
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
          color: #666;
          font-size: 12px;
          margin-top: 10px;
          text-align: center;
        `;
        infoDiv.innerHTML = `
          Type: ${plotType} | Dimensions: ${width}x${height}px
          ${plotData.data ? ` | Data points: ${Array.isArray(plotData.data) ? plotData.data.length : 'N/A'}` : ''}
          ${plotData.bins ? ` | Bins: ${plotData.bins.length}` : ''}
        `;
        plotContainer.appendChild(infoDiv);
        
      } catch (error) {
        // Show error in canvas
        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.fillRect(0, 0, width, height);
        context.fillStyle = 'red';
        context.font = '14px Arial';
        context.textAlign = 'center';
        context.fillText(`Render Error: ${error.message}`, width / 2, height / 2);
      }
      
      targetElement.appendChild(plotContainer);
      
      // Scroll into view if in REPL
      if (targetElement.parentElement && targetElement.parentElement.id === 'repl-history') {
        plotContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      
      return targetElement.id || 'rendered';
    }
  }
  
  return 'render-failed';
}

const rGraphicsFunctions = {
  // Primary detection function (must be first)
  'HISTOGRAM': (data, bins = 10, options = {}) => {
    // Alias to HIST for detection purposes
    return rGraphicsFunctions.HIST(data, { ...options, bins });
  },

  // Plot Configuration and State
  'PAR': (options = {}) => {
    try {
      const defaultPar = {
        mfrow: [1, 1],      // Multiple plots: rows, cols
        mfcol: [1, 1],      // Multiple plots: cols, rows
        mar: [5.1, 4.1, 4.1, 2.1], // Margins: bottom, left, top, right
        mai: [1.02, 0.82, 0.82, 0.42], // Margins in inches
        oma: [0, 0, 0, 0],  // Outer margins
        omd: [0, 1, 0, 1],  // Outer margin device coordinates
        fig: [0, 1, 0, 1],  // Figure coordinates
        plt: [0.1320755, 0.9390244, 0.1459390, 0.8540610], // Plot coordinates
        usr: [0, 1, 0, 1],  // User coordinates
        xaxs: 'r',          // X-axis style: 'r' regular, 'i' internal
        yaxs: 'r',          // Y-axis style
        las: 0,             // Label style: 0=parallel, 1=horizontal, 2=perpendicular, 3=vertical
        cex: 1.0,           // Character expansion
        cex_axis: 1.0,      // Axis annotation size
        cex_lab: 1.0,       // X/Y label size
        cex_main: 1.2,      // Main title size
        cex_sub: 1.0,       // Subtitle size
        col: 'black',       // Default color
        col_axis: 'black',  // Axis color
        col_lab: 'black',   // Label color
        col_main: 'black',  // Main title color
        col_sub: 'black',   // Subtitle color
        bg: 'white',        // Background color
        fg: 'black',        // Foreground color
        font: 1,            // Font: 1=plain, 2=bold, 3=italic, 4=bold italic
        font_axis: 1,       // Axis font
        font_lab: 1,        // Label font
        font_main: 2,       // Main title font (bold)
        font_sub: 1,        // Subtitle font
        lty: 1,             // Line type: 1=solid, 2=dashed, 3=dotted, etc.
        lwd: 1,             // Line width
        pch: 1,             // Plotting character
        ps: 12,             // Point size
        pty: 'm',           // Plot type: 'm'=maximal, 's'=square
        xlog: false,        // Log scale X
        ylog: false,        // Log scale Y
        adj: 0.5,           // Text adjustment
        ann: true,          // Annotate plots
        ask: false,         // Ask before new page
        bty: 'o',           // Box type: 'o', 'l', '7', 'c', 'u', ']'
        lab: [5, 5, 7],     // Number of tick marks
        mgp: [3, 1, 0],     // Axis label positions
        tck: NaN,           // Tick mark length
        tcl: -0.5,          // Tick length
        xaxt: 's',          // X-axis type: 's'=standard, 'n'=none
        yaxt: 's'           // Y-axis type
      };
      
      return Object.assign(defaultPar, options);
    } catch (e) {
      return {};
    }
  },

  // Basic Plotting Functions
  'PLOT': (x, y = null, options = {}) => {
    try {
      if (x === null || x === undefined) {
        return { type: 'plot', error: 'x data cannot be null or undefined' };
      }
      
      const plotData = {
        type: 'plot',
        x: Array.isArray(x) ? x : [x],
        y: y ? (Array.isArray(y) ? y : [y]) : null,
        options: {
          type: options.type || 'p',      // 'p'=points, 'l'=lines, 'b'=both, 'o'=overplotted, etc.
          main: options.main || '',       // Main title
          sub: options.sub || '',         // Subtitle
          xlab: options.xlab || '',       // X-axis label
          ylab: options.ylab || '',       // Y-axis label
          xlim: options.xlim || null,     // X-axis limits
          ylim: options.ylim || null,     // Y-axis limits
          col: options.col || 'black',    // Color
          pch: options.pch || 1,          // Point character
          cex: options.cex || 1,          // Character expansion
          lty: options.lty || 1,          // Line type
          lwd: options.lwd || 1,          // Line width
          log: options.log || '',         // Log scale: 'x', 'y', 'xy'
          axes: options.axes !== false,   // Draw axes
          ann: options.ann !== false,     // Draw annotations
          frame_plot: options.frame_plot !== false, // Draw frame
          panel_first: options.panel_first || null,
          panel_last: options.panel_last || null,
          asp: options.asp || null        // Aspect ratio
        },
        timestamp: new Date().toISOString()
      };

      // Auto-generate y if not provided
      if (!plotData.y) {
        plotData.y = Array.from({length: plotData.x.length}, (_, i) => i + 1);
        plotData.x = Array.from({length: plotData.x.length}, (_, i) => plotData.x[i]);
      }

      // Suggest render function to REPL
      suggestRender(plotData, options);

      return plotData;
    } catch (e) {
      return { type: 'plot', error: e.message };
    }
  },

  'POINTS': (x, y, options = {}) => {
    try {
      return {
        type: 'points',
        x: Array.isArray(x) ? x : [x],
        y: Array.isArray(y) ? y : [y],
        options: {
          col: options.col || 'black',
          pch: options.pch || 1,
          cex: options.cex || 1
        },
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return { type: 'points', error: e.message };
    }
  },

  'LINES': (x, y, options = {}) => {
    try {
      return {
        type: 'lines',
        x: Array.isArray(x) ? x : [x],
        y: Array.isArray(y) ? y : [y],
        options: {
          col: options.col || 'black',
          lty: options.lty || 1,
          lwd: options.lwd || 1
        },
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return { type: 'lines', error: e.message };
    }
  },


  // Statistical Plots
  'HIST': (x, options = {}) => {
    try {
      // Handle named parameter syntax: HIST data=[1,2,3]
      let inputData = x;
      if (options && options.data && !x) {
        inputData = options.data;
      } else if (typeof x === 'object' && x.data && !Array.isArray(x)) {
        // Handle case where all params come as first argument object
        options = x;
        inputData = x.data;
      }
      
      const data = Array.isArray(inputData) ? inputData : [inputData];
      const numericData = data.filter(val => !isNaN(parseFloat(val))).map(val => parseFloat(val));
      
      if (numericData.length === 0) {
        return { type: 'hist', error: 'No numeric data provided' };
      }

      // Calculate breaks
      let breaks = options.breaks || 'Sturges';
      let nBins;
      
      if (typeof breaks === 'string') {
        switch (breaks.toLowerCase()) {
          case 'sturges':
            nBins = Math.ceil(Math.log2(numericData.length)) + 1;
            break;
          case 'scott':
            const sd = rGraphicsFunctions.calculateSD(numericData);
            const h = 3.5 * sd * Math.pow(numericData.length, -1/3);
            nBins = Math.ceil((Math.max(...numericData) - Math.min(...numericData)) / h);
            break;
          default:
            nBins = 10;
        }
      } else if (typeof breaks === 'number') {
        nBins = breaks;
      } else {
        nBins = 10;
      }

      // Create histogram bins
      const min = Math.min(...numericData);
      const max = Math.max(...numericData);
      
      // Handle constant values (all data points are the same)
      let binWidth = (max - min) / nBins;
      if (binWidth === 0) {
        // For constant values, create a single bin centered around the value
        nBins = 1;
        binWidth = 1; // arbitrary width for display
        const bins = [{
          start: min - 0.5,
          end: min + 0.5,
          count: numericData.length,
          density: numericData.length
        }];
        
        const plotData = {
          type: 'hist',
          data: numericData,
          bins: bins,
          breaks: [min - 0.5, min + 0.5],
          counts: [numericData.length],
          density: [numericData.length],
          mids: [min],
          options: {
            main: options.main || 'Histogram',
            xlab: options.xlab || '',
            ylab: options.ylab || 'Frequency',
            col: options.col || 'lightgray',
            border: options.border || 'black',
            freq: options.freq !== false,
            probability: options.probability === true,
            density: options.density || null,
            angle: options.angle || 45,
            xlim: options.xlim || [min - 1, min + 1],
            ylim: options.ylim || null
          },
          timestamp: new Date().toISOString()
        };

        // Suggest render function to REPL
        if (typeof window !== 'undefined' && window.rexxjs) {
          window.rexxjs.suggestedRenderFunction = () => {
            return rGraphicsFunctions.RENDER({
              plot: plotData,
              output: window.rexxjs.renderTarget || 'auto',
              width: options.width || 800,
              height: options.height || 600
            });
          };
        }

        return plotData;
      }
      
      const bins = Array.from({length: nBins}, (_, i) => ({
        start: min + i * binWidth,
        end: min + (i + 1) * binWidth,
        count: 0,
        density: 0
      }));

      // Fill bins
      for (const value of numericData) {
        let binIndex = Math.floor((value - min) / binWidth);
        if (binIndex >= nBins) binIndex = nBins - 1;
        if (binIndex < 0) binIndex = 0;
        bins[binIndex].count++;
      }

      // Calculate density
      const totalArea = binWidth * numericData.length;
      bins.forEach(bin => {
        bin.density = bin.count / totalArea;
      });

      const plotData = {
        type: 'hist',
        data: numericData,
        bins: bins,
        breaks: bins.map(bin => bin.start).concat([bins[bins.length - 1].end]),
        counts: bins.map(bin => bin.count),
        density: bins.map(bin => bin.density),
        mids: bins.map(bin => (bin.start + bin.end) / 2),
        options: {
          main: options.main || 'Histogram',
          xlab: options.xlab || '',
          ylab: options.ylab || 'Frequency',
          col: options.col || 'lightgray',
          border: options.border || 'black',
          freq: options.freq !== false,
          probability: options.probability === true,
          density: options.density || null,
          angle: options.angle || 45,
          xlim: options.xlim || [min, max],
          ylim: options.ylim || null
        },
        timestamp: new Date().toISOString()
      };

      // Suggest render function to REPL
      suggestRender(plotData, options);

      return plotData;
    } catch (e) {
      return { type: 'hist', error: e.message };
    }
  },

  'BOXPLOT': (x, options = {}) => {
    try {
      const data = Array.isArray(x) ? x : [x];
      const numericData = data.filter(val => !isNaN(parseFloat(val))).map(val => parseFloat(val));
      
      if (numericData.length === 0) {
        return { type: 'boxplot', error: 'No numeric data provided' };
      }

      const sorted = numericData.sort((a, b) => a - b);
      const n = sorted.length;
      
      // Calculate quartiles
      const q1 = rGraphicsFunctions.calculateQuantile(sorted, 0.25);
      const q2 = rGraphicsFunctions.calculateQuantile(sorted, 0.5);  // median
      const q3 = rGraphicsFunctions.calculateQuantile(sorted, 0.75);
      const iqr = q3 - q1;
      
      // Calculate whiskers
      const lowerWhisker = Math.max(sorted[0], q1 - 1.5 * iqr);
      const upperWhisker = Math.min(sorted[n - 1], q3 + 1.5 * iqr);
      
      // Find outliers
      const outliers = sorted.filter(val => val < lowerWhisker || val > upperWhisker);

      return {
        type: 'boxplot',
        data: numericData,
        stats: {
          min: sorted[0],
          q1: q1,
          median: q2,
          q3: q3,
          max: sorted[n - 1],
          iqr: iqr,
          lowerWhisker: lowerWhisker,
          upperWhisker: upperWhisker,
          outliers: outliers,
          n: n
        },
        options: {
          main: options.main || 'Box Plot',
          xlab: options.xlab || '',
          ylab: options.ylab || '',
          col: options.col || 'lightblue',
          border: options.border || 'black',
          outline: options.outline !== false,
          range: options.range || 1.5,
          width: options.width || null,
          varwidth: options.varwidth === true,
          notch: options.notch === true,
          horizontal: options.horizontal === true
        },
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return { type: 'boxplot', error: e.message };
    }
  },

  'BARPLOT': (height, options = {}) => {
    try {
      const data = Array.isArray(height) ? height : [height];
      const numericData = data.map(val => parseFloat(val) || 0);
      
      const plotData = {
        type: 'barplot',
        heights: numericData,
        names: options.names || data.map((_, i) => String(i + 1)),
        options: {
          main: options.main || 'Bar Plot',
          xlab: options.xlab || '',
          ylab: options.ylab || '',
          col: options.col || 'gray',
          border: options.border || 'black',
          space: options.space || 0.2,
          width: options.width || 1,
          xlim: options.xlim || null,
          ylim: options.ylim || [0, Math.max(...numericData) * 1.1],
          beside: options.beside === true,
          horiz: options.horiz === true,
          density: options.density || null,
          angle: options.angle || 45,
          offset: options.offset || 0
        },
        timestamp: new Date().toISOString()
      };

      // Suggest render function to REPL
      suggestRender(plotData, options);

      return plotData;
    } catch (e) {
      return { type: 'barplot', error: e.message };
    }
  },

  'PIE': (x, options = {}) => {
    try {
      const data = Array.isArray(x) ? x : [x];
      const numericData = data.map(val => parseFloat(val) || 0);
      // Check for non-positive values
      if (numericData.some(val => val <= 0)) {
        return { type: 'pie', error: 'Data must contain positive values' };
      }
      
      const total = numericData.reduce((sum, val) => sum + val, 0);
      
      if (total <= 0) {
        return { type: 'pie', error: 'Data must contain positive values' };
      }

      const percentages = numericData.map(val => (val / total) * 100);
      const angles = numericData.map(val => (val / total) * 360);

      const plotData = {
        type: 'pie',
        values: numericData,
        percentages: percentages,
        angles: angles,
        labels: options.labels || data.map((_, i) => String(i + 1)),
        options: {
          main: options.main || 'Pie Chart',
          col: options.col || rGraphicsFunctions.generateColors(numericData.length),
          border: options.border || 'white',
          lty: options.lty || 1,
          density: options.density || null,
          angle: options.angle || 45,
          clockwise: options.clockwise === true,
          init_angle: options.init_angle || 90,
          radius: options.radius || 0.8
        },
        timestamp: new Date().toISOString()
      };

      // Suggest render function to REPL
      suggestRender(plotData, options);

      return plotData;
    } catch (e) {
      return { type: 'pie', error: e.message };
    }
  },

  'SCATTER': (x, y, options = {}) => {
    try {
      const xData = Array.isArray(x) ? x : [x];
      const yData = Array.isArray(y) ? y : [y];
      
      if (xData.length !== yData.length) {
        return { type: 'scatter', error: 'x and y data must have same length' };
      }

      const plotData = {
        type: 'scatter',
        x: xData.map(val => parseFloat(val)),
        y: yData.map(val => parseFloat(val)),
        options: {
          main: options.main || 'Scatter Plot',
          xlab: options.xlab || 'X',
          ylab: options.ylab || 'Y',
          col: options.col || 'black',
          pch: options.pch || 1,
          cex: options.cex || 1,
          xlim: options.xlim || null,
          ylim: options.ylim || null,
          log: options.log || '',
          type: options.type || 'p'
        },
        timestamp: new Date().toISOString()
      };

      // Suggest render function to REPL
      suggestRender(plotData, options);

      return plotData;
    } catch (e) {
      return { type: 'scatter', error: e.message };
    }
  },

  // Alias for SCATTER (common alternative spelling)
  'SCATTEPLOT': (x, y, options = {}) => {
    return rGraphicsFunctions.SCATTER(x, y, options);
  },

  // Specialized Plots
  'QQPLOT': (x, y = null, options = {}) => {
    try {
      const xData = Array.isArray(x) ? x.filter(val => !isNaN(parseFloat(val))).map(parseFloat) : [parseFloat(x)];
      
      let yData;
      if (y === null) {
        // Q-Q plot against normal distribution
        yData = rGraphicsFunctions.generateNormalQuantiles(xData.length);
      } else {
        yData = Array.isArray(y) ? y.filter(val => !isNaN(parseFloat(val))).map(parseFloat) : [parseFloat(y)];
      }

      const xQuantiles = rGraphicsFunctions.calculateQuantiles(xData);
      const yQuantiles = rGraphicsFunctions.calculateQuantiles(yData);

      return {
        type: 'qqplot',
        x: xQuantiles,
        y: yQuantiles,
        options: {
          main: options.main || 'Q-Q Plot',
          xlab: options.xlab || 'Theoretical Quantiles',
          ylab: options.ylab || 'Sample Quantiles',
          col: options.col || 'black',
          pch: options.pch || 1,
          cex: options.cex || 1,
          qqline: options.qqline !== false
        },
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return { type: 'qqplot', error: e.message };
    }
  },

  'QQNORM': (x, options = {}) => {
    try {
      const data = Array.isArray(x) ? x.filter(val => !isNaN(parseFloat(val))).map(parseFloat) : [parseFloat(x)];
      
      if (data.length < 2) {
        return { type: 'qqnorm', error: 'Need at least 2 data points' };
      }

      // Always compare against normal distribution
      const normalQuantiles = rGraphicsFunctions.generateNormalQuantiles(data.length);
      const sampleQuantiles = rGraphicsFunctions.calculateQuantiles(data);

      return {
        type: 'qqnorm',
        x: normalQuantiles,
        y: sampleQuantiles,
        sample: data,
        options: {
          main: options.main || 'Normal Q-Q Plot',
          xlab: options.xlab || 'Theoretical Normal Quantiles',
          ylab: options.ylab || 'Sample Quantiles',
          col: options.col || 'black',
          pch: options.pch || 1,
          cex: options.cex || 1,
          qqline: options.qqline !== false
        },
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return { type: 'qqnorm', error: e.message };
    }
  },

  'DENSITY_PLOT': (x, options = {}) => {
    try {
      const data = Array.isArray(x) ? x.filter(val => !isNaN(parseFloat(val))).map(parseFloat) : [parseFloat(x)];
      
      if (data.length < 2) {
        return { type: 'density', error: 'Need at least 2 data points' };
      }

      const density = rGraphicsFunctions.calculateKernelDensity(data, options.kernel || 'gaussian', options.bw || 'nrd0');

      return {
        type: 'density',
        x: density.x,
        y: density.y,
        data: data,
        options: {
          main: options.main || 'Density Plot',
          xlab: options.xlab || '',
          ylab: options.ylab || 'Density',
          col: options.col || 'black',
          lty: options.lty || 1,
          lwd: options.lwd || 1,
          fill: options.fill || null,
          alpha: options.alpha || 0.5,
          kernel: options.kernel || 'gaussian',
          bw: options.bw || 'nrd0'
        },
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return { type: 'density', error: e.message };
    }
  },

  // Utility Functions
  'COLORS': () => {
    return [
      'white', 'black', 'red', 'green', 'blue', 'cyan', 'magenta', 'yellow',
      'gray', 'darkgray', 'lightgray', 'brown', 'orange', 'pink', 'gold',
      'purple', 'violet', 'turquoise', 'salmon', 'lightblue', 'lightgreen',
      'khaki', 'lavender', 'maroon', 'navy', 'olive', 'teal', 'silver',
      'lime', 'aqua', 'fuchsia', 'coral', 'crimson', 'darkblue', 'darkgreen',
      'darkred', 'indigo', 'midnightblue', 'forestgreen', 'darkorange',
      'darkviolet', 'deepskyblue', 'goldenrod', 'hotpink', 'limegreen'
    ];
  },

  'RGB': (r, g, b, alpha = 1) => {
    try {
      const red = Math.round(Math.max(0, Math.min(255, r * 255)));
      const green = Math.round(Math.max(0, Math.min(255, g * 255)));
      const blue = Math.round(Math.max(0, Math.min(255, b * 255)));
      const a = Math.max(0, Math.min(1, alpha));
      
      if (a === 1 || alpha === 1) {
        return `rgb(${red},${green},${blue})`;
      } else if (a === 0) {
        return `rgb(${red},${green},${blue})`; // Treat alpha=0 as opaque for R compatibility
      } else {
        return `rgba(${red},${green},${blue},${a})`;
      }
    } catch (e) {
      return 'black';
    }
  },

  'HSV': (h, s, v) => {
    try {
      const hue = ((h % 360) + 360) % 360;
      const sat = Math.max(0, Math.min(1, s));
      const val = Math.max(0, Math.min(1, v));
      
      const c = val * sat;
      const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
      const m = val - c;
      
      let r, g, b;
      
      if (hue < 60) {
        r = c; g = x; b = 0;
      } else if (hue < 120) {
        r = x; g = c; b = 0;
      } else if (hue < 180) {
        r = 0; g = c; b = x;
      } else if (hue < 240) {
        r = 0; g = x; b = c;
      } else if (hue < 300) {
        r = x; g = 0; b = c;
      } else {
        r = c; g = 0; b = x;
      }
      
      return rGraphicsFunctions.RGB(r + m, g + m, b + m);
    } catch (e) {
      return 'black';
    }
  },

  // Helper Functions
  calculateSD: (data) => {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
    return Math.sqrt(variance);
  },

  calculateQuantile: (sortedData, q) => {
    const n = sortedData.length;
    if (n === 0) return NaN;
    if (n === 1) return sortedData[0];
    
    // Use R's quantile method (type 7, default)
    const h = (n - 1) * q;
    const hFloor = Math.floor(h);
    const hCeil = Math.ceil(h);
    
    if (hFloor === hCeil) {
      return sortedData[hFloor];
    } else {
      return sortedData[hFloor] + (h - hFloor) * (sortedData[hCeil] - sortedData[hFloor]);
    }
  },

  calculateQuantiles: (data) => {
    const sorted = data.slice().sort((a, b) => a - b);
    const n = sorted.length;
    return Array.from({length: n}, (_, i) => {
      const q = (i + 0.5) / n;
      return rGraphicsFunctions.calculateQuantile(sorted, q);
    });
  },

  generateNormalQuantiles: (n) => {
    // Generate quantiles for standard normal distribution
    return Array.from({length: n}, (_, i) => {
      const p = (i + 0.5) / n;
      return rGraphicsFunctions.qnorm(p);
    });
  },

  qnorm: (p) => {
    // Approximation of inverse normal CDF (quantile function)
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;
    
    // Beasley-Springer-Moro algorithm approximation
    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q, r;
    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) / ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q / (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) / ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
    }
  },

  calculateKernelDensity: (data, kernel = 'gaussian', bw = 'nrd0') => {
    const n = data.length;
    const sorted = data.slice().sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;
    
    // Calculate bandwidth
    let bandwidth;
    if (typeof bw === 'string') {
      switch (bw) {
        case 'nrd0':
          const sd = rGraphicsFunctions.calculateSD(data);
          const iqr = rGraphicsFunctions.calculateQuantile(sorted, 0.75) - rGraphicsFunctions.calculateQuantile(sorted, 0.25);
          bandwidth = 0.9 * Math.min(sd, iqr / 1.34) * Math.pow(n, -0.2);
          break;
        case 'nrd':
          bandwidth = 1.06 * rGraphicsFunctions.calculateSD(data) * Math.pow(n, -0.2);
          break;
        default:
          bandwidth = range / 50;
      }
    } else {
      bandwidth = bw;
    }
    
    // Generate evaluation points
    const nPoints = 512;
    const extend = 3 * bandwidth;
    const xMin = min - extend;
    const xMax = max + extend;
    const step = (xMax - xMin) / (nPoints - 1);
    
    const x = Array.from({length: nPoints}, (_, i) => xMin + i * step);
    const y = new Array(nPoints).fill(0);
    
    // Calculate density at each point
    for (let i = 0; i < nPoints; i++) {
      for (let j = 0; j < n; j++) {
        const u = (x[i] - data[j]) / bandwidth;
        y[i] += rGraphicsFunctions.kernelFunction(u, kernel);
      }
      y[i] /= (n * bandwidth);
    }
    
    return { x, y };
  },

  kernelFunction: (u, kernel) => {
    switch (kernel.toLowerCase()) {
      case 'gaussian':
      case 'normal':
        return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
      case 'epanechnikov':
        return Math.abs(u) <= 1 ? 0.75 * (1 - u * u) : 0;
      case 'uniform':
      case 'rectangular':
        return Math.abs(u) <= 1 ? 0.5 : 0;
      case 'triangular':
        return Math.abs(u) <= 1 ? 1 - Math.abs(u) : 0;
      case 'biweight':
      case 'quartic':
        return Math.abs(u) <= 1 ? (15/16) * Math.pow(1 - u * u, 2) : 0;
      case 'triweight':
        return Math.abs(u) <= 1 ? (35/32) * Math.pow(1 - u * u, 3) : 0;
      case 'cosine':
        return Math.abs(u) <= 1 ? (Math.PI/4) * Math.cos((Math.PI/2) * u) : 0;
      default:
        return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI); // Default to gaussian
    }
  },

  generateColors: (n) => {
    const baseColors = ['red', 'blue', 'green', 'orange', 'purple', 'brown', 'pink', 'gray', 'olive', 'cyan'];
    if (n <= baseColors.length) {
      return baseColors.slice(0, n);
    }
    
    // Generate more colors using HSV
    const colors = [];
    for (let i = 0; i < n; i++) {
      const hue = (360 * i) / n;
      const saturation = 0.7 + 0.3 * Math.sin(i);
      const value = 0.8 + 0.2 * Math.cos(i);
      colors.push(rGraphicsFunctions.HSV(hue, saturation, value));
    }
    return colors;
  },

  'QQLINE': (qqData, options = {}) => {
    try {
      if (!qqData || qqData.type !== 'qqplot' && qqData.type !== 'qqnorm') {
        return { type: 'qqline', error: 'QQLINE requires Q-Q plot data' };
      }

      if (qqData.error) {
        return { type: 'qqline', error: qqData.error };
      }

      const x = qqData.x || [];
      const y = qqData.y || [];

      if (x.length < 2 || y.length < 2 || x.length !== y.length) {
        return { type: 'qqline', error: 'Insufficient data for Q-Q line' };
      }

      // Calculate line through first and third quartiles (robust method)
      const sortedIndices = Array.from({length: x.length}, (_, i) => i)
        .sort((a, b) => x[a] - x[b]);
      
      const q1Index = Math.floor(x.length * 0.25);
      const q3Index = Math.floor(x.length * 0.75);
      
      const q1x = x[sortedIndices[q1Index]];
      const q1y = y[sortedIndices[q1Index]];
      const q3x = x[sortedIndices[q3Index]];
      const q3y = y[sortedIndices[q3Index]];

      // Calculate slope and intercept
      const slope = (q3y - q1y) / (q3x - q1x);
      const intercept = q1y - slope * q1x;

      // Generate line points across the data range
      const xMin = Math.min(...x);
      const xMax = Math.max(...x);
      const lineX = [xMin, xMax];
      const lineY = [slope * xMin + intercept, slope * xMax + intercept];

      return {
        type: 'qqline',
        x: lineX,
        y: lineY,
        slope: slope,
        intercept: intercept,
        originalData: {
          x: x,
          y: y
        },
        options: {
          col: options.col || 'red',
          lty: options.lty || 1,
          lwd: options.lwd || 2,
          main: options.main || 'Q-Q Line',
          xlab: options.xlab || 'Theoretical Quantiles',
          ylab: options.ylab || 'Sample Quantiles'
        },
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return { type: 'qqline', error: e.message };
    }
  },

  'CONTOUR': (x, y, z, options = {}) => {
    try {
      const xData = Array.isArray(x) ? x : [x];
      const yData = Array.isArray(y) ? y : [y];
      const zMatrix = Array.isArray(z) ? z : [[z]];

      // Validate input dimensions
      if (xData.length === 0 || yData.length === 0) {
        return { type: 'contour', error: 'X and Y coordinates cannot be empty' };
      }

      // Ensure z is a proper matrix
      if (!Array.isArray(zMatrix[0])) {
        return { type: 'contour', error: 'Z must be a 2D array (matrix)' };
      }

      const nRows = zMatrix.length;
      const nCols = zMatrix[0].length;

      // Generate default x,y grids if needed
      let xGrid = xData;
      let yGrid = yData;
      
      if (xGrid.length !== nCols) {
        xGrid = Array.from({length: nCols}, (_, i) => i);
      }
      if (yGrid.length !== nRows) {
        yGrid = Array.from({length: nRows}, (_, i) => i);
      }

      // Calculate z-value range for contour levels
      const flatZ = zMatrix.flat().filter(v => !isNaN(v));
      if (flatZ.length === 0) {
        return { type: 'contour', error: 'No valid Z values found' };
      }

      const zMin = Math.min(...flatZ);
      const zMax = Math.max(...flatZ);
      
      // Generate contour levels
      const nLevels = options.nlevels || 10;
      const levels = [];
      for (let i = 0; i <= nLevels; i++) {
        levels.push(zMin + (zMax - zMin) * i / nLevels);
      }

      // Simple marching squares algorithm for contour extraction
      const contours = [];
      
      for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
        const level = levels[levelIndex];
        const contourPaths = [];
        
        // For each cell in the grid, check for contour intersections
        for (let i = 0; i < nRows - 1; i++) {
          for (let j = 0; j < nCols - 1; j++) {
            const z00 = zMatrix[i][j];
            const z10 = zMatrix[i][j + 1];
            const z01 = zMatrix[i + 1][j];
            const z11 = zMatrix[i + 1][j + 1];
            
            // Skip if any corners are NaN
            if (isNaN(z00) || isNaN(z10) || isNaN(z01) || isNaN(z11)) continue;
            
            // Determine which corners are above/below the contour level
            const above00 = z00 >= level;
            const above10 = z10 >= level;
            const above01 = z01 >= level;
            const above11 = z11 >= level;
            
            // Count how many corners are above the level
            const aboveCount = [above00, above10, above01, above11].filter(Boolean).length;
            
            // Only draw contour if it passes through this cell
            if (aboveCount > 0 && aboveCount < 4) {
              const x0 = xGrid[j];
              const x1 = xGrid[j + 1];
              const y0 = yGrid[i];
              const y1 = yGrid[i + 1];
              
              const path = rGraphicsFunctions.extractContourPath(
                x0, x1, y0, y1,
                z00, z10, z01, z11,
                level,
                above00, above10, above01, above11
              );
              
              if (path.length > 0) {
                contourPaths.push(path);
              }
            }
          }
        }
        
        if (contourPaths.length > 0) {
          contours.push({
            level: level,
            paths: contourPaths,
            color: rGraphicsFunctions.getContourColor(levelIndex, levels.length, options.colors)
          });
        }
      }

      return {
        type: 'contour',
        x: xGrid,
        y: yGrid,
        z: zMatrix,
        levels: levels,
        contours: contours,
        options: {
          main: options.main || 'Contour Plot',
          xlab: options.xlab || 'X',
          ylab: options.ylab || 'Y',
          nlevels: nLevels,
          colors: options.colors || null,
          filled: options.filled || false
        },
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return { type: 'contour', error: e.message };
    }
  },

  // Helper function to extract contour path from a grid cell
  extractContourPath: function(x0, x1, y0, y1, z00, z10, z01, z11, level, above00, above10, above01, above11) {
    const path = [];
    
    // Linear interpolation helper
    const lerp = (a, b, t) => a + (b - a) * t;
    
    // Check each edge for contour intersections
    const edges = [];
    
    // Bottom edge (z00 to z10)
    if (above00 !== above10) {
      const t = (level - z00) / (z10 - z00);
      edges.push({ x: lerp(x0, x1, t), y: y0 });
    }
    
    // Right edge (z10 to z11)
    if (above10 !== above11) {
      const t = (level - z10) / (z11 - z10);
      edges.push({ x: x1, y: lerp(y0, y1, t) });
    }
    
    // Top edge (z01 to z11)
    if (above01 !== above11) {
      const t = (level - z01) / (z11 - z01);
      edges.push({ x: lerp(x0, x1, t), y: y1 });
    }
    
    // Left edge (z00 to z01)
    if (above00 !== above01) {
      const t = (level - z00) / (z01 - z00);
      edges.push({ x: x0, y: lerp(y0, y1, t) });
    }
    
    // Connect the intersection points
    if (edges.length >= 2) {
      return [edges[0], edges[1]];
    }
    
    return [];
  },

  // Helper function to get contour color
  getContourColor: function(index, total, customColors) {
    if (customColors && Array.isArray(customColors)) {
      return customColors[index % customColors.length];
    }
    
    // Default color scheme - blue to red
    const ratio = index / (total - 1);
    const hue = (1 - ratio) * 240; // Blue (240) to Red (0)
    return `hsl(${hue}, 70%, 50%)`;
  },

  'HEATMAP': (data, options = {}) => {
    try {
      // Handle different input formats
      let matrix;
      
      if (Array.isArray(data) && Array.isArray(data[0])) {
        // Already a 2D array
        matrix = data;
      } else if (Array.isArray(data)) {
        // Convert 1D array to square matrix if possible
        const size = Math.sqrt(data.length);
        if (size === Math.floor(size)) {
          matrix = Array.from({length: size}, (_, i) => 
            data.slice(i * size, (i + 1) * size)
          );
        } else {
          return { type: 'heatmap', error: '1D array length must be a perfect square for automatic matrix conversion' };
        }
      } else {
        return { type: 'heatmap', error: 'Data must be a 2D array or 1D array with perfect square length' };
      }

      if (matrix.length === 0 || matrix[0].length === 0) {
        return { type: 'heatmap', error: 'Matrix cannot be empty' };
      }

      const nRows = matrix.length;
      const nCols = matrix[0].length;

      // Validate all rows have same length
      for (let i = 0; i < nRows; i++) {
        if (matrix[i].length !== nCols) {
          return { type: 'heatmap', error: 'All matrix rows must have the same length' };
        }
      }

      // Extract numeric values and calculate range
      const flatValues = matrix.flat().filter(v => !isNaN(parseFloat(v))).map(parseFloat);
      if (flatValues.length === 0) {
        return { type: 'heatmap', error: 'No valid numeric values found in matrix' };
      }

      const minValue = Math.min(...flatValues);
      const maxValue = Math.max(...flatValues);
      const valueRange = maxValue - minValue || 1;

      // Generate row and column labels if not provided
      const rowLabels = options.rownames || Array.from({length: nRows}, (_, i) => `Row ${i + 1}`);
      const colLabels = options.colnames || Array.from({length: nCols}, (_, i) => `Col ${i + 1}`);

      // Create color mapping for each cell
      const colorMatrix = matrix.map((row, i) => 
        row.map((value, j) => {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) return null;
          
          // Normalize to 0-1 range
          const normalized = (numValue - minValue) / valueRange;
          
          // Generate color based on colorscheme
          const color = rGraphicsFunctions.getHeatmapColor(normalized, options.colorscheme);
          
          return {
            value: numValue,
            normalized: normalized,
            color: color,
            row: i,
            col: j,
            rowLabel: rowLabels[i] || `R${i}`,
            colLabel: colLabels[j] || `C${j}`
          };
        })
      );

      return {
        type: 'heatmap',
        matrix: matrix,
        colorMatrix: colorMatrix,
        nRows: nRows,
        nCols: nCols,
        minValue: minValue,
        maxValue: maxValue,
        rowLabels: rowLabels,
        colLabels: colLabels,
        options: {
          main: options.main || 'Heatmap',
          xlab: options.xlab || '',
          ylab: options.ylab || '',
          colorscheme: options.colorscheme || 'heat',
          scale: options.scale || 'none', // 'row', 'column', or 'none'
          showValues: options.showValues !== false,
          cellWidth: options.cellWidth || 30,
          cellHeight: options.cellHeight || 30
        },
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return { type: 'heatmap', error: e.message };
    }
  },

  // Helper function to generate heatmap colors
  getHeatmapColor: function(normalized, colorscheme = 'heat') {
    // Clamp normalized value to 0-1 range
    const t = Math.max(0, Math.min(1, normalized));
    
    switch (colorscheme) {
      case 'heat': // Red-Orange-Yellow-White
        if (t < 0.33) {
          const r = 255;
          const g = Math.round(t * 3 * 255);
          return `rgb(${r}, ${g}, 0)`;
        } else if (t < 0.66) {
          const r = 255;
          const g = 255;
          const b = Math.round((t - 0.33) * 3 * 255);
          return `rgb(${r}, ${g}, ${b})`;
        } else {
          const intensity = Math.round((1 - t) * 0.33 * 255 + 0.67 * 255);
          return `rgb(255, 255, ${intensity})`;
        }
      
      case 'cool': // Blue-Cyan-Green
        const r = Math.round(t * 255);
        const g = Math.round((1 - t) * 255);
        return `rgb(${r}, ${g}, 255)`;
      
      case 'viridis': // Purple-Blue-Green-Yellow
        if (t < 0.25) {
          const ratio = t * 4;
          const r = Math.round(68 + ratio * (59 - 68));
          const g = Math.round(1 + ratio * (82 - 1));
          const b = Math.round(84 + ratio * (139 - 84));
          return `rgb(${r}, ${g}, ${b})`;
        } else if (t < 0.5) {
          const ratio = (t - 0.25) * 4;
          const r = Math.round(59 + ratio * (33 - 59));
          const g = Math.round(82 + ratio * (144 - 82));
          const b = Math.round(139 + ratio * (140 - 139));
          return `rgb(${r}, ${g}, ${b})`;
        } else if (t < 0.75) {
          const ratio = (t - 0.5) * 4;
          const r = Math.round(33 + ratio * (94 - 33));
          const g = Math.round(144 + ratio * (201 - 144));
          const b = Math.round(140 + ratio * (97 - 140));
          return `rgb(${r}, ${g}, ${b})`;
        } else {
          const ratio = (t - 0.75) * 4;
          const r = Math.round(94 + ratio * (253 - 94));
          const g = Math.round(201 + ratio * (231 - 201));
          const b = Math.round(97 + ratio * (37 - 97));
          return `rgb(${r}, ${g}, ${b})`;
        }
      
      case 'grayscale':
        const intensity = Math.round(t * 255);
        return `rgb(${intensity}, ${intensity}, ${intensity})`;
      
      default: // Default to heat colorscheme
        return rGraphicsFunctions.getHeatmapColor(normalized, 'heat');
    }
  },

  'ABLINE': (a = null, b = null, hOrOptions = null, v = null, options = {}) => {
    try {
      let slope = null;
      let intercept = null;
      let isVertical = false;
      let isHorizontal = false;
      let h = null;
      
      // Handle different input formats - check if third parameter is options object
      if (typeof hOrOptions === 'object' && hOrOptions !== null) {
        // Called with options object: ABLINE(a, b, { h: 5, v: 3, ... })
        options = { ...hOrOptions, ...options };
        h = null;
      } else {
        // Called with direct parameters: ABLINE(a, b, h, v, options)
        h = hOrOptions;
      }
      
      if (a !== null && b !== null) {
        // abline(a, b) - intercept and slope
        intercept = parseFloat(a);
        slope = parseFloat(b);
      } else if (h !== null) {
        // Horizontal line at y = h
        isHorizontal = true;
        intercept = parseFloat(h);
      } else if (v !== null) {
        // Vertical line at x = v  
        isVertical = true;
        intercept = parseFloat(v);
      } else if (options.h !== undefined) {
        // Horizontal line at y = h (from options)
        isHorizontal = true;
        intercept = parseFloat(options.h);
      } else if (options.v !== undefined) {
        // Vertical line at x = v (from options)
        isVertical = true;
        intercept = parseFloat(options.v);
      } else if (options.coef && Array.isArray(options.coef) && options.coef.length >= 2) {
        // From linear model coefficients [intercept, slope]
        intercept = parseFloat(options.coef[0]);
        slope = parseFloat(options.coef[1]);
      } else if (a !== null) {
        // Single parameter could be slope with intercept 0, or horizontal line
        if (options.horizontal || options.h !== undefined) {
          isHorizontal = true;
          intercept = parseFloat(a);
        } else {
          intercept = 0;
          slope = parseFloat(a);
        }
      } else {
        return { type: 'abline', error: 'Must specify line parameters: (a,b), h=, v=, or coef=' };
      }

      // Validate numeric values
      if (!isVertical && !isHorizontal && (isNaN(intercept) || isNaN(slope))) {
        return { type: 'abline', error: 'Line parameters must be numeric' };
      }
      if ((isVertical || isHorizontal) && isNaN(intercept)) {
        return { type: 'abline', error: 'Line position must be numeric' };
      }

      // Generate line points for rendering
      let linePoints = [];
      
      if (isVertical) {
        // Vertical line - we'll need plot bounds to draw properly
        linePoints = [
          { x: intercept, y: -1000 },
          { x: intercept, y: 1000 }
        ];
      } else if (isHorizontal) {
        // Horizontal line
        linePoints = [
          { x: -1000, y: intercept },
          { x: 1000, y: intercept }
        ];
      } else {
        // Regular line with slope and intercept
        const xRange = options.xlim || [-10, 10];
        linePoints = [
          { x: xRange[0], y: intercept + slope * xRange[0] },
          { x: xRange[1], y: intercept + slope * xRange[1] }
        ];
      }

      return {
        type: 'abline',
        // R-style properties as expected by tests
        a: isHorizontal || isVertical ? null : intercept,
        b: isHorizontal || isVertical ? null : slope,
        h: isHorizontal ? intercept : null,
        v: isVertical ? intercept : null,
        // Internal properties
        slope: slope,
        intercept: intercept,
        isVertical: isVertical,
        isHorizontal: isHorizontal,
        points: linePoints,
        options: {
          col: options.col || 'red',
          lty: options.lty || 1,
          lwd: options.lwd || 1,
          alpha: options.alpha || 1.0
        },
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return { type: 'abline', error: e.message };
    }
  },

  // Universal rendering function - works in both NodeJS and Web environments
  'RENDER': (options = {}) => {
    try {
      // Extract parameters
      const plotData = options.plot || options.data;
      const output = options.output;
      const width = options.width || 800;
      const height = options.height || 600;
      const format = options.format || 'auto';
      const margin = options.margin;
      
      if (!plotData || !plotData.type) {
        throw new Error('RENDER: plot parameter is required and must be a valid plot object');
      }
      
      if (!output) {
        throw new Error('RENDER: output parameter is required');
      }
      
      // Detect environment
      const isNodeJS = (typeof window === 'undefined');
      const isWeb = (typeof window !== 'undefined');
      
      if (isNodeJS) {
        // NodeJS: File system rendering
        try {
          const path = require('path');
          const fs = require('fs');
          
          // Try to load the histogram renderer
          let renderPlotToPNG;
          try {
            const rendererPath = path.join(__dirname, 'histogram-renderer.js');
            if (fs.existsSync(rendererPath)) {
              renderPlotToPNG = require('./histogram-renderer').renderPlotToPNG;
            } else {
              // Try relative path
              renderPlotToPNG = require('./histogram-renderer').renderPlotToPNG;
            }
          } catch (e) {
            throw new Error(`RENDER: Could not load PNG renderer: ${e.message}. Make sure histogram-renderer.js is available.`);
          }
          
          // Set up render options
          const renderOptions = { width, height };
          if (margin) renderOptions.margin = margin;
          
          // Handle special output targets
          if (output === 'clipboard') {
            // For NodeJS, we'd need additional clipboard library
            throw new Error('RENDER: clipboard output not yet supported in NodeJS mode');
          }
          
          if (output === 'base64') {
            // Render to temporary file then convert to base64
            const tempPath = path.join('/tmp', `render-${Date.now()}.png`);
            const savedPath = renderPlotToPNG(plotData, tempPath, renderOptions);
            const imageBuffer = fs.readFileSync(savedPath);
            fs.unlinkSync(savedPath); // Clean up temp file
            return `data:image/png;base64,${imageBuffer.toString('base64')}`;
          }
          
          // Regular file output
          const savedPath = renderPlotToPNG(plotData, output, renderOptions);
          return savedPath;
          
        } catch (e) {
          throw new Error(`RENDER (NodeJS): ${e.message}`);
        }
        
      } else {
        // Web: DOM rendering
        return renderPlotToDOM(plotData, output, { width, height, format, margin });
      }
      
    } catch (e) {
      return { type: 'render', error: e.message };
    }
  }
};

// Fix circular references in PAIRS function after object is complete
rGraphicsFunctions.PAIRS = (data, options = {}) => {
  try {
    // Handle different input formats
    let matrix;
    let colNames;
    
    if (Array.isArray(data) && Array.isArray(data[0])) {
      // Already a 2D array (rows are observations, columns are variables)
      matrix = data;
      colNames = options.labels || Array.from({length: matrix[0].length}, (_, i) => `Var${i + 1}`);
    } else if (typeof data === 'object' && data !== null) {
      // Object with named columns
      colNames = Object.keys(data);
      const nRows = Math.max(...colNames.map(col => Array.isArray(data[col]) ? data[col].length : 1));
      matrix = Array.from({length: nRows}, (_, i) => 
        colNames.map(col => Array.isArray(data[col]) ? data[col][i] : data[col])
      );
    } else {
      return { type: 'pairs', error: 'Data must be a 2D array or object with named columns' };
    }

    if (!matrix || matrix.length === 0 || !matrix[0] || matrix[0].length < 2) {
      return { type: 'pairs', error: 'Need at least 2 variables for pairs plot' };
    }

    const nVars = matrix[0].length;
    const nObs = matrix.length;

    // Filter out rows with any NaN values
    const cleanMatrix = matrix.filter(row => 
      row.every(val => !isNaN(parseFloat(val)))
    ).map(row => row.map(val => parseFloat(val)));

    if (cleanMatrix.length < 2) {
      return { type: 'pairs', error: 'Need at least 2 complete observations for pairs plot' };
    }

    // Generate all pairwise scatterplots
    const panels = [];
    
    for (let i = 0; i < nVars; i++) {
      for (let j = 0; j < nVars; j++) {
        if (i === j) {
          // Diagonal: histogram or density plot
          const values = cleanMatrix.map(row => row[i]);
          const histData = rGraphicsFunctions.HIST(values, {
            main: colNames[i],
            xlab: colNames[i],
            bins: options.bins || 10,
            col: options.col || 'lightblue'
          });
          
          panels.push({
            row: i,
            col: j,
            type: 'histogram',
            data: histData,
            xVar: colNames[i],
            yVar: colNames[i]
          });
        } else {
          // Off-diagonal: scatterplot
          const xValues = cleanMatrix.map(row => row[j]); // Column j for x-axis
          const yValues = cleanMatrix.map(row => row[i]); // Row i for y-axis
          
          const scatterData = rGraphicsFunctions.SCATTER(xValues, yValues, {
            main: `${colNames[i]} vs ${colNames[j]}`,
            xlab: colNames[j],
            ylab: colNames[i],
            col: options.col || 'blue',
            pch: options.pch || 1,
            cex: options.cex || 0.8
          });
          
          panels.push({
            row: i,
            col: j,
            type: 'scatter',
            data: scatterData,
            xVar: colNames[j],
            yVar: colNames[i]
          });
        }
      }
    }

    // Calculate variable ranges for consistent scaling
    const varRanges = colNames.map((_, varIdx) => {
      const values = cleanMatrix.map(row => row[varIdx]);
      return {
        min: Math.min(...values),
        max: Math.max(...values),
        range: Math.max(...values) - Math.min(...values)
      };
    });

    return {
      type: 'pairs',
      panels: panels,
      nVars: nVars,
      nObs: cleanMatrix.length,
      varNames: colNames,
      varRanges: varRanges,
      cleanData: cleanMatrix,
      options: {
        main: options.main || 'Pairs Plot',
        col: options.col || 'blue',
        pch: options.pch || 1,
        cex: options.cex || 0.8,
        bins: options.bins || 10,
        labels: colNames
      },
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return { type: 'pairs', error: e.message };
  }
};

// Register functions globally in browser environment
if (typeof window !== 'undefined') {
  // Initialize registry if it doesn't exist
  if (!window.REXX_FUNCTION_LIBS) {
    window.REXX_FUNCTION_LIBS = [];
  }
  
  // Register the main object
  window.rGraphicsFunctions = rGraphicsFunctions;
  
  // Register individual functions globally (for backward compatibility)
  Object.assign(window, rGraphicsFunctions);
  
  // Register in the modern registry
  window.REXX_FUNCTION_LIBS.push({
    path: 'r-graphics-functions.js',
    name: 'r-graphics-functions', 
    version: '1.0.0',
    description: 'R Graphics and Visualization Functions',
    type: 'library',
    functions: rGraphicsFunctions,
    dependencies: []
  });

  // Register detection function for REQUIRE system (still needed for compatibility)
  window.GRAPHICS_FUNCTIONS_MAIN = () => {
    return {
      type: 'library',
      name: 'r-graphics-functions',
      version: '1.0.0',
      description: 'R Graphics and Visualization Functions',
      provides: {
        functions: Object.keys(rGraphicsFunctions)
      },
      dependencies: []
    };
  };
} else if (typeof global !== 'undefined') {
  // Node.js environment
  
  // Register the main object
  global.rGraphicsFunctions = rGraphicsFunctions;
  
  // Register individual functions globally
  Object.assign(global, rGraphicsFunctions);
  
  // Register detection function for REQUIRE system
  global.GRAPHICS_FUNCTIONS_MAIN = () => {
    return {
      type: 'library',
      name: 'r-graphics-functions',
      version: '1.0.0',
      description: 'R Graphics and Visualization Functions',
      provides: {
        functions: [
          'HIST', 'HIST', 'PLOT', 'SCATTER', 'BOXPLOT', 'BARPLOT', 'PIE',
          'DENSITY', 'QQPLOT', 'PAIRS', 'HEATMAP', 'CONTOUR', 'ABLINE', 'RENDER'
        ]
      },
      dependencies: []
    };
  };
  
  // Register with global registry if available
  if (typeof global.registerLibraryDetectionFunction === 'function') {
    global.registerLibraryDetectionFunction('r-graphics-functions', 'GRAPHICS_FUNCTIONS_MAIN');
  }
}

// Export for both Node.js and browser environments (module.exports)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rGraphicsFunctions };
}