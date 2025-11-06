/*!
 * Text Diffing and Patching Functions
 * Requires: diff package
 * Works in both Node.js and browser (after bundling)
 * @rexxjs-meta=DIFF_FUNCTIONS_META
 */

const Diff = require('diff');

/**
 * DIFF - Compare two texts and return differences
 * Works in both Node.js and browser environments
 *
 * @param {string|array} text1 - First text (string or array of lines)
 * @param {string|array} text2 - Second text (string or array of lines)
 * @param {object} options - Options for diff format
 * @returns {string|array} - Diff output in specified format
 */
function DIFF(text1, text2, options = {}) {
  // Validate required parameters
  if (text1 === undefined || text1 === null) {
    throw new Error('DIFF function requires at least 2 parameters: text1 and text2');
  }
  if (text2 === undefined || text2 === null) {
    throw new Error('DIFF function requires 2 parameters: text1 and text2');
  }

  const {
    format = 'unified',    // 'unified', 'lines', 'words', 'chars', 'json', 'patch'
    context = 3,           // Lines of context for unified diff
    filename1 = 'a',       // First filename for patch header
    filename2 = 'b'        // Second filename for patch header
  } = options;

  // Convert inputs to strings if they're arrays
  let str1 = Array.isArray(text1) ? text1.join('\n') : String(text1);
  let str2 = Array.isArray(text2) ? text2.join('\n') : String(text2);

  // REXX doesn't process escape sequences in strings, so we need to handle them
  // Convert common escape sequences (only for string inputs, not arrays)
  if (!Array.isArray(text1)) {
    str1 = str1.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
  }
  if (!Array.isArray(text2)) {
    str2 = str2.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
  }

  switch (format.toLowerCase()) {
    case 'unified':
    case 'patch':
      // Create unified diff (like `diff -u`)
      return Diff.createPatch(filename2, str1, str2, filename1, filename2, { context });

    case 'lines':
      // Line-by-line diff returning array of change objects
      return Diff.diffLines(str1, str2);

    case 'words':
      // Word-by-word diff
      return Diff.diffWords(str1, str2);

    case 'chars':
    case 'characters':
      // Character-by-character diff
      return Diff.diffChars(str1, str2);

    case 'json':
      // Line diff as JSON-friendly format
      const lineDiff = Diff.diffLines(str1, str2);
      return lineDiff.map(part => ({
        added: part.added || false,
        removed: part.removed || false,
        value: part.value,
        count: part.count
      }));

    case 'summary':
      // Return simple summary
      const changes = Diff.diffLines(str1, str2);
      const added = changes.filter(c => c.added).reduce((sum, c) => sum + c.count, 0);
      const removed = changes.filter(c => c.removed).reduce((sum, c) => sum + c.count, 0);
      const unchanged = changes.filter(c => !c.added && !c.removed).reduce((sum, c) => sum + c.count, 0);
      return {
        added,
        removed,
        unchanged,
        total: added + removed + unchanged
      };

    default:
      throw new Error(`Unknown diff format: ${format}`);
  }
}

/**
 * DIFF_APPLY - Apply a patch to text
 *
 * @param {string} text - Original text
 * @param {string} patch - Patch to apply (unified diff format)
 * @returns {string} - Patched text
 */
function DIFF_APPLY(text, patch) {
  // Handle escape sequences in text
  let processedText = String(text).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');

  let patches;
  try {
    patches = Diff.parsePatch(patch);
  } catch (e) {
    throw new Error('Invalid patch format: ' + e.message);
  }

  if (!patches || patches.length === 0 || !patches[0].hunks || patches[0].hunks.length === 0) {
    throw new Error('Invalid patch format');
  }

  const result = Diff.applyPatch(processedText, patches[0]);
  if (result === false || result === null) {
    throw new Error('Patch could not be applied');
  }

  return result;
}

/**
 * DIFF_PATCH - Create a structured patch object
 *
 * @param {string} text1 - Original text
 * @param {string} text2 - Modified text
 * @param {object} options - Patch options
 * @returns {object} - Structured patch object
 */
function DIFF_PATCH(text1, text2, options = {}) {
  // Validate required parameters
  if (text1 === undefined || text1 === null) {
    throw new Error('DIFF_PATCH function requires at least 2 parameters: text1 and text2');
  }
  if (text2 === undefined || text2 === null) {
    throw new Error('DIFF_PATCH function requires 2 parameters: text1 and text2');
  }

  const { filename1 = 'a', filename2 = 'b' } = options;

  let str1 = Array.isArray(text1) ? text1.join('\n') : String(text1);
  let str2 = Array.isArray(text2) ? text2.join('\n') : String(text2);

  // Handle escape sequences (only for string inputs, not arrays)
  if (!Array.isArray(text1)) {
    str1 = str1.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
  }
  if (!Array.isArray(text2)) {
    str2 = str2.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
  }

  // createPatch(filename, oldStr, newStr, oldHeader, newHeader, options)
  const patchText = Diff.createPatch('file', str1, str2, filename1, filename2);
  const patches = Diff.parsePatch(patchText);

  // Set custom filenames if provided
  if (patches && patches[0]) {
    patches[0].oldFileName = filename1;
    patches[0].newFileName = filename2;
  }

  return patches[0] || null;
}

/**
 * PATCH - Apply a unified diff patch to text
 *
 * @param {string} text - Original text to patch
 * @param {string|object} patch - Unified diff patch (string) or parsed patch object
 * @param {object} options - Patch options
 * @returns {string|object} - Patched text, or result object if returnResult=true
 *
 * @example
 * // Apply a patch string
 * PATCH("line1\nline2\nline3", patchString)
 *
 * // Get detailed result
 * PATCH(original, patch, {returnResult: true})
 */
function PATCH(text, patch, options = {}) {
  const {
    fuzz = 0,              // Fuzz factor for inexact matching
    returnResult = false,  // Return detailed result object instead of just text
    compareLine = null     // Custom line comparison function
  } = options;

  // Handle escape sequences in text (like DIFF)
  let processedText = text;
  if (typeof text === 'string') {
    processedText = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
  }

  // Parse patch if it's a string
  let patchObj;
  if (typeof patch === 'string') {
    try {
      const parsed = Diff.parsePatch(patch);
      if (!parsed || parsed.length === 0) {
        throw new Error('Invalid patch format: no patches found');
      }
      patchObj = parsed[0];
    } catch (e) {
      throw new Error(`Invalid patch format: ${e.message}`);
    }
  } else if (typeof patch === 'object' && patch.hunks) {
    patchObj = patch;
  } else {
    throw new Error('Patch must be a string (unified diff) or parsed patch object');
  }

  // Check if patch has hunks
  if (!patchObj.hunks || patchObj.hunks.length === 0) {
    throw new Error('Invalid patch: no hunks found');
  }

  // Build options for applyPatch
  const applyOptions = { fuzz };
  if (compareLine) {
    applyOptions.compareLine = compareLine;
  }

  // Apply the patch
  const result = Diff.applyPatch(processedText, patchObj, applyOptions);

  if (result === false) {
    throw new Error('Patch could not be applied - conflicts detected');
  }

  if (returnResult) {
    return {
      success: result !== false,
      text: result,
      hunks: patchObj.hunks.length,
      oldFileName: patchObj.oldFileName,
      newFileName: patchObj.newFileName
    };
  }

  return result;
}

/**
 * PATCH_CHECK - Check if a patch can be applied without actually applying it
 *
 * @param {string} text - Original text
 * @param {string|object} patch - Patch to check
 * @param {object} options - Options (fuzz, compareLine)
 * @returns {object} - {canApply: boolean, conflicts: array}
 */
function PATCH_CHECK(text, patch, options = {}) {
  // Validate required parameters
  if (text === undefined || text === null) {
    throw new Error('PATCH_CHECK function requires at least 2 parameters: text and patch');
  }
  if (patch === undefined || patch === null) {
    throw new Error('PATCH_CHECK function requires 2 parameters: text and patch');
  }

  try {
    // Try to apply the patch
    PATCH(text, patch, { ...options, returnResult: true });
    return {
      canApply: true,
      conflicts: []
    };
  } catch (e) {
    return {
      canApply: false,
      conflicts: [e.message]
    };
  }
}

/**
 * PATCH_APPLY_MULTIPLE - Apply multiple patches in sequence
 *
 * @param {string} text - Original text
 * @param {array} patches - Array of patches to apply
 * @param {object} options - Options for each patch
 * @returns {string|object} - Final patched text or result object
 */
function PATCH_APPLY_MULTIPLE(text, patches, options = {}) {
  const {
    stopOnError = true,    // Stop if any patch fails
    returnResults = false  // Return array of results instead of final text
  } = options;

  let currentText = text;
  const results = [];

  for (let i = 0; i < patches.length; i++) {
    try {
      const result = PATCH(currentText, patches[i], { ...options, returnResult: true });
      currentText = result.text;
      results.push({
        index: i,
        success: true,
        ...result
      });
    } catch (e) {
      results.push({
        index: i,
        success: false,
        error: e.message
      });

      if (stopOnError) {
        if (returnResults) {
          return results;
        }
        throw new Error(`Patch ${i} failed: ${e.message}`);
      }
    }
  }

  if (returnResults) {
    return results;
  }

  return currentText;
}

/**
 * PATCH_CREATE_REVERSE - Create a reverse patch (to undo a patch)
 *
 * @param {string|object} patch - Original patch
 * @returns {object} - Reversed patch object
 */
function PATCH_CREATE_REVERSE(patch) {
  // Validate required parameter
  if (patch === undefined || patch === null) {
    throw new Error('PATCH_CREATE_REVERSE function requires 1 parameter: patch');
  }

  // Parse patch if string
  let patchObj;
  if (typeof patch === 'string') {
    const parsed = Diff.parsePatch(patch);
    if (!parsed || parsed.length === 0) {
      throw new Error('Invalid patch format');
    }
    patchObj = parsed[0];
  } else {
    patchObj = patch;
  }

  // Create reversed patch by swapping old/new
  const reversed = {
    oldFileName: patchObj.newFileName,
    newFileName: patchObj.oldFileName,
    oldHeader: patchObj.newHeader,
    newHeader: patchObj.oldHeader,
    hunks: patchObj.hunks.map(hunk => ({
      oldStart: hunk.newStart,
      oldLines: hunk.newLines,
      newStart: hunk.oldStart,
      newLines: hunk.oldLines,
      lines: hunk.lines.map(line => {
        if (line[0] === '+') return '-' + line.substring(1);
        if (line[0] === '-') return '+' + line.substring(1);
        return line;
      })
    }))
  };

  return reversed;
}

/**
 * Detection function for RexxJS library system
 * @returns {object} Library metadata
 */
function DIFF_FUNCTIONS_META() {
  return {
    library: 'diff-functions',
    version: '1.0.0',
    description: 'Text diffing and patching functions',
    functions: ['DIFF', 'DIFF_APPLY', 'DIFF_PATCH', 'PATCH', 'PATCH_CHECK', 'PATCH_APPLY_MULTIPLE', 'PATCH_CREATE_REVERSE'],
    dependencies: ['diff'],
    environment: ['nodejs', 'browser']
  };
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DIFF,
    DIFF_APPLY,
    DIFF_PATCH,
    PATCH,
    PATCH_CHECK,
    PATCH_APPLY_MULTIPLE,
    PATCH_CREATE_REVERSE,
    DIFF_FUNCTIONS_META
  };
}
