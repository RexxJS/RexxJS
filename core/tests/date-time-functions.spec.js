/**
 * Date Time Functions Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { dateTimeFunctions } = require('../src/date-time-functions');

describe('Date Time Functions', () => {

  describe('DATE', () => {
    test('should return current date in default format', () => {
      const result = dateTimeFunctions.DATE();
      expect(result).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/); // Classic REXX: "DD Mon YYYY"
    });

    test('should return date in sortable format', () => {
      const result = dateTimeFunctions.DATE('S');
      expect(result).toMatch(/^\d{8}$/); // YYYYMMDD format
    });
  });

  describe('TIME', () => {
    test('should return current time in default format', () => {
      const result = dateTimeFunctions.TIME();
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/); // HH:MM:SS format
    });
  });

  describe('NOW', () => {
    test('should return current datetime in ISO format', () => {
      const result = dateTimeFunctions.NOW();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
    });

    test('should return current datetime in custom format', () => {
      const result = dateTimeFunctions.NOW('UTC', 'YYYY-MM-DD HH:MM:SS');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('NOW_TIMESTAMP', () => {
    test('should return current timestamp', () => {
      const result = dateTimeFunctions.NOW_TIMESTAMP();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(1600000000000); // After year 2020
      expect(result).toBeLessThan(Date.now() + 1000); // Within reasonable range
    });
  });

  describe('DATE_ADD', () => {
    test('should add days to date', () => {
      const result = dateTimeFunctions.DATE_ADD('2023-01-01', 10);
      expect(result).toMatch(/2023-01-11/);
    });

    test('should add months and years', () => {
      const result = dateTimeFunctions.DATE_ADD('2023-01-01', 0, 1, 1); // +1 month, +1 year
      expect(result).toMatch(/2024-02-01/);
    });

    test('should handle complex date additions', () => {
      const result = dateTimeFunctions.DATE_ADD('2023-01-01', 5, 2, 1, 12, 30, 45);
      expect(result).toContain('2024-03-06'); // 1 year, 2 months, 5 days later
    });
  });

  describe('DATE_SUB', () => {
    test('should subtract days from date', () => {
      const result = dateTimeFunctions.DATE_SUB('2023-01-15', 10);
      expect(result).toMatch(/2023-01-05/);
    });

    test('should subtract months and years', () => {
      const result = dateTimeFunctions.DATE_SUB('2023-03-01', 0, 1, 1); // -1 month, -1 year
      expect(result).toMatch(/2022-02-01/);
    });
  });

  describe('DATE_DIFF', () => {
    test('should calculate difference in days', () => {
      const result = dateTimeFunctions.DATE_DIFF('2023-01-01', '2023-01-11');
      expect(result).toBe(10);
    });

    test('should calculate difference in different units', () => {
      const hoursDiff = dateTimeFunctions.DATE_DIFF('2023-01-01T00:00:00', '2023-01-01T12:00:00', 'hours');
      expect(hoursDiff).toBe(12);

      const minutesDiff = dateTimeFunctions.DATE_DIFF('2023-01-01T00:00:00', '2023-01-01T00:30:00', 'minutes');
      expect(minutesDiff).toBe(30);
    });

    test('should handle negative differences', () => {
      const result = dateTimeFunctions.DATE_DIFF('2023-01-15', '2023-01-01');
      expect(result).toBe(-14);
    });
  });

  describe('DATE_PARSE', () => {
    test('should parse ISO date string', () => {
      const result = dateTimeFunctions.DATE_PARSE('2023-01-01T12:00:00Z');
      expect(result).toBeInstanceOf(Date);
    });

    test('should parse various date formats', () => {
      const formats = [
        '2023-01-01',
        '01/01/2023', 
        'January 1, 2023'
      ];

      formats.forEach(dateStr => {
        const result = dateTimeFunctions.DATE_PARSE(dateStr);
        expect(result).toBeInstanceOf(Date);
      });
    });
  });

  describe('DATE_VALID', () => {
    test('should validate valid dates', () => {
      const validDates = [
        '2023-01-01',
        '2023-12-31T23:59:59Z',
        'January 1, 2023',
        '01/01/2023'
      ];

      validDates.forEach(dateStr => {
        const result = dateTimeFunctions.DATE_VALID(dateStr);
        expect(result).toBe(true);
      });
    });

    test('should reject invalid dates', () => {
      const invalidDates = [
        '2023-13-01', // Invalid month
        '2023-01-32', // Invalid day
        'not a date',
        '',
        null
      ];

      invalidDates.forEach(dateStr => {
        const result = dateTimeFunctions.DATE_VALID(dateStr);
        expect(result).toBe(false);
      });
    });
  });

  describe('DATE_FORMAT', () => {
    test('should format date in ISO format', () => {
      const result = dateTimeFunctions.DATE_FORMAT('2023-01-15T10:30:45Z', 'ISO');
      expect(result).toMatch(/2023-01-15/);
    });

    test('should format date in custom formats', () => {
      const testDate = '2023-01-15T10:30:45Z';
      
      const usFormat = dateTimeFunctions.DATE_FORMAT(testDate, 'US');
      expect(usFormat).toMatch(/1\/15\/2023/);
      
      const euroFormat = dateTimeFunctions.DATE_FORMAT(testDate, 'EU');
      expect(euroFormat).toMatch(/15\/0?1\/2023/);
    });
  });

  describe('TIME_FORMAT', () => {
    test('should format time in 24-hour format', () => {
      const result = dateTimeFunctions.TIME_FORMAT('2023-01-15T15:30:45Z', '24');
      expect(result).toMatch(/15:30:45/);
    });

    test('should format time in 12-hour format', () => {
      const result = dateTimeFunctions.TIME_FORMAT('2023-01-15T15:30:45Z', '12');
      expect(result).toMatch(/3:30:45 PM/);
    });
  });

  describe('DATE_SUBTRACT', () => {
    test('should subtract days from date', () => {
      const result = dateTimeFunctions.DATE_SUBTRACT('2023-01-15', 5, 'days');
      expect(result).toMatch(/2023-01-10/);
    });

    test('should subtract months from date', () => {
      const result = dateTimeFunctions.DATE_SUBTRACT('2023-03-15', 2, 'months');
      expect(result).toMatch(/2023-01-15/);
    });
  });

  describe('DATE_PARSE_DETAILS', () => {
    test('should parse date details', () => {
      const result = dateTimeFunctions.DATE_PARSE_DETAILS('2023-01-15T10:30:45Z');
      expect(result).toHaveProperty('year', 2023);
      expect(result).toHaveProperty('month', 1);
      expect(result).toHaveProperty('day', 15);
      expect(result).toHaveProperty('hour', 10);
      expect(result).toHaveProperty('minute', 30);
      expect(result).toHaveProperty('second', 45);
    });
  });

  describe('DATE_CREATE', () => {
    test('should create date from components', () => {
      const result = dateTimeFunctions.DATE_CREATE(2023, 1, 15, 10, 30, 45);
      expect(result).toMatch(/2023-01-15T10:30:45/);
    });

    test('should create date with default time', () => {
      const result = dateTimeFunctions.DATE_CREATE(2023, 6, 20);
      expect(result).toMatch(/2023-06-[12]\dT/); // Handle timezone differences
    });
  });

  describe('DATE_IS_WEEKEND', () => {
    test('should detect weekend days', () => {
      // Saturday
      const saturday = dateTimeFunctions.DATE_IS_WEEKEND('2023-01-14');
      expect(saturday).toBe(true);
      
      // Sunday  
      const sunday = dateTimeFunctions.DATE_IS_WEEKEND('2023-01-15');
      expect(sunday).toBe(true);
      
      // Monday
      const monday = dateTimeFunctions.DATE_IS_WEEKEND('2023-01-16');
      expect(monday).toBe(false);
    });
  });

  describe('DATE_IS_BUSINESS_DAY', () => {
    test('should detect business days', () => {
      // Monday (business day)
      const monday = dateTimeFunctions.DATE_IS_BUSINESS_DAY('2023-01-16');
      expect(monday).toBe(true);
      
      // Saturday (not business day)
      const saturday = dateTimeFunctions.DATE_IS_BUSINESS_DAY('2023-01-14');
      expect(saturday).toBe(false);
    });
  });

  describe('DATE_NEXT_BUSINESS_DAY', () => {
    test('should find next business day', () => {
      // Friday -> Monday
      const result = dateTimeFunctions.DATE_NEXT_BUSINESS_DAY('2023-01-13');
      expect(result).toMatch(/2023-01-16/);
    });
  });

  describe('DATE_AGE', () => {
    test('should calculate age', () => {
      const result = dateTimeFunctions.DATE_AGE('1990-01-01', '2023-01-01');
      expect(result).toBe(33);
    });

    test('should use current date as reference when not provided', () => {
      const result = dateTimeFunctions.DATE_AGE('2000-01-01');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(20);
    });
  });

  describe('DATE_QUARTER', () => {
    test('should return correct quarter', () => {
      expect(dateTimeFunctions.DATE_QUARTER('2023-01-15')).toBe(1);
      expect(dateTimeFunctions.DATE_QUARTER('2023-04-15')).toBe(2);
      expect(dateTimeFunctions.DATE_QUARTER('2023-07-15')).toBe(3);
      expect(dateTimeFunctions.DATE_QUARTER('2023-10-15')).toBe(4);
    });
  });

  describe('DATE_WEEK_NUMBER', () => {
    test('should return week number', () => {
      const result = dateTimeFunctions.DATE_WEEK_NUMBER('2023-01-15');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(53);
    });
  });

  describe('Extended DATE() with Timezone & Locale', () => {
    test('should return date with specified timezone', () => {
      const result = dateTimeFunctions.DATE('N', 'UTC');
      expect(result).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/);
    });

    test('should return date with different timezone', () => {
      // Should not throw for valid IANA timezone
      const result = dateTimeFunctions.DATE('N', 'America/New_York');
      expect(result).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/);
    });

    test('should return date with locale-aware month names (French)', () => {
      const result = dateTimeFunctions.DATE('N', 'UTC', 'fr-FR');
      // French month names are lowercase and may contain periods: "oct.", "avr.", etc.
      expect(result).toMatch(/^ {0,2}\d{1,2}\s+[a-z]+\.?\s+\d{4}$/);
    });

    test('should return date with locale-aware month names (German)', () => {
      const result = dateTimeFunctions.DATE('N', 'UTC', 'de-DE');
      // German month names: Jan, Feb, Mär, Apr, Mai, Jun, Jul, Aug, Sep, Okt, Nov, Dez
      expect(result).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2,3}\.?\s+\d{4}$/);
    });

    test('should return date with locale-aware month names (Spanish)', () => {
      const result = dateTimeFunctions.DATE('N', 'UTC', 'es-ES');
      // Spanish month names are lowercase: enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre
      expect(result).toMatch(/^ {0,2}\d{1,2}\s+[a-z]+\.?\s+\d{4}$/);
    });

    test('should handle timezone with all format codes', () => {
      // Test 'S' format with timezone
      const sortable = dateTimeFunctions.DATE('S', 'America/Los_Angeles');
      expect(sortable).toMatch(/^\d{8}$/);

      // Test 'D' format with timezone
      const ddmmyy = dateTimeFunctions.DATE('D', 'Europe/London');
      expect(ddmmyy).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);

      // Test 'W' format with timezone
      const dow = dateTimeFunctions.DATE('W', 'Asia/Tokyo');
      expect(dow).toMatch(/^[0-6]$/);
    });

    test('should throw error for invalid timezone', () => {
      expect(() => {
        dateTimeFunctions.DATE('N', 'InvalidTimeZone/None');
      }).toThrow('Invalid timezone');
    });

    test('should throw error for unsupported locale', () => {
      expect(() => {
        dateTimeFunctions.DATE('N', 'UTC', 'invalid-locale-code');
      }).toThrow('Unsupported locale');
    });
  });

  describe('Extended TIME() with Timezone & Locale', () => {
    test('should return time with specified timezone', () => {
      const result = dateTimeFunctions.TIME('N', 'UTC');
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    test('should return time with different timezone', () => {
      // Should not throw for valid IANA timezone
      const result = dateTimeFunctions.TIME('N', 'America/New_York');
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    test('should return seconds with timezone', () => {
      const result = dateTimeFunctions.TIME('S', 'UTC');
      // Should be a number between 0 and 86400 (seconds in a day)
      expect(parseInt(result)).toBeGreaterThanOrEqual(0);
      expect(parseInt(result)).toBeLessThan(86400);
    });

    test('should handle all format codes with timezone', () => {
      // Test 'N' format with timezone
      const normal = dateTimeFunctions.TIME('N', 'Europe/Paris');
      expect(normal).toMatch(/^\d{2}:\d{2}:\d{2}$/);

      // Test 'S' format with timezone
      const seconds = dateTimeFunctions.TIME('S', 'Asia/Tokyo');
      expect(seconds).toMatch(/^\d+$/);

      // Test 'L' format with timezone
      const microseconds = dateTimeFunctions.TIME('L', 'Australia/Sydney');
      expect(microseconds).toMatch(/^\d+$/);
    });

    test('should throw error for invalid timezone', () => {
      expect(() => {
        dateTimeFunctions.TIME('N', 'NotATimeZone');
      }).toThrow('Invalid timezone');
    });

    test('should throw error for unsupported locale', () => {
      expect(() => {
        dateTimeFunctions.TIME('N', 'UTC', 'not-a-valid-bcp47-locale');
      }).toThrow('Unsupported locale');
    });
  });

  describe('Timezone & Locale Consistency', () => {
    test('should return consistent formats across different timezones', () => {
      const utcDate = dateTimeFunctions.DATE('N', 'UTC');
      const nyDate = dateTimeFunctions.DATE('N', 'America/New_York');
      const tokyoDate = dateTimeFunctions.DATE('N', 'Asia/Tokyo');

      // All should match the pattern, even if values differ
      expect(utcDate).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/);
      expect(nyDate).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/);
      expect(tokyoDate).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/);
    });

    test('should return consistent formats across different locales', () => {
      const enDate = dateTimeFunctions.DATE('N', 'UTC', 'en-US');
      const frDate = dateTimeFunctions.DATE('N', 'UTC', 'fr-FR');
      const deDate = dateTimeFunctions.DATE('N', 'UTC', 'de-DE');
      const esDate = dateTimeFunctions.DATE('N', 'UTC', 'es-ES');

      // All should match their respective locale patterns
      expect(enDate).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/);  // English: Oct
      expect(frDate).toMatch(/^ {0,2}\d{1,2}\s+[a-z]+\.?\s+\d{4}$/);      // French: oct. or octobre
      expect(deDate).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2,3}\.?\s+\d{4}$/); // German: Okt or Oktober
      expect(esDate).toMatch(/^ {0,2}\d{1,2}\s+[a-z]+\.?\s+\d{4}$/);      // Spanish: octubre
    });

    test('should support multiple locales with multiple timezones', () => {
      const combinations = [
        ['N', 'UTC', 'en-US'],
        ['N', 'America/New_York', 'fr-FR'],
        ['N', 'Europe/London', 'de-DE'],
        ['N', 'Asia/Tokyo', 'ja-JP'],
        ['S', 'Australia/Sydney', 'en-AU'],
      ];

      combinations.forEach(([format, tz, locale]) => {
        const result = dateTimeFunctions.DATE(format, tz, locale);
        if (format === 'S') {
          expect(result).toMatch(/^\d{8}$/);
        } else {
          expect(result).toBeDefined();
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid dates by throwing errors', () => {
      expect(() => dateTimeFunctions.DATE_ADD('invalid-date', 1)).toThrow();

      // DATE_DIFF returns 0 for invalid dates rather than throwing
      const result = dateTimeFunctions.DATE_DIFF('invalid', 'dates');
      expect(result).toBe(0);
    });

    test('should handle edge cases', () => {
      // Leap year
      const leapYear = dateTimeFunctions.DATE_ADD('2024-02-28', 1);
      expect(leapYear).toMatch(/2024-02-29/);
      
      // Month overflow (JavaScript Date handles this by going to next month)
      const monthOverflow = dateTimeFunctions.DATE_ADD('2023-01-31', 0, 1);
      expect(monthOverflow).toMatch(/2023-0[23]/); // Could be Feb or Mar depending on implementation
    });
  });

  describe('Integration Tests', () => {
    test('should handle full date workflow', () => {
      // Get current timestamp
      const timestamp = dateTimeFunctions.NOW_TIMESTAMP();
      expect(typeof timestamp).toBe('number');

      // Add time to current date
      const currentDate = dateTimeFunctions.DATE();
      const futureDate = dateTimeFunctions.DATE_ADD(currentDate, 30); // 30 days later
      
      // Calculate difference
      const diff = dateTimeFunctions.DATE_DIFF(currentDate, futureDate);
      expect(diff).toBe(30);

      // Validate the future date
      const isValid = dateTimeFunctions.DATE_VALID(futureDate);
      expect(isValid).toBe(true);
    });

    test('should handle timezone consistency', () => {
      const utcDate = dateTimeFunctions.DATE();
      const utcTime = dateTimeFunctions.TIME();

      expect(utcDate).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/); // Classic REXX format
      expect(utcTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);

      // The classic REXX date format won't directly parse as a date string, but the time should
      expect(dateTimeFunctions.DATE_VALID(utcTime)).toBe(false); // Time strings aren't valid dates
    });

    test('should handle complex date operations workflow', () => {
      const testDate = '2023-01-15';
      
      // Test business day operations
      const isBusinessDay = dateTimeFunctions.DATE_IS_BUSINESS_DAY(testDate);
      const nextBusinessDay = dateTimeFunctions.DATE_NEXT_BUSINESS_DAY(testDate);
      
      expect(typeof isBusinessDay).toBe('boolean');
      expect(nextBusinessDay).toBeDefined();
      
      // Test age and quarter calculations
      const age = dateTimeFunctions.DATE_AGE('1990-01-01', testDate);
      const quarter = dateTimeFunctions.DATE_QUARTER(testDate);
      
      expect(age).toBe(33);
      expect(quarter).toBe(1);
      
      // Test formatting operations
      const formatted = dateTimeFunctions.DATE_FORMAT(testDate, 'US');
      const details = dateTimeFunctions.DATE_PARSE_DETAILS(testDate);
      
      expect(formatted).toMatch(/1\/15\/2023/);
      expect(details.year).toBe(2023);
      expect(details.month).toBe(1);
      expect(details.day).toBe(15);
    });
  });
});