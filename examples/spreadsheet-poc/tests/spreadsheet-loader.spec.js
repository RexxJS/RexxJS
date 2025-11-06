/**
 * Tests for SpreadsheetLoader
 */

const SpreadsheetLoader = require('../spreadsheet-loader');

describe('SpreadsheetLoader', () => {
    describe('parseHashParameter', () => {
        test('parses simple sheet name', () => {
            const result = SpreadsheetLoader.parseHashParameter('Sheet1');
            expect(result).toEqual({ type: 'name', value: 'Sheet1' });
        });

        test('parses load= with relative path', () => {
            const result = SpreadsheetLoader.parseHashParameter('load=data/sheet.json');
            expect(result).toEqual({ type: 'url', value: 'data/sheet.json' });
        });

        test('parses load= with absolute path', () => {
            const result = SpreadsheetLoader.parseHashParameter('load=/data/sheet.json');
            expect(result).toEqual({ type: 'url', value: '/data/sheet.json' });
        });

        test('parses load= with HTTP URL', () => {
            const result = SpreadsheetLoader.parseHashParameter('load=http://example.com/sheet.json');
            expect(result).toEqual({ type: 'url', value: 'http://example.com/sheet.json' });
        });

        test('parses load= with HTTPS URL', () => {
            const result = SpreadsheetLoader.parseHashParameter('load=https://example.com/sheet.json');
            expect(result).toEqual({ type: 'url', value: 'https://example.com/sheet.json' });
        });

        test('handles empty hash', () => {
            const result = SpreadsheetLoader.parseHashParameter('');
            expect(result).toEqual({ type: 'name', value: 'Sheet1' });
        });

        test('handles null hash', () => {
            const result = SpreadsheetLoader.parseHashParameter(null);
            expect(result).toEqual({ type: 'name', value: 'Sheet1' });
        });
    });

    describe('validateSpreadsheetData', () => {
        test('validates valid data', () => {
            const data = {
                name: 'Test Sheet',
                version: '1.0',
                cells: {
                    A1: { value: '10', expression: null }
                },
                setupScript: 'LET X = 5',
                metadata: { rows: 100, cols: 26 }
            };

            const result = SpreadsheetLoader.validateSpreadsheetData(data);
            expect(result.name).toBe('Test Sheet');
            expect(result.version).toBe('1.0');
            expect(result.cells).toBeDefined();
            expect(result.setupScript).toBe('LET X = 5');
        });

        test('provides defaults for missing fields', () => {
            const data = { cells: {} };

            const result = SpreadsheetLoader.validateSpreadsheetData(data);
            expect(result.name).toBe('Untitled');
            expect(result.version).toBe('1.0');
            expect(result.setupScript).toBe('');
            expect(result.metadata).toEqual({});
        });

        test('throws error for invalid data', () => {
            expect(() => {
                SpreadsheetLoader.validateSpreadsheetData(null);
            }).toThrow('Invalid spreadsheet data');

            expect(() => {
                SpreadsheetLoader.validateSpreadsheetData('not an object');
            }).toThrow('Invalid spreadsheet data');
        });

        test('throws error for invalid cells', () => {
            expect(() => {
                SpreadsheetLoader.validateSpreadsheetData({ cells: 'not an object' });
            }).toThrow('Invalid cells data');
        });
    });

    describe('exportModelData', () => {
        // Mock SpreadsheetModel
        const mockModel = {
            rows: 100,
            cols: 26,
            setupScript: 'LET TAX = 0.08',
            cells: new Map([
                ['A1', { value: '10', expression: null, format: null, comment: null }],
                ['A2', { value: '20', expression: 'A1 * 2', format: '$0.00', comment: 'Double' }],
                ['B1', { value: '', expression: null, format: null, comment: null }] // Empty cell - should be excluded
            ])
        };

        test('exports model data correctly', () => {
            const result = SpreadsheetLoader.exportModelData(mockModel, 'Test Export');

            expect(result.name).toBe('Test Export');
            expect(result.version).toBe('1.0');
            expect(result.setupScript).toBe('LET TAX = 0.08');
            expect(result.cells).toBeDefined();
            expect(result.cells.A1).toEqual({
                value: '10',
                expression: null,
                format: null,
                comment: null
            });
            expect(result.cells.A2).toEqual({
                value: '20',
                expression: 'A1 * 2',
                format: '$0.00',
                comment: 'Double'
            });
            expect(result.cells.B1).toBeUndefined(); // Empty cell not exported
            expect(result.metadata.rows).toBe(100);
            expect(result.metadata.cols).toBe(26);
        });

        test('handles default name', () => {
            const result = SpreadsheetLoader.exportModelData({ ...mockModel, cells: new Map() });
            expect(result.name).toBe('Untitled');
        });
    });
});
