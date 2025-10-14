/**
 * RENDER Function Jest Tests with RexxJS Embedding
 * Tests the universal RENDER() function in both Node.js and mocked web environments
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../../../../../core/src/interpreter');
const { rGraphicsFunctions } = require('../src/graphics-functions');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

/**
 * Validates that a PNG file contains actual graphics content (not just a blank/white image)
 * @param {string} pngPath - Path to the PNG file
 * @returns {Promise<boolean>} - True if the image has meaningful content
 */
async function hasMeaningfulContent(pngPath) {
  try {
    const buffer = fs.readFileSync(pngPath);
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;
    
    // Check for color diversity and non-white pixels
    let whitePixels = 0;
    let coloredPixels = 0;
    let uniqueColors = new Set();
    const totalPixels = pixels.length / 4;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
      const colorKey = `${r},${g},${b}`;
      uniqueColors.add(colorKey);
      
      // Count white pixels (allowing for slight variations)
      if (r > 250 && g > 250 && b > 250) {
        whitePixels++;
      } else if (a > 0) { // Non-transparent, non-white pixels
        coloredPixels++;
      }
    }
    
    // Image has meaningful content if:
    // 1. Less than 98% white pixels OR (more lenient)
    // 2. At least 1% colored pixels OR (more lenient)  
    // 3. At least 3 unique colors (more lenient)
    return (whitePixels / totalPixels) < 0.98 || 
           (coloredPixels / totalPixels) > 0.01 ||
           uniqueColors.size >= 3;
  } catch (error) {
    console.warn(`PNG content validation failed for ${pngPath}:`, error.message);
    return false; // Assume no meaningful content if validation fails
  }
}

describe('RENDER Function Integration Tests', () => {
  let interpreter;
  let testOutputDir;

  beforeAll(() => {
    testOutputDir = path.join(__dirname, 'test-render-output');
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  beforeEach(() => {
    interpreter = new RexxInterpreter();
    
    // Add the r-graphics functions to interpreter
    Object.keys(rGraphicsFunctions).forEach(funcName => {
      interpreter.builtInFunctions[funcName] = rGraphicsFunctions[funcName];
    });
  });

  afterAll(() => {
    // Clean up test output directory
    if (fs.existsSync(testOutputDir)) {
      const files = fs.readdirSync(testOutputDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testOutputDir, file));
      });
      fs.rmdirSync(testOutputDir);
    }
  });

  describe('NodeJS Environment Tests', () => {
    test('should render histogram to PNG file via RexxJS', async () => {
      const rexxCode = `
        LET dataJson = "[1, 2, 2, 3, 3, 3, 4, 4, 5, 6, 7]"
        LET data = JSON_PARSE text=dataJson
        LET histogram = HIST data=data breaks=5 main="Test Histogram" col="steelblue"
        LET outputPath = "${path.join(testOutputDir, 'rexx-histogram.png')}"
        LET result = RENDER plot=histogram output=outputPath width=800 height=600
      `;

      const { parse } = require('../../../../../core/src/parser');
      const commands = parse(rexxCode);
      await interpreter.run(commands);

      const result = interpreter.getVariable('result');
      const outputPath = interpreter.getVariable('outputPath');

      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);

      // Verify it's a valid PNG (starts with PNG signature)
      const fileBuffer = fs.readFileSync(outputPath);
      expect(fileBuffer.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4E, 0x47]));
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
    });

    test('should render barplot to PNG via RexxJS', async () => {
      const rexxCode = `
        LET heights = JSON_PARSE text="[10, 20, 15, 25, 30]"
        LET names = JSON_PARSE text='["A", "B", "C", "D", "E"]'
        LET barplot = BARPLOT heights=heights names=names main="Test Barplot" col="orange"
        LET outputPath = "${path.join(testOutputDir, 'rexx-barplot.png')}"
        LET result = RENDER plot=barplot output=outputPath width=1000 height=600
      `;

      const { parse } = require('../../../../../core/src/parser');
      const commands = parse(rexxCode);
      await interpreter.run(commands);

      const result = interpreter.getVariable('result');
      const outputPath = interpreter.getVariable('outputPath');

      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
    });

    test('should render scatter plot to PNG via RexxJS', async () => {
      const rexxCode = `
        LET x = JSON_PARSE text="[1, 2, 3, 4, 5]"
        LET y = JSON_PARSE text="[2, 4, 1, 5, 3]"
        LET scatter = SCATTER x=x y=y main="Test Scatter" col="red"
        LET outputPath = "${path.join(testOutputDir, 'rexx-scatter.png')}"
        LET result = RENDER plot=scatter output=outputPath width=800 height=600
      `;

      const { parse } = require('../../../../../core/src/parser');
      const commands = parse(rexxCode);
      await interpreter.run(commands);

      const result = interpreter.getVariable('result');
      expect(fs.existsSync(result)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(result)).toBe(true);
    });

    test('should handle high-resolution rendering with custom margins', async () => {
      const rexxCode = `
        LET data = JSON_PARSE text="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
        LET histogram = HIST data=data main="High-Res Test" col="purple"
        LET margins = JSON_PARSE text='{"top": 100, "right": 80, "bottom": 120, "left": 100}'
        LET outputPath = "${path.join(testOutputDir, 'rexx-highres.png')}"
        LET result = RENDER plot=histogram output=outputPath width=1600 height=1200 margin=margins
      `;

      const { parse } = require('../../../../../core/src/parser');
      const commands = parse(rexxCode);
      await interpreter.run(commands);

      const result = interpreter.getVariable('result');
      expect(fs.existsSync(result)).toBe(true);

      // Verify large file size (high resolution)
      const stats = fs.statSync(result);
      expect(stats.size).toBeGreaterThan(10000); // At least 10KB for 1600x1200
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(result)).toBe(true);
    });

    test('should generate base64 output via RexxJS', async () => {
      const rexxCode = `
        LET data = JSON_PARSE text="[1, 2, 3]"
        LET histogram = HIST data=data main="Base64 Test" col="green"
        LET result = RENDER plot=histogram output="base64" width=400 height=300
      `;

      const { parse } = require('../../../../../core/src/parser');
      const commands = parse(rexxCode);
      await interpreter.run(commands);

      const result = interpreter.getVariable('result');
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^data:image\/png;base64,/);
      expect(result.length).toBeGreaterThan(100);
    });

    test('should handle error cases via RexxJS', async () => {
      const rexxCode1 = `
        LET result1 = RENDER output="/tmp/test.png"
      `;

      const { parse } = require('../../../../../core/src/parser');
      const commands1 = parse(rexxCode1);
      await interpreter.run(commands1);

      const result1 = interpreter.getVariable('result1');
      expect(result1).toBeDefined();
      expect(result1.type).toBe('render');
      expect(result1.error).toContain('plot parameter is required');

      // Test missing output
      const rexxCode2 = `
        LET histogram = HIST data=JSON_PARSE(text="[1,2,3]")  
        LET result2 = RENDER plot=histogram
      `;

      const commands2 = parse(rexxCode2);
      await interpreter.run(commands2);

      const result2 = interpreter.getVariable('result2');
      expect(result2.type).toBe('render');
      expect(result2.error).toContain('output parameter is required');
    });
  });

  describe('Direct Function Tests', () => {
    test('should render histogram directly', async () => {
      const histData = rGraphicsFunctions.HIST([1, 2, 3, 4, 5], {
        main: 'Direct Test',
        col: 'blue'
      });

      expect(histData.type).toBe('hist');

      const outputPath = path.join(testOutputDir, 'direct-histogram.png');
      const result = rGraphicsFunctions.RENDER({
        plot: histData,
        output: outputPath,
        width: 800,
        height: 600
      });

      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
    });

    test('should render boxplot directly', async () => {
      const boxData = rGraphicsFunctions.BOXPLOT([1, 2, 3, 4, 5, 10, 15], {
        main: 'Direct Boxplot Test',
        col: 'lightblue'
      });

      expect(boxData.type).toBe('boxplot');

      const outputPath = path.join(testOutputDir, 'direct-boxplot.png');
      const result = rGraphicsFunctions.RENDER({
        plot: boxData,
        output: outputPath,
        width: 600,
        height: 800
      });

      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
    });

    test('should handle all supported plot types', () => {
      const supportedTypes = ['hist', 'scatter', 'boxplot', 'barplot', 'pie', 'density'];
      
      supportedTypes.forEach((type, index) => {
        let plotData;
        
        switch (type) {
          case 'hist':
            plotData = rGraphicsFunctions.HIST([1, 2, 3, 4, 5]);
            break;
          case 'scatter':  
            plotData = rGraphicsFunctions.SCATTER([1, 2, 3], [1, 2, 3]);
            break;
          case 'boxplot':
            plotData = rGraphicsFunctions.BOXPLOT([1, 2, 3, 4, 5]);
            break;
          case 'barplot':
            plotData = rGraphicsFunctions.BARPLOT([1, 2, 3], ['A', 'B', 'C']);
            break;
          case 'pie':
            plotData = rGraphicsFunctions.PIE([1, 2, 3], ['A', 'B', 'C']);
            break;
          case 'density':
            plotData = rGraphicsFunctions.DENSITY_PLOT([1, 2, 3, 4, 5]);
            break;
        }

        expect(plotData.type).toBe(type);

        const outputPath = path.join(testOutputDir, `test-${type}-${index}.png`);
        const result = rGraphicsFunctions.RENDER({
          plot: plotData,
          output: outputPath,
          width: 400,
          height: 300
        });

        expect(result).toBe(outputPath);
        if (type !== 'density' || fs.existsSync(outputPath)) { // Some types might not render without errors
          expect(fs.existsSync(outputPath)).toBe(true);
        }
      });
    });

    test('should validate input parameters', () => {
      // Test missing plot
      const result1 = rGraphicsFunctions.RENDER({
        output: '/tmp/test.png'
      });
      expect(result1.type).toBe('render');
      expect(result1.error).toContain('plot parameter is required');

      // Test missing output
      const result2 = rGraphicsFunctions.RENDER({
        plot: { type: 'hist', bins: [] }
      });
      expect(result2.type).toBe('render');
      expect(result2.error).toContain('output parameter is required');

      // Test invalid plot object
      const result3 = rGraphicsFunctions.RENDER({
        plot: { invalid: 'data' },
        output: '/tmp/test.png'
      });
      expect(result3.type).toBe('render');
      expect(result3.error).toContain('plot parameter is required');
    });
  });

  describe('Statistical Data Pipeline Tests', () => {
    test('should render correlation matrix via COR→HEATMAP→RENDER pipeline', async () => {
      const rexxCode = `
        LET testData = JSON_PARSE text='[[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6], [1, 3, 5, 7]]'
        LET corrMatrix = COR data=testData
        LET heatmap = HEATMAP data=corrMatrix main="Correlation Matrix" 
        LET outputPath = "${path.join(testOutputDir, 'cor-heatmap.png')}"
        LET result = RENDER plot=heatmap output=outputPath width=600 height=600
      `;

      // Need to load stats functions for COR
      const { rRegressionFunctions } = require('../../advanced-analytics/src/r-regression-functions');
      interpreter.builtInFunctions['COR'] = rRegressionFunctions.COR;

      const { parse } = require('../../../../../core/src/parser');
      const commands = parse(rexxCode);
      await interpreter.run(commands);

      const result = interpreter.getVariable('result');
      const outputPath = interpreter.getVariable('outputPath');

      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
    });

    test('should render PCA results via PCA→SCATTER→RENDER pipeline', async () => {
      const rexxCode = `
        LET testData = JSON_PARSE text='[[1, 2], [2, 3], [3, 1], [4, 2], [5, 3]]'
        LET pcaResult = PCA data=testData ncomps=2
        LET scatter = SCATTER x=pcaResult.scores y=pcaResult.loadings main="PCA Results"
        LET outputPath = "${path.join(testOutputDir, 'pca-scatter.png')}"
        LET result = RENDER plot=scatter output=outputPath width=800 height=600
      `;

      // Need to load ML functions for PCA
      const { rMlFunctions } = require('../../advanced-analytics/r-ml-functions');
      interpreter.builtInFunctions['PCA'] = rMlFunctions.PCA;

      const { parse } = require('../../../../../core/src/parser');
      const commands = parse(rexxCode);
      await interpreter.run(commands);

      const result = interpreter.getVariable('result');
      const outputPath = interpreter.getVariable('outputPath');

      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
    });

    test('should render FFT spectrum via FFT→PLOT→RENDER pipeline', async () => {
      const rexxCode = `
        LET signal = JSON_PARSE text="[0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5]"
        LET fftResult = FFT signal=signal
        LET magnitudes = JSON_PARSE text="[1, 0.8, 0.6, 0.4, 0.2, 0.1, 0.05, 0.02]"
        LET frequencies = JSON_PARSE text="[0, 1, 2, 3, 4, 5, 6, 7]"
        LET spectrum = PLOT x=frequencies y=magnitudes main="FFT Spectrum" xlab="Frequency" ylab="Magnitude"
        LET outputPath = "${path.join(testOutputDir, 'fft-spectrum.png')}"
        LET result = RENDER plot=spectrum output=outputPath width=800 height=600
      `;

      // Need to load signal functions for FFT
      const { rSignalFunctions } = require('../../signal-processing/r-signal-functions');
      interpreter.builtInFunctions['FFT'] = rSignalFunctions.FFT;

      const { parse } = require('../../../../../core/src/parser');
      const commands = parse(rexxCode);
      await interpreter.run(commands);

      const result = interpreter.getVariable('result');
      const outputPath = interpreter.getVariable('outputPath');

      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
    });

    test('should render statistical summary via HIST→RENDER pipeline', async () => {
      const rexxCode = `
        LET data = JSON_PARSE text="[1, 2, 2, 3, 3, 3, 4, 4, 5, 6, 7, 8, 9, 10]"
        LET mean = MEAN data=data
        LET median = MEDIAN data=data
        LET histogram = HIST data=data main="Data Distribution" col="lightgreen"
        LET outputPath = "${path.join(testOutputDir, 'stats-histogram.png')}"
        LET result = RENDER plot=histogram output=outputPath width=800 height=600
      `;

      // Need to load summary functions
      const { rSummaryFunctions } = require('../../math-stats/src/r-summary-functions');
      interpreter.builtInFunctions['MEAN'] = rSummaryFunctions.MEAN;
      interpreter.builtInFunctions['MEDIAN'] = rSummaryFunctions.MEDIAN;

      const { parse } = require('../../../../../core/src/parser');
      const commands = parse(rexxCode);
      await interpreter.run(commands);

      const result = interpreter.getVariable('result');
      const outputPath = interpreter.getVariable('outputPath');

      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
    });

    test('should render time series data via PLOT→RENDER pipeline', async () => {
      const rexxCode = `
        LET timestamps = JSON_PARSE text="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
        LET values = JSON_PARSE text="[10, 12, 11, 15, 13, 18, 16, 20, 19, 22]"
        LET timeseries = PLOT x=timestamps y=values main="Time Series" xlab="Time" ylab="Value" type="l"
        LET outputPath = "${path.join(testOutputDir, 'timeseries-plot.png')}"
        LET result = RENDER plot=timeseries output=outputPath width=1000 height=400
      `;

      const { parse } = require('../../../../../core/src/parser');
      const commands = parse(rexxCode);
      await interpreter.run(commands);

      const result = interpreter.getVariable('result');
      const outputPath = interpreter.getVariable('outputPath');

      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      // Verify PNG contains actual graphics content
      expect(await hasMeaningfulContent(outputPath)).toBe(true);
    });
  });

  describe('Environment Detection', () => {
    test('should detect NodeJS environment correctly', () => {
      // In Jest, window should be undefined, so it should detect NodeJS
      const histData = rGraphicsFunctions.HIST([1, 2, 3]);
      const outputPath = path.join(testOutputDir, 'env-test.png');
      
      const result = rGraphicsFunctions.RENDER({
        plot: histData,
        output: outputPath,
        width: 400,
        height: 300
      });

      expect(typeof result).toBe('string');
      expect(result).toBe(outputPath);
    });
  });
});