/*!
 * System Capabilities - Open Boolean Determination System
 * @requires is about boolean flags - ANY kind of yes/no determination
 * NOT just "commands in PATH"
 * Copyright (c) 2025 Paul Hammant | MIT License
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Cache for capability checks to avoid repeated evaluations
 */
const capabilityCache = new Map();

/**
 * Custom capability definitions loaded from external sources
 */
let customCapabilities = {};

/**
 * Load custom capability definitions from a file
 * Checks multiple locations for capability definitions
 */
function loadCustomCapabilities() {
  // Check for .rexxt-capabilities.js in current directory
  const locations = [
    '.rexxt-capabilities.js',
    'rexxt-capabilities.js',
    path.join(process.cwd(), '.rexxt-capabilities.js')
  ];

  for (const location of locations) {
    try {
      if (fs.existsSync(location)) {
        const definitions = require(path.resolve(location));
        customCapabilities = { ...customCapabilities, ...definitions };
        return;
      }
    } catch (error) {
      // Silently continue if file can't be loaded
    }
  }
}

// Try to load custom capabilities on module load
try {
  loadCustomCapabilities();
} catch (error) {
  // No custom capabilities found - that's fine
}

/**
 * Check if a command exists on the system
 * This is ONE type of boolean check, used as a fallback
 */
function hasCommand(command) {
  try {
    const checkCmd = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${checkCmd} ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a capability is available (OPEN BOOLEAN DETERMINATION)
 *
 * @requires is about ANY yes/no decision, not just "commands in PATH"
 *
 * Capability can be determined by:
 * 1. Environment variable: HAS_DOCKER=true
 * 2. Custom checker function: HAS_DOCKER()
 * 3. Configuration file: .rexxt-capabilities.js
 * 4. File existence check: /some/feature/flag
 * 5. Command in PATH (fallback)
 *
 * Examples of boolean determinations:
 *   @requires docker         → Is docker available? (any check)
 *   @requires feature-x      → Is feature-x enabled? (env var, file, config)
 *   @requires api-available  → Is API reachable? (custom check)
 *   @requires ci-environment → Running in CI? (env check)
 *   @requires gpu-support    → GPU available? (hardware check)
 *
 * This is OPEN - the meaning of ANY capability is user-defined
 */
function checkCapability(capability, customCheckers = {}) {
  const normalizedCap = capability.toLowerCase().trim();
  const cacheKey = `capability:${normalizedCap}`;

  // Check cache first
  if (capabilityCache.has(cacheKey)) {
    return capabilityCache.get(cacheKey);
  }

  let result = false;

  // Priority 1: Environment variable HAS_<CAPABILITY>=true
  const envVarName = `HAS_${normalizedCap.toUpperCase().replace(/-/g, '_')}`;
  if (process.env[envVarName]) {
    const envValue = process.env[envVarName].toLowerCase();
    result = envValue === 'true' || envValue === '1' || envValue === 'yes';
    capabilityCache.set(cacheKey, result);
    return result;
  }

  // Priority 2: Custom checker function passed in
  const checkerName = `HAS_${normalizedCap.toUpperCase().replace(/-/g, '_')}`;
  if (customCheckers[checkerName]) {
    result = customCheckers[checkerName]();
    capabilityCache.set(cacheKey, result);
    return result;
  }

  // Priority 3: Custom capability definitions from file
  if (customCapabilities[checkerName]) {
    if (typeof customCapabilities[checkerName] === 'function') {
      result = customCapabilities[checkerName]();
    } else if (typeof customCapabilities[checkerName] === 'boolean') {
      result = customCapabilities[checkerName];
    }
    capabilityCache.set(cacheKey, result);
    return result;
  }

  // Priority 4: Check if it's a file path (absolute or starts with ./)
  if (normalizedCap.startsWith('/') || normalizedCap.startsWith('./')) {
    result = fs.existsSync(normalizedCap);
    capabilityCache.set(cacheKey, result);
    return result;
  }

  // Priority 5: Default fallback - check if command exists in PATH
  result = hasCommand(normalizedCap);
  capabilityCache.set(cacheKey, result);
  return result;
}

/**
 * Register a custom capability checker dynamically
 */
function registerCapability(name, checker) {
  const normalizedName = `HAS_${name.toUpperCase().replace(/-/g, '_')}`;
  if (typeof checker === 'function') {
    customCapabilities[normalizedName] = checker;
  } else if (typeof checker === 'boolean') {
    customCapabilities[normalizedName] = checker;
  }
  // Clear cache for this capability if it exists
  capabilityCache.delete(`capability:${name.toLowerCase()}`);
}

/**
 * Clear the capability cache
 */
function clearCache() {
  capabilityCache.clear();
}

/**
 * Reload custom capabilities from file
 */
function reloadCapabilities() {
  customCapabilities = {};
  clearCache();
  loadCustomCapabilities();
}

module.exports = {
  hasCommand,
  checkCapability,
  registerCapability,
  clearCache,
  reloadCapabilities
};
