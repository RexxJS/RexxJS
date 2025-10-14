/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for R Visualization & Graphics Functions
 */

const { rGraphicsFunctions } = require('../src/graphics-functions.js');

describe('R Visualization & Graphics Functions', () => {
  describe('PAR', () => {
    test('should return default parameters', () => {
      const par = rGraphicsFunctions.PAR();
      
      expect(par.mfrow).toEqual([1, 1]);
      expect(par.mar).toEqual([5.1, 4.1, 4.1, 2.1]);
      expect(par.cex).toBe(1.0);
      expect(par.col).toBe('black');
      expect(par.bg).toBe('white');
      expect(par.font_main).toBe(2);
      expect(par.lty).toBe(1);
      expect(par.pch).toBe(1);
    });

    test('should override default parameters', () => {
      const par = rGraphicsFunctions.PAR({
        mfrow: [2, 2],
        col: 'red',
        cex: 1.5,
        bg: 'lightblue'
      });
      
      expect(par.mfrow).toEqual([2, 2]);
      expect(par.col).toBe('red');
      expect(par.cex).toBe(1.5);
      expect(par.bg).toBe('lightblue');
      expect(par.mar).toEqual([5.1, 4.1, 4.1, 2.1]); // Should keep defaults
    });
  });

  describe('PLOT', () => {
    test('should create basic plot with x and y data', () => {
      const plot = rGraphicsFunctions.PLOT([1, 2, 3], [4, 5, 6]);
      
      expect(plot.type).toBe('plot');
      expect(plot.x).toEqual([1, 2, 3]);
      expect(plot.y).toEqual([4, 5, 6]);
      expect(plot.options.type).toBe('p');
      expect(plot.options.col).toBe('black');
      expect(plot.options.axes).toBe(true);
    });

    test('should auto-generate y values when only x provided', () => {
      const plot = rGraphicsFunctions.PLOT([10, 20, 30]);
      
      expect(plot.type).toBe('plot');
      expect(plot.x).toEqual([10, 20, 30]);
      expect(plot.y).toEqual([1, 2, 3]);
    });

    test('should handle plot options', () => {
      const plot = rGraphicsFunctions.PLOT([1, 2, 3], [4, 5, 6], {
        main: 'Test Plot',
        xlab: 'X Axis',
        ylab: 'Y Axis',
        col: 'red',
        type: 'l',
        pch: 16
      });
      
      expect(plot.options.main).toBe('Test Plot');
      expect(plot.options.xlab).toBe('X Axis');
      expect(plot.options.ylab).toBe('Y Axis');
      expect(plot.options.col).toBe('red');
      expect(plot.options.type).toBe('l');
      expect(plot.options.pch).toBe(16);
    });

    test('should handle single values', () => {
      const plot = rGraphicsFunctions.PLOT(5, 10);
      
      expect(plot.x).toEqual([5]);
      expect(plot.y).toEqual([10]);
    });
  });

  describe('POINTS', () => {
    test('should create points object', () => {
      const points = rGraphicsFunctions.POINTS([1, 2, 3], [4, 5, 6]);
      
      expect(points.type).toBe('points');
      expect(points.x).toEqual([1, 2, 3]);
      expect(points.y).toEqual([4, 5, 6]);
      expect(points.options.col).toBe('black');
      expect(points.options.pch).toBe(1);
    });

    test('should handle point options', () => {
      const points = rGraphicsFunctions.POINTS([1, 2], [3, 4], {
        col: 'blue',
        pch: 16,
        cex: 2
      });
      
      expect(points.options.col).toBe('blue');
      expect(points.options.pch).toBe(16);
      expect(points.options.cex).toBe(2);
    });
  });

  describe('LINES', () => {
    test('should create lines object', () => {
      const lines = rGraphicsFunctions.LINES([1, 2, 3], [4, 5, 6]);
      
      expect(lines.type).toBe('lines');
      expect(lines.x).toEqual([1, 2, 3]);
      expect(lines.y).toEqual([4, 5, 6]);
      expect(lines.options.col).toBe('black');
      expect(lines.options.lty).toBe(1);
      expect(lines.options.lwd).toBe(1);
    });

    test('should handle line options', () => {
      const lines = rGraphicsFunctions.LINES([1, 2], [3, 4], {
        col: 'red',
        lty: 2,
        lwd: 3
      });
      
      expect(lines.options.col).toBe('red');
      expect(lines.options.lty).toBe(2);
      expect(lines.options.lwd).toBe(3);
    });
  });

  describe('ABLINE', () => {
    test('should create line with slope and intercept', () => {
      const abline = rGraphicsFunctions.ABLINE(2, 0.5); // y = 0.5x + 2
      
      expect(abline.type).toBe('abline');
      expect(abline.a).toBe(2);
      expect(abline.b).toBe(0.5);
      expect(abline.h).toBe(null);
      expect(abline.v).toBe(null);
    });

    test('should create horizontal line', () => {
      const abline = rGraphicsFunctions.ABLINE(null, null, 5); // horizontal at y=5
      
      expect(abline.h).toBe(5);
      expect(abline.a).toBe(null);
      expect(abline.b).toBe(null);
      expect(abline.v).toBe(null);
    });

    test('should create vertical line', () => {
      const abline = rGraphicsFunctions.ABLINE(null, null, null, 3); // vertical at x=3
      
      expect(abline.v).toBe(3);
      expect(abline.a).toBe(null);
      expect(abline.b).toBe(null);
      expect(abline.h).toBe(null);
    });
  });

  describe('HIST', () => {
    test('should create histogram with default settings', () => {
      const data = [1, 2, 2, 3, 3, 3, 4, 4, 5];
      const hist = rGraphicsFunctions.HIST(data);
      
      expect(hist.type).toBe('hist');
      expect(hist.data).toEqual(data);
      expect(hist.bins).toBeDefined();
      expect(hist.counts).toBeDefined();
      expect(hist.density).toBeDefined();
      expect(hist.mids).toBeDefined();
      expect(hist.options.main).toBe('Histogram');
      expect(hist.options.col).toBe('lightgray');
    });

    test('should handle histogram options', () => {
      const data = [1, 2, 3, 4, 5];
      const hist = rGraphicsFunctions.HIST(data, {
        breaks: 3,
        main: 'My Histogram',
        xlab: 'Values',
        ylab: 'Count',
        col: 'blue',
        freq: false
      });
      
      expect(hist.options.main).toBe('My Histogram');
      expect(hist.options.xlab).toBe('Values');
      expect(hist.options.ylab).toBe('Count');
      expect(hist.options.col).toBe('blue');
      expect(hist.options.freq).toBe(false);
    });

    test('should calculate bins correctly', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const hist = rGraphicsFunctions.HIST(data, { breaks: 5 });
      
      expect(hist.bins.length).toBe(5);
      expect(hist.counts.length).toBe(5);
      expect(hist.density.length).toBe(5);
      expect(hist.mids.length).toBe(5);
      
      // Total count should equal data length
      const totalCount = hist.counts.reduce((sum, count) => sum + count, 0);
      expect(totalCount).toBe(data.length);
    });

    test('should handle empty or non-numeric data', () => {
      const hist1 = rGraphicsFunctions.HIST([]);
      expect(hist1.error).toBeDefined();
      
      const hist2 = rGraphicsFunctions.HIST(['a', 'b', 'c']);
      expect(hist2.error).toBeDefined();
    });
  });

  describe('BOXPLOT', () => {
    test('should create boxplot with quartiles', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const boxplot = rGraphicsFunctions.BOXPLOT(data);
      
      expect(boxplot.type).toBe('boxplot');
      expect(boxplot.data).toEqual(data);
      expect(boxplot.stats.min).toBe(1);
      expect(boxplot.stats.max).toBe(10);
      expect(boxplot.stats.median).toBe(5.5);
      expect(boxplot.stats.q1).toBe(3.25);
      expect(boxplot.stats.q3).toBe(7.75);
      expect(boxplot.stats.n).toBe(10);
    });

    test('should identify outliers', () => {
      const data = [1, 2, 3, 4, 5, 100]; // 100 is an outlier
      const boxplot = rGraphicsFunctions.BOXPLOT(data);
      
      expect(boxplot.stats.outliers).toContain(100);
    });

    test('should handle boxplot options', () => {
      const data = [1, 2, 3, 4, 5];
      const boxplot = rGraphicsFunctions.BOXPLOT(data, {
        main: 'My Boxplot',
        col: 'lightblue',
        horizontal: true,
        notch: true
      });
      
      expect(boxplot.options.main).toBe('My Boxplot');
      expect(boxplot.options.col).toBe('lightblue');
      expect(boxplot.options.horizontal).toBe(true);
      expect(boxplot.options.notch).toBe(true);
    });

    test('should handle empty or non-numeric data', () => {
      const boxplot1 = rGraphicsFunctions.BOXPLOT([]);
      expect(boxplot1.error).toBeDefined();
      
      const boxplot2 = rGraphicsFunctions.BOXPLOT(['a', 'b']);
      expect(boxplot2.error).toBeDefined();
    });
  });

  describe('BARPLOT', () => {
    test('should create barplot with heights', () => {
      const heights = [3, 7, 2, 9, 5];
      const barplot = rGraphicsFunctions.BARPLOT(heights);
      
      expect(barplot.type).toBe('barplot');
      expect(barplot.heights).toEqual(heights);
      expect(barplot.names).toEqual(['1', '2', '3', '4', '5']);
      expect(barplot.options.main).toBe('Bar Plot');
      expect(barplot.options.col).toBe('gray');
    });

    test('should handle custom names and options', () => {
      const heights = [10, 15, 8];
      const barplot = rGraphicsFunctions.BARPLOT(heights, {
        names: ['A', 'B', 'C'],
        main: 'Custom Bar Plot',
        col: 'blue',
        horiz: true,
        space: 0.5
      });
      
      expect(barplot.names).toEqual(['A', 'B', 'C']);
      expect(barplot.options.main).toBe('Custom Bar Plot');
      expect(barplot.options.col).toBe('blue');
      expect(barplot.options.horiz).toBe(true);
      expect(barplot.options.space).toBe(0.5);
    });

    test('should handle single value', () => {
      const barplot = rGraphicsFunctions.BARPLOT(42);
      
      expect(barplot.heights).toEqual([42]);
      expect(barplot.names).toEqual(['1']);
    });
  });

  describe('PIE', () => {
    test('should create pie chart with percentages', () => {
      const values = [10, 20, 30, 40];
      const pie = rGraphicsFunctions.PIE(values);
      
      expect(pie.type).toBe('pie');
      expect(pie.values).toEqual(values);
      expect(pie.percentages).toEqual([10, 20, 30, 40]); // Should sum to 100%
      expect(pie.angles).toEqual([36, 72, 108, 144]); // Should sum to 360°
      expect(pie.labels).toEqual(['1', '2', '3', '4']);
    });

    test('should handle custom labels and options', () => {
      const values = [25, 25, 50];
      const pie = rGraphicsFunctions.PIE(values, {
        labels: ['Small', 'Medium', 'Large'],
        main: 'Size Distribution',
        col: ['red', 'green', 'blue']
      });
      
      expect(pie.labels).toEqual(['Small', 'Medium', 'Large']);
      expect(pie.options.main).toBe('Size Distribution');
      expect(pie.options.col).toEqual(['red', 'green', 'blue']);
    });

    test('should handle invalid data', () => {
      const pie1 = rGraphicsFunctions.PIE([0, 0, 0]);
      expect(pie1.error).toBeDefined();
      
      const pie2 = rGraphicsFunctions.PIE([-5, 10]);
      expect(pie2.error).toBeDefined();
    });
  });

  describe('SCATTEPLOT', () => {
    test('should create scatter plot', () => {
      const x = [1, 2, 3, 4];
      const y = [2, 4, 1, 5];
      const scatter = rGraphicsFunctions.SCATTEPLOT(x, y);
      
      expect(scatter.type).toBe('scatter');
      expect(scatter.x).toEqual(x);
      expect(scatter.y).toEqual(y);
      expect(scatter.options.main).toBe('Scatter Plot');
      expect(scatter.options.xlab).toBe('X');
      expect(scatter.options.ylab).toBe('Y');
    });

    test('should handle scatter plot options', () => {
      const x = [1, 2, 3];
      const y = [4, 5, 6];
      const scatter = rGraphicsFunctions.SCATTEPLOT(x, y, {
        main: 'Custom Scatter',
        xlab: 'Time',
        ylab: 'Value',
        col: 'red',
        pch: 16
      });
      
      expect(scatter.options.main).toBe('Custom Scatter');
      expect(scatter.options.xlab).toBe('Time');
      expect(scatter.options.ylab).toBe('Value');
      expect(scatter.options.col).toBe('red');
      expect(scatter.options.pch).toBe(16);
    });

    test('should handle mismatched array lengths', () => {
      const scatter = rGraphicsFunctions.SCATTEPLOT([1, 2, 3], [4, 5]);
      expect(scatter.error).toBeDefined();
    });
  });

  describe('QQPLOT', () => {
    test('should create Q-Q plot against normal distribution', () => {
      const data = [1, 2, 3, 4, 5];
      const qqplot = rGraphicsFunctions.QQPLOT(data);
      
      expect(qqplot.type).toBe('qqplot');
      expect(qqplot.x).toBeDefined();
      expect(qqplot.y).toBeDefined();
      expect(qqplot.x.length).toBe(qqplot.y.length);
      expect(qqplot.options.main).toBe('Q-Q Plot');
      expect(qqplot.options.qqline).toBe(true);
    });

    test('should create Q-Q plot between two datasets', () => {
      const x = [1, 2, 3, 4];
      const y = [1.1, 2.2, 2.9, 4.1];
      const qqplot = rGraphicsFunctions.QQPLOT(x, y);
      
      expect(qqplot.type).toBe('qqplot');
      expect(qqplot.x).toBeDefined();
      expect(qqplot.y).toBeDefined();
    });
  });

  describe('DENSITY_PLOT', () => {
    test('should create density plot', () => {
      const data = [1, 2, 2, 3, 3, 3, 4, 4, 5];
      const density = rGraphicsFunctions.DENSITY_PLOT(data);
      
      expect(density.type).toBe('density');
      expect(density.x).toBeDefined();
      expect(density.y).toBeDefined();
      expect(density.data).toEqual(data);
      expect(density.options.main).toBe('Density Plot');
      expect(density.options.kernel).toBe('gaussian');
    });

    test('should handle density plot options', () => {
      const data = [1, 2, 3, 4, 5];
      const density = rGraphicsFunctions.DENSITY_PLOT(data, {
        main: 'Custom Density',
        kernel: 'epanechnikov',
        col: 'blue',
        fill: 'lightblue'
      });
      
      expect(density.options.main).toBe('Custom Density');
      expect(density.options.kernel).toBe('epanechnikov');
      expect(density.options.col).toBe('blue');
      expect(density.options.fill).toBe('lightblue');
    });

    test('should handle insufficient data', () => {
      const density = rGraphicsFunctions.DENSITY_PLOT([1]);
      expect(density.error).toBeDefined();
    });
  });

  describe('Color Functions', () => {
    describe('COLORS', () => {
      test('should return array of color names', () => {
        const colors = rGraphicsFunctions.COLORS();
        
        expect(Array.isArray(colors)).toBe(true);
        expect(colors.length).toBeGreaterThan(0);
        expect(colors).toContain('red');
        expect(colors).toContain('blue');
        expect(colors).toContain('green');
        expect(colors).toContain('black');
        expect(colors).toContain('white');
      });
    });

    describe('RGB', () => {
      test('should create RGB color strings', () => {
        expect(rGraphicsFunctions.RGB(1, 0, 0)).toBe('rgb(255,0,0)');
        expect(rGraphicsFunctions.RGB(0, 1, 0)).toBe('rgb(0,255,0)');
        expect(rGraphicsFunctions.RGB(0, 0, 1)).toBe('rgb(0,0,255)');
        expect(rGraphicsFunctions.RGB(0.5, 0.5, 0.5)).toBe('rgb(128,128,128)');
      });

      test('should handle alpha channel', () => {
        expect(rGraphicsFunctions.RGB(1, 0, 0, 0.5)).toBe('rgba(255,0,0,0.5)');
        expect(rGraphicsFunctions.RGB(0, 1, 0, 0.8)).toBe('rgba(0,255,0,0.8)');
      });

      test('should clamp values to valid range', () => {
        expect(rGraphicsFunctions.RGB(-1, 2, 0.5)).toBe('rgb(0,255,128)');
        expect(rGraphicsFunctions.RGB(0.5, 0.5, 0.5, -0.5)).toBe('rgb(128,128,128)');
        expect(rGraphicsFunctions.RGB(0.5, 0.5, 0.5, 1.5)).toBe('rgb(128,128,128)');
      });
    });

    describe('HSV', () => {
      test('should create colors from HSV values', () => {
        const red = rGraphicsFunctions.HSV(0, 1, 1);
        const green = rGraphicsFunctions.HSV(120, 1, 1);
        const blue = rGraphicsFunctions.HSV(240, 1, 1);
        
        expect(red).toBe('rgb(255,0,0)');
        expect(green).toBe('rgb(0,255,0)');
        expect(blue).toBe('rgb(0,0,255)');
      });

      test('should handle hue wrapping', () => {
        const red1 = rGraphicsFunctions.HSV(0, 1, 1);
        const red2 = rGraphicsFunctions.HSV(360, 1, 1);
        const red3 = rGraphicsFunctions.HSV(-360, 1, 1);
        
        expect(red1).toBe(red2);
        expect(red1).toBe(red3);
      });

      test('should handle saturation and value', () => {
        const gray = rGraphicsFunctions.HSV(0, 0, 0.5);
        const white = rGraphicsFunctions.HSV(0, 0, 1);
        const black = rGraphicsFunctions.HSV(0, 1, 0);
        
        expect(gray).toBe('rgb(128,128,128)');
        expect(white).toBe('rgb(255,255,255)');
        expect(black).toBe('rgb(0,0,0)');
      });
    });

    describe('generateColors', () => {
      test('should generate requested number of colors', () => {
        const colors3 = rGraphicsFunctions.generateColors(3);
        const colors10 = rGraphicsFunctions.generateColors(10);
        const colors20 = rGraphicsFunctions.generateColors(20);
        
        expect(colors3.length).toBe(3);
        expect(colors10.length).toBe(10);
        expect(colors20.length).toBe(20);
      });

      test('should generate distinct colors', () => {
        const colors = rGraphicsFunctions.generateColors(5);
        const uniqueColors = new Set(colors);
        
        expect(uniqueColors.size).toBe(colors.length);
      });
    });
  });

  describe('Helper Functions', () => {
    describe('calculateSD', () => {
      test('should calculate standard deviation', () => {
        const sd1 = rGraphicsFunctions.calculateSD([1, 2, 3, 4, 5]);
        const sd2 = rGraphicsFunctions.calculateSD([10, 10, 10, 10]);
        
        expect(sd1).toBeCloseTo(1.58, 2);
        expect(sd2).toBe(0);
      });
    });

    describe('calculateQuantile', () => {
      test('should calculate quantiles correctly', () => {
        const data = [1, 2, 3, 4, 5];
        
        expect(rGraphicsFunctions.calculateQuantile(data, 0)).toBe(1);
        expect(rGraphicsFunctions.calculateQuantile(data, 0.5)).toBe(3);
        expect(rGraphicsFunctions.calculateQuantile(data, 1)).toBe(5);
        expect(rGraphicsFunctions.calculateQuantile(data, 0.25)).toBe(2);
        expect(rGraphicsFunctions.calculateQuantile(data, 0.75)).toBe(4);
      });
    });

    describe('qnorm', () => {
      test('should approximate inverse normal CDF', () => {
        expect(rGraphicsFunctions.qnorm(0.5)).toBeCloseTo(0, 5);
        expect(rGraphicsFunctions.qnorm(0.9772)).toBeCloseTo(2, 1);
        expect(rGraphicsFunctions.qnorm(0.0228)).toBeCloseTo(-2, 1);
      });

      test('should handle boundary cases', () => {
        expect(rGraphicsFunctions.qnorm(0)).toBe(-Infinity);
        expect(rGraphicsFunctions.qnorm(1)).toBe(Infinity);
      });
    });

    describe('kernelFunction', () => {
      test('should compute Gaussian kernel', () => {
        const gaussian0 = rGraphicsFunctions.kernelFunction(0, 'gaussian');
        const gaussian1 = rGraphicsFunctions.kernelFunction(1, 'gaussian');
        
        expect(gaussian0).toBeCloseTo(0.3989, 4); // 1/sqrt(2*pi)
        expect(gaussian1).toBeCloseTo(0.2420, 4);
      });

      test('should compute other kernel types', () => {
        const epan = rGraphicsFunctions.kernelFunction(0, 'epanechnikov');
        const uniform = rGraphicsFunctions.kernelFunction(0, 'uniform');
        
        expect(epan).toBe(0.75);
        expect(uniform).toBe(0.5);
      });

      test('should handle out-of-support values', () => {
        const epan = rGraphicsFunctions.kernelFunction(2, 'epanechnikov');
        const uniform = rGraphicsFunctions.kernelFunction(2, 'uniform');
        
        expect(epan).toBe(0);
        expect(uniform).toBe(0);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(rGraphicsFunctions.PAR().mfrow).toEqual([1, 1]);
      expect(rGraphicsFunctions.PLOT(null, null).error).toBeDefined();
      expect(rGraphicsFunctions.HIST(null).error).toBeDefined();
      expect(rGraphicsFunctions.BOXPLOT(null).error).toBeDefined();
    });

    test('should handle invalid data types', () => {
      expect(rGraphicsFunctions.HIST(['a', 'b', 'c']).error).toBeDefined();
      expect(rGraphicsFunctions.BOXPLOT(['x', 'y']).error).toBeDefined();
      expect(rGraphicsFunctions.DENSITY_PLOT('string').error).toBeDefined();
    });

    test('should handle empty arrays', () => {
      expect(rGraphicsFunctions.HIST([]).error).toBeDefined();
      expect(rGraphicsFunctions.BOXPLOT([]).error).toBeDefined();
      expect(rGraphicsFunctions.DENSITY_PLOT([]).error).toBeDefined();
    });
  });

  describe('Complex Plotting Scenarios', () => {
    test('should handle multiple plot types for same data', () => {
      const data = [1, 2, 3, 4, 5, 4, 3, 2, 1];
      
      const plot = rGraphicsFunctions.PLOT(data);
      const hist = rGraphicsFunctions.HIST(data);
      const boxplot = rGraphicsFunctions.BOXPLOT(data);
      const density = rGraphicsFunctions.DENSITY_PLOT(data);
      
      expect(plot.type).toBe('plot');
      expect(hist.type).toBe('hist');
      expect(boxplot.type).toBe('boxplot');
      expect(density.type).toBe('density');
      
      // All should process the same data successfully
      expect(plot.error).toBeUndefined();
      expect(hist.error).toBeUndefined();
      expect(boxplot.error).toBeUndefined();
      expect(density.error).toBeUndefined();
    });

    test('should maintain consistent timestamps', () => {
      const plot1 = rGraphicsFunctions.PLOT([1, 2, 3]);
      const plot2 = rGraphicsFunctions.PLOT([4, 5, 6]);
      
      expect(plot1.timestamp).toBeDefined();
      expect(plot2.timestamp).toBeDefined();
      expect(new Date(plot1.timestamp)).toBeInstanceOf(Date);
      expect(new Date(plot2.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('R Compatibility', () => {
    test('plot options should match R naming conventions', () => {
      const plot = rGraphicsFunctions.PLOT([1, 2, 3], null, {
        main: 'Main Title',
        xlab: 'X Label',
        ylab: 'Y Label',
        xlim: [0, 10],
        ylim: [0, 5],
        col: 'red',
        pch: 16,
        cex: 1.5
      });
      
      expect(plot.options.main).toBe('Main Title');
      expect(plot.options.xlab).toBe('X Label');
      expect(plot.options.ylab).toBe('Y Label');
      expect(plot.options.xlim).toEqual([0, 10]);
      expect(plot.options.ylim).toEqual([0, 5]);
      expect(plot.options.col).toBe('red');
      expect(plot.options.pch).toBe(16);
      expect(plot.options.cex).toBe(1.5);
    });

    test('histogram should match R break algorithms', () => {
      const data = Array.from({length: 100}, () => Math.random());
      
      const histSturges = rGraphicsFunctions.HIST(data, { breaks: 'Sturges' });
      const histScott = rGraphicsFunctions.HIST(data, { breaks: 'Scott' });
      
      // Sturges formula: ceil(log2(n)) + 1
      const expectedSturges = Math.ceil(Math.log2(100)) + 1;
      expect(histSturges.bins.length).toBe(expectedSturges);
      
      expect(histScott.bins.length).toBeGreaterThan(0);
    });

    test('boxplot statistics should match R conventions', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const boxplot = rGraphicsFunctions.BOXPLOT(data);
      
      // R uses different quartile calculation methods, but basic structure should match
      expect(boxplot.stats.min).toBeLessThanOrEqual(boxplot.stats.q1);
      expect(boxplot.stats.q1).toBeLessThanOrEqual(boxplot.stats.median);
      expect(boxplot.stats.median).toBeLessThanOrEqual(boxplot.stats.q3);
      expect(boxplot.stats.q3).toBeLessThanOrEqual(boxplot.stats.max);
      expect(boxplot.stats.iqr).toBe(boxplot.stats.q3 - boxplot.stats.q1);
    });
  });
});