/*!
 * rexxt Capability Definitions - Example Configuration
 * Define what capabilities mean for YOUR tests
 *
 * @requires is about BOOLEAN DETERMINATION - any yes/no decision
 * This file shows various types of checks beyond "command in PATH"
 */

const { execSync } = require('child_process');
const fs = require('fs');

// ============= Boolean Flags =============

// Simple boolean - feature flag
exports.HAS_FEATURE_X = true;
exports.HAS_FEATURE_Y = false;

// ============= Environment-Based =============

// Check if running in CI
exports.HAS_CI_ENVIRONMENT = function() {
  return process.env.CI === 'true' ||
         process.env.GITHUB_ACTIONS === 'true' ||
         process.env.GITLAB_CI === 'true';
};

// Check Node.js version
exports.HAS_NODE_18_PLUS = function() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  return major >= 18;
};

// ============= Platform Checks =============

exports.HAS_LINUX = function() {
  return process.platform === 'linux';
};

exports.HAS_MACOS = function() {
  return process.platform === 'darwin';
};

exports.HAS_WINDOWS = function() {
  return process.platform === 'win32';
};

// ============= Hardware/System Checks =============

exports.HAS_GPU = function() {
  // Example: check for NVIDIA GPU
  try {
    execSync('nvidia-smi', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

exports.HAS_ENOUGH_MEMORY = function() {
  // Check if system has at least 4GB RAM
  const totalMem = require('os').totalmem();
  return totalMem >= 4 * 1024 * 1024 * 1024;
};

// ============= File/Directory Checks =============

exports.HAS_CONFIG_FILE = function() {
  return fs.existsSync('./config.json');
};

exports.HAS_TEST_DATA = function() {
  return fs.existsSync('./test-data') &&
         fs.statSync('./test-data').isDirectory();
};

// ============= Docker with Daemon Check =============

exports.HAS_DOCKER = function() {
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
};

// ============= Network/API Checks =============

exports.HAS_INTERNET = function() {
  try {
    execSync('ping -c 1 8.8.8.8', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
};

exports.HAS_LOCAL_API = function() {
  // Example: check if local dev API is running
  try {
    const http = require('http');
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000/health', (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
  } catch {
    return false;
  }
};

// ============= Custom Logic =============

exports.HAS_DOOFUS = function() {
  // Doofus is enabled if:
  // 1. DOOFUS_ENABLED env var is set, OR
  // 2. doofus command exists, OR
  // 3. .doofus file exists

  if (process.env.DOOFUS_ENABLED === 'true') {
    return true;
  }

  try {
    execSync('which doofus', { stdio: 'ignore' });
    return true;
  } catch {
    // Command not found
  }

  return fs.existsSync('./.doofus');
};

// ============= Composite Checks =============

exports.HAS_FULL_DOCKER_STACK = function() {
  // Requires both docker AND docker-compose
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 2000 });
    execSync('which docker-compose', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};
