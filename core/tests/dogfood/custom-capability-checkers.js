/*!
 * Custom Capability Checkers - Example
 * Shows how to define custom logic for capability detection
 * Copyright (c) 2025 Paul Hammant | MIT License
 */

const { execSync } = require('child_process');

/**
 * Custom Docker checker - verifies daemon is running, not just command exists
 */
function HAS_DOCKER() {
  try {
    // First check if command exists
    const checkCmd = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${checkCmd} docker`, { stdio: 'ignore' });

    // Then verify daemon is actually running
    execSync('docker info', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Custom Podman checker - verifies it's working
 */
function HAS_PODMAN() {
  try {
    const checkCmd = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${checkCmd} podman`, { stdio: 'ignore' });
    execSync('podman info', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Custom checker for hypothetical "doofus" capability
 * This could check anything - environment variables, files, API endpoints, etc.
 */
function HAS_DOOFUS() {
  // Example 1: Check environment variable
  if (process.env.DOOFUS_ENABLED === 'true') {
    return true;
  }

  // Example 2: Check if command exists
  try {
    const checkCmd = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${checkCmd} doofus`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Custom checker based on Node.js version
 */
function HAS_NODE_18_PLUS() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  return major >= 18;
}

/**
 * Custom checker for Linux-only features
 */
function HAS_LINUX() {
  return process.platform === 'linux';
}

/**
 * Custom checker for macOS-only features
 */
function HAS_MACOS() {
  return process.platform === 'darwin';
}

/**
 * Custom checker for Windows-only features
 */
function HAS_WINDOWS() {
  return process.platform === 'win32';
}

// Export all custom checkers
module.exports = {
  HAS_DOCKER,
  HAS_PODMAN,
  HAS_DOOFUS,
  HAS_NODE_18_PLUS,
  HAS_LINUX,
  HAS_MACOS,
  HAS_WINDOWS
};
