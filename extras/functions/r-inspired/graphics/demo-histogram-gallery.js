/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Demo script that creates multiple histogram PNGs to showcase the rendering capability
 */

const { rGraphicsFunctions } = require('./src/graphics-functions');
const { renderHistogramToPNG } = require('./src/histogram-renderer');
const path = require('path');
const fs = require('fs');

// Create output directory
const outputDir = path.join(__dirname, 'histogram-gallery');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 Creating Histogram Gallery...\n');

// 1. Normal Distribution
console.log('📊 Creating normal distribution histogram...');
const normalData = [];
for (let i = 0; i < 1000; i++) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  normalData.push(z0 * 15 + 100); // mean=100, std=15
}

const normalHist = rGraphicsFunctions.HIST(normalData, {
  main: 'Normal Distribution (μ=100, σ=15)',
  xlab: 'Value',
  ylab: 'Frequency',
  col: 'steelblue',
  border: 'navy',
  breaks: 25
});

renderHistogramToPNG(normalHist, path.join(outputDir, '1-normal-distribution.png'));

// 2. Uniform Distribution
console.log('📊 Creating uniform distribution histogram...');
const uniformData = Array.from({length: 800}, () => Math.random() * 50 + 25);
const uniformHist = rGraphicsFunctions.HIST(uniformData, {
  main: 'Uniform Distribution [25, 75]',
  xlab: 'Value',
  ylab: 'Frequency',
  col: 'lightgreen',
  border: 'darkgreen',
  breaks: 20
});

renderHistogramToPNG(uniformHist, path.join(outputDir, '2-uniform-distribution.png'));

// 3. Exponential Distribution (approximation)
console.log('📊 Creating exponential distribution histogram...');
const exponentialData = [];
for (let i = 0; i < 500; i++) {
  const lambda = 0.5;
  const u = Math.random();
  const exp = -Math.log(u) / lambda;
  exponentialData.push(exp);
}

const expHist = rGraphicsFunctions.HIST(exponentialData, {
  main: 'Exponential Distribution (λ=0.5)',
  xlab: 'Value',
  ylab: 'Frequency',
  col: 'orange',
  border: 'red',
  breaks: 15
});

renderHistogramToPNG(expHist, path.join(outputDir, '3-exponential-distribution.png'));

// 4. Bimodal Distribution
console.log('📊 Creating bimodal distribution histogram...');
const bimodalData = [];
// First mode around 20
for (let i = 0; i < 300; i++) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  bimodalData.push(z0 * 5 + 20);
}
// Second mode around 60
for (let i = 0; i < 200; i++) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  bimodalData.push(z0 * 3 + 60);
}

const bimodalHist = rGraphicsFunctions.HIST(bimodalData, {
  main: 'Bimodal Distribution',
  xlab: 'Value',
  ylab: 'Frequency',
  col: 'purple',
  border: 'darkviolet',
  breaks: 30
});

renderHistogramToPNG(bimodalHist, path.join(outputDir, '4-bimodal-distribution.png'));

// 5. Small Dataset
console.log('📊 Creating small dataset histogram...');
const smallData = [1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 5];
const smallHist = rGraphicsFunctions.HIST(smallData, {
  main: 'Small Dataset (n=12)',
  xlab: 'Value',
  ylab: 'Count',
  col: 'lightcoral',
  border: 'darkred',
  breaks: 5
});

renderHistogramToPNG(smallHist, path.join(outputDir, '5-small-dataset.png'));

// 6. Constant Values
console.log('📊 Creating constant values histogram...');
const constantData = Array(20).fill(42);
const constantHist = rGraphicsFunctions.HIST(constantData, {
  main: 'Constant Values (all = 42)',
  xlab: 'Value',
  ylab: 'Count',
  col: 'gold',
  border: 'orange'
});

renderHistogramToPNG(constantHist, path.join(outputDir, '6-constant-values.png'));

console.log('\n✅ Histogram Gallery Complete!');
console.log(`📁 Check the '${outputDir}' directory for PNG files:`);

// List created files
const files = fs.readdirSync(outputDir);
files.forEach((file, index) => {
  const stats = fs.statSync(path.join(outputDir, file));
  console.log(`   ${index + 1}. ${file} (${Math.round(stats.size / 1024)} KB)`);
});

console.log('\n🎯 Each PNG demonstrates the complete R Graphics Function → PNG rendering pipeline!');