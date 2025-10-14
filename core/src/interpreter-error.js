'use strict';

class RexxError extends Error {
  constructor(message, type = 'REXX', sourceContext = null) {
    super(message);
    this.name = 'RexxError';
    this.type = type;
    this.sourceContext = sourceContext;

    // Format the message with source context if available
    if (sourceContext && sourceContext.lineNumber && sourceContext.sourceLine) {
      const filename = sourceContext.sourceFilename || 'unknown';
      const contextLine = sourceContext.sourceLine.trim();
      this.message = `Rexx ${type}: ${contextLine} (${filename}: ${sourceContext.lineNumber})\n${message}`;
    }
  }

  // Provide a toJSON method to prevent circular references during serialization
  toJSON() {
    const result = {
      name: this.name,
      message: this.message,
      type: this.type,
      stack: this.stack
    };

    // Include sourceContext but remove any circular references
    if (this.sourceContext) {
      result.sourceContext = {
        lineNumber: this.sourceContext.lineNumber,
        sourceLine: this.sourceContext.sourceLine,
        sourceFilename: this.sourceContext.sourceFilename
        // Exclude interpreter and any other potentially circular references
      };
    }

    return result;
  }
}

module.exports = { RexxError };
