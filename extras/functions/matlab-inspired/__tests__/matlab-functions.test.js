/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

describe('MATLAB-inspired Functions Library Tests', () => {

    afterEach(() => {
        jest.resetModules();
        delete global.MATLAB_FUNCTIONS;
        delete global.MATLAB_FUNCTIONS_META;
    });

    const loadModule = () => {
        const fs = require('fs');
        const path = require('path');
        const source = fs.readFileSync(path.join(__dirname, '../src/matlab-functions.js'), 'utf8');
        eval(source);
    };

    test('should load without errors and define globals', () => {
        loadModule();
        expect(global.MATLAB_FUNCTIONS).toBeDefined();
        expect(global.MATLAB_FUNCTIONS_META).toBeDefined();
    });

    describe('LINSPACE function', () => {
        test('should generate linearly spaced vector with default n=100', () => {
            loadModule();
            const result = global.MATLAB_FUNCTIONS['LINSPACE'](0, 10);
            expect(result).toHaveLength(100);
            expect(result[0]).toBe(0);
            expect(result[99]).toBeCloseTo(10, 10);
        });

        test('should generate linearly spaced vector with custom n', () => {
            loadModule();
            const result = global.MATLAB_FUNCTIONS['LINSPACE'](0, 10, 5);
            expect(result).toEqual([0, 2.5, 5, 7.5, 10]);
        });

        test('should handle negative ranges', () => {
            loadModule();
            const result = global.MATLAB_FUNCTIONS['LINSPACE'](-5, 5, 3);
            expect(result).toEqual([-5, 0, 5]);
        });

        test('should throw error for n < 2', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['LINSPACE'](0, 10, 1)).toThrow('LINSPACE requires n >= 2');
        });

        test('should throw error for non-numeric arguments', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['LINSPACE']('a', 10, 5)).toThrow('LINSPACE requires numeric arguments');
        });
    });

    describe('LOGSPACE function', () => {
        test('should generate logarithmically spaced vector', () => {
            loadModule();
            const result = global.MATLAB_FUNCTIONS['LOGSPACE'](0, 2, 3);
            expect(result).toHaveLength(3);
            expect(result[0]).toBeCloseTo(1, 10);      // 10^0 = 1
            expect(result[1]).toBeCloseTo(10, 10);     // 10^1 = 10
            expect(result[2]).toBeCloseTo(100, 10);    // 10^2 = 100
        });

        test('should handle negative exponents', () => {
            loadModule();
            const result = global.MATLAB_FUNCTIONS['LOGSPACE'](-2, 0, 3);
            expect(result[0]).toBeCloseTo(0.01, 10);   // 10^-2 = 0.01
            expect(result[2]).toBeCloseTo(1, 10);      // 10^0 = 1
        });

        test('should throw error for n < 2', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['LOGSPACE'](0, 2, 1)).toThrow('LOGSPACE requires n >= 2');
        });
    });

    describe('ZEROS function', () => {
        test('should create 1D array of zeros', () => {
            loadModule();
            const result = global.MATLAB_FUNCTIONS['ZEROS'](5);
            expect(result).toEqual([0, 0, 0, 0, 0]);
        });

        test('should create 2D array of zeros', () => {
            loadModule();
            const result = global.MATLAB_FUNCTIONS['ZEROS'](2, 3);
            expect(result).toEqual([[0, 0, 0], [0, 0, 0]]);
        });

        test('should throw error for invalid dimensions', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['ZEROS'](0)).toThrow('ZEROS requires positive integer rows');
            expect(() => global.MATLAB_FUNCTIONS['ZEROS'](2, 0)).toThrow('ZEROS requires positive integer cols');
        });
    });

    describe('ONES function', () => {
        test('should create 1D array of ones', () => {
            loadModule();
            const result = global.MATLAB_FUNCTIONS['ONES'](4);
            expect(result).toEqual([1, 1, 1, 1]);
        });

        test('should create 2D array of ones', () => {
            loadModule();
            const result = global.MATLAB_FUNCTIONS['ONES'](2, 3);
            expect(result).toEqual([[1, 1, 1], [1, 1, 1]]);
        });

        test('should throw error for invalid dimensions', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['ONES'](-1)).toThrow('ONES requires positive integer rows');
        });
    });

    describe('EYE function', () => {
        test('should create square identity matrix', () => {
            loadModule();
            const result = global.MATLAB_FUNCTIONS['EYE'](3);
            expect(result).toEqual([
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
            ]);
        });

        test('should create rectangular identity matrix', () => {
            loadModule();
            const result = global.MATLAB_FUNCTIONS['EYE'](2, 4);
            expect(result).toEqual([
                [1, 0, 0, 0],
                [0, 1, 0, 0]
            ]);
        });

        test('should throw error for invalid dimensions', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['EYE'](0)).toThrow('EYE requires positive integer dimension');
        });
    });

    describe('DIAG function', () => {
        test('should extract diagonal from matrix', () => {
            loadModule();
            const matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
            const result = global.MATLAB_FUNCTIONS['DIAG'](matrix);
            expect(result).toEqual([1, 5, 9]);
        });

        test('should create diagonal matrix from vector', () => {
            loadModule();
            const vector = [1, 2, 3];
            const result = global.MATLAB_FUNCTIONS['DIAG'](vector);
            expect(result).toEqual([
                [1, 0, 0],
                [0, 2, 0],
                [0, 0, 3]
            ]);
        });

        test('should throw error for non-array input', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['DIAG']('not an array')).toThrow('DIAG requires an array');
        });
    });

    describe('RESHAPE function', () => {
        test('should reshape 1D array to 2D', () => {
            loadModule();
            const array = [1, 2, 3, 4, 5, 6];
            const result = global.MATLAB_FUNCTIONS['RESHAPE'](array, 2, 3);
            expect(result).toEqual([[1, 2, 3], [4, 5, 6]]);
        });

        test('should reshape 2D array', () => {
            loadModule();
            const array = [[1, 2], [3, 4]];
            const result = global.MATLAB_FUNCTIONS['RESHAPE'](array, 1, 4);
            expect(result).toEqual([[1, 2, 3, 4]]);
        });

        test('should throw error for mismatched dimensions', () => {
            loadModule();
            const array = [1, 2, 3, 4];
            expect(() => global.MATLAB_FUNCTIONS['RESHAPE'](array, 2, 3)).toThrow('RESHAPE requires 6 elements, got 4');
        });

        test('should throw error for non-array input', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['RESHAPE']('not array', 2, 2)).toThrow('RESHAPE requires an array as first argument');
        });

        test('should throw error for invalid dimensions', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['RESHAPE']([1, 2], 0, 2)).toThrow('RESHAPE requires positive integer dimensions');
        });
    });

    describe('TRANSPOSE function', () => {
        test('should transpose a square matrix', () => {
            loadModule();
            const matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
            const result = global.MATLAB_FUNCTIONS['TRANSPOSE'](matrix);
            expect(result).toEqual([[1, 4, 7], [2, 5, 8], [3, 6, 9]]);
        });

        test('should transpose a rectangular matrix', () => {
            loadModule();
            const matrix = [[1, 2, 3], [4, 5, 6]];
            const result = global.MATLAB_FUNCTIONS['TRANSPOSE'](matrix);
            expect(result).toEqual([[1, 4], [2, 5], [3, 6]]);
        });

        test('should throw error for non-2D array', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['TRANSPOSE']([1, 2, 3])).toThrow('TRANSPOSE requires a 2D array');
        });
    });

    describe('SIZE function', () => {
        test('should return dimensions of 1D array', () => {
            loadModule();
            const array = [1, 2, 3, 4, 5];
            const result = global.MATLAB_FUNCTIONS['SIZE'](array);
            expect(result).toEqual([5]);
        });

        test('should return dimensions of 2D array', () => {
            loadModule();
            const array = [[1, 2, 3], [4, 5, 6]];
            const result = global.MATLAB_FUNCTIONS['SIZE'](array);
            expect(result).toEqual([2, 3]);
        });

        test('should return specific dimension for 2D array', () => {
            loadModule();
            const array = [[1, 2, 3], [4, 5, 6]];
            expect(global.MATLAB_FUNCTIONS['SIZE'](array, 1)).toBe(2);
            expect(global.MATLAB_FUNCTIONS['SIZE'](array, 2)).toBe(3);
        });

        test('should return specific dimension for 1D array', () => {
            loadModule();
            const array = [1, 2, 3, 4, 5];
            expect(global.MATLAB_FUNCTIONS['SIZE'](array, 1)).toBe(5);
        });

        test('should throw error for non-array', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['SIZE']('not array')).toThrow('SIZE requires an array');
        });

        test('should throw error for invalid dimension', () => {
            loadModule();
            const array = [[1, 2], [3, 4]];
            expect(() => global.MATLAB_FUNCTIONS['SIZE'](array, 3)).toThrow('SIZE dimension must be 1 or 2 for 2D arrays');
        });
    });

    describe('LENGTH function', () => {
        test('should return length of 1D array', () => {
            loadModule();
            const array = [1, 2, 3, 4, 5];
            expect(global.MATLAB_FUNCTIONS['LENGTH'](array)).toBe(5);
        });

        test('should return max dimension for 2D array', () => {
            loadModule();
            const array = [[1, 2, 3], [4, 5, 6]];
            expect(global.MATLAB_FUNCTIONS['LENGTH'](array)).toBe(3); // max(2, 3)
        });

        test('should throw error for non-array', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['LENGTH']('not array')).toThrow('LENGTH requires an array');
        });
    });

    describe('NUMEL function', () => {
        test('should return element count for 1D array', () => {
            loadModule();
            const array = [1, 2, 3, 4, 5];
            expect(global.MATLAB_FUNCTIONS['NUMEL'](array)).toBe(5);
        });

        test('should return element count for 2D array', () => {
            loadModule();
            const array = [[1, 2, 3], [4, 5, 6]];
            expect(global.MATLAB_FUNCTIONS['NUMEL'](array)).toBe(6);
        });

        test('should throw error for non-array', () => {
            loadModule();
            expect(() => global.MATLAB_FUNCTIONS['NUMEL']('not array')).toThrow('NUMEL requires an array');
        });
    });

    describe('PLOT function', () => {
        test('should return a valid SVG string for a valid data array', () => {
            loadModule();
            const data = '[1, 5, 3, 8, 2]';
            const result = global.MATLAB_FUNCTIONS['PLOT'](data);
            expect(result).toContain('<svg');
            expect(result).toContain('<polyline');
        });

        test('should throw an error for invalid JSON data', () => {
            loadModule();
            const data = '[1, 5, 3, 8,';
            expect(() => global.MATLAB_FUNCTIONS['PLOT'](data)).toThrow('Invalid data format. Please provide a valid JSON array string.');
        });

        test('should throw an error for non-array data', () => {
            loadModule();
            const data = '{"a": 1}';
            expect(() => global.MATLAB_FUNCTIONS['PLOT'](data)).toThrow('Data must be an array of numbers.');
        });

        test('should throw an error for an array with non-numeric values', () => {
            loadModule();
            const data = '[1, "a", 3]';
            expect(() => global.MATLAB_FUNCTIONS['PLOT'](data)).toThrow('Data must be an array of numbers.');
        });
    });
});
