/**
 * Escape Sequence Processor
 * Processes JavaScript-style escape sequences in REXX strings
 *
 * Supported escape sequences:
 * \0  - null character (U+0000)
 * \'  - single quote (U+0027)
 * \"  - double quote (U+0022)
 * \\  - backslash (U+005C)
 * \n  - newline (U+000A)
 * \r  - carriage return (U+000D)
 * \v  - vertical tab (U+000B)
 * \t  - tab (U+0009)
 * \b  - backspace (U+0008)
 * \f  - form feed (U+000C)
 * \uXXXX  - Unicode code point (4 hex digits)
 * \uXXXXXXXX - Unicode code point (8 hex digits, for code points > U+FFFF)
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

/**
 * Process JavaScript-style escape sequences in a string
 * @param {string} str - The string with potential escape sequences
 * @returns {string} - The string with escape sequences processed
 */
function processEscapeSequences(str) {
  if (typeof str !== 'string') {
    return str;
  }

  let result = '';
  let i = 0;

  while (i < str.length) {
    if (str[i] === '\\' && i + 1 < str.length) {
      const nextChar = str[i + 1];

      switch (nextChar) {
        case '0':
          // Null character
          result += '\u0000';
          i += 2;
          break;
        case "'":
          // Single quote
          result += "'";
          i += 2;
          break;
        case '"':
          // Double quote
          result += '"';
          i += 2;
          break;
        case '\\':
          // Backslash
          result += '\\';
          i += 2;
          break;
        case 'n':
          // Newline
          result += '\n';
          i += 2;
          break;
        case 'r':
          // Carriage return
          result += '\r';
          i += 2;
          break;
        case 'v':
          // Vertical tab
          result += '\v';
          i += 2;
          break;
        case 't':
          // Tab
          result += '\t';
          i += 2;
          break;
        case 'b':
          // Backspace
          result += '\b';
          i += 2;
          break;
        case 'f':
          // Form feed
          result += '\f';
          i += 2;
          break;
        case 'u':
          // Unicode escape sequence: \uXXXX or \uXXXXXXXX
          if (i + 9 < str.length) {
            // Try 8-digit Unicode escape first (for code points > U+FFFF)
            const eightDigits = str.slice(i + 2, i + 10);
            if (/^[0-9a-fA-F]{8}$/.test(eightDigits)) {
              const codePoint = parseInt(eightDigits, 16);
              result += String.fromCodePoint(codePoint);
              i += 10;
              break;
            }
          }
          if (i + 5 < str.length) {
            // Try 4-digit Unicode escape
            const fourDigits = str.slice(i + 2, i + 6);
            if (/^[0-9a-fA-F]{4}$/.test(fourDigits)) {
              const codePoint = parseInt(fourDigits, 16);
              result += String.fromCharCode(codePoint);
              i += 6;
              break;
            }
          }
          // If no valid Unicode escape, keep \u as-is
          result += str[i];
          i += 1;
          break;
        default:
          // Unknown escape sequence - keep as-is
          result += str[i];
          i += 1;
          break;
      }
    } else {
      result += str[i];
      i += 1;
    }
  }

  return result;
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { processEscapeSequences };
} else if (typeof window !== 'undefined') {
  window.processEscapeSequences = processEscapeSequences;
}
