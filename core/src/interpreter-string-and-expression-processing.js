(function() {
'use strict';

/**
 * String and Expression Processing for REXX interpreter
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

// True when `part` is exactly one quoted literal, '...' or "...", in which a
// doubled quote of its own kind stands for one quote ('it''s').
const isSingleLiteral = function(part) {
    const q = part[0];
    if ((q !== '"' && q !== "'") || part.length < 2 || part[part.length - 1] !== q) return false;
    for (let i = 1; i < part.length - 1; i++) {
        if (part[i] === q) {
            if (part[i + 1] !== q || i + 1 === part.length - 1) return false;
            i++;
        }
    }
    return true;
}

// A quoted literal's text, as classic REXX reads it: the quotes removed, and
// a doubled quote of the same kind made one ('it''s' is it's).
const unquoteLiteral = function(literal) {
    const q = literal[0];
    return literal.substring(1, literal.length - 1).split(q + q).join(q);
}

const parseQuotedParts = function(expression) {
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenCount = 0;

    for (let i = 0; i < expression.length; i++) {
        const char = expression[i];

        if (!inQuotes && (char === '"' || char === "'")) {
            inQuotes = true;
            quoteChar = char;
            current += char;
        } else if (inQuotes && char === quoteChar) {
            current += char;
            inQuotes = false;
            quoteChar = '';
        } else if (!inQuotes && char === '(') {
            parenCount++;
            current += char;
        } else if (!inQuotes && char === ')') {
            parenCount--;
            current += char;
        } else if (!inQuotes && char === ' ' && parenCount === 0) {
            if (current.trim()) {
                parts.push(current.trim());
                current = '';
            }
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        parts.push(current.trim());
    }

    return parts;
}

const interpolateString = async function(template, resolveValueFn) {
    // Get current interpolation pattern configuration
    let pattern;
    try {
      // Try to load interpolation config (Node.js or browser)
      if (typeof require !== 'undefined') {
        pattern = require('./interpolation').getCurrentPattern();
      } else if (typeof window !== 'undefined' && window.InterpolationConfig) {
        pattern = window.InterpolationConfig.getCurrentPattern();
      } else {
        // Fallback to default handlebars pattern if config not available
        pattern = {
          regex: /\{\{([^}]*)\}\}/g,
          hasDelims: (str) => str.includes('{{'),
          extractVar: (match) => match.slice(2, -2)
        };
      }
    } catch (error) {
      // Fallback to default pattern if config loading fails
      pattern = {
        regex: /\{\{([^}]*)\}\}/g,
        hasDelims: (str) => str.includes('{{'),
        extractVar: (match) => match.slice(2, -2)
      };
    }
    
    // Handle case where there are no interpolation patterns - just return the template
    if (!pattern.hasDelims(template)) {
      return template;
    }
    
    // Replace variables with resolved values using configurable pattern
    const interpolationPromises = [];
    const placeholders = [];
    
    // Find all variable patterns using current configuration
    const matches = template.match(pattern.regex);
    if (!matches) return template;
    
    // Collect all resolveValue promises  
    for (const match of matches) {
      const variableName = pattern.extractVar(match);
      placeholders.push(match);
      interpolationPromises.push(resolveValueFn(variableName));
    }
    
    // Wait for all variable resolutions
    const resolvedValues = await Promise.all(interpolationPromises);
    
    // Replace placeholders with resolved values
    let result = template;
    for (let i = 0; i < placeholders.length; i++) {
      const resolvedValue = resolvedValues[i];
      const variableName = pattern.extractVar(placeholders[i]);
      if (resolvedValue !== variableName) { // resolveValue returns original value if not found
        result = result.replace(placeholders[i], String(resolvedValue));
      }
    }
    
    return result;
}

const evaluateConcatenation = async function(expression, resolveValueFn, evaluateExpressionFn, unsetSymbolValueFn) {
    // Split the expression by || operators while preserving quoted strings and parentheses
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenDepth = 0;

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      const nextChar = expression[i + 1];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        current += char;
        quoteChar = '';
      } else if (!inQuotes && char === '(') {
        parenDepth++;
        current += char;
      } else if (!inQuotes && char === ')') {
        parenDepth--;
        current += char;
      } else if (!inQuotes && parenDepth === 0 && char === '|' && nextChar === '|') {
        // Found || operator at top level (not inside parentheses)
        parts.push(current.trim());
        current = '';
        i++; // Skip the second |
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    // Evaluate each part and concatenate the results
    // Get escape sequence processor if available
    let processEscapeSequences;
    try {
      if (typeof require !== 'undefined') {
        processEscapeSequences = require('./escape-sequence-processor').processEscapeSequences;
      } else if (typeof window !== 'undefined' && window.processEscapeSequences) {
        processEscapeSequences = window.processEscapeSequences;
      }
    } catch (error) {
      // escape-sequence-processor not available, skip processing
    }

    // One term: a literal, or an expression or variable worked out.
    const term = async (part) => {
      if (isSingleLiteral(part) && part[0] === '"') {
        // Quoted string - remove quotes and interpolate if needed
        let unquoted = unquoteLiteral(part);
        // Check if we need to interpolate within the string
        if (typeof evaluateExpressionFn !== 'undefined' && unquoted.includes('{{')) {
          // Has interpolation patterns, but keep as-is for now
          // The interpolateString function will handle it if needed
        } else if (processEscapeSequences) {
          // No interpolation patterns, apply escape sequence processor
          unquoted = processEscapeSequences(unquoted);
        }
        return unquoted;
      } else if (isSingleLiteral(part)) {
        // Single quoted string - no interpolation, no escape sequences
        return unquoteLiteral(part);
      } else if (typeof evaluateExpressionFn !== 'undefined') {
        // For non-quoted, non-string parts, try different evaluation strategies

        // First, check if this looks like it needs parsing (contains operators or parentheses)
        const hasOperatorsOrParens = part.startsWith('(') ||
                                     part.includes('+') || part.includes('-') ||
                                     part.includes('*') || part.includes('/') || part.includes('%') ||
                                     part.includes('>') || part.includes('<') || part.includes('=') ||
                                     part.includes('**');

        if (hasOperatorsOrParens) {
          try {
            // This looks like an expression - try to evaluate it
            // Pass the raw string which evaluateExpressionFn should handle
            const evaluated = await evaluateExpressionFn(part);
            return String(evaluated);
          } catch (error) {
            // If it fails as an expression, try as a variable
            const resolved = await resolveValueFn(part);
            return String(resolved);
          }
        } else {
          // No operators, treat as variable; a symbol no variable is set
          // for is its uppercase name (TRL 3.1)
          const resolved = await resolveValueFn(part);
          return String(unsetSymbolValueFn && resolved === part ? unsetSymbolValueFn(part) : resolved);
        }
      } else {
        // No expression evaluator - treat as variable reference
        const resolved = await resolveValueFn(part);
        return String(resolved);
      }
    };

    // Each side of || is terms joined by blanks or abutted, as in classic
    // REXX (SAY "(RC" rc || ")", v"text"): parser.js's concatenationTerms
    // reads the side's terms, arithmetic among them bound tighter, and each
    // is worked out and joined with one blank, or none when abutted. A side
    // that is not such a list (one with = in it) is one term.
    const concatenationTerms = (typeof require !== 'undefined' && typeof module !== 'undefined')
      ? require('./parser').concatenationTerms
      : window.concatenationTerms;
    const results = [];
    for (const part of parts) {
      const groups = concatenationTerms(part) || [{ text: part, abut: false }];
      let joined = '';
      for (let g = 0; g < groups.length; g++) {
        joined += (g === 0 || groups[g].abut ? '' : ' ') + await term(groups[g].text);
      }
      results.push(joined);
    }

    return results.join('');
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { parseQuotedParts, interpolateString, evaluateConcatenation, isSingleLiteral, unquoteLiteral };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('stringProcessing')) {
        window.rexxModuleRegistry.set('stringProcessing', {
            parseQuotedParts,
            interpolateString,
            evaluateConcatenation,
            isSingleLiteral,
            unquoteLiteral
        });
    }
}

})(); // End IIFE


