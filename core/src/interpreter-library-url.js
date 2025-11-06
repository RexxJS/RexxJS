/**
 * Library and URL utilities for REXX interpreter
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
 * 
 * Handles library URL resolution, GitHub raw/release URLs, and library source management
 * 
 * This module provides browser/Node.js compatible library and URL functions
 * for loading external REXX libraries from various sources.
 */

/**
 * Check if library name refers to local or npm module (not remote web-hosted)
 * @param {string} libraryName - Library name to check
 * @returns {boolean} True if local file, npm package, or registry-style name; false if remote web-hosted
 */
function isLocalOrNpmModule(libraryName) {
  // Local relative paths
  if (libraryName.startsWith('./') || libraryName.startsWith('../')) {
    return true;
  }
  
  // Check for remote web-hosted libraries (any HTTP/HTTPS URL or git hosting platforms)
  if (libraryName.startsWith('http://') || libraryName.startsWith('https://')) {
    return false; // Direct HTTP/HTTPS URLs are remote
  }
  
  // Check for common git hosting platforms (github.com, gitlab.com, bitbucket.org, etc.)
  const gitHostPatterns = [
    'github.com/',
    'gitlab.com/',
    'bitbucket.org/',
    'dev.azure.com/',
    'git.sr.ht/',
    'codeberg.org/',
    'gitea.com/'
  ];
  
  for (const pattern of gitHostPatterns) {
    if (libraryName.includes(pattern)) {
      return false; // Git hosting platforms are remote
    }
  }
  
  // Everything else is considered local/npm (package names, local files)
  return true;
}

/**
 * Get library type classification
 * @param {string} libraryName - Library name
 * @param {Function} isBuiltinLibraryFn - Function to check if library is built-in
 * @returns {string} Library type ('builtin', 'local', 'module', 'third-party')
 */
function getLibraryType(libraryName, isBuiltinLibraryFn) {
  // Check if it's a built-in library using our centralized list
  if (isBuiltinLibraryFn(libraryName)) {
    return 'builtin';
  }

  // Check if it's a direct HTTPS or HTTP URL (including localhost development server)
  if (libraryName.startsWith('https://') || libraryName.startsWith('http://')) {
    return 'https-url'; // Treated as HTTPS-URL type even if HTTP for security/permission purposes
  }

  // Check if it's a local file path
  if (libraryName.startsWith('./') || libraryName.startsWith('../') || libraryName.startsWith('/')) {
    return 'local';
  }

  // Check if it follows Go-style module path
  if (libraryName.startsWith('github.com/') ||
      libraryName.startsWith('gitlab.com/') ||
      libraryName.startsWith('dev.azure.com/')) {
    return 'module'; // e.g., "github.com/username/my-rexx-lib", "gitlab.com/user/repo", "dev.azure.com/org/project"
  }

  // Everything else is third-party (no more complex fallback classifications)
  return 'third-party';
}

/**
 * Get repository name from library name
 * @param {string} libraryName - Library name
 * @param {Function} isBuiltinLibraryFn - Function to check if library is built-in
 * @returns {string} Repository name
 */
function getLibraryRepository(libraryName, isBuiltinLibraryFn) {
  // Strip version specifier if present: "repo@v1.2.3" -> "repo"
  const libraryNameWithoutVersion = libraryName.split('@')[0];
  const libraryType = getLibraryType(libraryNameWithoutVersion, isBuiltinLibraryFn);
  
  switch (libraryType) {
    case 'builtin':
      return 'rexxjs/rexxjs';
      
    case 'module':
      // Extract repo from module path: 
      // "github.com/username/repo" -> "username/repo"
      // "gitlab.com/username/repo" -> "username/repo"  
      // "dev.azure.com/org/project" -> "org/project"
      if (libraryNameWithoutVersion.startsWith('dev.azure.com/')) {
        return libraryNameWithoutVersion.replace(/^dev\.azure\.com\//, '');
      }
      return libraryNameWithoutVersion.replace(/^(github|gitlab)\.com\//, '');
      
    case 'third-party':
    default:
      // If it contains a slash, it's username/repo format, otherwise assume rexx-libs
      return libraryNameWithoutVersion.includes('/') 
        ? libraryNameWithoutVersion
        : `rexx-libs/${libraryNameWithoutVersion}`;
  }
}

/**
 * Get tag/version from library name
 * @param {string} libraryName - Library name
 * @param {Function} isBuiltinLibraryFn - Function to check if library is built-in
 * @returns {string} Tag/version
 */
function getLibraryTag(libraryName, isBuiltinLibraryFn) {
  const libraryType = getLibraryType(libraryName, isBuiltinLibraryFn);
  
  // Check if library name includes version specifier
  if (libraryName.includes('@')) {
    const version = libraryName.split('@').pop();
    return version; // e.g., "v1.2.3" or "main" or commit hash
  }
  
  switch (libraryType) {
    case 'builtin':
      return 'refs/heads/main';
    case 'module':
    case 'third-party':
    default:
      return 'main';
  }
}

/**
 * Get file path for library
 * @param {string} libraryName - Library name  
 * @param {Function} isBuiltinLibraryFn - Function to check if library is built-in
 * @returns {string} File path
 */
function getLibraryPath(libraryName, isBuiltinLibraryFn) {
  const libraryType = getLibraryType(libraryName, isBuiltinLibraryFn);
  const libraryNameWithoutVersion = libraryName.split('@')[0];
  
  switch (libraryType) {
    case 'builtin':
      return `src/${libraryNameWithoutVersion}.js`;
    case 'module':
      // Third-party libraries with username/repo follow dist convention
      const libName = libraryNameWithoutVersion.split('/').pop(); // Extract name after slash
      return `dist/${libName}.js`;
    case 'third-party':
    default:
      // Simple libraries use lib directory
      return `lib/${libraryNameWithoutVersion}.js`;
  }
}

/**
 * Check if should use GitHub releases instead of raw files
 * @param {string} libraryName - Library name
 * @param {string} tag - Version tag
 * @returns {boolean} True if should use releases
 */
function shouldUseGitHubRelease(libraryName, tag) {
  // Use releases for:
  // 1. Semantic version tags: v1.2.3, 1.2.3
  // 2. Libraries that explicitly prefer releases
  return /^v?\d+\.\d+\.\d+/.test(tag);
}

/**
 * Resolve GitHub raw file URL
 * @param {string} libraryName - Library name
 * @param {Function} isBuiltinLibraryFn - Function to check if library is built-in
 * @returns {string} GitHub raw URL
 */
function resolveGitHubRawUrl(libraryName, isBuiltinLibraryFn) {
  const libraryRepo = getLibraryRepository(libraryName, isBuiltinLibraryFn);
  const tag = getLibraryTag(libraryName, isBuiltinLibraryFn);
  const path = getLibraryPath(libraryName, isBuiltinLibraryFn);
  
  return `https://raw.githubusercontent.com/${libraryRepo}/${tag}/${path}`;
}

/**
 * Resolve web library URL (local fallback)
 * @param {string} libraryName - Library name
 * @returns {string} Web library URL
 */
function resolveWebLibraryUrl(libraryName) {
  // Check for library mapping first
  if (typeof window !== 'undefined' && window.rexxjs && window.rexxjs.libMapping) {
    const mappedUrl = window.rexxjs.libMapping[libraryName];
    if (mappedUrl) {
      console.log(`Using mapped URL for ${libraryName}: ${mappedUrl}`);
      return mappedUrl;
    }
  }
  
  // Handle direct HTTP/HTTPS URLs - return as-is
  if (libraryName.startsWith('https://') || libraryName.startsWith('http://')) {
    return libraryName;
  }

  // Handle relative paths (../src/file.js or ./file.js) - return as-is
  if (libraryName.startsWith('../') || libraryName.startsWith('./') || libraryName.startsWith('/')) {
    return libraryName;
  }
  
  // For library names without extension, add .js and use /libs/ prefix
  if (!libraryName.endsWith('.js')) {
    return `/libs/${libraryName}.js`;
  }
  
  // For library names with .js extension, use /libs/ prefix but don't double-add .js
  return `/libs/${libraryName}`;
}

/**
 * Get all possible library sources in order of preference
 * @param {string} libraryName - Library name
 * @param {Function} isBuiltinLibraryFn - Function to check if library is built-in
 * @returns {Array} Array of source objects with type and url
 */
function getLibrarySources(libraryName, isBuiltinLibraryFn) {
  const sources = [];
  const libraryType = getLibraryType(libraryName, isBuiltinLibraryFn);
  
  // Handle direct HTTPS URLs - return as-is
  if (libraryType === 'https-url') {
    sources.push({ type: 'Direct HTTPS', url: libraryName });
    return sources;
  }
  
  const tag = getLibraryTag(libraryName, isBuiltinLibraryFn);
  const libName = libraryName.split('/').pop().split('@')[0];
  
  // 1. GitHub releases (RECOMMENDED - our standard convention)
  if (shouldUseGitHubRelease(libraryName, tag)) {
    sources.push(...getGitHubReleaseSources(libraryName, libName, tag, isBuiltinLibraryFn));
  }
  
  // 2. GitHub raw files (fallback for development)
  const githubUrl = resolveGitHubRawUrl(libraryName, isBuiltinLibraryFn);
  sources.push({ type: 'GitHub Raw', url: githubUrl });
  
  return sources;
}

/**
 * Check if should try CDN sources
 * @param {string} libraryName - Library name
 * @param {Function} isBuiltinLibraryFn - Function to check if library is built-in
 * @returns {boolean} True if should try CDN
 */
function shouldTryCDN(libraryName, isBuiltinLibraryFn) {
  // Try CDN for libraries that might be published to npm
  const libraryType = getLibraryType(libraryName, isBuiltinLibraryFn);
  return libraryType !== 'builtin'; // Try CDN for all third-party libraries
}

/**
 * Get CDN source URLs
 * @param {string} libraryName - Library name
 * @param {string} libName - Library name without path/version
 * @param {string} tag - Version tag
 * @param {Function} isBuiltinLibraryFn - Function to check if library is built-in
 * @returns {Array} Array of CDN source objects
 */
function getCDNSources(libraryName, libName, tag, isBuiltinLibraryFn) {
  const sources = [];
  const version = tag === 'main' || tag === 'latest' ? 'latest' : tag;
  
  // unpkg.com (npm packages)
  sources.push({
    type: 'unpkg CDN',
    url: `https://unpkg.com/${libName}@${version}/dist/${libName}.js`
  });
  
  // jsDelivr (npm + GitHub)
  sources.push({
    type: 'jsDelivr CDN', 
    url: `https://cdn.jsdelivr.net/npm/${libName}@${version}/dist/${libName}.js`
  });
  
  // For GitHub-style module names, try jsDelivr GitHub mode
  if (libraryName.includes('/')) {
    const repo = getLibraryRepository(libraryName, isBuiltinLibraryFn);
    sources.push({
      type: 'jsDelivr GitHub',
      url: `https://cdn.jsdelivr.net/gh/${repo}@${tag}/dist/${libName}.js`
    });
  }
  
  return sources;
}

/**
 * Get GitHub release source URLs
 * @param {string} libraryName - Library name
 * @param {string} libName - Library name without path/version
 * @param {string} tag - Version tag
 * @param {Function} isBuiltinLibraryFn - Function to check if library is built-in
 * @returns {Array} Array of GitHub release source objects
 */
function getGitHubReleaseSources(libraryName, libName, tag, isBuiltinLibraryFn) {
  const repo = getLibraryRepository(libraryName, isBuiltinLibraryFn);
  const sources = [];
  
  // Standard GitHub releases naming convention:
  // https://github.com/<owner>/<libraryName>/releases/download/<tag>/<filename>
  const patterns = [
    `${libName}-min.js`,       // FIRST: <libraryName>-min.js (minified, preferred)
    `${libName}.js`,           // SECOND: <libraryName>.js (development version)
    `${libName}-${tag}.js`,    // Fallback: versioned filename
    'bundle.js',               // Fallback: generic bundle
    'index.js'                 // Fallback: generic index
  ];
  
  for (const pattern of patterns) {
    sources.push({
      type: 'GitHub Release',
      url: `https://github.com/${repo}/releases/download/${tag}/${pattern}`
    });
  }
  
  return sources;
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { 
        isLocalOrNpmModule,
        getLibraryType,
        getLibraryRepository,
        getLibraryTag,
        getLibraryPath,
        shouldUseGitHubRelease,
        resolveGitHubRawUrl,
        resolveWebLibraryUrl,
        getLibrarySources,
        shouldTryCDN,
        getCDNSources,
        getGitHubReleaseSources
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - attach to global window
    window.isLocalOrNpmModule = isLocalOrNpmModule;
    window.getLibraryType = getLibraryType;
    window.getLibraryRepository = getLibraryRepository;
    window.getLibraryTag = getLibraryTag;
    window.getLibraryPath = getLibraryPath;
    window.shouldUseGitHubRelease = shouldUseGitHubRelease;
    window.resolveGitHubRawUrl = resolveGitHubRawUrl;
    window.resolveWebLibraryUrl = resolveWebLibraryUrl;
    window.getLibrarySources = getLibrarySources;
    window.shouldTryCDN = shouldTryCDN;
    window.getCDNSources = getCDNSources;
    window.getGitHubReleaseSources = getGitHubReleaseSources;
}