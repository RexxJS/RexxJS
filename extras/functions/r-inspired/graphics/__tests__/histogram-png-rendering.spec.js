/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for histogram PNG rendering using D3.js
 */

const { rGraphicsFunctions } = require('../src/graphics-functions.js');
const { renderHistogramToPNG } = require('../src/histogram-renderer.js');
const fs = require('fs');
const path = require('path');

describe('Histogram PNG Rendering', () => {
  const testOutputDir = path.join(__dirname, 'generated_images');
  
  beforeAll(() => {
    // Create directory for generated test images (persisted, in .gitignore)
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  test('should generate PNG file from histogram data', () => {
    // Create sample data
    const sampleData = [1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 5];
    
    // Generate histogram data
    const histogramData = rGraphicsFunctions.HIST(sampleData, {
      main: 'Test Histogram',
      xlab: 'Values',
      ylab: 'Count',
      col: 'blue'
    });
    
    // Render to PNG
    const outputPath = path.join(testOutputDir, 'test-histogram.png');
    const savedPath = renderHistogramToPNG(histogramData, outputPath);
    
    // Verify file was created
    expect(fs.existsSync(savedPath)).toBe(true);
    expect(savedPath).toBe(outputPath);
    
    // Verify file has content (PNG files should be > 1000 bytes)
    const stats = fs.statSync(savedPath);
    expect(stats.size).toBeGreaterThan(1000);
  });

  test('should handle custom rendering options', () => {
    const sampleData = Array.from({length: 100}, () => Math.random() * 10);
    
    const histogramData = rGraphicsFunctions.HIST(sampleData, {
      main: 'Custom Options Test',
      col: 'red',
      border: 'black'
    });
    
    const outputPath = path.join(testOutputDir, 'custom-options.png');
    const savedPath = renderHistogramToPNG(histogramData, outputPath, {
      width: 400,
      height: 300,
      margin: { top: 40, right: 30, bottom: 50, left: 60 }
    });
    
    expect(fs.existsSync(savedPath)).toBe(true);
    
    // Smaller dimensions should result in smaller file
    const stats = fs.statSync(savedPath);
    expect(stats.size).toBeGreaterThan(500);
    expect(stats.size).toBeLessThan(20000);
  });

  test('should work with normal distribution data', () => {
    // Generate normal distribution using Box-Muller transform
    const normalData = [];
    for (let i = 0; i < 500; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      normalData.push(z0 * 3 + 50); // mean=50, std=3
    }
    
    const histogramData = rGraphicsFunctions.HIST(normalData, {
      main: 'Normal Distribution (μ=50, σ=3)',
      xlab: 'Value',
      ylab: 'Frequency',
      col: 'lightgreen',
      breaks: 25
    });
    
    const outputPath = path.join(testOutputDir, 'normal-distribution.png');
    const savedPath = renderHistogramToPNG(histogramData, outputPath);
    
    expect(fs.existsSync(savedPath)).toBe(true);
    
    // Verify histogram data structure
    expect(histogramData.bins.length).toBe(25);
    expect(histogramData.data.length).toBe(500);
  });

  test('should handle edge cases', () => {
    // Single value repeated
    const constantData = [5, 5, 5, 5, 5];
    
    const histogramData = rGraphicsFunctions.HIST(constantData, {
      main: 'Constant Values',
      col: 'orange'
    });
    
    const outputPath = path.join(testOutputDir, 'constant-values.png');
    const savedPath = renderHistogramToPNG(histogramData, outputPath);
    
    expect(fs.existsSync(savedPath)).toBe(true);
    expect(histogramData.bins.length).toBeGreaterThan(0);
  });

  test('should preserve histogram statistical properties', () => {
    const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    const histogramData = rGraphicsFunctions.HIST(testData, {
      breaks: 5
    });
    
    const outputPath = path.join(testOutputDir, 'statistical-test.png');
    renderHistogramToPNG(histogramData, outputPath);
    
    // Verify histogram statistics
    const totalCount = histogramData.counts.reduce((sum, count) => sum + count, 0);
    expect(totalCount).toBe(testData.length);
    
    // Verify bins cover the data range
    expect(histogramData.bins[0].start).toBeLessThanOrEqual(Math.min(...testData));
    expect(histogramData.bins[histogramData.bins.length - 1].end).toBeGreaterThanOrEqual(Math.max(...testData));
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });
});