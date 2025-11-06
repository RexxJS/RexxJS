'use strict';

/**
 * Library fetching utilities for REXX interpreter
 *
 * This module provides browser/Node.js compatible functions for fetching
 * library code from various sources (URLs, releases, etc).
 */

// Import library URL utilities
let libraryUrlUtils;
if (typeof require !== 'undefined') {
  libraryUrlUtils = require('./interpreter-library-url.js');
}

/**
 * Fetch library code from multiple sources
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} libraryName - The library name
 * @returns {Promise<string>} The library code
 */
async function fetchLibraryCode(interpreter, libraryName) {
  // Try multiple sources in order of preference
  const sources = getLibrarySources(interpreter, libraryName);

  for (const source of sources) {
    try {
      console.log(`Trying ${source.type}: ${source.url}`);
      return await fetchFromUrl(interpreter, source.url);
    } catch (error) {
      console.warn(`${source.type} failed for ${libraryName}: ${error.message}`);
      // Continue to next source
    }
  }

  throw new Error(`All sources failed for ${libraryName}`);
}

/**
 * Get library sources (wrapper to libraryUrlUtils)
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} libraryName - The library name
 * @returns {Array<Object>} List of sources to try
 */
function getLibrarySources(interpreter, libraryName) {
  return libraryUrlUtils.getLibrarySources(libraryName, interpreter.isBuiltinLibrary.bind(interpreter));
}

/**
 * Fetch from GitHub release with multiple fallback strategies
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} libraryName - The library name
 * @returns {Promise<string>} The library code
 */
async function fetchFromReleaseWithFallbacks(interpreter, libraryName) {
  const libraryRepo = interpreter.getLibraryRepository(libraryName);
  const tag = interpreter.getLibraryTag(libraryName);
  const libName = libraryName.split('/').pop().split('@')[0];

  // Strategy 1: Try common individual file patterns
  const filePatterns = [
    `${libName}.js`,
    `${libName}.min.js`,
    `${libName}-${tag}.js`,
    `bundle.js`,
    `index.js`
  ];

  for (const filename of filePatterns) {
    try {
      const url = `https://github.com/${libraryRepo}/releases/download/${tag}/${filename}`;
      console.log(`Trying release asset: ${filename}`);
      return await fetchFromUrl(interpreter, url);
    } catch (error) {
      // Continue to next pattern
    }
  }

  // Strategy 2: Try common zip patterns and extract
  const zipPatterns = [
    'dist.zip',
    `${libName}.zip`,
    `${libName}-${tag}.zip`,
    'release.zip'
  ];

  for (const zipName of zipPatterns) {
    try {
      const zipUrl = `https://github.com/${libraryRepo}/releases/download/${tag}/${zipName}`;
      console.log(`Trying ZIP release asset: ${zipName}`);
      return await fetchFromZipRelease(interpreter, zipUrl, libName);
    } catch (error) {
      // Continue to next pattern
    }
  }

  // Strategy 3: Fallback to raw file at the release tag
  console.log(`All release strategies failed, falling back to raw file at tag ${tag}`);
  const fallbackUrl = `https://raw.githubusercontent.com/${libraryRepo}/${tag}/dist/${libName}.js`;
  return await fetchFromUrl(interpreter, fallbackUrl);
}

/**
 * Fetch from ZIP release (not yet implemented)
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} zipUrl - The ZIP file URL
 * @param {string} libName - The library name
 * @returns {Promise<string>} The library code
 */
async function fetchFromZipRelease(interpreter, zipUrl, libName) {
  // This would require a ZIP extraction library in Node.js
  // For now, throw an error indicating ZIP support needed
  throw new Error(`ZIP release extraction not yet implemented for ${zipUrl}`);

  // TODO: Implement ZIP extraction
  // const zip = await fetchFromUrl(interpreter, zipUrl);
  // const jsContent = extractJavaScriptFromZip(zip, libName);
  // return jsContent;
}

/**
 * Fetch code from URL
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} url - The URL to fetch from
 * @returns {Promise<string>} The fetched content
 */
async function fetchFromUrl(interpreter, url) {
  if (typeof window !== 'undefined') {
    // Browser environment
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  } else {
    // Node.js environment
    const https = require('https');
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      }).on('error', reject);
    });
  }
}

/**
 * Wait for library response (browser postMessage-based)
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} requestId - The request ID to wait for
 * @returns {Promise<Object>} The library response
 */
async function waitForLibraryResponse(interpreter, requestId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Library request timeout (30s)'));
    }, 30000);

    const handler = (event) => {
      if (event.data.type === 'library-response' &&
          event.data.requestId === requestId) {
        cleanup();
        resolve(event.data);
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener('message', handler);
    };

    window.addEventListener('message', handler);
  });
}

// Export functions
module.exports = {
  fetchLibraryCode,
  getLibrarySources,
  fetchFromReleaseWithFallbacks,
  fetchFromZipRelease,
  fetchFromUrl,
  waitForLibraryResponse
};

// Browser environment support
if (typeof window !== 'undefined') {
  if (!window.rexxModuleRegistry) {
    window.rexxModuleRegistry = new Map();
  }
  window.rexxModuleRegistry.set('libraryFetching', module.exports);
}
