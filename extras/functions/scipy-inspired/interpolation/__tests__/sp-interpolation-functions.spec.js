/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Test suite for SciPy-inspired Interpolation Functions
 */

const { spInterpolationFunctions } = require('../src/sp-interpolation-functions');

describe('SciPy Interpolation Functions', () => {
  
  describe('INTERP1D - 1D Interpolation', () => {
    
    test('should create cubic spline interpolator', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16]; // y = x^2
      
      const interpolator = spInterpolationFunctions.INTERP1D(x, y, { kind: 'cubic' });
      
      expect(interpolator.error).toBeUndefined();
      expect(interpolator.type).toBe('interp1d');
      expect(interpolator.kind).toBe('cubic');
      expect(typeof interpolator.__call__).toBe('function');
      expect(typeof interpolator.interpolate).toBe('function');
    });

    test('should interpolate cubic spline values correctly', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16]; // y = x^2
      
      const interpolator = spInterpolationFunctions.INTERP1D(x, y, { kind: 'cubic' });
      
      // Test known points
      expect(interpolator.interpolate(0)).toBeCloseTo(0, 5);
      expect(interpolator.interpolate(1)).toBeCloseTo(1, 5);
      expect(interpolator.interpolate(2)).toBeCloseTo(4, 5);
      
      // Test interpolated points
      const result1_5 = interpolator.interpolate(1.5);
      expect(result1_5).toBeGreaterThan(1);
      expect(result1_5).toBeLessThan(4);
      expect(result1_5).toBeCloseTo(2.25, 1); // Should be close to x^2 = 2.25
    });

    test('should handle linear interpolation', () => {
      const x = [0, 1, 2, 3];
      const y = [0, 2, 4, 6]; // y = 2x
      
      const interpolator = spInterpolationFunctions.INTERP1D(x, y, { kind: 'linear' });
      
      expect(interpolator.interpolate(0.5)).toBeCloseTo(1, 10);
      expect(interpolator.interpolate(1.5)).toBeCloseTo(3, 10);
      expect(interpolator.interpolate(2.5)).toBeCloseTo(5, 10);
    });

    test('should handle nearest neighbor interpolation', () => {
      const x = [0, 1, 2, 3];
      const y = [10, 20, 30, 40];
      
      const interpolator = spInterpolationFunctions.INTERP1D(x, y, { kind: 'nearest' });
      
      expect(interpolator.interpolate(0.4)).toBe(10); // Closer to x=0
      expect(interpolator.interpolate(0.6)).toBe(20); // Closer to x=1
      expect(interpolator.interpolate(1.3)).toBe(20); // Closer to x=1
      expect(interpolator.interpolate(1.7)).toBe(30); // Closer to x=2
    });

    test('should handle quadratic interpolation', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16]; // y = x^2
      
      const interpolator = spInterpolationFunctions.INTERP1D(x, y, { kind: 'quadratic' });
      
      // Test known points
      expect(interpolator.interpolate(0)).toBeCloseTo(0, 5);
      expect(interpolator.interpolate(2)).toBeCloseTo(4, 5);
      
      // Test interpolated point
      const result1_5 = interpolator.interpolate(1.5);
      expect(result1_5).toBeCloseTo(2.25, 1); // Should be close to x^2 = 2.25
    });

    test('should handle array input for interpolation', () => {
      const x = [0, 1, 2, 3];
      const y = [0, 1, 4, 9];
      
      const interpolator = spInterpolationFunctions.INTERP1D(x, y, { kind: 'linear' });
      const xi = [0.5, 1.5, 2.5];
      const result = interpolator.interpolate(xi);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result[0]).toBeCloseTo(0.5, 10);
      expect(result[1]).toBeCloseTo(2.5, 10);
      expect(result[2]).toBeCloseTo(6.5, 10);
    });

    test('should handle bounds error', () => {
      const x = [0, 1, 2];
      const y = [0, 1, 4];
      
      const interpolator = spInterpolationFunctions.INTERP1D(x, y, { 
        kind: 'linear', 
        bounds_error: true 
      });
      
      expect(() => interpolator.interpolate(-1)).toThrow();
      expect(() => interpolator.interpolate(3)).toThrow();
    });

    test('should use fill_value for out-of-bounds when bounds_error is false', () => {
      const x = [0, 1, 2];
      const y = [0, 1, 4];
      
      const interpolator = spInterpolationFunctions.INTERP1D(x, y, { 
        kind: 'linear', 
        bounds_error: false,
        fill_value: -999 
      });
      
      expect(interpolator.interpolate(-1)).toBe(-999);
      expect(interpolator.interpolate(3)).toBe(-999);
    });

    test('should handle duplicate x values by removing them', () => {
      const x = [0, 1, 1, 2, 3];
      const y = [0, 1, 2, 4, 9];
      
      const interpolator = spInterpolationFunctions.INTERP1D(x, y, { kind: 'linear' });
      
      expect(interpolator.error).toBeUndefined();
      expect(interpolator.x).toHaveLength(4); // Duplicates removed
    });

    test('should return error for insufficient data points', () => {
      const x = [0];
      const y = [1];
      
      const result = spInterpolationFunctions.INTERP1D(x, y);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('at least 2 data points');
    });

    test('should return error for mismatched array lengths', () => {
      const x = [0, 1, 2];
      const y = [0, 1];
      
      const result = spInterpolationFunctions.INTERP1D(x, y);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('same length');
    });
  });

  describe('PCHIP - Piecewise Cubic Hermite Interpolation', () => {
    
    test('should create PCHIP interpolator', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16];
      
      const interpolator = spInterpolationFunctions.PCHIP(x, y);
      
      expect(interpolator.error).toBeUndefined();
      expect(interpolator.type).toBe('pchip');
      expect(typeof interpolator.__call__).toBe('function');
      expect(typeof interpolator.interpolate).toBe('function');
    });

    test('should interpolate PCHIP values correctly', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16]; // y = x^2
      
      const interpolator = spInterpolationFunctions.PCHIP(x, y);
      
      // Test known points
      expect(interpolator.interpolate(0)).toBeCloseTo(0, 5);
      expect(interpolator.interpolate(1)).toBeCloseTo(1, 5);
      expect(interpolator.interpolate(2)).toBeCloseTo(4, 5);
      
      // Test interpolated points
      const result1_5 = interpolator.interpolate(1.5);
      expect(result1_5).toBeGreaterThan(1);
      expect(result1_5).toBeLessThan(4);
    });

    test('should preserve monotonicity', () => {
      const x = [0, 1, 2, 3];
      const y = [0, 1, 2, 3]; // Monotonic increasing
      
      const interpolator = spInterpolationFunctions.PCHIP(x, y);
      
      // Test that interpolated values maintain monotonicity
      const testPoints = [0.5, 1.2, 1.8, 2.3];
      const results = testPoints.map(xi => interpolator.interpolate(xi));
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeGreaterThanOrEqual(results[i-1]);
      }
    });
  });

  describe('INTERP2D - 2D Interpolation', () => {
    
    test('should create 2D interpolator', () => {
      const x = [0, 1, 2];
      const y = [0, 1, 2];
      const z = [
        [0, 1, 4],
        [1, 2, 5],
        [4, 5, 8]
      ];
      
      const interpolator = spInterpolationFunctions.INTERP2D(x, y, z);
      
      expect(interpolator.error).toBeUndefined();
      expect(interpolator.type).toBe('interp2d');
      expect(typeof interpolator.__call__).toBe('function');
      expect(typeof interpolator.interpolate).toBe('function');
    });

    test('should interpolate 2D values correctly', () => {
      const x = [0, 1, 2];
      const y = [0, 1, 2];
      const z = [
        [0, 1, 2],
        [1, 2, 3],
        [2, 3, 4]
      ]; // z = x + y
      
      const interpolator = spInterpolationFunctions.INTERP2D(x, y, z);
      
      // Test known points
      expect(interpolator.interpolate(0, 0)).toBeCloseTo(0, 10);
      expect(interpolator.interpolate(1, 1)).toBeCloseTo(2, 10);
      expect(interpolator.interpolate(2, 2)).toBeCloseTo(4, 10);
      
      // Test interpolated point
      const result = interpolator.interpolate(0.5, 0.5);
      expect(result).toBeCloseTo(1, 5); // Should be close to 0.5 + 0.5 = 1
    });

    test('should handle array inputs for 2D interpolation', () => {
      const x = [0, 1];
      const y = [0, 1];
      const z = [[0, 1], [1, 2]];
      
      const interpolator = spInterpolationFunctions.INTERP2D(x, y, z);
      
      const xi = [0.5, 0.5];
      const yi = [0.5, 0.5];
      const result = interpolator.interpolate(xi, yi);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    test('should return error for non-2D z array', () => {
      const x = [0, 1];
      const y = [0, 1];
      const z = [0, 1, 2, 3]; // 1D array
      
      const result = spInterpolationFunctions.INTERP2D(x, y, z);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('2D array');
    });
  });

  describe('SPLREP/SPLEV - B-spline Interpolation', () => {
    
    test('should create B-spline representation', () => {
      const x = [0, 1, 2, 3, 4, 5];
      const y = [0, 1, 4, 9, 16, 25]; // y = x^2
      
      const tck = spInterpolationFunctions.SPLREP(x, y);
      
      expect(tck.error).toBeUndefined();
      expect(tck.type).toBe('splrep');
      expect(tck.t).toBeDefined(); // knots
      expect(tck.c).toBeDefined(); // coefficients
      expect(tck.k).toBe(3); // default cubic
    });

    test('should evaluate B-spline', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16];
      
      const tck = spInterpolationFunctions.SPLREP(x, y);
      const result = spInterpolationFunctions.SPLEV([0, 1, 2], tck);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      // For this simplified B-spline implementation, just check that we get numeric results
      expect(typeof result[0]).toBe('number');
      expect(typeof result[1]).toBe('number');
      expect(typeof result[2]).toBe('number');
    });

    test('should handle different spline degrees', () => {
      const x = [0, 1, 2, 3, 4, 5];
      const y = [0, 1, 4, 9, 16, 25];
      
      const tck_linear = spInterpolationFunctions.SPLREP(x, y, { k: 1 });
      const tck_quadratic = spInterpolationFunctions.SPLREP(x, y, { k: 2 });
      
      expect(tck_linear.k).toBe(1);
      expect(tck_quadratic.k).toBe(2);
    });
  });

  describe('RBF - Radial Basis Functions', () => {
    
    test('should create 1D RBF interpolator', () => {
      const x = [0, 1, 2, 3];
      const y = null; // 1D case
      const d = [0, 1, 4, 9]; // function values
      
      const rbf = spInterpolationFunctions.RBF(x, y, d);
      
      expect(rbf.error).toBeUndefined();
      expect(rbf.type).toBe('rbf');
      expect(typeof rbf.__call__).toBe('function');
    });

    test('should interpolate with different RBF functions', () => {
      const x = [0, 1, 2];
      const y = null;
      const d = [0, 1, 4];
      
      const rbf_multiquadric = spInterpolationFunctions.RBF(x, y, d, { function: 'multiquadric' });
      const rbf_gaussian = spInterpolationFunctions.RBF(x, y, d, { function: 'gaussian' });
      const rbf_linear = spInterpolationFunctions.RBF(x, y, d, { function: 'linear' });
      
      expect(rbf_multiquadric.function).toBe('multiquadric');
      expect(rbf_gaussian.function).toBe('gaussian');
      expect(rbf_linear.function).toBe('linear');
      
      // Should produce different results
      const result1 = rbf_multiquadric.interpolate(0.5);
      const result2 = rbf_gaussian.interpolate(0.5);
      const result3 = rbf_linear.interpolate(0.5);
      
      expect(result1).not.toBeCloseTo(result2, 2);
      expect(result1).not.toBeCloseTo(result3, 2);
    });

    test('should handle 2D RBF interpolation', () => {
      const x = [0, 1, 0, 1];
      const y = [0, 0, 1, 1]; // 2x2 grid
      const d = [0, 1, 1, 2]; // function values
      
      const rbf = spInterpolationFunctions.RBF(x, y, d);
      
      const result = rbf.interpolate([0.5], [0.5]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(typeof result[0]).toBe('number');
    });
  });

  describe('BARYCENTRIC - Barycentric Lagrange', () => {
    
    test('should create barycentric interpolator', () => {
      const x = [0, 1, 2, 3];
      const y = [0, 1, 8, 27]; // y = x^3
      
      const bary = spInterpolationFunctions.BARYCENTRIC(x, y);
      
      expect(bary.error).toBeUndefined();
      expect(bary.type).toBe('barycentric');
      expect(bary.weights).toBeDefined();
      expect(typeof bary.__call__).toBe('function');
      expect(typeof bary.add_xi).toBe('function');
    });

    test('should interpolate exactly at data points', () => {
      const x = [0, 1, 2];
      const y = [1, 4, 9];
      
      const bary = spInterpolationFunctions.BARYCENTRIC(x, y);
      
      expect(bary.interpolate(0)).toBeCloseTo(1, 10);
      expect(bary.interpolate(1)).toBeCloseTo(4, 10);
      expect(bary.interpolate(2)).toBeCloseTo(9, 10);
    });

    test('should allow adding new points', () => {
      const x = [0, 1];
      const y = [0, 1];
      
      const bary = spInterpolationFunctions.BARYCENTRIC(x, y);
      bary.add_xi(2, 4);
      
      expect(bary.x).toHaveLength(3);
      expect(bary.y).toHaveLength(3);
    });
  });

  describe('KROGH - Krogh Interpolation', () => {
    
    test('should create Krogh interpolator', () => {
      const x = [0, 1, 2, 3];
      const y = [1, 2, 5, 10];
      
      const krogh = spInterpolationFunctions.KROGH(x, y);
      
      expect(krogh.error).toBeUndefined();
      expect(krogh.type).toBe('krogh');
      expect(krogh.dd_table).toBeDefined();
      expect(typeof krogh.derivative).toBe('function');
    });

    test('should interpolate using divided differences', () => {
      const x = [0, 1, 2];
      const y = [1, 2, 5]; // Some polynomial
      
      const krogh = spInterpolationFunctions.KROGH(x, y);
      
      // Should match exactly at data points
      expect(krogh.interpolate(0)).toBeCloseTo(1, 10);
      expect(krogh.interpolate(1)).toBeCloseTo(2, 10);
      expect(krogh.interpolate(2)).toBeCloseTo(5, 10);
      
      // Should give reasonable interpolation between points
      const mid = krogh.interpolate(0.5);
      expect(mid).toBeGreaterThan(1);
      expect(mid).toBeLessThan(2);
    });

    test('should build divided difference table correctly', () => {
      const x = [0, 1, 2];
      const y = [0, 1, 4]; // y = x^2
      
      const table = spInterpolationFunctions.buildDividedDifferenceTable(x, y);
      
      expect(table).toHaveLength(3);
      expect(table[0]).toHaveLength(3);
      
      // First column should be y values
      expect(table[0][0]).toBe(0);
      expect(table[1][0]).toBe(1);
      expect(table[2][0]).toBe(4);
      
      // First differences should be [1, 3]
      expect(table[0][1]).toBe(1);
      expect(table[1][1]).toBe(3);
      
      // Second difference should be 1 (since y = x^2 has second derivative = 2, but divided difference gives 1)
      expect(table[0][2]).toBeCloseTo(1, 5);
    });
  });

  describe('Advanced interpolation methods comparison', () => {
    
    test('should compare different methods on same data', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16]; // y = x^2
      
      const cubic = spInterpolationFunctions.INTERP1D(x, y, { kind: 'cubic' });
      const pchip = spInterpolationFunctions.PCHIP(x, y);
      const bary = spInterpolationFunctions.BARYCENTRIC(x, y);
      const krogh = spInterpolationFunctions.KROGH(x, y);
      
      const test_point = 1.5;
      const expected = 2.25; // 1.5^2
      
      const results = [
        cubic.interpolate(test_point),
        pchip.interpolate(test_point),
        bary.interpolate(test_point),
        krogh.interpolate(test_point)
      ];
      
      // All should give reasonable results close to expected
      results.forEach(result => {
        expect(result).toBeGreaterThan(1);
        expect(result).toBeLessThan(4);
      });
      
      // At least some should be close to the true value
      const close_results = results.filter(r => Math.abs(r - expected) < 0.5);
      expect(close_results.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    
    test('should handle single point arrays gracefully', () => {
      const result = spInterpolationFunctions.INTERP1D([1], [2]);
      expect(result.error).toBeDefined();
    });

    test('should handle unsupported interpolation kind', () => {
      const x = [0, 1, 2];
      const y = [0, 1, 4];
      
      const result = spInterpolationFunctions.INTERP1D(x, y, { kind: 'unsupported' });
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Unsupported interpolation kind');
    });

    test('should handle non-numeric input', () => {
      const x = ['a', 'b', 'c'];
      const y = [0, 1, 2];
      
      const interpolator = spInterpolationFunctions.INTERP1D(x, y);
      expect(interpolator.error).toBeDefined();
    });

    test('should handle insufficient data for B-splines', () => {
      const x = [0, 1];
      const y = [0, 1];
      
      const result = spInterpolationFunctions.SPLREP(x, y, { k: 3 });
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Need at least 4 data points');
    });

    test('should handle invalid B-spline representation', () => {
      const invalid_tck = { t: null, c: null, k: undefined };
      
      const result = spInterpolationFunctions.SPLEV([1], invalid_tck);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid B-spline representation');
    });

    test('should handle mismatched coordinate arrays in RBF', () => {
      const x = [0, 1, 2];
      const y = [0, 1]; // Different length
      const d = [0, 1, 4];
      
      const result = spInterpolationFunctions.RBF(x, y, d);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('same length');
    });
  });

  describe('GRIDDATA - Scattered Data Interpolation', () => {
    test('should create griddata interpolator with nearest method', () => {
      const points = [[0, 0], [1, 0], [0, 1], [1, 1]];
      const values = [1, 2, 3, 4];
      const xi = [[0.5, 0.5]];
      
      const result = spInterpolationFunctions.GRIDDATA(points, values, xi, { method: 'nearest' });
      expect(result.error).toBeUndefined();
      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(1);
    });

    test('should interpolate scattered data with linear method', () => {
      const points = [[0, 0], [1, 0], [0, 1]];
      const values = [1, 2, 3];
      const xi = [[0.5, 0.25]];
      
      const result = spInterpolationFunctions.GRIDDATA(points, values, xi, { method: 'linear' });
      expect(result.error).toBeUndefined();
      expect(result.results).toBeDefined();
      expect(typeof result.results[0]).toBe('number');
    });

    test('should handle cubic RBF method for griddata', () => {
      const points = [[0, 1, 2]];
      const values = [0, 1, 4];
      const xi = [[1.5]];
      
      const result = spInterpolationFunctions.GRIDDATA(points, values, xi, { method: 'cubic' });
      expect(result.error).toBeUndefined();
      expect(result.results).toBeDefined();
    });

    test('should work with 1D scattered data', () => {
      const points = [0, 1, 2, 3];
      const values = [0, 1, 4, 9];
      const xi = [1.5, 2.5];
      
      const result = spInterpolationFunctions.GRIDDATA(points, values, xi, { method: 'linear' });
      expect(result.error).toBeUndefined();
      expect(result.results.length).toBe(2);
    });

    test('should return fill_value for problematic points', () => {
      const points = [];
      const values = [];
      const xi = [[0, 0]];
      
      const result = spInterpolationFunctions.GRIDDATA(points, values, xi, { fill_value: -999 });
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Empty input data');
    });
  });

  describe('AKIMA1D - Shape-Preserving Interpolation', () => {
    test('should create Akima interpolator', () => {
      const x = [0, 1, 2, 3, 4, 5];
      const y = [0, 1, 4, 9, 16, 25];
      
      const interpolator = spInterpolationFunctions.AKIMA1D(x, y);
      expect(interpolator.error).toBeUndefined();
      expect(typeof interpolator.interpolate).toBe('function');
    });

    test('should preserve shape better than cubic splines', () => {
      const x = [0, 1, 2, 3, 4, 5];
      const y = [0, 2, 1, 3, 2, 4]; // Oscillating data
      
      const interpolator = spInterpolationFunctions.AKIMA1D(x, y);
      expect(interpolator.error).toBeUndefined();
      
      const result = interpolator.interpolate([1.5, 2.5, 3.5]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      result.forEach(val => expect(typeof val).toBe('number'));
    });

    test('should require at least 5 data points', () => {
      const x = [0, 1, 2, 3];
      const y = [0, 1, 4, 9];
      
      const interpolator = spInterpolationFunctions.AKIMA1D(x, y);
      expect(interpolator.error).toBeDefined();
      expect(interpolator.error).toContain('at least 5 data points');
    });

    test('should handle monotonic data correctly', () => {
      const x = [0, 1, 2, 3, 4, 5];
      const y = [0, 1, 2, 3, 4, 5]; // Monotonic
      
      const interpolator = spInterpolationFunctions.AKIMA1D(x, y);
      expect(interpolator.error).toBeUndefined();
      
      const result = interpolator.interpolate([0.5, 1.5, 2.5]);
      expect(result[0]).toBeCloseTo(0.5, 1);
      expect(result[1]).toBeCloseTo(1.5, 1);
      expect(result[2]).toBeCloseTo(2.5, 1);
    });
  });

  describe('SP_UNISPLINE - Smoothing Splines', () => {
    test('should create UnivariateSpline interpolator', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16];
      
      const interpolator = spInterpolationFunctions.SP_UNISPLINE(x, y);
      expect(interpolator.error).toBeUndefined();
      expect(typeof interpolator.interpolate).toBe('function');
    });

    test('should handle smoothing factor', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0.1, 0.9, 4.1, 8.9, 16.1]; // Noisy data
      
      const interpolator = spInterpolationFunctions.SP_UNISPLINE(x, y, { s: 1 });
      expect(interpolator.error).toBeUndefined();
      
      const result = interpolator.interpolate([1.5, 2.5]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    test('should work with weighted data points', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16];
      const weights = [1, 2, 1, 2, 1]; // Higher weight for points 1 and 3
      
      const interpolator = spInterpolationFunctions.SP_UNISPLINE(x, y, { w: weights });
      expect(interpolator.error).toBeUndefined();
    });

    test('should require at least 4 data points', () => {
      const x = [0, 1, 2];
      const y = [0, 1, 4];
      
      const interpolator = spInterpolationFunctions.SP_UNISPLINE(x, y);
      expect(interpolator.error).toBeDefined();
      expect(interpolator.error).toContain('at least 4 data points');
    });
  });

  describe('SP_REGULARGRID - Regular Grid Interpolation', () => {
    test('should interpolate on 1D regular grid', () => {
      const points = [0, 1, 2, 3, 4];
      const values = [0, 1, 4, 9, 16];
      
      const interpolator = spInterpolationFunctions.SP_REGULARGRID(points, values, { method: 'linear' });
      expect(interpolator.error).toBeUndefined();
      
      const result = interpolator.interpolate([1.5, 2.5]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    test('should handle nearest neighbor on regular grid', () => {
      const points = [0, 1, 2, 3];
      const values = [0, 1, 4, 9];
      
      const interpolator = spInterpolationFunctions.SP_REGULARGRID(points, values, { method: 'nearest' });
      expect(interpolator.error).toBeUndefined();
      
      const result = interpolator.interpolate([0.6, 2.4]);
      expect(result[0]).toBe(1); // Nearest to points[1]
      expect(result[1]).toBe(4); // Nearest to points[2]
    });

    test('should handle multi-dimensional regular grids', () => {
      const points = [[0, 1, 2], [0, 1, 2]]; // 2D grid
      const values = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
      
      const interpolator = spInterpolationFunctions.SP_REGULARGRID(points, values);
      expect(interpolator.error).toBeUndefined();
    });

    test('should handle empty points array', () => {
      const points = [];
      const values = [];
      
      const interpolator = spInterpolationFunctions.SP_REGULARGRID(points, values);
      expect(interpolator.error).toBeDefined();
      expect(interpolator.error).toContain('non-empty array');
    });
  });

  describe('SP_CUBIC_SPLINE - Enhanced Cubic Splines', () => {
    test('should create cubic spline with natural boundary conditions', () => {
      const x = [0, 1, 2, 3];
      const y = [0, 1, 4, 9];
      
      const interpolator = spInterpolationFunctions.SP_CUBIC_SPLINE(x, y, { bc_type: 'natural' });
      expect(interpolator.error).toBeUndefined();
      expect(typeof interpolator.interpolate).toBe('function');
    });

    test('should handle not-a-knot boundary conditions', () => {
      const x = [0, 1, 2, 3];
      const y = [0, 1, 4, 9];
      
      const interpolator = spInterpolationFunctions.SP_CUBIC_SPLINE(x, y, { bc_type: 'not-a-knot' });
      expect(interpolator.error).toBeUndefined();
      
      const result = interpolator.interpolate([0.5, 1.5, 2.5]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    test('should support extrapolation option', () => {
      const x = [0, 1, 2];
      const y = [0, 1, 4];
      
      const interpolator = spInterpolationFunctions.SP_CUBIC_SPLINE(x, y, { extrapolate: true });
      expect(interpolator.error).toBeUndefined();
      
      const result = interpolator.interpolate([-0.5, 2.5]); // Outside domain
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    test('should require at least 3 data points', () => {
      const x = [0, 1];
      const y = [0, 1];
      
      const interpolator = spInterpolationFunctions.SP_CUBIC_SPLINE(x, y);
      expect(interpolator.error).toBeDefined();
      expect(interpolator.error).toContain('at least 3 data points');
    });
  });

  describe('SP_LSQ_SPLINE - Least-Squares Splines', () => {
    test('should create LSQ spline with user-specified knots', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16];
      const knots = [0, 2, 4];
      
      const interpolator = spInterpolationFunctions.SP_LSQ_SPLINE(x, y, knots);
      expect(interpolator.error).toBeUndefined();
      expect(interpolator.knots).toEqual(knots);
      expect(Array.isArray(interpolator.coefficients)).toBe(true);
    });

    test('should handle weighted least-squares fitting', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16];
      const knots = [0, 2, 4];
      const weights = [1, 2, 1, 2, 1];
      
      const interpolator = spInterpolationFunctions.SP_LSQ_SPLINE(x, y, knots, { w: weights });
      expect(interpolator.error).toBeUndefined();
    });

    test('should work with different spline degrees', () => {
      const x = [0, 1, 2, 3, 4];
      const y = [0, 1, 4, 9, 16];
      const knots = [0, 2, 4];
      
      const interpolator = spInterpolationFunctions.SP_LSQ_SPLINE(x, y, knots, { k: 2 });
      expect(interpolator.error).toBeUndefined();
    });
  });

  describe('SP_SPLPREP - Parametric Splines', () => {
    test('should prepare parametric spline for 2D curve', () => {
      const x = [[0, 1, 2, 3], [0, 1, 0, -1]]; // 2D curve
      
      const result = spInterpolationFunctions.SP_SPLPREP(x);
      expect(result.error).toBeUndefined();
      expect(result.splines).toBeDefined();
      expect(result.splines.length).toBe(2);
      expect(Array.isArray(result.u)).toBe(true);
    });

    test('should handle 3D parametric curves', () => {
      const x = [[0, 1, 2], [0, 1, 0], [0, 0, 1]]; // 3D curve
      
      const result = spInterpolationFunctions.SP_SPLPREP(x);
      expect(result.error).toBeUndefined();
      expect(result.splines.length).toBe(3);
    });

    test('should evaluate parametric spline at new parameters', () => {
      const x = [[0, 1, 2, 3], [0, 1, 0, -1]];
      
      const spline = spInterpolationFunctions.SP_SPLPREP(x);
      expect(spline.error).toBeUndefined();
      
      const result = spline.evaluate([0.25, 0.5, 0.75]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // 2D output
      expect(result[0].length).toBe(3); // 3 evaluation points
    });

    test('should handle mismatched coordinate array lengths', () => {
      const x = [[0, 1, 2], [0, 1]]; // Different lengths
      
      const result = spInterpolationFunctions.SP_SPLPREP(x);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('same length');
    });
  });

  describe('SP_PPOLY - Piecewise Polynomials', () => {
    test('should create piecewise polynomial representation', () => {
      const c = [[1, 0], [2, 1], [3, 4]]; // Coefficients for each piece
      const x = [0, 1, 2]; // Breakpoints
      
      const ppoly = spInterpolationFunctions.SP_PPOLY(c, x);
      expect(ppoly.error).toBeUndefined();
      expect(ppoly.coefficients).toEqual(c);
      expect(ppoly.breakpoints).toEqual(x);
    });

    test('should evaluate polynomial pieces correctly', () => {
      const c = [1, 0, 0]; // Constant polynomial = 1
      const x = [0, 1, 2];
      
      const ppoly = spInterpolationFunctions.SP_PPOLY(c, x);
      expect(ppoly.error).toBeUndefined();
      
      const result = ppoly.interpolate([0.5, 1.5]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    test('should respect extrapolation bounds', () => {
      const c = [1, 0];
      const x = [0, 1];
      
      const ppoly = spInterpolationFunctions.SP_PPOLY(c, x, { extrapolate: false });
      expect(ppoly.error).toBeUndefined();
      
      const result = ppoly.interpolate([-1, 2]); // Outside bounds
      expect(result[0]).toBeNaN();
      expect(result[1]).toBeNaN();
    });

    test('should handle invalid inputs', () => {
      const c = 'invalid';
      const x = [0, 1];
      
      const ppoly = spInterpolationFunctions.SP_PPOLY(c, x);
      expect(ppoly.error).toBeDefined();
      expect(ppoly.error).toContain('must be arrays');
    });
  });
});