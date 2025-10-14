/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Jest tests for R Graphics Functions PNG rendering
 */

const { rGraphicsFunctions } = require('../src/graphics-functions.js');
const { renderPlotToPNG, renderBoxplotToPNG, renderScatterToPNG, renderBarplotToPNG, renderPieToPNG } = require('./histogram-renderer');
const fs = require('fs');
const path = require('path');

describe('R Graphics PNG Rendering', () => {
  const testOutputDir = path.join(__dirname, 'generated_images');
  
  beforeAll(() => {
    // Create directory for generated test images (persisted, in .gitignore)
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  describe('Boxplot Rendering', () => {
    test('should generate PNG file from boxplot data', () => {
      // Create sample data with outliers
      const sampleData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 30]; // 25, 30 are outliers
      
      // Generate boxplot data
      const boxplotData = rGraphicsFunctions.BOXPLOT(sampleData, {
        main: 'Test Boxplot',
        ylab: 'Values',
        col: 'lightblue'
      });
      
      // Render to PNG
      const outputPath = path.join(testOutputDir, 'test-boxplot.png');
      const savedPath = renderBoxplotToPNG(boxplotData, outputPath);
      
      // Verify file was created
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(savedPath).toBe(outputPath);
      
      // Verify file has content
      const stats = fs.statSync(savedPath);
      expect(stats.size).toBeGreaterThan(1000);
      
      // Verify boxplot statistics  
      expect(boxplotData.stats.outliers).toContain(25);
      expect(boxplotData.stats.outliers).toContain(30);
      expect(boxplotData.stats.median).toBeDefined();
    });

    test('should handle boxplot without outliers', () => {
      const normalData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      const boxplotData = rGraphicsFunctions.BOXPLOT(normalData, {
        main: 'No Outliers Boxplot',
        col: 'lightgreen'
      });
      
      const outputPath = path.join(testOutputDir, 'boxplot-no-outliers.png');
      const savedPath = renderBoxplotToPNG(boxplotData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(boxplotData.stats.outliers).toHaveLength(0);
    });
  });

  describe('Scatter Plot Rendering', () => {
    test('should generate PNG file from scatter plot data', () => {
      // Create correlated data
      const x = Array.from({length: 50}, (_, i) => i);
      const y = x.map(val => val * 2 + Math.random() * 5); // Linear with noise
      
      // Generate scatter plot data
      const scatterData = rGraphicsFunctions.SCATTEPLOT(x, y, {
        main: 'Test Scatter Plot',
        xlab: 'X Values',
        ylab: 'Y Values',
        col: 'red'
      });
      
      // Render to PNG
      const outputPath = path.join(testOutputDir, 'test-scatter.png');
      const savedPath = renderScatterToPNG(scatterData, outputPath);
      
      // Verify file was created
      expect(fs.existsSync(savedPath)).toBe(true);
      
      // Verify file has content
      const stats = fs.statSync(savedPath);
      expect(stats.size).toBeGreaterThan(1000);
      
      // Verify scatter plot data
      expect(scatterData.x).toHaveLength(50);
      expect(scatterData.y).toHaveLength(50);
      expect(scatterData.type).toBe('scatter');
    });

    test('should handle small scatter plot datasets', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      
      const scatterData = rGraphicsFunctions.SCATTEPLOT(x, y, {
        main: 'Small Scatter Plot',
        col: 'blue'
      });
      
      const outputPath = path.join(testOutputDir, 'scatter-small.png');
      const savedPath = renderScatterToPNG(scatterData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(scatterData.x).toEqual(x);
      expect(scatterData.y).toEqual(y);
    });
  });

  describe('Universal Plot Renderer', () => {
    test('should route histogram to correct renderer', () => {
      const histData = rGraphicsFunctions.HIST([1, 2, 2, 3, 3, 3, 4], {
        main: 'Router Test Histogram'
      });
      
      const outputPath = path.join(testOutputDir, 'router-histogram.png');
      const savedPath = renderPlotToPNG(histData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(histData.type).toBe('hist');
    });

    test('should route boxplot to correct renderer', () => {
      const boxData = rGraphicsFunctions.BOXPLOT([1, 2, 3, 4, 5, 10], {
        main: 'Router Test Boxplot'
      });
      
      const outputPath = path.join(testOutputDir, 'router-boxplot.png');
      const savedPath = renderPlotToPNG(boxData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(boxData.type).toBe('boxplot');
    });

    test('should route scatter plot to correct renderer', () => {
      const scatterData = rGraphicsFunctions.SCATTEPLOT([1, 2, 3], [4, 5, 6], {
        main: 'Router Test Scatter'
      });
      
      const outputPath = path.join(testOutputDir, 'router-scatter.png');
      const savedPath = renderPlotToPNG(scatterData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(scatterData.type).toBe('scatter');
    });

    test('should throw error for unsupported plot type', () => {
      const invalidData = { type: 'unsupported', data: [] };
      
      expect(() => {
        renderPlotToPNG(invalidData, '/tmp/test.png');
      }).toThrow('Unsupported plot type: unsupported');
    });
  });

  describe('Barplot Rendering', () => {
    test('should generate PNG file from barplot data', () => {
      // Create sample categorical data
      const heights = [15, 23, 8, 42, 17];
      const names = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
      
      // Generate barplot data
      const barplotData = rGraphicsFunctions.BARPLOT(heights, {
        names: names,
        main: 'Test Bar Chart',
        xlab: 'Categories',
        ylab: 'Values',
        col: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
      });
      
      // Render to PNG
      const outputPath = path.join(testOutputDir, 'test-barplot.png');
      const savedPath = renderBarplotToPNG(barplotData, outputPath);
      
      // Verify file was created
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(savedPath).toBe(outputPath);
      
      // Verify file has content
      const stats = fs.statSync(savedPath);
      expect(stats.size).toBeGreaterThan(1000);
      
      // Verify barplot data structure
      expect(barplotData.heights).toEqual(heights);
      expect(barplotData.names).toEqual(names);
      expect(barplotData.type).toBe('barplot');
    });

    test('should handle barplot with single color', () => {
      const heights = [10, 20, 15, 25];
      
      const barplotData = rGraphicsFunctions.BARPLOT(heights, {
        main: 'Single Color Barplot',
        col: 'steelblue'
      });
      
      const outputPath = path.join(testOutputDir, 'barplot-single-color.png');
      const savedPath = renderBarplotToPNG(barplotData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(barplotData.heights).toEqual(heights);
    });
  });

  describe('Pie Chart Rendering', () => {
    test('should generate PNG file from pie chart data', () => {
      // Create sample proportional data
      const values = [25, 35, 15, 25];
      const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
      
      // Generate pie chart data
      const pieData = rGraphicsFunctions.PIE(values, {
        labels: labels,
        main: 'Test Pie Chart',
        col: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
      });
      
      // Render to PNG
      const outputPath = path.join(testOutputDir, 'test-pie.png');
      const savedPath = renderPieToPNG(pieData, outputPath);
      
      // Verify file was created
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(savedPath).toBe(outputPath);
      
      // Verify file has content
      const stats = fs.statSync(savedPath);
      expect(stats.size).toBeGreaterThan(1000);
      
      // Verify pie chart data structure
      expect(pieData.values).toEqual(values);
      expect(pieData.labels).toEqual(labels);
      expect(pieData.type).toBe('pie');
      expect(pieData.percentages.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 1);
    });

    test('should handle pie chart with default labels', () => {
      const values = [30, 45, 25];
      
      const pieData = rGraphicsFunctions.PIE(values, {
        main: 'Default Labels Pie'
      });
      
      const outputPath = path.join(testOutputDir, 'pie-default-labels.png');
      const savedPath = renderPieToPNG(pieData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(pieData.labels).toEqual(['1', '2', '3']);
      expect(pieData.values).toEqual(values);
    });
  });

  describe('Complex Statistical Scenarios', () => {
    test('should handle boxplot with extreme outliers', () => {
      const dataWithExtremes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100, 1000];
      
      const boxplotData = rGraphicsFunctions.BOXPLOT(dataWithExtremes, {
        main: 'Extreme Outliers',
        col: 'orange'
      });
      
      const outputPath = path.join(testOutputDir, 'boxplot-extreme-outliers.png');
      const savedPath = renderBoxplotToPNG(boxplotData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(boxplotData.stats.outliers).toContain(100);
      expect(boxplotData.stats.outliers).toContain(1000);
    });

    test('should handle scatter plot with perfect correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // Perfect 2x correlation
      
      const scatterData = rGraphicsFunctions.SCATTEPLOT(x, y, {
        main: 'Perfect Correlation',
        xlab: 'Independent Variable',
        ylab: 'Dependent Variable (2x)',
        col: 'purple'
      });
      
      const outputPath = path.join(testOutputDir, 'scatter-perfect-correlation.png');
      const savedPath = renderScatterToPNG(scatterData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      
      // Verify perfect correlation
      for (let i = 0; i < x.length; i++) {
        expect(y[i]).toBe(x[i] * 2);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle empty data gracefully', () => {
      const emptyBoxplot = rGraphicsFunctions.BOXPLOT([], {
        main: 'Empty Data Test'
      });
      
      expect(emptyBoxplot.error).toBeDefined();
    });

    test('should handle mismatched scatter plot data', () => {
      const mismatchedScatter = rGraphicsFunctions.SCATTEPLOT([1, 2, 3], [1, 2], {
        main: 'Mismatched Data'
      });
      
      expect(mismatchedScatter.error).toBeDefined();
    });
  });

  describe('Custom Rendering Options', () => {
    test('should respect custom dimensions and colors', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const boxplotData = rGraphicsFunctions.BOXPLOT(data, {
        main: 'Custom Style Boxplot',
        col: 'magenta',
        border: 'darkred'
      });
      
      const outputPath = path.join(testOutputDir, 'boxplot-custom-style.png');
      const savedPath = renderBoxplotToPNG(boxplotData, outputPath, {
        width: 600,
        height: 400,
        margin: { top: 60, right: 40, bottom: 80, left: 80 }
      });
      
      expect(fs.existsSync(savedPath)).toBe(true);
      
      // Verify custom dimensions create smaller file
      const stats = fs.statSync(savedPath);
      expect(stats.size).toBeGreaterThan(500);
      expect(stats.size).toBeLessThan(25000);
    });
  });

  describe('Density Plot Rendering', () => {
    test('should generate PNG file from density plot data', () => {
      // Create sample data with known distribution
      const sampleData = Array.from({length: 100}, () => Math.random() * 10 + 5);
      
      // Generate density plot data
      const densityData = rGraphicsFunctions.DENSITY_PLOT(sampleData, {
        main: 'Test Density Plot',
        xlab: 'Value',
        ylab: 'Density',
        col: 'green'
      });
      
      // Render to PNG
      const outputPath = path.join(testOutputDir, 'test-density.png');
      const savedPath = renderPlotToPNG(densityData, outputPath);
      
      // Verify file was created
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(savedPath).toBe(outputPath);
      
      // Verify file has content
      const stats = fs.statSync(savedPath);
      expect(stats.size).toBeGreaterThan(1000);
      
      // Verify density plot data structure
      expect(densityData.type).toBe('density');
      expect(densityData.x).toBeDefined();
      expect(densityData.y).toBeDefined();
      expect(densityData.x.length).toBeGreaterThan(0);
      expect(densityData.y.length).toBeGreaterThan(0);
    });

    test('should handle small density datasets', () => {
      const smallData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      const densityData = rGraphicsFunctions.DENSITY_PLOT(smallData, {
        main: 'Small Density Plot',
        col: 'purple'
      });
      
      const outputPath = path.join(testOutputDir, 'density-small.png');
      const savedPath = renderPlotToPNG(densityData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(densityData.type).toBe('density');
    });
  });

  describe('Q-Q Plot Rendering', () => {
    test('should generate PNG file from Q-Q plot data', () => {
      // Create sample data (normal distribution)
      const normalData = Array.from({length: 50}, () => {
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      });
      
      // Generate Q-Q plot data (against normal distribution)
      const qqData = rGraphicsFunctions.QQPLOT(normalData, null, {
        main: 'Test Q-Q Plot vs Normal',
        col: 'red'
      });
      
      // Render to PNG
      const outputPath = path.join(testOutputDir, 'test-qqplot.png');
      const savedPath = renderPlotToPNG(qqData, outputPath);
      
      // Verify file was created
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(savedPath).toBe(outputPath);
      
      // Verify file has content
      const stats = fs.statSync(savedPath);
      expect(stats.size).toBeGreaterThan(1000);
      
      // Verify Q-Q plot data structure
      expect(qqData.type).toBe('qqplot');
      expect(qqData.x).toBeDefined();
      expect(qqData.y).toBeDefined();
      expect(qqData.x.length).toBe(qqData.y.length);
    });

    test('should handle Q-Q plot with two datasets', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const data2 = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
      
      const qqData = rGraphicsFunctions.QQPLOT(data1, data2, {
        main: 'Q-Q Plot Two Datasets',
        col: 'blue'
      });
      
      const outputPath = path.join(testOutputDir, 'qqplot-two-datasets.png');
      const savedPath = renderPlotToPNG(qqData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(qqData.type).toBe('qqplot');
    });
  });

  describe('Advanced Statistical Scenarios', () => {
    test('should handle density plot with different bandwidth', () => {
      const data = Array.from({length: 100}, () => Math.random() * 20);
      
      const densityData = rGraphicsFunctions.DENSITY_PLOT(data, {
        main: 'Custom Bandwidth Density',
        bw: 0.5,
        col: 'orange'
      });
      
      const outputPath = path.join(testOutputDir, 'density-custom-bandwidth.png');
      const savedPath = renderPlotToPNG(densityData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(densityData.type).toBe('density');
    });

    test('should create Q-Q plot showing deviation from normality', () => {
      // Create skewed data
      const skewedData = Array.from({length: 50}, () => Math.pow(Math.random(), 3) * 10);
      
      const qqData = rGraphicsFunctions.QQPLOT(skewedData, null, {
        main: 'Skewed Data vs Normal',
        col: 'darkred'
      });
      
      const outputPath = path.join(testOutputDir, 'qqplot-skewed.png');
      const savedPath = renderPlotToPNG(qqData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(qqData.type).toBe('qqplot');
    });
  });

  describe('Router Integration', () => {
    test('should route density plot to correct renderer', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const densityData = rGraphicsFunctions.DENSITY_PLOT(data, {
        main: 'Router Test Density'
      });
      
      const outputPath = path.join(testOutputDir, 'router-density.png');
      const savedPath = renderPlotToPNG(densityData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(densityData.type).toBe('density');
    });

    test('should route Q-Q plot to correct renderer', () => {
      const data = [1, 2, 3, 4, 5];
      const qqData = rGraphicsFunctions.QQPLOT(data, null, {
        main: 'Router Test Q-Q'
      });
      
      const outputPath = path.join(testOutputDir, 'router-qqplot.png');
      const savedPath = renderPlotToPNG(qqData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(qqData.type).toBe('qqplot');
    });

    test('should route line plot to correct renderer', () => {
      const xData = [1, 2, 3, 4, 5];
      const yData = [2, 4, 1, 8, 3];
      const lineData = rGraphicsFunctions.LINES(xData, yData, {
        main: 'Router Test Lines',
        col: 'red'
      });
      
      const outputPath = path.join(testOutputDir, 'router-lines.png');
      const savedPath = renderPlotToPNG(lineData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(lineData.type).toBe('lines');
    });
  });

  describe('Line Plot Rendering', () => {
    test('should generate PNG file from line data', () => {
      const xData = [0, 1, 2, 3, 4, 5];
      const yData = [0, 1, 4, 9, 16, 25];
      const lineData = rGraphicsFunctions.LINES(xData, yData, {
        main: 'Test Line Plot - Quadratic',
        xlab: 'X Values',
        ylab: 'Y Values',
        col: 'green',
        lwd: 3
      });
      
      expect(lineData.type).toBe('lines');
      expect(lineData.x).toEqual(xData);
      expect(lineData.y).toEqual(yData);
      
      const outputPath = path.join(testOutputDir, 'line-plot-test.png');
      const savedPath = renderPlotToPNG(lineData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(savedPath).toBe(outputPath);
    });

    test('should handle dashed line style', () => {
      const xData = [1, 2, 3, 4, 5];
      const yData = [5, 3, 8, 2, 7];
      const lineData = rGraphicsFunctions.LINES(xData, yData, {
        main: 'Dashed Line Plot',
        col: 'blue',
        lty: 2
      });
      
      const outputPath = path.join(testOutputDir, 'line-plot-dashed.png');
      const savedPath = renderPlotToPNG(lineData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(lineData.options.lty).toBe(2);
    });

    test('should handle different line colors and weights', () => {
      const xData = Array.from({length: 20}, (_, i) => i);
      const yData = xData.map(x => Math.sin(x * 0.3) * 5);
      const lineData = rGraphicsFunctions.LINES(xData, yData, {
        main: 'Sine Wave',
        xlab: 'Time',
        ylab: 'Amplitude',
        col: 'purple',
        lwd: 4
      });
      
      const outputPath = path.join(testOutputDir, 'line-plot-sine.png');
      const savedPath = renderPlotToPNG(lineData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(lineData.options.col).toBe('purple');
      expect(lineData.options.lwd).toBe(4);
    });
  });

  describe('Q-Q Line Rendering', () => {
    test('should generate PNG file from Q-Q line data', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const qqData = rGraphicsFunctions.QQNORM(data, {
        main: 'Test Q-Q Plot'
      });
      
      const qqlineData = rGraphicsFunctions.QQLINE(qqData, {
        col: 'red',
        lwd: 3
      });
      
      expect(qqlineData.type).toBe('qqline');
      expect(qqlineData.x).toHaveLength(2); // Line has start and end points
      expect(qqlineData.y).toHaveLength(2);
      expect(qqlineData.slope).toBeDefined();
      expect(qqlineData.intercept).toBeDefined();
      
      const outputPath = path.join(testOutputDir, 'qqline-test.png');
      const savedPath = renderPlotToPNG(qqlineData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(savedPath).toBe(outputPath);
    });

    test('should handle Q-Q line with custom styling', () => {
      const data = Array.from({length: 50}, (_, i) => i * 0.2);
      const qqData = rGraphicsFunctions.QQPLOT(data, null, {
        main: 'Custom Q-Q Plot'
      });
      
      const qqlineData = rGraphicsFunctions.QQLINE(qqData, {
        col: 'blue',
        lty: 2,
        lwd: 4
      });
      
      const outputPath = path.join(testOutputDir, 'qqline-styled.png');
      const savedPath = renderPlotToPNG(qqlineData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(qqlineData.options.col).toBe('blue');
      expect(qqlineData.options.lty).toBe(2);
      expect(qqlineData.options.lwd).toBe(4);
    });

    test('should route Q-Q line to correct renderer', () => {
      const data = [5, 10, 15, 20, 25];
      const qqData = rGraphicsFunctions.QQNORM(data);
      const qqlineData = rGraphicsFunctions.QQLINE(qqData, {
        main: 'Router Test Q-Q Line'
      });
      
      const outputPath = path.join(testOutputDir, 'router-qqline.png');
      const savedPath = renderPlotToPNG(qqlineData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(qqlineData.type).toBe('qqline');
    });

    test('should handle error cases gracefully', () => {
      // Test with invalid input
      const invalidData = rGraphicsFunctions.QQLINE(null);
      expect(invalidData.error).toBeDefined();
      
      // Test with insufficient data
      const smallQQData = { type: 'qqnorm', x: [1], y: [1] };
      const smallLineData = rGraphicsFunctions.QQLINE(smallQQData);
      expect(smallLineData.error).toBeDefined();
    });
  });

  describe('Contour Plot Rendering', () => {
    test('should generate PNG file from contour data', () => {
      // Create sample 2D data - a simple peak function
      const nx = 10, ny = 10;
      const x = Array.from({length: nx}, (_, i) => i - 4);
      const y = Array.from({length: ny}, (_, i) => i - 4);
      const z = Array.from({length: ny}, (_, i) => 
        Array.from({length: nx}, (_, j) => 
          Math.exp(-(x[j]*x[j] + y[i]*y[i]) / 8)
        )
      );
      
      const contourData = rGraphicsFunctions.CONTOUR(x, y, z, {
        main: 'Test Contour Plot',
        xlab: 'X coordinate',
        ylab: 'Y coordinate',
        nlevels: 5
      });
      
      expect(contourData.type).toBe('contour');
      expect(contourData.x).toEqual(x);
      expect(contourData.y).toEqual(y);
      expect(contourData.z).toEqual(z);
      expect(contourData.levels).toHaveLength(6); // nlevels + 1
      expect(contourData.contours).toBeDefined();
      
      const outputPath = path.join(testOutputDir, 'contour-test.png');
      const savedPath = renderPlotToPNG(contourData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(savedPath).toBe(outputPath);
    });

    test('should handle contour plot with custom levels and colors', () => {
      const nx = 8, ny = 8;
      const x = Array.from({length: nx}, (_, i) => i);
      const y = Array.from({length: ny}, (_, i) => i);
      const z = Array.from({length: ny}, (_, i) => 
        Array.from({length: nx}, (_, j) => 
          Math.sin(x[j] * 0.5) * Math.cos(y[i] * 0.5)
        )
      );
      
      const contourData = rGraphicsFunctions.CONTOUR(x, y, z, {
        main: 'Sine-Cosine Contour',
        nlevels: 8,
        colors: ['blue', 'green', 'yellow', 'red']
      });
      
      const outputPath = path.join(testOutputDir, 'contour-custom.png');
      const savedPath = renderPlotToPNG(contourData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(contourData.options.nlevels).toBe(8);
      expect(contourData.options.colors).toEqual(['blue', 'green', 'yellow', 'red']);
    });

    test('should route contour plot to correct renderer', () => {
      const x = [0, 1, 2];
      const y = [0, 1, 2];
      const z = [[1, 2, 3], [2, 3, 4], [3, 4, 5]];
      
      const contourData = rGraphicsFunctions.CONTOUR(x, y, z, {
        main: 'Router Test Contour'
      });
      
      const outputPath = path.join(testOutputDir, 'router-contour.png');
      const savedPath = renderPlotToPNG(contourData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(contourData.type).toBe('contour');
    });

    test('should handle contour error cases gracefully', () => {
      // Test with empty data
      const emptyData = rGraphicsFunctions.CONTOUR([], [], []);
      expect(emptyData.error).toBeDefined();
      
      // Test with invalid z matrix
      const invalidZ = rGraphicsFunctions.CONTOUR([1, 2], [1, 2], [1, 2, 3]);
      expect(invalidZ.error).toBeDefined();
      
      // Test with NaN values
      const nanZ = [[NaN, NaN], [NaN, NaN]];
      const nanData = rGraphicsFunctions.CONTOUR([1, 2], [1, 2], nanZ);
      expect(nanData.error).toBeDefined();
    });
  });

  describe('Heatmap Rendering', () => {
    test('should generate PNG file from heatmap data', () => {
      const matrix = [
        [1, 2, 3],
        [4, 5, 6], 
        [7, 8, 9]
      ];
      
      const heatmapData = rGraphicsFunctions.HEATMAP(matrix, {
        main: 'Test Heatmap',
        colorscheme: 'heat',
        showValues: true
      });
      
      expect(heatmapData.type).toBe('heatmap');
      expect(heatmapData.nRows).toBe(3);
      expect(heatmapData.nCols).toBe(3);
      expect(heatmapData.matrix).toEqual(matrix);
      
      const outputPath = path.join(testOutputDir, 'heatmap-test.png');
      const savedPath = renderPlotToPNG(heatmapData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(savedPath).toBe(outputPath);
    });

    test('should handle different color schemes', () => {
      const matrix = [[1, 2], [3, 4]];
      const heatmapData = rGraphicsFunctions.HEATMAP(matrix, {
        main: 'Viridis Heatmap',
        colorscheme: 'viridis'
      });
      
      const outputPath = path.join(testOutputDir, 'heatmap-viridis.png');
      const savedPath = renderPlotToPNG(heatmapData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(heatmapData.options.colorscheme).toBe('viridis');
    });
  });

  describe('Pairs Plot Rendering', () => {
    test('should generate PNG file from pairs data', () => {
      // Create sample multivariate data
      const data = {
        x: [1, 2, 3, 4, 5],
        y: [2, 4, 6, 8, 10],
        z: [1, 4, 9, 16, 25]
      };
      
      const pairsData = rGraphicsFunctions.PAIRS(data, {
        main: 'Test Pairs Plot'
      });
      
      expect(pairsData.type).toBe('pairs');
      expect(pairsData.nVars).toBe(3);
      expect(pairsData.panels).toHaveLength(9); // 3x3 matrix
      
      const outputPath = path.join(testOutputDir, 'pairs-test.png');
      const savedPath = renderPlotToPNG(pairsData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(savedPath).toBe(outputPath);
    });

    test('should handle matrix input format', () => {
      const matrix = [
        [1, 2], [2, 4], [3, 6], [4, 8]
      ];
      
      const pairsData = rGraphicsFunctions.PAIRS(matrix, {
        labels: ['A', 'B']
      });
      
      expect(pairsData.nVars).toBe(2);
      expect(pairsData.varNames).toEqual(['A', 'B']);
    });
  });

  describe('Abline Rendering', () => {
    test('should generate PNG file from abline data', () => {
      const ablineData = rGraphicsFunctions.ABLINE(2, 1, {
        col: 'red',
        lwd: 2
      });
      
      expect(ablineData.type).toBe('abline');
      expect(ablineData.intercept).toBe(2);
      expect(ablineData.slope).toBe(1);
      
      const outputPath = path.join(testOutputDir, 'abline-test.png');
      const savedPath = renderPlotToPNG(ablineData, outputPath);
      
      expect(fs.existsSync(savedPath)).toBe(true);
      expect(savedPath).toBe(outputPath);
    });

    test('should handle horizontal and vertical lines', () => {
      // Horizontal line
      const hlineData = rGraphicsFunctions.ABLINE(null, null, { h: 5 });
      expect(hlineData.isHorizontal).toBe(true);
      expect(hlineData.intercept).toBe(5);
      
      // Vertical line
      const vlineData = rGraphicsFunctions.ABLINE(null, null, { v: 3 });
      expect(vlineData.isVertical).toBe(true);
      expect(vlineData.intercept).toBe(3);
    });
  });
});