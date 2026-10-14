const excelFunctions = require('../src/excel-functions');

describe('Excel Functions', () => {
  const table = [['Name', 'Age', 'City'], ['John', 30, 'New York'], ['Jane', 25, 'London'], ['Bob', 40, 'Paris']];

  describe('VLOOKUP', () => {
    test('should find the value in the table (exact match)', () => {
      expect(excelFunctions.VLOOKUP(table, 'Jane', 2, true)).toBe(25);
      expect(excelFunctions.VLOOKUP(table, 'Bob', 3, true)).toBe('Paris');
    });

    test('should find the value in the table (approximate match)', () => {
      expect(excelFunctions.VLOOKUP(table, 'J', 2, false)).toBe(30);
    });

    test('should return null if the value is not found', () => {
      expect(excelFunctions.VLOOKUP(table, 'Mike', 2, true)).toBeNull();
    });
  });

  describe('HLOOKUP', () => {
    const hTable = [['Name', 'John', 'Jane', 'Bob'], ['Age', 30, 25, 40], ['City', 'New York', 'London', 'Paris']];
    test('should find the value in the table (exact match)', () => {
      expect(excelFunctions.HLOOKUP(hTable, 'Jane', 2, true)).toBe(25);
      expect(excelFunctions.HLOOKUP(hTable, 'Bob', 3, true)).toBe('Paris');
    });

    test('should find the value in the table (approximate match)', () => {
      expect(excelFunctions.HLOOKUP(hTable, 'J', 2, false)).toBe(30);
    });

    test('should return null if the value is not found', () => {
      expect(excelFunctions.HLOOKUP(hTable, 'Mike', 2, true)).toBeNull();
    });
  });

  describe('INDEX', () => {
    test('should return the value at the specified row and column', () => {
      expect(excelFunctions.INDEX(table, 2, 3)).toBe('New York');
    });
  });

  describe('MATCH', () => {
    test('should return the position of the matched value', () => {
      expect(excelFunctions.MATCH(['John', 'Jane', 'Bob'], 'Jane', 0)).toBe(2);
    });
  });

  describe('CONCATENATE', () => {
    test('should concatenate the given values', () => {
      expect(excelFunctions.CONCATENATE('Hello', ' ', 'World')).toBe('Hello World');
    });
  });

  describe('LEFT', () => {
    test('should return the leftmost characters of a string', () => {
      expect(excelFunctions.LEFT('Hello', 3)).toBe('Hel');
    });
  });

  describe('RIGHT', () => {
    test('should return the rightmost characters of a string', () => {
      expect(excelFunctions.RIGHT('Hello', 3)).toBe('llo');
    });
  });

  describe('MID', () => {
    test('should return a substring from the middle of a string', () => {
      expect(excelFunctions.MID('Hello World', 7, 5)).toBe('World');
    });
  });

  describe('LEN', () => {
    test('should return the length of a string', () => {
      expect(excelFunctions.LEN('Hello')).toBe(5);
    });
  });

  describe('EXCEL_UPPER', () => {
    test('should convert a string to uppercase', () => {
      expect(excelFunctions.EXCEL_UPPER('Hello')).toBe('HELLO');
    });
  });

  describe('EXCEL_LOWER', () => {
    test('should convert a string to lowercase', () => {
      expect(excelFunctions.EXCEL_LOWER('Hello')).toBe('hello');
    });
  });

  describe('PROPER', () => {
    test('should capitalize the first letter of each word', () => {
      expect(excelFunctions.PROPER('hello world')).toBe('Hello World');
    });
  });

  describe('EXCEL_TRIM', () => {
    test('should remove leading and trailing spaces', () => {
      expect(excelFunctions.EXCEL_TRIM('  Hello  ')).toBe('Hello');
    });
  });

  describe('SUBSTITUTE', () => {
    test('should substitute text in a string', () => {
      expect(excelFunctions.SUBSTITUTE('Hello World', 'World', 'Universe')).toBe('Hello Universe');
    });
  });

  describe('TODAY', () => {
    test('should return the current date as an Excel serial number', () => {
      const excelToday = Math.floor(Date.now() / 86400000) + 25569;
      expect(excelFunctions.TODAY()).toBe(excelToday);
    });
  });

  describe('EXCEL_NOW', () => {
    test('should return the current date and time as an Excel serial number', () => {
      const excelNow = Date.now() / 86400000 + 25569;
      expect(excelFunctions.EXCEL_NOW()).toBeCloseTo(excelNow, 5);
    });
  });

  describe('YEAR', () => {
    test('should return the year from a date', () => {
      expect(excelFunctions.YEAR('2025-01-01')).toBe(2025);
    });
  });

  describe('MONTH', () => {
    test('should return the month from a date', () => {
      expect(excelFunctions.MONTH('2025-01-01')).toBe(1);
    });
  });

  describe('DAY', () => {
    test('should return the day from a date', () => {
      expect(excelFunctions.DAY('2025-01-01')).toBe(1);
    });
  });

  describe('WEEKDAY', () => {
    test('should return the weekday from a date', () => {
      expect(excelFunctions.WEEKDAY('2025-01-01', 1)).toBe(3); // Wednesday
    });
  });

  describe('PMT', () => {
    test('should calculate the payment for a loan', () => {
      expect(excelFunctions.PMT(0.08 / 12, 10, 10000)).toBeCloseTo(-1037.03, 2);
    });
  });

  describe('FV', () => {
    test('should calculate the future value of an investment', () => {
      expect(excelFunctions.FV(0.06 / 12, 10, -200, -500, 1)).toBeCloseTo(2581.40, 2);
    });
  });

  describe('PV', () => {
    test('should calculate the present value of an investment', () => {
      expect(excelFunctions.PV(0.08, 10, 500, 10000, 0)).toBeCloseTo(-7986.98, 2);
    });
  });

  describe('NPV', () => {
    test('should calculate the net present value of an investment', () => {
      expect(excelFunctions.NPV(0.1, -10000, 3000, 4200, 6800)).toBeCloseTo(1188.44, 2);
    });
  });

  describe('IRR', () => {
    test('should calculate the internal rate of return for a series of cash flows', () => {
      expect(excelFunctions.IRR([-100, 39, 59, 55, 20])).toBeCloseTo(0.28, 2);
    });
  });
});
