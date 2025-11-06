/**
 * Spreadsheet Control Protocol/Grammar - MIT Licensed
 *
 * Copyright (c) 2024-2025 Paul Hammant and Contributors
 * Licensed under the MIT License (see LICENSE-PROTOCOL-MIT)
 *
 * This file defines the wire protocol/grammar for controlling spreadsheets
 * via REXX ADDRESS commands. The protocol is intentionally MIT licensed to
 * encourage ecosystem growth and interoperability.
 *
 * REXX functions for remote control of the spreadsheet.
 * These are used both by:
 * - Remote ADDRESS commands (via HTTP control bus)
 * - Cell expressions (e.g., =SETCELL("B1", GETCELL("A1")))
 *
 * This ensures a single source of truth for spreadsheet manipulation.
 *
 * Anyone can implement compatible clients in any language or create
 * alternative spreadsheet implementations using this protocol.
 */

/**
 * Create spreadsheet control functions bound to a specific model and adapter
 * @param {SpreadsheetModel} model - The spreadsheet model
 * @param {SpreadsheetRexxAdapter} adapter - The REXX adapter
 * @returns {Object} Functions to register with interpreter
 */
export function createSpreadsheetControlFunctions(model, adapter) {
  return {
    /**
     * SETCELL - Set cell content (value or formula)
     * Usage: CALL SETCELL("A1", "100")
     *        CALL SETCELL("A3", "=A1+A2")
     *        result = SETCELL("B1", "Hello")
     */
    SETCELL: async function(cellRef, content) {
      if (!cellRef || typeof cellRef !== 'string') {
        throw new Error('SETCELL requires cell reference as first argument (e.g., "A1")');
      }
      if (content === undefined || content === null) {
        throw new Error('SETCELL requires content as second argument');
      }

      // Convert content to string
      const contentStr = String(content);

      // Set the cell
      await model.setCell(cellRef, contentStr, adapter);

      // Trigger UI update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('spreadsheet-update'));
      }

      // Return the set value (REXX convention)
      return contentStr;
    },

    /**
     * GETCELL - Get cell value
     * Usage: value = GETCELL("A1")
     *        SAY "Cell A1 is:" GETCELL("A1")
     */
    GETCELL: function(cellRef) {
      if (!cellRef || typeof cellRef !== 'string') {
        throw new Error('GETCELL requires cell reference as argument (e.g., "A1")');
      }

      const cell = model.getCell(cellRef);
      return cell.value || '';
    },

    /**
     * GETEXPRESSION - Get cell formula/expression
     * Usage: formula = GETEXPRESSION("A3")
     */
    GETEXPRESSION: function(cellRef) {
      if (!cellRef || typeof cellRef !== 'string') {
        throw new Error('GETEXPRESSION requires cell reference as argument (e.g., "A1")');
      }

      const cell = model.getCell(cellRef);
      return cell.expression || '';
    },

    /**
     * CLEARCELL - Clear cell content
     * Usage: CALL CLEARCELL("A1")
     */
    CLEARCELL: async function(cellRef) {
      if (!cellRef || typeof cellRef !== 'string') {
        throw new Error('CLEARCELL requires cell reference as argument (e.g., "A1")');
      }

      await model.setCell(cellRef, '', adapter);

      // Trigger UI update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('spreadsheet-update'));
      }

      return '';
    },

    /**
     * SPREADSHEET_VERSION - Get spreadsheet control functions version
     * Usage: SAY SPREADSHEET_VERSION()
     */
    SPREADSHEET_VERSION: function() {
      return 'var_missing-2024-11-06';
    }
  };
}

/**
 * Function metadata for RexxJS parameter handling
 */
export const functionMetadata = {
  SETCELL: {
    name: 'SETCELL',
    params: ['cellRef', 'content'],
    description: 'Set cell content (value or formula)',
    examples: [
      'CALL SETCELL("A1", "100")',
      'CALL SETCELL("A3", "=A1+A2")',
      'result = SETCELL("B1", "Hello")'
    ]
  },
  GETCELL: {
    name: 'GETCELL',
    params: ['cellRef'],
    description: 'Get cell value',
    examples: [
      'value = GETCELL("A1")',
      'SAY "Cell A1 is:" GETCELL("A1")'
    ]
  },
  GETEXPRESSION: {
    name: 'GETEXPRESSION',
    params: ['cellRef'],
    description: 'Get cell formula/expression',
    examples: [
      'formula = GETEXPRESSION("A3")'
    ]
  },
  CLEARCELL: {
    name: 'CLEARCELL',
    params: ['cellRef'],
    description: 'Clear cell content',
    examples: [
      'CALL CLEARCELL("A1")'
    ]
  },
  SPREADSHEET_VERSION: {
    name: 'SPREADSHEET_VERSION',
    params: [],
    description: 'Get spreadsheet control functions version',
    examples: [
      'SAY SPREADSHEET_VERSION()'
    ]
  }
};
