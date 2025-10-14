/**
 * Shared utilities for ADDRESS container/VM handlers
 * Provides common functions for Docker, Podman, systemd-nspawn, QEMU, VirtualBox, etc.
 */

/**
 * Interpolate variables in a message template
 * Note: Interpolation is now handled by the interpreter before ADDRESS commands are invoked
 * This function is kept for backwards compatibility but just returns the template
 * @param {string} template - Template string with variables
 * @param {object} context - Context object with variable values
 * @returns {Promise<string>} Interpolated string
 */
async function interpolateMessage(template, context = {}) {
  if (!template || typeof template !== 'string') return template;

  // Default: support {var}, {{var}}, ${var}, and %var% patterns
  return template
    .replace(/\{([^}]+)\}/g, (m, v) => (context[v] !== undefined ? String(context[v]) : m))
    .replace(/\$\{([^}]+)\}/g, (m, v) => (context[v] !== undefined ? String(context[v]) : m))
    .replace(/%([^%]+)%/g, (m, v) => (context[v] !== undefined ? String(context[v]) : m));
}

/**
 * Create a logging function for a specific handler
 * @param {string} handlerName - Name of the handler (e.g., 'ADDRESS_DOCKER')
 * @returns {Function} Log function
 */
function createLogFunction(handlerName) {
  return function log(operation, details) {
    if (typeof process !== 'undefined' && process.env && process.env.DEBUG) {
      try {
        console.log(`[${handlerName}] ${operation}`, details);
      } catch (e) {
        // Silently fail
      }
    }
  };
}

/**
 * Log activity (alias for debugging)
 * @param {string} activity - Activity description
 * @param {object} details - Activity details
 */
function logActivity(activity, details) {
  if (typeof process !== 'undefined' && process.env && process.env.DEBUG) {
    try {
      console.log(`[ACTIVITY] ${activity}`, details);
    } catch (e) {
      // Silently fail
    }
  }
}

/**
 * Parse command string into operation and parameters
 * @param {string} cmd - Command string
 * @returns {object} Parsed command with operation and params
 */
function parseCommand(cmd) {
  const trimmed = (cmd || '').trim();
  if (!trimmed) return { operation: '', params: {} };

  // Handle simple commands without parameters
  if (['status', 'list'].includes(trimmed)) {
    return { operation: trimmed, params: {} };
  }

  // Extract operation (first word)
  const firstSpace = trimmed.indexOf(' ');
  const operation = firstSpace === -1 ? trimmed : trimmed.substring(0, firstSpace);
  const paramString = firstSpace === -1 ? '' : trimmed.substring(firstSpace + 1).trim();

  const params = {};
  if (!paramString) {
    return { operation, params };
  }

  // Parse parameters, handling quoted values
  const regex = /(\w+)=((?:"[^"]*"|'[^']*'|[^\s]+))/g;
  let match;
  const matchedRanges = [];

  while ((match = regex.exec(paramString)) !== null) {
    const key = match[1];
    let value = match[2];

    // Track which parts of the string we've already matched
    matchedRanges.push({ start: match.index, end: match.index + match[0].length });

    // Remove quotes
    value = value.replace(/^["']|["']$/g, '');

    // Keep as string to preserve format (e.g., "8.0" should not become 8)
    params[key] = value;
  }

  // Also handle boolean flags (parameters without =)
  // But only for tokens that weren't part of a key=value pair
  const words = paramString.split(/\s+/);
  let currentPos = 0;
  for (const word of words) {
    const wordStart = paramString.indexOf(word, currentPos);
    const wordEnd = wordStart + word.length;

    // Check if this word overlaps with any matched range
    const isPartOfKeyValue = matchedRanges.some(range =>
      (wordStart >= range.start && wordStart < range.end) ||
      (wordEnd > range.start && wordEnd <= range.end)
    );

    if (!word.includes('=') && !isPartOfKeyValue && word.length > 0) {
      params[word] = true;
    }

    currentPos = wordEnd;
  }

  return { operation, params };
}

/**
 * Parse command parts (alias for parseCommand)
 * @param {string} cmd - Command string
 * @returns {object} Parsed command
 */
function parseCommandParts(cmd) {
  return parseCommand(cmd);
}

/**
 * Parse memory limit string to bytes
 * @param {string} limit - Memory limit (e.g., '512m', '2g', '1024k', '1t')
 * @returns {number} Memory in bytes
 */
function parseMemoryLimit(limit) {
  if (!limit || typeof limit !== 'string') return 0;

  const match = limit.match(/^(\d+(?:\.\d+)?)\s*([kmgt]?b?)$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'b').toLowerCase();

  const multipliers = {
    'b': 1,
    'k': 1024,
    'kb': 1024,
    'm': 1024 * 1024,
    'mb': 1024 * 1024,
    'g': 1024 * 1024 * 1024,
    'gb': 1024 * 1024 * 1024,
    't': 1024 * 1024 * 1024 * 1024,
    'tb': 1024 * 1024 * 1024 * 1024
  };

  return Math.floor(value * (multipliers[unit] || 1));
}

/**
 * Test if a runtime binary is available
 * @param {string} runtime - Runtime binary name
 * @returns {Promise<boolean>} True if runtime is available
 */
function testRuntime(runtime) {
  const { spawn } = require('child_process');

  return new Promise((resolve, reject) => {
    const proc = spawn(runtime, ['--version'], { stdio: 'ignore' });
    const timeout = setTimeout(() => {
      try { proc.kill(); } catch (e) {}
      reject(new Error(`${runtime} test timeout`));
    }, 5000);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`${runtime} test failed with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`${runtime} not found: ${err.message}`));
    });
  });
}

/**
 * Validate command string for security
 * @param {string} cmd - Command to validate
 * @param {Set} bannedCommands - Set of banned command patterns
 * @returns {Array<string>} List of security violations
 */
function validateCommand(cmd, bannedCommands = new Set()) {
  const violations = [];

  if (typeof cmd !== 'string' || cmd.length === 0) {
    violations.push('Command must be a non-empty string');
    return violations;
  }

  // Check for banned commands
  for (const banned of bannedCommands) {
    if (cmd.includes(banned)) {
      violations.push(`Command contains banned pattern: ${banned}`);
    }
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /rm\s+-rf?\s+\/(?!tmp|var\/tmp)/,  // rm -rf / or rm -r / (except safe dirs)
    />\s*\/dev\/(sda|sdb|sdc|nvme)/,   // Writing to disk devices
    /dd\s+.*of=\/dev/,                   // dd to disk devices
    /fork\(\)/,                          // Fork bombs
    /:\(\)\s*\{/,                        // Shell fork bomb pattern
    /eval\s*\(/,                         // eval() in various forms
    /;\s*rm\s+/,                         // Semicolon-chained rm commands
    /&\s*$/,                             // Background process execution
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(cmd)) {
      violations.push(`Command contains dangerous pattern: ${pattern.source}`);
    }
  }

  return violations;
}

/**
 * Validate volume path for security
 * @param {string} volumePath - Path to validate
 * @param {string} securityMode - Security mode ('strict', 'moderate', 'permissive')
 * @param {Set} allowedPaths - Set of allowed volume paths
 * @returns {boolean} True if path is valid
 */
function validateVolumePath(volumePath, securityMode = 'moderate', allowedPaths = new Set()) {
  if (!volumePath || typeof volumePath !== 'string') return false;

  // In permissive mode, allow all paths
  if (securityMode === 'permissive') return true;

  // In strict mode, only allow explicitly whitelisted paths
  if (securityMode === 'strict') {
    return Array.from(allowedPaths).some(allowed => volumePath.startsWith(allowed));
  }

  // In moderate mode, block dangerous paths
  const dangerousPaths = ['/', '/etc', '/sys', '/proc', '/dev', '/boot', '/root'];
  return !dangerousPaths.some(dangerous => volumePath === dangerous || volumePath.startsWith(dangerous + '/'));
}

/**
 * Validate binary path for security
 * @param {string} binaryPath - Path to validate
 * @param {string} securityMode - Security mode
 * @param {Set} trustedBinaries - Set of trusted binary paths
 * @param {Function} auditCallback - Callback for audit events
 * @returns {boolean} True if binary is trusted
 */
function validateBinaryPath(binaryPath, securityMode = 'moderate', trustedBinaries = new Set(), auditCallback = null) {
  if (!binaryPath || typeof binaryPath !== 'string') return false;

  // In permissive mode, allow all binaries
  if (securityMode === 'permissive') return true;

  // In strict mode, only allow explicitly trusted binaries
  if (securityMode === 'strict') {
    const isTrusted = trustedBinaries.has(binaryPath);
    if (auditCallback) {
      auditCallback('binary_validation', {
        path: binaryPath,
        securityMode,
        trusted: isTrusted,
        reason: isTrusted ? 'explicitly_trusted' : 'not_in_trusted_set'
      });
    }
    return isTrusted;
  }

  // In moderate mode, allow binaries in standard locations or current directory
  const standardPaths = ['/usr/local/bin/', '/usr/bin/', '/bin/'];
  const isStandard = standardPaths.some(prefix => binaryPath.startsWith(prefix));

  // Allow current directory paths (starts with ./ or contains current working dir)
  const isCurrentDir = binaryPath.startsWith('./');
  const isAbsolutePath = binaryPath.startsWith('/');
  const hasRexxPattern = binaryPath.includes('rexx');

  // In moderate mode, allow:
  // 1. Standard system paths
  // 2. Current directory (./)
  // 3. Paths containing 'rexx' (RexxJS binaries)
  // 4. Explicitly trusted binaries
  const isAllowed = isStandard || isCurrentDir || (isAbsolutePath && hasRexxPattern) || trustedBinaries.has(binaryPath);

  if (auditCallback) {
    auditCallback('binary_validation', {
      path: binaryPath,
      securityMode,
      allowed: isAllowed,
      reason: isAllowed ? 'path_allowed' : 'path_not_allowed'
    });
  }

  return isAllowed;
}

/**
 * Audit security event
 * @param {string} event - Event name
 * @param {object} details - Event details
 * @param {string} securityMode - Security mode
 * @param {Array} auditLog - Audit log array
 * @param {Function} logFunc - Log function
 */
function auditSecurityEvent(event, details, securityMode, auditLog, logFunc) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    securityMode
  };

  if (auditLog) {
    auditLog.push(auditEntry);
  }

  if (logFunc) {
    logFunc('security_event', auditEntry);
  }
}

/**
 * Calculate uptime from start time
 * @param {string|number|Date} startTime - Start time
 * @returns {string} Uptime string
 */
function calculateUptime(startTime) {
  if (!startTime) return '0s';

  const start = typeof startTime === 'string' ? new Date(startTime).getTime() :
                typeof startTime === 'number' ? startTime :
                startTime.getTime();

  const uptimeMs = Math.max(0, Date.now() - start);

  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Parse key=value parameter string
 * @param {string} paramStr - Parameter string
 * @returns {object} Parsed parameters
 */
function parseKeyValueString(paramStr) {
  if (!paramStr || typeof paramStr !== 'string') return {};

  const params = {};

  // Match key=value patterns, handling quoted values
  const regex = /(\w+)=([^\s]+|"[^"]*"|'[^']*')/g;
  let match;

  while ((match = regex.exec(paramStr)) !== null) {
    const key = match[1];
    let value = match[2];

    // Remove quotes
    value = value.replace(/^["']|["']$/g, '');

    // Convert to number if it looks like an integer or if string representation matches
    const numValue = Number(value);
    if (!isNaN(numValue) && value !== '') {
      // Only convert if string representation matches (preserves "8.0" as "8.0")
      params[key] = String(numValue) === value ? numValue : value;
    } else {
      params[key] = value;
    }
  }

  return params;
}

/**
 * Parse CHECKPOINT output for progress monitoring
 * @param {string} output - Output string containing CHECKPOINT markers
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Array} Array of checkpoint records
 */
function parseCheckpointOutput(output, progressCallback) {
  const checkpoints = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (line.includes('CHECKPOINT')) {
      // Try function call format: CHECKPOINT('NAME', 'key=value key2=value2')
      const funcMatch = line.match(/CHECKPOINT\s*\(\s*['"](\w+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
      if (funcMatch) {
        const checkpoint = funcMatch[1];
        const paramsStr = funcMatch[2];
        const params = parseKeyValueString(paramsStr);

        checkpoints.push({ checkpoint, params });

        if (progressCallback) {
          progressCallback(checkpoint, params);
        }
        continue;
      }

      // Try JSON format: CHECKPOINT name {"key": "value"}
      const jsonMatch = line.match(/CHECKPOINT\s+(\w+)\s+(\{.+\})/);
      if (jsonMatch) {
        try {
          const checkpoint = jsonMatch[1];
          const params = JSON.parse(jsonMatch[2]);
          checkpoints.push({ checkpoint, params });

          if (progressCallback) {
            progressCallback(checkpoint, params);
          }
          continue;
        } catch (e) {
          // Fall through to simple match
        }
      }

      // Simple format: CHECKPOINT name key1=value1 key2=value2
      const match = line.match(/CHECKPOINT\s+(\w+)(?:\s+(.+))?/);
      if (match) {
        const checkpoint = match[1];
        const paramsStr = match[2] || '';
        const params = parseKeyValueString(paramsStr);

        checkpoints.push({ checkpoint, params });

        if (progressCallback) {
          progressCallback(checkpoint, params);
        }
      }
    }
  }

  return checkpoints;
}

/**
 * Wrap RexxJS script with CHECKPOINT monitoring
 * @param {string} script - Original script
 * @param {object} options - Wrapping options
 * @returns {string} Wrapped script
 */
function wrapScriptWithCheckpoints(script, options = {}) {
  if (!script) return script;

  // Add CHECKPOINT at start and end
  const wrapped = `
/* Auto-wrapped with CHECKPOINT monitoring */
CALL CHECKPOINT 'SCRIPT_START'

${script}

CALL CHECKPOINT 'SCRIPT_END'
  `.trim();

  return wrapped;
}

/**
 * Parse enhanced CHECKPOINT output with structured data
 * @param {string} output - Output containing CHECKPOINT markers
 * @param {Function} callback - Callback for each checkpoint
 * @returns {Array} Array of checkpoint records
 */
function parseEnhancedCheckpointOutput(output, callback) {
  const checkpoints = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (line.includes('CHECKPOINT')) {
      // Support both simple and JSON checkpoint formats
      const simpleMatch = line.match(/CHECKPOINT\s+(\w+)(?:\s+(.+))?/);
      const jsonMatch = line.match(/CHECKPOINT\s+(\w+)\s+(\{.+\})/);

      if (jsonMatch) {
        try {
          const checkpoint = jsonMatch[1];
          const params = JSON.parse(jsonMatch[2]);
          const record = { checkpoint, params };
          checkpoints.push(record);
          if (callback) callback(record);
        } catch (e) {
          // Fall through to simple match
        }
      } else if (simpleMatch) {
        const checkpoint = simpleMatch[1];
        const paramsStr = simpleMatch[2] || '';
        const params = parseKeyValueString(paramsStr);
        const record = { checkpoint, params };
        checkpoints.push(record);
        if (callback) callback(record);
      }
    }
  }

  return checkpoints;
}

/**
 * Format status string
 * @param {string} runtime - Runtime name
 * @param {number} containers - Active container count
 * @param {number} max - Maximum containers
 * @param {string} security - Security mode
 * @returns {string} Formatted status string
 */
function formatStatus(runtime, containers, max, security) {
  return `${runtime} | containers: ${containers}/${max} | security: ${security}`;
}

// Export all functions
module.exports = {
  interpolateMessage,
  createLogFunction,
  logActivity,
  parseCommand,
  parseCommandParts,
  parseMemoryLimit,
  testRuntime,
  validateCommand,
  validateVolumePath,
  validateBinaryPath,
  auditSecurityEvent,
  calculateUptime,
  parseKeyValueString,
  parseCheckpointOutput,
  wrapScriptWithCheckpoints,
  parseEnhancedCheckpointOutput,
  formatStatus
};
