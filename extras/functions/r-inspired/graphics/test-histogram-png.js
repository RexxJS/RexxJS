/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Test script to generate a histogram PNG using the R Graphics Functions
 */

const { rGraphicsFunctions } = require('./src/graphics-functions');
const { renderHistogramToPNG } = require('./histogram-renderer');
const path = require('path');

// Generate sample data - normal distribution
const sampleData = [];
for (let i = 0; i < 1000; i++) {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  sampleData.push(z0 * 2 + 10); // mean=10, std=2
}

console.log('Generating histogram data...');

// Create histogram using R Graphics Function
const histogramData = rGraphicsFunctions.HIST(sampleData, {
  main: 'Sample Normal Distribution',
  xlab: 'Value',
  ylab: 'Frequency',
  col: 'steelblue',
  border: 'navy',
  breaks: 20
});

console.log('Histogram data created:');
console.log(`- Data points: ${histogramData.data.length}`);
console.log(`- Bins: ${histogramData.bins.length}`);
console.log(`- Range: ${Math.min(...sampleData).toFixed(2)} to ${Math.max(...sampleData).toFixed(2)}`);

// Render to PNG
const outputPath = path.join(__dirname, 'histogram-output.png');

console.log('Rendering histogram to PNG...');

try {
  const savedPath = renderHistogramToPNG(histogramData, outputPath, {
    width: 800,
    height: 600,
    margin: { top: 60, right: 50, bottom: 80, left: 80 }
  });
  
  console.log(`✅ Histogram PNG saved to: ${savedPath}`);
  console.log('You can now view the histogram image!');
  
} catch (error) {
  console.error('❌ Error rendering histogram:', error.message);
}