/**
 * SpreadsheetModel Tests
 *
 * Tests for the core spreadsheet model without DOM dependencies.
 */

const SpreadsheetModel = require('../spreadsheet-model');

describe('SpreadsheetModel', () => {
    let model;

    beforeEach(() => {
        model = new SpreadsheetModel(100, 26);
    });

    describe('Column letter conversion', () => {
        it('should convert column letters to numbers', () => {
            expect(SpreadsheetModel.colLetterToNumber('A')).toBe(1);
            expect(SpreadsheetModel.colLetterToNumber('B')).toBe(2);
            expect(SpreadsheetModel.colLetterToNumber('Z')).toBe(26);
            expect(SpreadsheetModel.colLetterToNumber('AA')).toBe(27);
            expect(SpreadsheetModel.colLetterToNumber('AB')).toBe(28);
            expect(SpreadsheetModel.colLetterToNumber('AZ')).toBe(52);
            expect(SpreadsheetModel.colLetterToNumber('BA')).toBe(53);
        });

        it('should convert column numbers to letters', () => {
            expect(SpreadsheetModel.colNumberToLetter(1)).toBe('A');
            expect(SpreadsheetModel.colNumberToLetter(2)).toBe('B');
            expect(SpreadsheetModel.colNumberToLetter(26)).toBe('Z');
            expect(SpreadsheetModel.colNumberToLetter(27)).toBe('AA');
            expect(SpreadsheetModel.colNumberToLetter(28)).toBe('AB');
            expect(SpreadsheetModel.colNumberToLetter(52)).toBe('AZ');
            expect(SpreadsheetModel.colNumberToLetter(53)).toBe('BA');
        });

        it('should round-trip column conversions', () => {
            for (let i = 1; i <= 100; i++) {
                const letter = SpreadsheetModel.colNumberToLetter(i);
                const number = SpreadsheetModel.colLetterToNumber(letter);
                expect(number).toBe(i);
            }
        });
    });

    describe('Cell reference parsing', () => {
        it('should parse valid cell references', () => {
            const ref1 = SpreadsheetModel.parseCellRef('A1');
            expect(ref1.col).toBe('A');
            expect(ref1.row).toBe(1);

            const ref2 = SpreadsheetModel.parseCellRef('B10');
            expect(ref2.col).toBe('B');
            expect(ref2.row).toBe(10);

            const ref3 = SpreadsheetModel.parseCellRef('AA99');
            expect(ref3.col).toBe('AA');
            expect(ref3.row).toBe(99);
        });

        it('should throw error for invalid cell references', () => {
            expect(() => SpreadsheetModel.parseCellRef('1A')).toThrow();
            expect(() => SpreadsheetModel.parseCellRef('A')).toThrow();
            expect(() => SpreadsheetModel.parseCellRef('123')).toThrow();
            expect(() => SpreadsheetModel.parseCellRef('')).toThrow();
        });

        it('should format cell references', () => {
            expect(SpreadsheetModel.formatCellRef('A', 1)).toBe('A1');
            expect(SpreadsheetModel.formatCellRef('Z', 99)).toBe('Z99');
            expect(SpreadsheetModel.formatCellRef('AA', 10)).toBe('AA10');
            expect(SpreadsheetModel.formatCellRef(1, 1)).toBe('A1');
            expect(SpreadsheetModel.formatCellRef(26, 99)).toBe('Z99');
        });
    });

    describe('Cell value operations', () => {
        it('should store and retrieve literal values', () => {
            model.setCell('A1', '10');
            expect(model.getCellValue('A1')).toBe('10');

            model.setCell('B2', 'Hello');
            expect(model.getCellValue('B2')).toBe('Hello');
        });

        it('should return empty string for unset cells', () => {
            expect(model.getCellValue('A1')).toBe('');
            expect(model.getCellValue('Z99')).toBe('');
        });

        it('should clear cells when set to empty', () => {
            model.setCell('A1', '10');
            expect(model.getCellValue('A1')).toBe('10');

            model.setCell('A1', '');
            expect(model.getCellValue('A1')).toBe('');

            model.setCell('A1', null);
            expect(model.getCellValue('A1')).toBe('');
        });

        it('should distinguish between value and expression', () => {
            model.setCell('A1', '10');
            const cell1 = model.getCell('A1');
            expect(cell1.value).toBe('10');
            expect(cell1.expression).toBeNull();

            model.setCell('A2', '=A1 + 5');
            const cell2 = model.getCell('A2');
            expect(cell2.expression).toBe('A1 + 5');
        });
    });

    describe('Expression detection', () => {
        it('should detect expressions starting with =', () => {
            model.setCell('A1', '=10 + 20');
            const cell = model.getCell('A1');
            expect(cell.expression).toBe('10 + 20');
        });

        it('should trim whitespace around =', () => {
            model.setCell('A1', '  = 10 + 20  ');
            const cell = model.getCell('A1');
            expect(cell.expression).toBe('10 + 20');
        });

        it('should not treat = in middle of string as expression', () => {
            model.setCell('A1', 'x=10');
            const cell = model.getCell('A1');
            expect(cell.value).toBe('x=10');
            expect(cell.expression).toBeNull();
        });
    });

    describe('Cell reference extraction', () => {
        it('should extract cell references from expressions', () => {
            const refs1 = model.extractCellReferences('A1 + B2');
            expect(refs1).toEqual(['A1', 'B2']);

            const refs2 = model.extractCellReferences('SUM(A1, A2, A3)');
            expect(refs2).toEqual(['A1', 'A2', 'A3']);

            const refs3 = model.extractCellReferences('A1 + A1 + B1');
            expect(refs3).toEqual(['A1', 'B1']); // Duplicates removed
        });

        it('should handle multi-letter column references', () => {
            const refs = model.extractCellReferences('AA10 + AB20 + Z99');
            expect(refs).toEqual(['AA10', 'AB20', 'Z99']);
        });

        it('should return empty array for expressions with no references', () => {
            const refs = model.extractCellReferences('10 + 20');
            expect(refs).toEqual([]);
        });

        it('should not extract partial matches', () => {
            const refs = model.extractCellReferences('BA1D + A1');
            // BA1D should not match, but A1 should
            expect(refs).toContain('A1');
            expect(refs).not.toContain('BA1D');
        });
    });

    describe('JSON export/import', () => {
        it('should export cells to JSON', () => {
            model.setCell('A1', '10');
            model.setCell('A2', '20');
            model.setCell('A3', '=A1 + A2');

            const json = model.toJSON();
            expect(json.A1).toBe('10');
            expect(json.A2).toBe('20');
            expect(json.A3).toBe('=A1 + A2');
        });

        it('should import cells from JSON', () => {
            const data = {
                'A1': '10',
                'B1': 'Hello',
                'C1': '=A1 + 5'
            };

            model.fromJSON(data);

            expect(model.getCellValue('A1')).toBe('10');
            expect(model.getCellValue('B1')).toBe('Hello');
            expect(model.getCell('C1').expression).toBe('A1 + 5');
        });

        it('should clear model before import', () => {
            model.setCell('A1', '999');
            model.setCell('B1', '888');

            model.fromJSON({ 'C1': '777' });

            expect(model.getCellValue('A1')).toBe('');
            expect(model.getCellValue('B1')).toBe('');
            expect(model.getCellValue('C1')).toBe('777');
        });
    });

    describe('Get all cells', () => {
        it('should return all non-empty cells', () => {
            model.setCell('A1', '10');
            model.setCell('B2', 'Hello');
            model.setCell('C3', '=A1 + 5');

            const cells = model.getAllCells();
            expect(cells).toHaveLength(3);

            const refs = cells.map(c => c.ref).sort();
            expect(refs).toEqual(['A1', 'B2', 'C3']);
        });

        it('should not include cleared cells', () => {
            model.setCell('A1', '10');
            model.setCell('A2', '20');
            model.setCell('A1', ''); // Clear A1

            const cells = model.getAllCells();
            expect(cells).toHaveLength(1);
            expect(cells[0].ref).toBe('A2');
        });
    });

    describe('Cell addressing with objects', () => {
        it('should accept {col, row} objects for getCell', () => {
            model.setCell('A1', '10');
            const cell = model.getCell({ col: 'A', row: 1 });
            expect(cell.value).toBe('10');
        });

        it('should accept {col, row} objects for setCell', () => {
            model.setCell({ col: 'B', row: 2 }, 'Hello');
            expect(model.getCellValue('B2')).toBe('Hello');
        });

        it('should accept numeric column in objects', () => {
            model.setCell({ col: 1, row: 1 }, 'Test');
            expect(model.getCellValue('A1')).toBe('Test');
        });
    });
});
