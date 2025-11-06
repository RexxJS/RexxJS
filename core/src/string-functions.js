/**
 * String manipulation functions for REXX interpreter
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const stringFunctions = {
  'UPPER': (str) => {
    if (typeof str !== 'string') str = String(str);
    return str.toUpperCase();
  },

  'LOWER': (str) => {
    if (typeof str !== 'string') str = String(str);
    return str.toLowerCase();
  },

  'LENGTH': (str) => {
    // Handle arrays directly without converting to strings
    if (Array.isArray(str)) {
      return str.length;
    }
    // Handle objects (return number of properties)
    if (typeof str === 'object' && str !== null) {
      return Object.keys(str).length;
    }
    // For strings and other types, convert to string and return length
    if (typeof str !== 'string') str = String(str);
    return str.length;
  },

  'SUBSTR': (strOrParams, start, length) => {
    // Handle both unified parameter model and positional arguments
    // If first arg is an object with 'string' property, it's the new unified model
    let str, actualStart, actualLength;

    if (typeof strOrParams === 'object' && strOrParams !== null && 'string' in strOrParams) {
      // Unified parameter model: { string, start, length }
      str = strOrParams.string;
      actualStart = strOrParams.start;
      actualLength = strOrParams.length;
    } else {
      // Positional arguments (backward compatible)
      str = strOrParams;
      actualStart = start;
      actualLength = length;
    }

    if (typeof str !== 'string') str = String(str);
    const startPos = Math.max(0, (parseInt(actualStart) || 1) - 1); // Convert 1-based to 0-based
    if (actualLength === undefined) {
      return str.substring(startPos);
    } else {
      const len = parseInt(actualLength) || 0;
      return str.substring(startPos, startPos + len);
    }
  },

  'POS': (string, needle, start = 1) => {
    if (typeof string !== 'string') string = String(string);
    if (typeof needle !== 'string') needle = String(needle);
    const startPos = Math.max(0, (parseInt(start) || 1) - 1); // Convert 1-based to 0-based
    const pos = string.indexOf(needle, startPos);
    return pos === -1 ? 0 : pos + 1; // Convert 0-based to 1-based, 0 means not found
  },

  'INDEX': (string, needle, start = 1) => {
    // INDEX is an alias for POS - finds the position of a substring
    if (typeof string !== 'string') string = String(string);
    if (typeof needle !== 'string') needle = String(needle);
    const startPos = Math.max(0, (parseInt(start) || 1) - 1); // Convert 1-based to 0-based
    const pos = string.indexOf(needle, startPos);
    return pos === -1 ? 0 : pos + 1; // Convert 0-based to 1-based, 0 means not found
  },

  'ABBREV': (string, abbrev, length = 1) => {
    try {
      const str = String(string).toUpperCase();
      const abbr = String(abbrev).toUpperCase();
      const minLen = parseInt(length) || 1;

      // Check if abbrev is long enough
      if (abbr.length < minLen) {
        return 0;
      }

      // Check if string starts with abbrev
      if (str.startsWith(abbr)) {
        return 1;
      }

      return 0;
    } catch (e) {
      return 0;
    }
  },

  'TRIM': (string) => {
    try {
      return String(string).trim();
    } catch (e) {
      return '';
    }
  },
  
  'TRIM_START': (string) => {
    try {
      return String(string).trimStart();
    } catch (e) {
      return '';
    }
  },
  
  'TRIM_END': (string) => {
    try {
      return String(string).trimEnd();
    } catch (e) {
      return '';
    }
  },
  
  'STRIP': (string, option = 'BOTH', character = ' ') => {
    try {
      const str = String(string);
      const char = String(character);
      const opt = String(option).toUpperCase();
      
      // Escape special regex characters
      const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      switch (opt) {
        case 'LEADING':
        case 'L':
          return str.replace(new RegExp(`^[${escapedChar}]+`), '');
        case 'TRAILING':  
        case 'T':
          return str.replace(new RegExp(`[${escapedChar}]+$`), '');
        case 'BOTH':
        case 'B':
        default:
          return str.replace(new RegExp(`^[${escapedChar}]+|[${escapedChar}]+$`, 'g'), '');
      }
    } catch (e) {
      return '';
    }
  },
  
  'REVERSE': (string) => {
    try {
      return String(string).split('').reverse().join('');
    } catch (e) {
      return '';
    }
  },
  
  'SPACE': (string, n = 1, pad = ' ') => {
    try {
      const str = String(string).trim();
      let count = parseInt(n);
      // Handle NaN, undefined, null cases - default to 1
      if (isNaN(count)) count = 1;
      // Handle negative values - make them 0
      count = Math.max(0, count);
      
      const padChar = String(pad);
      
      // Split by any whitespace, filter out empty strings
      const words = str.split(/\s+/).filter(word => word.length > 0);
      
      // If no words, return empty string
      if (words.length === 0) return '';
      
      // Join with specified padding (or no padding if count is 0)
      return words.join(count === 0 ? '' : padChar.repeat(count));
    } catch (e) {
      return '';
    }
  },

  'WORD': (string, n) => {
    try {
      const str = String(string).trim();
      let wordNum = parseInt(n);
      
      // Handle NaN case - default to 1
      if (isNaN(wordNum)) wordNum = 1;
      
      if (wordNum < 1) return '';
      
      // Split by whitespace and filter out empty strings
      const words = str.split(/\s+/).filter(word => word.length > 0);
      
      // Return the nth word (1-based index)
      if (wordNum <= words.length) {
        return words[wordNum - 1];
      }
      
      return '';
    } catch (e) {
      return '';
    }
  },
  
  'WORDS': (string) => {
    try {
      const str = String(string).trim();
      
      if (str === '') return 0;
      
      // Split by whitespace and filter out empty strings
      const words = str.split(/\s+/).filter(word => word.length > 0);
      
      return words.length;
    } catch (e) {
      return 0;
    }
  },
  
  'WORDPOS': (string, phrase, start = 1) => {
    try {
      const str = String(string).trim();
      const phraseStr = String(phrase).trim();
      const startPos = Math.max(1, parseInt(start) || 1);

      if (phraseStr === '' || str === '') return 0;

      // Split both phrase and string into words
      const phraseWords = phraseStr.split(/\s+/).filter(word => word.length > 0);
      const stringWords = str.split(/\s+/).filter(word => word.length > 0);

      if (phraseWords.length === 0 || stringWords.length === 0) return 0;

      // Search starting from the specified position (1-based)
      for (let i = startPos - 1; i <= stringWords.length - phraseWords.length; i++) {
        let match = true;

        // Check if all words in phrase match at this position
        for (let j = 0; j < phraseWords.length; j++) {
          if (stringWords[i + j] !== phraseWords[j]) {
            match = false;
            break;
          }
        }

        if (match) {
          return i + 1; // Convert back to 1-based index
        }
      }

      return 0; // Not found
    } catch (e) {
      return 0;
    }
  },
  
  'DELWORD': (string, start, length = null) => {
    try {
      const str = String(string).trim();
      let startPos = parseInt(start);
      if (isNaN(startPos)) startPos = 1;
      
      if (str === '' || startPos < 1) return str;
      
      // Split into words
      const words = str.split(/\s+/).filter(word => word.length > 0);
      
      if (startPos > words.length) return str;
      
      // Determine how many words to delete
      let deleteCount;
      if (length === null || length === undefined) {
        // Delete all words from start to end
        deleteCount = words.length - startPos + 1;
      } else {
        deleteCount = Math.max(0, parseInt(length) || 0);
      }
      
      // Remove the specified words
      const result = [...words];
      result.splice(startPos - 1, deleteCount);
      
      return result.join(' ');
    } catch (e) {
      return '';
    }
  },
  
  'SUBWORD': (string, start, length = null) => {
    try {
      const str = String(string).trim();
      let startPos = parseInt(start);
      if (isNaN(startPos)) startPos = 1;
      
      if (str === '' || startPos < 1) return '';
      
      // Split into words
      const words = str.split(/\s+/).filter(word => word.length > 0);
      
      if (startPos > words.length) return '';
      
      // Determine how many words to extract
      let extractCount;
      if (length === null || length === undefined) {
        // Extract all words from start to end
        extractCount = words.length - startPos + 1;
      } else {
        extractCount = Math.max(0, parseInt(length) || 0);
      }
      
      // Extract the specified words
      const result = words.slice(startPos - 1, startPos - 1 + extractCount);
      
      return result.join(' ');
    } catch (e) {
      return '';
    }
  },

  'INDEXOF': (string, searchString, fromIndex = 0) => {
    try {
      const str = String(string);
      const search = String(searchString);
      const from = parseInt(fromIndex) || 0;
      return str.indexOf(search, from);
    } catch (e) {
      return -1;
    }
  },
  
  'INCLUDES': (string, searchString) => {
    try {
      const str = String(string);
      const search = String(searchString);
      return str.includes(search);
    } catch (e) {
      return false;
    }
  },
  
  'STARTS_WITH': (string, searchString) => {
    try {
      const str = String(string);
      const search = String(searchString);
      return str.startsWith(search);
    } catch (e) {
      return false;
    }
  },
  
  'ENDS_WITH': (string, searchString) => {
    try {
      const str = String(string);
      const search = String(searchString);
      return str.endsWith(search);
    } catch (e) {
      return false;
    }
  },

  'REPEAT': (string, count) => {
    try {
      const str = String(string);
      const num = Math.max(0, parseInt(count) || 0);
      return str.repeat(num);
    } catch (e) {
      return '';
    }
  },
  
  'COPIES': (string, count) => {
    try {
      const str = String(string);
      const num = Math.max(0, parseInt(count) || 0);
      return str.repeat(num);
    } catch (e) {
      return '';
    }
  },
  
  'PAD_START': (string, targetLength, padString = ' ') => {
    try {
      const str = String(string);
      const length = parseInt(targetLength) || 0;
      const pad = String(padString);
      return str.padStart(length, pad);
    } catch (e) {
      return String(string);
    }
  },
  
  'PAD_END': (string, targetLength, padString = ' ') => {
    try {
      const str = String(string);
      const length = parseInt(targetLength) || 0;
      const pad = String(padString);
      return str.padEnd(length, pad);
    } catch (e) {
      return String(string);
    }
  },

  'TRANSLATE': (string, outputTable = '', inputTable = '') => {
    try {
      const str = String(string);
      const outTable = String(outputTable);
      const inTable = String(inputTable);
      
      // If no tables provided, convert to uppercase (classic Rexx default)
      if (outTable === '' && inTable === '') {
        return str.toUpperCase();
      }
      
      // If only output table provided, use lowercase alphabet as input table
      if (inTable === '' && outTable !== '') {
        const defaultInput = 'abcdefghijklmnopqrstuvwxyz';
        return translateString(str, outTable, defaultInput);
      }
      
      // Both tables provided
      return translateString(str, outTable, inTable);
      
      function translateString(text, out, inp) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const index = inp.indexOf(char);
          if (index !== -1 && index < out.length) {
            result += out[index];
          } else {
            result += char; // Character not in input table, keep as is
          }
        }
        return result;
      }
    } catch (e) {
      return '';
    }
  },
  
  'VERIFY': (string, reference, option = 'NOMATCH', start = 1) => {
    try {
      const str = String(string);
      const ref = String(reference);
      const opt = String(option).toUpperCase();
      const startPos = Math.max(1, parseInt(start) || 1);
      
      // Convert to 0-based index for JavaScript
      const startIndex = startPos - 1;
      
      if (startIndex >= str.length) return 0;
      
      const isMatch = opt === 'MATCH' || opt === 'M';
      
      for (let i = startIndex; i < str.length; i++) {
        const char = str[i];
        const foundInRef = ref.indexOf(char) !== -1;
        
        if (isMatch) {
          // Looking for first character that IS in reference
          if (foundInRef) {
            return i + 1; // Convert back to 1-based index
          }
        } else {
          // Looking for first character that is NOT in reference (default)
          if (!foundInRef) {
            return i + 1; // Convert back to 1-based index
          }
        }
      }
      
      // No matching character found
      return 0;
    } catch (e) {
      return 0;
    }
  },
  
  'SUBSTRING': (string, start, length) => {
    try {
      const str = String(string);
      const startPos = parseInt(start) || 0;
      if (length !== undefined && length !== null) {
        const len = parseInt(length);
        return str.substring(startPos, startPos + len);
      }
      return str.substring(startPos);
    } catch (e) {
      return '';
    }
  },

  'LEFT': (string, length, pad = ' ') => {
    try {
      const str = String(string);
      const len = parseInt(length) || 0;
      const padChar = String(pad);

      if (len <= 0) return '';
      if (str.length >= len) return str.substring(0, len);

      // Pad on the right
      const padNeeded = len - str.length;
      const fullPad = padChar.repeat(Math.ceil(padNeeded / padChar.length));
      return str + fullPad.substring(0, padNeeded);
    } catch (e) {
      return '';
    }
  },

  'RIGHT': (string, length, pad = ' ') => {
    try {
      const str = String(string);
      const len = parseInt(length) || 0;
      const padChar = String(pad);

      if (len <= 0) return '';
      if (str.length >= len) return str.substring(str.length - len);

      // Pad on the left
      const padNeeded = len - str.length;
      const fullPad = padChar.repeat(Math.ceil(padNeeded / padChar.length));
      return fullPad.substring(0, padNeeded) + str;
    } catch (e) {
      return '';
    }
  },

  'CENTER': (string, length, pad = ' ') => {
    try {
      const str = String(string);
      const len = parseInt(length) || 0;
      const padChar = String(pad);

      if (len <= 0) return '';
      if (str.length >= len) return str.substring(0, len);

      // Pad on both sides
      const padNeeded = len - str.length;
      const leftPad = Math.floor(padNeeded / 2);
      const rightPad = padNeeded - leftPad;

      const leftFullPad = padChar.repeat(Math.ceil(leftPad / padChar.length));
      const rightFullPad = padChar.repeat(Math.ceil(rightPad / padChar.length));

      return leftFullPad.substring(0, leftPad) + str + rightFullPad.substring(0, rightPad);
    } catch (e) {
      return '';
    }
  },
  
  'SLUG': (string) => {
    try {
      return String(string)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    } catch (e) {
      return '';
    }
  },

  // Text Analysis Functions with Dictionary Returns

  'WORD_FREQUENCY': (text) => {
    try {
      const str = String(text).toLowerCase();
      
      // Extract words (letters and numbers only)
      const words = str.match(/\b[a-z0-9]+\b/g);
      
      if (!words || words.length === 0) {
        return {};
      }
      
      const frequency = {};
      words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
      });
      
      return frequency;
    } catch (e) {
      return {};
    }
  },

  'SENTIMENT_ANALYSIS': (text) => {
    try {
      const str = String(text).toLowerCase();
      
      // Simple sentiment word lists
      const positiveWords = [
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'love', 'like',
        'happy', 'joy', 'pleased', 'satisfied', 'perfect', 'brilliant', 'outstanding', 'superb',
        'marvelous', 'terrific', 'fabulous', 'nice', 'beautiful', 'best', 'better', 'success',
        'successful', 'win', 'winner', 'positive', 'optimistic', 'hope', 'hopeful', 'excited'
      ];
      
      const negativeWords = [
        'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'dislike', 'sad', 'angry',
        'disappointed', 'frustrated', 'annoyed', 'upset', 'worried', 'concerned', 'problem', 'issue',
        'fail', 'failure', 'wrong', 'error', 'mistake', 'worst', 'worse', 'negative', 'pessimistic',
        'difficult', 'hard', 'impossible', 'useless', 'worthless', 'broken', 'damaged'
      ];
      
      // Extract words
      const words = str.match(/\b[a-z]+\b/g) || [];
      
      let positiveScore = 0;
      let negativeScore = 0;
      
      words.forEach(word => {
        if (positiveWords.includes(word)) {
          positiveScore++;
        } else if (negativeWords.includes(word)) {
          negativeScore++;
        }
      });
      
      const totalSentimentWords = positiveScore + negativeScore;
      const score = totalSentimentWords === 0 ? 0 : 
        (positiveScore - negativeScore) / totalSentimentWords;
      
      const confidence = totalSentimentWords / Math.max(words.length, 1);
      
      let sentiment = 'neutral';
      if (score > 0.1) sentiment = 'positive';
      else if (score < -0.1) sentiment = 'negative';
      
      return {
        score: Math.round(score * 1000) / 1000, // Round to 3 decimal places
        confidence: Math.round(confidence * 1000) / 1000,
        sentiment,
        positiveWords: positiveScore,
        negativeWords: negativeScore,
        totalWords: words.length
      };
    } catch (e) {
      return {
        score: 0,
        confidence: 0,
        sentiment: 'neutral',
        positiveWords: 0,
        negativeWords: 0,
        totalWords: 0
      };
    }
  },

  'EXTRACT_KEYWORDS': (text, maxKeywords = 10) => {
    try {
      const str = String(text).toLowerCase();
      
      // Common stop words to filter out
      const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
        'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
      ]);
      
      // Extract words (letters only, minimum length 3)
      const words = str.match(/\b[a-z]{3,}\b/g) || [];
      
      // Filter out stop words and count frequencies
      const wordFreq = {};
      words.forEach(word => {
        if (!stopWords.has(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
      
      // Sort by frequency and take top keywords
      const keywords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, Math.max(1, parseInt(maxKeywords) || 10))
        .map(([word, frequency]) => ({
          word,
          frequency,
          weight: frequency / words.length
        }));
      
      return {
        keywords,
        totalWords: words.length,
        uniqueWords: Object.keys(wordFreq).length,
        averageFrequency: keywords.length > 0 ? 
          keywords.reduce((sum, k) => sum + k.frequency, 0) / keywords.length : 0
      };
    } catch (e) {
      return {
        keywords: [],
        totalWords: 0,
        uniqueWords: 0,
        averageFrequency: 0
      };
    }
  },

  'VALIDATE_SCHEMA': (data, schema) => {
    try {
      let dataToValidate;
      let schemaObj;
      
      // Parse input data
      if (typeof data === 'string') {
        try {
          dataToValidate = JSON.parse(data);
        } catch (e) {
          dataToValidate = data;
        }
      } else {
        dataToValidate = data;
      }
      
      // Parse schema
      if (typeof schema === 'string') {
        try {
          schemaObj = JSON.parse(schema);
        } catch (e) {
          return {
            valid: false,
            errors: [`Invalid schema format: ${e.message}`],
            details: {
              totalFields: 0,
              validFields: 0,
              invalidFields: 0
            }
          };
        }
      } else {
        schemaObj = schema;
      }
      
      const errors = [];
      let totalFields = 0;
      let validFields = 0;
      
      // Helper function to validate a single field
      const validateField = (value, fieldSchema, fieldPath = '') => {
        totalFields++;
        const pathPrefix = fieldPath ? `${fieldPath}.` : '';
        
        // Check required fields
        if (fieldSchema.required && (value === undefined || value === null)) {
          errors.push(`Required field '${fieldPath}' is missing`);
          return false;
        }
        
        // Skip validation if field is not required and not present
        if (value === undefined || value === null) {
          if (!fieldSchema.required) {
            validFields++;
            return true;
          }
        }
        
        // Type validation
        if (fieldSchema.type) {
          const expectedType = fieldSchema.type.toLowerCase();
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          
          if (expectedType !== actualType) {
            // Special case: number can be string if it's parseable
            if (expectedType === 'number' && actualType === 'string' && !isNaN(parseFloat(value))) {
              // Valid numeric string
            } else {
              errors.push(`Field '${fieldPath}' expected type '${expectedType}' but got '${actualType}'`);
              return false;
            }
          }
        }
        
        // Value validation
        if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
          errors.push(`Field '${fieldPath}' value '${value}' not in allowed values: ${fieldSchema.enum.join(', ')}`);
          return false;
        }
        
        // Range validation for numbers
        if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
          const numValue = typeof value === 'number' ? value : parseFloat(value);
          if (fieldSchema.min !== undefined && numValue < fieldSchema.min) {
            errors.push(`Field '${fieldPath}' value ${numValue} is below minimum ${fieldSchema.min}`);
            return false;
          }
          if (fieldSchema.max !== undefined && numValue > fieldSchema.max) {
            errors.push(`Field '${fieldPath}' value ${numValue} is above maximum ${fieldSchema.max}`);
            return false;
          }
        }
        
        // String length validation
        if (typeof value === 'string') {
          if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
            errors.push(`Field '${fieldPath}' length ${value.length} is below minimum ${fieldSchema.minLength}`);
            return false;
          }
          if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
            errors.push(`Field '${fieldPath}' length ${value.length} is above maximum ${fieldSchema.maxLength}`);
            return false;
          }
        }
        
        // Pattern validation for strings
        if (typeof value === 'string' && fieldSchema.pattern) {
          const regex = new RegExp(fieldSchema.pattern);
          if (!regex.test(value)) {
            errors.push(`Field '${fieldPath}' value '${value}' does not match pattern '${fieldSchema.pattern}'`);
            return false;
          }
        }
        
        validFields++;
        return true;
      };
      
      // Validate object structure
      if (typeof dataToValidate === 'object' && dataToValidate !== null && !Array.isArray(dataToValidate)) {
        // Object validation
        for (const [fieldName, fieldSchema] of Object.entries(schemaObj)) {
          validateField(dataToValidate[fieldName], fieldSchema, fieldName);
        }
      } else if (Array.isArray(dataToValidate)) {
        // Array validation - validate each item
        dataToValidate.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            for (const [fieldName, fieldSchema] of Object.entries(schemaObj)) {
              validateField(item[fieldName], fieldSchema, `[${index}].${fieldName}`);
            }
          }
        });
      } else {
        // Single value validation
        if (Object.keys(schemaObj).length === 1) {
          const fieldName = Object.keys(schemaObj)[0];
          validateField(dataToValidate, schemaObj[fieldName], fieldName);
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
        details: {
          totalFields,
          validFields,
          invalidFields: totalFields - validFields
        }
      };
    } catch (e) {
      return {
        valid: false,
        errors: [`Validation error: ${e.message}`],
        details: {
          totalFields: 0,
          validFields: 0,
          invalidFields: 0
        }
      };
    }
  },

  'CHECK_TYPES': (data, expectedTypes) => {
    try {
      let dataToCheck;
      let types;
      
      // Parse input data
      if (typeof data === 'string') {
        try {
          dataToCheck = JSON.parse(data);
        } catch (e) {
          dataToCheck = data;
        }
      } else {
        dataToCheck = data;
      }
      
      // Parse expected types
      if (typeof expectedTypes === 'string') {
        try {
          types = JSON.parse(expectedTypes);
        } catch (e) {
          // Single type string
          types = expectedTypes.split(',').map(t => t.trim());
        }
      } else if (Array.isArray(expectedTypes)) {
        types = expectedTypes;
      } else {
        types = [expectedTypes];
      }
      
      const results = {
        valid: true,
        actualType: null,
        expectedTypes: types,
        matches: [],
        mismatches: [],
        details: {}
      };
      
      const getType = (value) => {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
      };
      
      if (Array.isArray(dataToCheck)) {
        // Check array of items
        results.actualType = 'array';
        results.details.itemCount = dataToCheck.length;
        results.details.itemTypes = {};
        
        dataToCheck.forEach((item, index) => {
          const itemType = getType(item);
          results.details.itemTypes[index] = itemType;
          
          const matches = types.some(expectedType => {
            if (expectedType === 'any') return true;
            if (expectedType === itemType) return true;
            if (expectedType === 'number' && itemType === 'string' && !isNaN(parseFloat(item))) return true;
            return false;
          });
          
          if (matches) {
            results.matches.push(index);
          } else {
            results.mismatches.push({
              index,
              actualType: itemType,
              value: item
            });
            results.valid = false;
          }
        });
      } else if (typeof dataToCheck === 'object' && dataToCheck !== null) {
        // Check object properties
        results.actualType = 'object';
        results.details.propertyTypes = {};
        
        for (const [key, value] of Object.entries(dataToCheck)) {
          const propType = getType(value);
          results.details.propertyTypes[key] = propType;
          
          const matches = types.some(expectedType => {
            if (expectedType === 'any') return true;
            if (expectedType === propType) return true;
            if (expectedType === 'number' && propType === 'string' && !isNaN(parseFloat(value))) return true;
            return false;
          });
          
          if (matches) {
            results.matches.push(key);
          } else {
            results.mismatches.push({
              property: key,
              actualType: propType,
              value: value
            });
            results.valid = false;
          }
        }
      } else {
        // Check single value
        const actualType = getType(dataToCheck);
        results.actualType = actualType;
        
        const matches = types.some(expectedType => {
          if (expectedType === 'any') return true;
          if (expectedType === actualType) return true;
          if (expectedType === 'number' && actualType === 'string' && !isNaN(parseFloat(dataToCheck))) return true;
          return false;
        });
        
        if (matches) {
          results.matches.push('value');
        } else {
          results.mismatches.push({
            actualType,
            value: dataToCheck
          });
          results.valid = false;
        }
      }
      
      return results;
    } catch (e) {
      return {
        valid: false,
        actualType: null,
        expectedTypes: [],
        matches: [],
        mismatches: [],
        details: {
          error: e.message
        }
      };
    }
  },

  //TODO insert more here

};

// Sibling converters for unified parameter model
function UPPER_positional_args_to_named_param_map(...args) {
  return { str: args[0] };
}

function LOWER_positional_args_to_named_param_map(...args) {
  return { str: args[0] };
}

function TRIM_positional_args_to_named_param_map(...args) {
  return { str: args[0] };
}

function LEFT_positional_args_to_named_param_map(...args) {
  return { str: args[0], length: args[1] };
}

function RIGHT_positional_args_to_named_param_map(...args) {
  return { str: args[0], length: args[1] };
}

function STRIP_positional_args_to_named_param_map(...args) {
  return { str: args[0], pattern: args[1] };
}

function REPLACE_positional_args_to_named_param_map(...args) {
  return { str: args[0], oldValue: args[1], newValue: args[2] };
}

function INDEX_positional_args_to_named_param_map(...args) {
  return { str: args[0], search: args[1], start: args[2] };
}

function LENGTH_positional_args_to_named_param_map(...args) {
  return { str: args[0] };
}

function POS_positional_args_to_named_param_map(...args) {
  return { string: args[0], needle: args[1], start: args[2] };
}

function ABBREV_positional_args_to_named_param_map(...args) {
  return { string: args[0], abbrev: args[1], length: args[2] };
}

function TRIM_START_positional_args_to_named_param_map(...args) {
  return { string: args[0] };
}

function TRIM_END_positional_args_to_named_param_map(...args) {
  return { string: args[0] };
}

function REVERSE_positional_args_to_named_param_map(...args) {
  return { string: args[0] };
}

function SPACE_positional_args_to_named_param_map(...args) {
  return { string: args[0], n: args[1], pad: args[2] };
}

function WORD_positional_args_to_named_param_map(...args) {
  return { string: args[0], n: args[1] };
}

function WORDS_positional_args_to_named_param_map(...args) {
  return { string: args[0] };
}

function WORDPOS_positional_args_to_named_param_map(...args) {
  return { string: args[0], phrase: args[1], start: args[2] };
}

function DELWORD_positional_args_to_named_param_map(...args) {
  return { string: args[0], start: args[1], length: args[2] };
}

function SUBWORD_positional_args_to_named_param_map(...args) {
  return { string: args[0], start: args[1], length: args[2] };
}

function INDEXOF_positional_args_to_named_param_map(...args) {
  return { string: args[0], searchString: args[1], fromIndex: args[2] };
}

function INCLUDES_positional_args_to_named_param_map(...args) {
  return { string: args[0], searchString: args[1] };
}

function STARTS_WITH_positional_args_to_named_param_map(...args) {
  return { string: args[0], searchString: args[1] };
}

function ENDS_WITH_positional_args_to_named_param_map(...args) {
  return { string: args[0], searchString: args[1] };
}

function REPEAT_positional_args_to_named_param_map(...args) {
  return { string: args[0], count: args[1] };
}

function COPIES_positional_args_to_named_param_map(...args) {
  return { string: args[0], count: args[1] };
}

function PAD_START_positional_args_to_named_param_map(...args) {
  return { string: args[0], targetLength: args[1], padString: args[2] };
}

function PAD_END_positional_args_to_named_param_map(...args) {
  return { string: args[0], targetLength: args[1], padString: args[2] };
}

function TRANSLATE_positional_args_to_named_param_map(...args) {
  return { string: args[0], outputTable: args[1], inputTable: args[2] };
}

function VERIFY_positional_args_to_named_param_map(...args) {
  return { string: args[0], reference: args[1], option: args[2], start: args[3] };
}

function SUBSTRING_positional_args_to_named_param_map(...args) {
  return { string: args[0], start: args[1], length: args[2] };
}

function CENTER_positional_args_to_named_param_map(...args) {
  return { string: args[0], length: args[1], pad: args[2] };
}

function SLUG_positional_args_to_named_param_map(...args) {
  return { string: args[0] };
}

function WORD_FREQUENCY_positional_args_to_named_param_map(...args) {
  return { text: args[0] };
}

function SENTIMENT_ANALYSIS_positional_args_to_named_param_map(...args) {
  return { text: args[0] };
}

function EXTRACT_KEYWORDS_positional_args_to_named_param_map(...args) {
  return { text: args[0], maxKeywords: args[1] };
}

/**
 * Sibling function: Convert positional arguments to named parameter map for SUBSTR
 * SUBSTR(string, start, length) -> { string, start, length }
 */
function SUBSTR_positional_args_to_named_param_map(...args) {
  return {
    string: args[0],
    start: args[1],
    length: args[2]
  };
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    stringFunctions,
    UPPER_positional_args_to_named_param_map,
    LOWER_positional_args_to_named_param_map,
    TRIM_positional_args_to_named_param_map,
    LEFT_positional_args_to_named_param_map,
    RIGHT_positional_args_to_named_param_map,
    STRIP_positional_args_to_named_param_map,
    REPLACE_positional_args_to_named_param_map,
    INDEX_positional_args_to_named_param_map,
    LENGTH_positional_args_to_named_param_map,
    POS_positional_args_to_named_param_map,
    ABBREV_positional_args_to_named_param_map,
    TRIM_START_positional_args_to_named_param_map,
    TRIM_END_positional_args_to_named_param_map,
    REVERSE_positional_args_to_named_param_map,
    SPACE_positional_args_to_named_param_map,
    WORD_positional_args_to_named_param_map,
    WORDS_positional_args_to_named_param_map,
    WORDPOS_positional_args_to_named_param_map,
    DELWORD_positional_args_to_named_param_map,
    SUBWORD_positional_args_to_named_param_map,
    INDEXOF_positional_args_to_named_param_map,
    INCLUDES_positional_args_to_named_param_map,
    STARTS_WITH_positional_args_to_named_param_map,
    ENDS_WITH_positional_args_to_named_param_map,
    REPEAT_positional_args_to_named_param_map,
    COPIES_positional_args_to_named_param_map,
    PAD_START_positional_args_to_named_param_map,
    PAD_END_positional_args_to_named_param_map,
    TRANSLATE_positional_args_to_named_param_map,
    VERIFY_positional_args_to_named_param_map,
    SUBSTRING_positional_args_to_named_param_map,
    CENTER_positional_args_to_named_param_map,
    SLUG_positional_args_to_named_param_map,
    WORD_FREQUENCY_positional_args_to_named_param_map,
    SENTIMENT_ANALYSIS_positional_args_to_named_param_map,
    EXTRACT_KEYWORDS_positional_args_to_named_param_map,
    SUBSTR_positional_args_to_named_param_map
  };
} else if (typeof window !== 'undefined') {
  window.stringFunctions = stringFunctions;
  window.UPPER_positional_args_to_named_param_map = UPPER_positional_args_to_named_param_map;
  window.LOWER_positional_args_to_named_param_map = LOWER_positional_args_to_named_param_map;
  window.TRIM_positional_args_to_named_param_map = TRIM_positional_args_to_named_param_map;
  window.LEFT_positional_args_to_named_param_map = LEFT_positional_args_to_named_param_map;
  window.RIGHT_positional_args_to_named_param_map = RIGHT_positional_args_to_named_param_map;
  window.STRIP_positional_args_to_named_param_map = STRIP_positional_args_to_named_param_map;
  window.REPLACE_positional_args_to_named_param_map = REPLACE_positional_args_to_named_param_map;
  window.INDEX_positional_args_to_named_param_map = INDEX_positional_args_to_named_param_map;
  window.LENGTH_positional_args_to_named_param_map = LENGTH_positional_args_to_named_param_map;
  window.POS_positional_args_to_named_param_map = POS_positional_args_to_named_param_map;
  window.ABBREV_positional_args_to_named_param_map = ABBREV_positional_args_to_named_param_map;
  window.TRIM_START_positional_args_to_named_param_map = TRIM_START_positional_args_to_named_param_map;
  window.TRIM_END_positional_args_to_named_param_map = TRIM_END_positional_args_to_named_param_map;
  window.REVERSE_positional_args_to_named_param_map = REVERSE_positional_args_to_named_param_map;
  window.SPACE_positional_args_to_named_param_map = SPACE_positional_args_to_named_param_map;
  window.WORD_positional_args_to_named_param_map = WORD_positional_args_to_named_param_map;
  window.WORDS_positional_args_to_named_param_map = WORDS_positional_args_to_named_param_map;
  window.WORDPOS_positional_args_to_named_param_map = WORDPOS_positional_args_to_named_param_map;
  window.DELWORD_positional_args_to_named_param_map = DELWORD_positional_args_to_named_param_map;
  window.SUBWORD_positional_args_to_named_param_map = SUBWORD_positional_args_to_named_param_map;
  window.INDEXOF_positional_args_to_named_param_map = INDEXOF_positional_args_to_named_param_map;
  window.INCLUDES_positional_args_to_named_param_map = INCLUDES_positional_args_to_named_param_map;
  window.STARTS_WITH_positional_args_to_named_param_map = STARTS_WITH_positional_args_to_named_param_map;
  window.ENDS_WITH_positional_args_to_named_param_map = ENDS_WITH_positional_args_to_named_param_map;
  window.REPEAT_positional_args_to_named_param_map = REPEAT_positional_args_to_named_param_map;
  window.COPIES_positional_args_to_named_param_map = COPIES_positional_args_to_named_param_map;
  window.PAD_START_positional_args_to_named_param_map = PAD_START_positional_args_to_named_param_map;
  window.PAD_END_positional_args_to_named_param_map = PAD_END_positional_args_to_named_param_map;
  window.TRANSLATE_positional_args_to_named_param_map = TRANSLATE_positional_args_to_named_param_map;
  window.VERIFY_positional_args_to_named_param_map = VERIFY_positional_args_to_named_param_map;
  window.SUBSTRING_positional_args_to_named_param_map = SUBSTRING_positional_args_to_named_param_map;
  window.CENTER_positional_args_to_named_param_map = CENTER_positional_args_to_named_param_map;
  window.SLUG_positional_args_to_named_param_map = SLUG_positional_args_to_named_param_map;
  window.WORD_FREQUENCY_positional_args_to_named_param_map = WORD_FREQUENCY_positional_args_to_named_param_map;
  window.SENTIMENT_ANALYSIS_positional_args_to_named_param_map = SENTIMENT_ANALYSIS_positional_args_to_named_param_map;
  window.EXTRACT_KEYWORDS_positional_args_to_named_param_map = EXTRACT_KEYWORDS_positional_args_to_named_param_map;
  window.SUBSTR_positional_args_to_named_param_map = SUBSTR_positional_args_to_named_param_map;
}
