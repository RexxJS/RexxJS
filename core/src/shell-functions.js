/**
 * Shell-Inspired Functions
 *
 * Modern file system operations inspired by Deno and Rust
 * - Rich native APIs (no shelling out)
 * - Named parameters for ergonomics
 * - Pipeline operator compatible
 * - Cross-platform using Node.js fs APIs
 *
 * Node.js only - requires file system access
 */

// Check if we're in Node.js environment
const isNodeJS = typeof require !== 'undefined' &&
                 typeof process !== 'undefined' &&
                 process.versions &&
                 process.versions.node;

// Only load Node.js dependencies if we're in Node.js
// This prevents webpack from trying to bundle them for the browser
let fs, path, child_process, os;

if (isNodeJS) {
  fs = require('fs');
  path = require('path');
  child_process = require('child_process');
  os = require('os');
}

/**
 * Helper to coerce boolean parameters that might be passed as strings or objects
 */
function toBool(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'object' && value.value !== undefined) {
    return toBool(value.value);
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
}

/**
 * Helper to coerce string parameters that might be passed as objects
 */
function toStr(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.value !== undefined) return String(value.value);
  return String(value);
}

/**
 * Check if pattern uses advanced glob features
 * @param {string} pattern - Pattern to check
 * @returns {boolean} True if pattern uses advanced features
 */
function hasAdvancedGlobFeatures(pattern) {
  // Check for character classes, brace expansion, extended globs, negation
  return /[\[\]\{\}\(\)\!]/.test(pattern);
}

/**
 * Simple wildcard pattern matching
 * Supports * (match any) and ? (match one character)
 * For advanced glob patterns, use extras/functions/minimatch module
 *
 * @param {string} str - String to test
 * @param {string} pattern - Pattern with * and ? wildcards
 * @returns {boolean} True if matches
 */
function matchWildcard(str, pattern) {
  // Check for advanced glob features and provide helpful error
  if (hasAdvancedGlobFeatures(pattern)) {
    throw new Error(
      `Pattern '${pattern}' uses advanced glob features (character classes, brace expansion, etc.).\n` +
      `Core shell functions only support simple wildcards: * and ?\n` +
      `For advanced patterns, use: REQUIRE "extras/functions/minimatch/minimatch-functions"`
    );
  }

  // Escape special regex characters except * and ?
  let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // Handle ** (recursive wildcard) before single *
  // Use placeholder to avoid affecting it with later replacements
  escaped = escaped.replace(/\*\*\//g, '__RECURSIVE__');

  // Handle remaining wildcards
  escaped = escaped
    .replace(/\*/g, '[^/]*')  // * matches anything except /
    .replace(/\?/g, '[^/]');  // ? matches any single char except /

  // Replace placeholder with the actual regex pattern
  escaped = escaped.replace(/__RECURSIVE__/g, '(?:.*?/)?');

  const regex = new RegExp('^' + escaped + '$');
  return regex.test(str);
}

/**
 * Walk directory recursively and return all files
 * No dependencies - pure fs operations
 *
 * @param {string} dirPath - Directory to walk
 * @param {string} pattern - Optional wildcard pattern to filter files
 * @returns {Array} Array of file paths
 */
function walkDirectory(dirPath, pattern = null) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const results = [];

  function scan(dir) {
    try {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);

        try {
          const stats = fs.statSync(fullPath);

          if (stats.isFile()) {
            // Apply pattern filter if provided
            if (!pattern || matchWildcard(entry, pattern)) {
              results.push(fullPath);
            }
          } else if (stats.isDirectory()) {
            // Recurse into subdirectories
            scan(fullPath);
          }
        } catch (e) {
          // Skip files/directories we can't access
          continue;
        }
      }
    } catch (e) {
      // Skip directories we can't read
      return;
    }
  }

  const stats = fs.statSync(dirPath);
  if (stats.isDirectory()) {
    scan(dirPath);
  } else if (stats.isFile()) {
    // If given a file path, just return it
    results.push(dirPath);
  }

  return results;
}

/**
 * LS_Browser - Browser-mode directory listing using HTTP methods
 * Supports WebDAV PROPFIND, JSON APIs, and HTML parsing
 *
 * @param {string} pathArg - URL path (relative to document.location or absolute)
 * @param {boolean} recursive - List recursively
 * @param {string} pattern - Glob pattern filter
 * @param {string} type - Filter by type: "file" or "directory"
 * @returns {Promise<Array>} Array of file/directory objects
 */
async function LS_Browser(pathArg, recursive = false, pattern = null, type = null) {
  // Resolve URL - absolute or relative to document.location
  let url;
  if (pathArg.startsWith('http://') || pathArg.startsWith('https://')) {
    url = pathArg;
  } else if (pathArg === '.') {
    // Current directory = directory of current page
    url = new URL('.', document.location.href).href;
  } else {
    // Relative path
    url = new URL(pathArg, document.location.href).href;
  }

  // Ensure URL ends with / for directory requests
  if (!url.endsWith('/')) {
    url += '/';
  }

  const results = [];

  // Try PROPFIND for WebDAV servers
  try {
    const propfindResponse = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Depth': recursive ? 'infinity' : '1',
        'Content-Type': 'application/xml'
      }
    });

    if (propfindResponse.ok) {
      const xml = await propfindResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');

      // Parse WebDAV multistatus response
      const responses = doc.querySelectorAll('response');

      for (const response of responses) {
        const href = response.querySelector('href')?.textContent;
        if (!href) continue;

        // Skip the parent directory itself in depth=1
        const fullUrl = new URL(href, url).href;
        if (fullUrl === url) continue;

        const propstat = response.querySelector('propstat');
        const prop = propstat?.querySelector('prop');

        const displayName = prop?.querySelector('displayname')?.textContent || href.split('/').filter(Boolean).pop();
        const contentLength = parseInt(prop?.querySelector('getcontentlength')?.textContent || '0');
        const lastModified = prop?.querySelector('getlastmodified')?.textContent;
        const isCollection = prop?.querySelector('resourcetype collection') !== null;

        const fileInfo = {
          name: displayName,
          path: fullUrl,
          relativePath: fullUrl.replace(url, ''),
          size: contentLength,
          mode: null,              // Not available via WebDAV/PROPFIND
          uid: null,               // Not available via WebDAV/PROPFIND
          gid: null,               // Not available via WebDAV/PROPFIND
          nlink: null,             // Not available via WebDAV/PROPFIND
          ino: null,               // Not available via WebDAV/PROPFIND
          isFile: !isCollection,
          isDirectory: isCollection,
          created: lastModified || new Date().toISOString(),
          modified: lastModified || new Date().toISOString(),
          accessed: lastModified || new Date().toISOString()
        };

        // Apply type filter
        if (type === 'file' && !fileInfo.isFile) continue;
        if (type === 'directory' && !fileInfo.isDirectory) continue;

        // Apply pattern filter
        if (pattern && !matchWildcard(fileInfo.name, pattern)) continue;

        results.push(fileInfo);
      }

      return results;
    }
  } catch (propfindError) {
    // PROPFIND failed, try other methods
  }

  // Fallback: Try to fetch as JSON (common REST API pattern)
  try {
    const jsonResponse = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (jsonResponse.ok && jsonResponse.headers.get('content-type')?.includes('application/json')) {
      const data = await jsonResponse.json();

      // Support common JSON directory listing formats
      const items = Array.isArray(data) ? data : (data.files || data.items || data.entries || []);

      for (const item of items) {
        const fileInfo = {
          name: item.name || item.filename || item.path,
          path: new URL(item.name || item.filename || item.path, url).href,
          relativePath: item.name || item.filename || item.path,
          size: item.size || item.length || 0,
          mode: item.mode || null,     // May be provided by REST API
          uid: item.uid || null,        // May be provided by REST API
          gid: item.gid || null,        // May be provided by REST API
          nlink: item.nlink || null,    // May be provided by REST API
          ino: item.ino || null,        // May be provided by REST API
          isFile: item.type === 'file' || !item.isDirectory,
          isDirectory: item.type === 'directory' || item.isDirectory,
          created: item.created || item.createdAt || new Date().toISOString(),
          modified: item.modified || item.modifiedAt || item.mtime || new Date().toISOString(),
          accessed: item.accessed || item.atime || new Date().toISOString()
        };

        // Apply filters
        if (type === 'file' && !fileInfo.isFile) continue;
        if (type === 'directory' && !fileInfo.isDirectory) continue;
        if (pattern && !matchWildcard(fileInfo.name, pattern)) continue;

        results.push(fileInfo);
      }

      return results;
    }
  } catch (jsonError) {
    // JSON failed, continue to HTML parsing
  }

  // Fallback: Parse HTML directory listing (Apache, nginx, etc.)
  try {
    const htmlResponse = await fetch(url);
    if (htmlResponse.ok) {
      const html = await htmlResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Look for links in common directory listing formats
      const links = doc.querySelectorAll('a[href]');

      for (const link of links) {
        const href = link.getAttribute('href');
        if (!href || href === '../' || href === '.' || href === '/') continue;

        const name = link.textContent.trim() || href;
        const isDirectory = href.endsWith('/');

        const fileInfo = {
          name: isDirectory ? name.slice(0, -1) : name,
          path: new URL(href, url).href,
          relativePath: href,
          size: 0,  // Not available from HTML
          mode: null,      // Not available from HTML
          uid: null,       // Not available from HTML
          gid: null,       // Not available from HTML
          nlink: null,     // Not available from HTML
          ino: null,       // Not available from HTML
          isFile: !isDirectory,
          isDirectory: isDirectory,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          accessed: new Date().toISOString()
        };

        // Apply filters
        if (type === 'file' && !fileInfo.isFile) continue;
        if (type === 'directory' && !fileInfo.isDirectory) continue;
        if (pattern && !matchWildcard(fileInfo.name, pattern)) continue;

        results.push(fileInfo);
      }

      return results;
    }
  } catch (htmlError) {
    throw new Error(`Failed to list directory at ${url}: ${htmlError.message}`);
  }

  return results;
}

/**
 * LS - List directory contents
 *
 * @param {string} path - Directory path
 * @param {boolean} recursive - List recursively
 * @param {string} pattern - Glob pattern filter (e.g., "*.txt")
 * @param {string} type - Filter by type: "file" or "directory"
 * @returns {Array} Array of file/directory objects with metadata
 */
function LS(pathArg, recursive = false, pattern = null, type = null) {
  const dirPath = pathArg || '.';
  recursive = toBool(recursive);

  // Browser mode: use HTTP methods
  if (!isNodeJS) {
    return LS_Browser(dirPath, recursive, pattern, type);
  }

  if (!fs.existsSync(dirPath)) {
    throw new Error(`Path does not exist: ${dirPath}`);
  }

  const results = [];

  function scan(dir, isRoot = true) {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);

      const fileInfo = {
        name: entry,
        path: fullPath,
        relativePath: path.relative(dirPath, fullPath),
        size: stats.size,
        mode: stats.mode,           // Permission bits (e.g., 33188 = 0100644)
        uid: stats.uid,              // User ID
        gid: stats.gid,              // Group ID
        nlink: stats.nlink,          // Number of hard links
        ino: stats.ino,              // Inode number
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        accessed: stats.atime.toISOString(),
      };

      // Check if should recurse into directories
      const shouldRecurse = fileInfo.isDirectory && recursive;

      // Apply type filter
      if (type === 'file' && !fileInfo.isFile) {
        if (shouldRecurse) scan(fullPath, false);
        continue;
      }
      if (type === 'directory' && !fileInfo.isDirectory) {
        continue;
      }

      // Apply pattern filter
      if (pattern) {
        if (!matchWildcard(fileInfo.name, pattern)) {
          // For recursive, check if we should continue into directories
          if (shouldRecurse) {
            scan(fullPath, false);
          }
          continue;
        }
      }

      results.push(fileInfo);

      // Recurse into directories
      if (shouldRecurse) {
        scan(fullPath, false);
      }
    }
  }

  scan(dirPath);
  return results;
}

/**
 * CAT - Read file contents
 *
 * @param {string} path - File path
 * @param {string} encoding - File encoding (default: utf8)
 * @returns {string} File contents
 */
function CAT(pathArg, encoding = 'utf8') {
  if (!fs.existsSync(pathArg)) {
    throw new Error(`File does not exist: ${pathArg}`);
  }

  return fs.readFileSync(pathArg, encoding);
}

/**
 * GREP - Search for pattern in files
 *
 * @param {string} pattern - Regex pattern to search for
 * @param {string} path - File path or glob pattern
 * @param {boolean} recursive - Search recursively
 * @param {boolean} ignoreCase - Case-insensitive search
 * @returns {Array} Array of match objects with file, line, lineNumber
 */
function GREP(pattern, pathArg, recursive = false, ignoreCase = false) {
  recursive = toBool(recursive);
  ignoreCase = toBool(ignoreCase);
  const results = [];

  // Process escape sequences in the pattern
  // Convert REXX-style escaped strings to JavaScript regex patterns
  // E.g., "\\b" should become "\b" for word boundary
  let processedPattern = pattern;
  if (typeof pattern === 'string') {
    // Replace double backslashes with single for common regex escape sequences
    processedPattern = pattern
      .replace(/\\\\b/g, '\\b')     // Word boundary
      .replace(/\\\\B/g, '\\B')     // Non-word boundary
      .replace(/\\\\d/g, '\\d')     // Digit
      .replace(/\\\\D/g, '\\D')     // Non-digit
      .replace(/\\\\s/g, '\\s')     // Whitespace
      .replace(/\\\\S/g, '\\S')     // Non-whitespace
      .replace(/\\\\w/g, '\\w')     // Word character
      .replace(/\\\\W/g, '\\W')     // Non-word character
      .replace(/\\\\t/g, '\\t')     // Tab
      .replace(/\\\\n/g, '\\n')     // Newline
      .replace(/\\\\r/g, '\\r');    // Carriage return
  }

  // Determine files to search
  let files = [];
  if (pathArg.includes('*') || pathArg.includes('?')) {
    // It's a wildcard pattern - extract base directory before any wildcards
    // Handle patterns like "dir/**/*.txt" or "dir/*.txt"
    const firstWildcard = Math.min(
      pathArg.indexOf('*') === -1 ? Infinity : pathArg.indexOf('*'),
      pathArg.indexOf('?') === -1 ? Infinity : pathArg.indexOf('?')
    );
    const pathBeforeWildcard = pathArg.substring(0, firstWildcard);
    const lastSlash = pathBeforeWildcard.lastIndexOf(path.sep);

    const dirPath = lastSlash > 0 ? pathBeforeWildcard.substring(0, lastSlash) : '.';
    const filePattern = pathArg.substring(lastSlash + 1);

    if (fs.existsSync(dirPath)) {
      // Walk directory and filter by pattern manually
      const allFiles = walkDirectory(dirPath);
      // For patterns with path separators (like **/*.txt), match against relative path
      files = allFiles.filter(f => {
        const relativePath = path.relative(dirPath, f);
        return matchWildcard(relativePath, filePattern);
      });
    } else {
      throw new Error(`Path does not exist: ${dirPath}`);
    }
  } else if (fs.existsSync(pathArg)) {
    const stats = fs.statSync(pathArg);
    if (stats.isFile()) {
      files = [pathArg];
    } else if (stats.isDirectory() && recursive) {
      // Search all files in directory recursively
      files = walkDirectory(pathArg);
    } else if (stats.isDirectory()) {
      // Search files in directory (non-recursive)
      const entries = fs.readdirSync(pathArg);
      files = entries
        .map(e => path.join(pathArg, e))
        .filter(f => {
          try {
            return fs.statSync(f).isFile();
          } catch (e) {
            return false;
          }
        });
    }
  } else {
    throw new Error(`Path does not exist: ${pathArg}`);
  }

  // Create regex
  const flags = ignoreCase ? 'gi' : 'g';
  const regex = new RegExp(processedPattern, flags);

  // Search each file
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (regex.test(line)) {
          results.push({
            file,
            line,
            lineNumber: index + 1,
            match: pattern,
          });
        }
        // Reset regex lastIndex for global flag
        regex.lastIndex = 0;
      });
    } catch (err) {
      // Skip files that can't be read (binary, permissions, etc.)
      continue;
    }
  }

  return results;
}

/**
 * FIND - Find files matching criteria
 *
 * @param {string} path - Starting directory
 * @param {string} type - Filter by type: "file" or "directory"
 * @param {string} name - Glob pattern for name
 * @param {number} modifiedWithin - Files modified within N days
 * @param {number} minSize - Minimum file size in bytes
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Array} Array of file objects
 */
function FIND(pathArg = '.', type = null, name = null, modifiedWithin = null, minSize = null, maxSize = null) {
  if (!fs.existsSync(pathArg)) {
    throw new Error(`Path does not exist: ${pathArg}`);
  }

  const results = [];
  const now = Date.now();
  const modifiedCutoff = modifiedWithin ? now - (modifiedWithin * 24 * 60 * 60 * 1000) : null;

  function scan(dir) {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);

      const fileInfo = {
        name: entry,
        path: fullPath,
        relativePath: path.relative(pathArg, fullPath),
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        accessed: stats.atime.toISOString(),
        modifiedTime: stats.mtime.getTime(),
      };

      // Apply filters
      if (type === 'file' && !fileInfo.isFile) {
        if (fileInfo.isDirectory) scan(fullPath);
        continue;
      }
      if (type === 'directory' && !fileInfo.isDirectory) continue;

      // Name pattern filter
      if (name) {
        if (!matchWildcard(fileInfo.name, name)) {
          if (fileInfo.isDirectory) scan(fullPath);
          continue;
        }
      }

      // Modified time filter
      if (modifiedCutoff && fileInfo.modifiedTime < modifiedCutoff) {
        if (fileInfo.isDirectory) scan(fullPath);
        continue;
      }

      // Size filters
      if (minSize !== null && fileInfo.size < minSize) continue;
      if (maxSize !== null && fileInfo.size > maxSize) continue;

      results.push(fileInfo);

      // Recurse into directories
      if (fileInfo.isDirectory) {
        scan(fullPath);
      }
    }
  }

  scan(pathArg);
  return results;
}

/**
 * MKDIR - Create directory
 *
 * @param {string} path - Directory path to create
 * @param {boolean} recursive - Create parent directories if needed
 */
function MKDIR(pathArg, recursive = false) {
  recursive = toBool(recursive);
  if (fs.existsSync(pathArg)) {
    // Already exists, that's okay
    return;
  }

  fs.mkdirSync(pathArg, { recursive });
}

/**
 * CP - Copy file or directory
 *
 * @param {string} source - Source path
 * @param {string} dest - Destination path
 * @param {boolean} recursive - Copy directories recursively
 */
function CP(source, dest, recursive = false) {
  recursive = toBool(recursive);
  if (!fs.existsSync(source)) {
    throw new Error(`Source does not exist: ${source}`);
  }

  const stats = fs.statSync(source);

  if (stats.isFile()) {
    fs.copyFileSync(source, dest);
  } else if (stats.isDirectory()) {
    if (!recursive) {
      throw new Error(`Cannot copy directory without recursive flag: ${source}`);
    }

    // Create destination directory
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    // Copy all contents
    const entries = fs.readdirSync(source);
    for (const entry of entries) {
      const srcPath = path.join(source, entry);
      const destPath = path.join(dest, entry);
      CP(srcPath, destPath, true);
    }
  }
}

/**
 * MV - Move/rename file or directory
 *
 * @param {string} source - Source path
 * @param {string} dest - Destination path
 */
function MV(source, dest) {
  if (!fs.existsSync(source)) {
    throw new Error(`Source does not exist: ${source}`);
  }

  fs.renameSync(source, dest);
}

/**
 * RM - Remove file or directory
 *
 * @param {string} path - Path to remove
 * @param {boolean} recursive - Remove directories recursively
 * @param {boolean} force - Don't throw error if path doesn't exist
 */
function RM(pathArg, recursive = false, force = false) {
  recursive = toBool(recursive);
  force = toBool(force);
  if (!fs.existsSync(pathArg)) {
    if (force) return;
    throw new Error(`Path does not exist: ${pathArg}`);
  }

  const stats = fs.statSync(pathArg);

  if (stats.isFile()) {
    fs.unlinkSync(pathArg);
  } else if (stats.isDirectory()) {
    if (!recursive) {
      // Check if directory is empty
      const entries = fs.readdirSync(pathArg);
      if (entries.length > 0) {
        throw new Error(`Directory not empty (use recursive=true): ${pathArg}`);
      }
    }
    fs.rmSync(pathArg, { recursive, force });
  }
}

/**
 * STAT - Get file/directory metadata
 *
 * @param {string} path - File or directory path
 * @returns {Object} File statistics
 */
function STAT(pathArg) {
  if (!fs.existsSync(pathArg)) {
    throw new Error(`Path does not exist: ${pathArg}`);
  }

  const stats = fs.statSync(pathArg);

  return {
    path: pathArg,
    size: stats.size,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    isSymbolicLink: stats.isSymbolicLink(),
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    accessed: stats.atime.toISOString(),
    mode: stats.mode,
    uid: stats.uid,
    gid: stats.gid,
  };
}

/**
 * BASENAME - Get base name of path
 *
 * @param {string} path - File path
 * @param {string} ext - Optional extension to remove
 * @returns {string} Base name
 */
function BASENAME(pathArg, ext = '') {
  return path.basename(pathArg, ext);
}

/**
 * DIRNAME - Get directory name of path
 *
 * @param {string} path - File path
 * @returns {string} Directory name
 */
function DIRNAME(pathArg) {
  return path.dirname(pathArg);
}

/**
 * PATH_JOIN - Join path components (varargs style)
 *
 * Supports multiple invocation styles:
 *   PATH_JOIN("a", "b", "c")           - Varargs: most natural
 *   PATH_JOIN(["a", "b", "c"])         - Array passed directly
 *   PATH_JOIN(parts=["a", "b", "c"])   - Named parameter (from unified model)
 *
 * @param {...string|Array} pathParts - Variable number of path parts or array of parts
 * @returns {string} Joined path
 */
function PATH_JOIN(...allArgs) {
  // Handle different invocation styles
  let actualParts = [];

  if (allArgs.length === 0) {
    throw new Error('PATH_JOIN requires at least one path part');
  }

  // Check if first arg is unified parameter model with 'parts' key
  if (allArgs.length === 1 &&
      typeof allArgs[0] === 'object' &&
      allArgs[0] !== null &&
      'parts' in allArgs[0]) {
    // Named parameter: PATH_JOIN(parts=["a", "b"])
    actualParts = Array.isArray(allArgs[0].parts) ? allArgs[0].parts : [allArgs[0].parts];
  } else if (allArgs.length === 1 && Array.isArray(allArgs[0])) {
    // Array passed directly: PATH_JOIN(["a", "b"])
    actualParts = allArgs[0];
  } else {
    // Varargs style: PATH_JOIN("a", "b", "c")
    actualParts = allArgs;
  }

  // Flatten any nested arrays and filter out empty strings
  actualParts = actualParts.flat().filter(p => p !== '');

  if (actualParts.length === 0) {
    throw new Error('PATH_JOIN requires at least one non-empty path part');
  }

  return path.join(...actualParts);
}

/**
 * Sibling function: Convert positional arguments to named parameter map for PATH_JOIN
 * Collects all varargs into a parts array
 */
function PATH_JOIN_positional_args_to_named_param_map(...args) {
  return {
    parts: args  // All varargs become the parts array
  };
}

/**
 * PATH_RESOLVE - Resolve to absolute path
 *
 * @param {string} pathArg - Path to resolve
 * @returns {string} Absolute path
 */
function PATH_RESOLVE(pathArg) {
  return path.resolve(pathArg);
}

/**
 * PATH_EXTNAME - Get file extension
 *
 * @param {string} pathArg - File path
 * @returns {string} File extension (including dot)
 */
function PATH_EXTNAME(pathArg) {
  return path.extname(pathArg);
}

/**
 * HEAD - Get first N lines from text or file
 *
 * @param {string|Array} input - Text string, array of lines, or file path
 * @param {number} lines - Number of lines to return (default: 10)
 * @returns {string|Array} First N lines (returns same type as input)
 */
function HEAD(input, lines = 10) {
  const n = parseInt(lines) || 10;

  // Handle array input (pipeline-friendly)
  if (Array.isArray(input)) {
    return input.slice(0, n);
  }

  // Handle string input
  if (typeof input === 'string') {
    // Check if it's a file path
    if (isNodeJS && fs.existsSync(input)) {
      const content = fs.readFileSync(input, 'utf8');
      const allLines = content.split('\n');
      return allLines.slice(0, n).join('\n');
    } else {
      // It's text content
      const allLines = input.split('\n');
      return allLines.slice(0, n).join('\n');
    }
  }

  throw new Error('HEAD requires a string or array as input');
}

/**
 * TAIL - Get last N lines from text or file
 *
 * @param {string|Array} input - Text string, array of lines, or file path
 * @param {number} lines - Number of lines to return (default: 10)
 * @returns {string|Array} Last N lines (returns same type as input)
 */
function TAIL(input, lines = 10) {
  const n = parseInt(lines) || 10;

  // Handle array input (pipeline-friendly)
  if (Array.isArray(input)) {
    return input.slice(-n);
  }

  // Handle string input
  if (typeof input === 'string') {
    // Check if it's a file path
    if (isNodeJS && fs.existsSync(input)) {
      const content = fs.readFileSync(input, 'utf8');
      const allLines = content.split('\n');
      return allLines.slice(-n).join('\n');
    } else {
      // It's text content
      const allLines = input.split('\n');
      return allLines.slice(-n).join('\n');
    }
  }

  throw new Error('TAIL requires a string or array as input');
}

/**
 * Word, line, and character count (like Unix wc)
 * @param {string|Array} input - Input text or array of lines
 * @param {string} [type] - Type of count: "lines", "words", "chars", or undefined for object with all counts
 * @returns {number|Object} Count of specified type or object with all counts
 */
function WC(input, type) {
  let text;

  // Convert input to text string
  if (Array.isArray(input)) {
    text = input.join('\n');
  } else if (typeof input === 'string') {
    text = input;
  } else {
    throw new Error('WC input must be a string or array of strings');
  }

  // Calculate counts
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  const words = text ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  // Return specific count or full object
  switch (type) {
    case 'lines':
      return lines;
    case 'words':
      return words;
    case 'chars':
      return chars;
    default:
      return { lines, words, chars };
  }
}

/**
 * SORT - Sort lines
 *
 * @param {string|Array} input - Text string, array, or file path
 * @param {boolean} reverse - Reverse sort order (default: false)
 * @param {boolean} numeric - Numeric sort (default: false)
 * @param {boolean} unique - Remove duplicates (default: false)
 * @returns {string|Array} Sorted lines (returns same type as input)
 */
function SORT(input, reverse = false, numeric = false, unique = false) {
  // Normalize boolean parameters - handle strings "true"/"false"
  reverse = toBool(reverse);
  numeric = toBool(numeric);
  unique = toBool(unique);

  let lines = [];
  const isArray = Array.isArray(input);

  if (isArray) {
    lines = [...input];
  } else if (typeof input === 'string') {
    // Check if it's a file path
    if (isNodeJS && fs.existsSync(input)) {
      const content = fs.readFileSync(input, 'utf8');
      lines = content.split('\n');
    } else {
      lines = input.split('\n');
    }
  } else {
    throw new Error('SORT requires a string or array as input');
  }

  // Sort
  if (numeric) {
    lines.sort((a, b) => {
      const numA = parseFloat(String(a)) || 0;
      const numB = parseFloat(String(b)) || 0;
      return numA - numB;
    });
  } else {
    lines.sort();
  }

  if (reverse) {
    lines.reverse();
  }

  if (unique) {
    lines = [...new Set(lines)];
  }

  return isArray ? lines : lines.join('\n');
}

/**
 * UNIQ - Remove duplicate adjacent lines
 *
 * @param {string|Array} input - Text string, array, or file path
 * @param {boolean} count - Show count of occurrences (default: false)
 * @returns {string|Array} Unique lines (returns same type as input)
 */
function UNIQ(input, count = false) {
  count = toBool(count);

  let lines = [];
  const isArray = Array.isArray(input);

  if (isArray) {
    lines = [...input];
  } else if (typeof input === 'string') {
    // Check if it's a file path
    if (isNodeJS && fs.existsSync(input)) {
      const content = fs.readFileSync(input, 'utf8');
      lines = content.split('\n');
    } else {
      lines = input.split('\n');
    }
  } else {
    throw new Error('UNIQ requires a string or array as input');
  }

  const result = [];
  let prevLine = null;
  let lineCount = 0;

  for (const line of lines) {
    if (line === prevLine) {
      lineCount++;
    } else {
      if (prevLine !== null) {
        result.push(count ? `${lineCount} ${prevLine}` : prevLine);
      }
      prevLine = line;
      lineCount = 1;
    }
  }

  // Don't forget the last line
  if (prevLine !== null) {
    result.push(count ? `${lineCount} ${prevLine}` : prevLine);
  }

  return isArray ? result : result.join('\n');
}

/**
 * SEQ - Generate sequence of numbers
 *
 * @param {number} start - Start value (or end if only one arg)
 * @param {number} end - End value
 * @param {number} step - Step increment (default: 1)
 * @returns {Array} Array of numbers
 */
function SEQ(start, end = null, step = 1) {
  let begin, finish;

  if (end === null) {
    // Called with single argument: SEQ(5) => 1..5
    begin = 1;
    finish = parseInt(start);
  } else {
    begin = parseInt(start);
    finish = parseInt(end);
  }

  step = parseInt(step);
  if (isNaN(step)) step = 1;

  const result = [];

  if (step === 0) {
    throw new Error('SEQ step cannot be zero');
  }

  if (step > 0) {
    for (let i = begin; i <= finish; i += step) {
      result.push(i);
    }
  } else {
    // step < 0
    for (let i = begin; i >= finish; i += step) {
      result.push(i);
    }
  }

  return result;
}

/**
 * SHUF - Shuffle lines randomly
 *
 * @param {string|Array} input - Text string, array, or file path
 * @returns {string|Array} Shuffled lines (returns same type as input)
 */
function SHUF(params) {
  // Handle unified parameter model: { input: ... }
  let actualInput;

  if (typeof params === 'object' && params !== null && 'input' in params) {
    actualInput = params.input;
  } else {
    // Direct value (from piped input or varargs)
    actualInput = params;
  }

  // Handle stringified JSON arrays from parser limitations
  if (typeof actualInput === 'string' && (actualInput.startsWith('[') || actualInput.startsWith('{'))) {
    try {
      const parsed = JSON.parse(actualInput);
      if (Array.isArray(parsed)) {
        actualInput = parsed;
      }
    } catch (e) {
      // Not valid JSON, treat as regular string
    }
  }

  let lines = [];
  const isArray = Array.isArray(actualInput);

  if (isArray) {
    lines = [...actualInput];
  } else if (typeof actualInput === 'string') {
    // Check if it's a file path
    if (isNodeJS && fs.existsSync(actualInput)) {
      const content = fs.readFileSync(actualInput, 'utf8');
      lines = content.split('\n');
    } else {
      lines = actualInput.split('\n');
    }
  } else {
    throw new Error('SHUF requires a string or array as input');
  }

  // Fisher-Yates shuffle
  for (let i = lines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lines[i], lines[j]] = [lines[j], lines[i]];
  }

  return isArray ? lines : lines.join('\n');
}

/**
 * Sibling function: Convert positional arguments to named parameter map for SHUF
 * SHUF(input) -> { input }
 */
function SHUF_positional_args_to_named_param_map(...args) {
  return {
    input: args[0]
  };
}

/**
 * Extract fields from text lines (like Unix cut)
 * @param {string|Array} input - Input text or array of lines
 * @param {string} [fields] - Field numbers to extract (e.g., "2" or "1,3")
 * @param {string} [delimiter] - Field delimiter (default: tab)
 * @returns {Array} Array of extracted field values
 */
function CUT(inputOrParams, fields = "1", delimiter = "\t") {
  // Handle both unified parameter model and positional arguments
  // If first arg is an object with 'input' property, it's the new unified model
  let actualInput, actualFields, actualDelimiter;

  if (typeof inputOrParams === 'object' && inputOrParams !== null && 'input' in inputOrParams) {
    // Unified parameter model: { input, fields, delimiter }
    actualInput = inputOrParams.input;
    actualFields = inputOrParams.fields !== undefined ? inputOrParams.fields : "1";
    actualDelimiter = inputOrParams.delimiter !== undefined ? inputOrParams.delimiter : "\t";
  } else {
    // Positional arguments (backward compatible)
    actualInput = inputOrParams;
    actualFields = fields;
    actualDelimiter = delimiter;
  }

  let lines;

  // Convert input to array of lines
  if (Array.isArray(actualInput)) {
    lines = actualInput;
  } else if (typeof actualInput === 'string') {
    lines = actualInput.split('\n');
  } else {
    throw new Error('CUT input must be a string or array of strings');
  }

  // Parse field numbers (supports ranges like "2-3" and lists like "1,3")
  const fieldNums = [];
  const fieldSpecs = String(actualFields).split(',');

  for (const spec of fieldSpecs) {
    const trimmed = spec.trim();
    if (trimmed.includes('-')) {
      // Range like "2-3"
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
      for (let i = start; i <= end; i++) {
        fieldNums.push(i - 1); // Convert to 0-based
      }
    } else {
      // Single field
      fieldNums.push(parseInt(trimmed) - 1); // Convert to 0-based
    }
  }

  const result = [];
  for (const line of lines) {
    const parts = line.split(actualDelimiter);
    const extracted = fieldNums.map(fieldNum => parts[fieldNum] || '');

    if (fieldNums.length === 1) {
      // Single field - return just the value
      result.push(extracted[0] || '');
    } else {
      // Multiple fields - join with delimiter
      result.push(extracted.join(actualDelimiter));
    }
  }

  return result;
}

/**
 * Sibling function: Convert positional arguments to named parameter map for CUT
 * CUT(input, fields, delimiter) -> { input, fields, delimiter }
 */
function CUT_positional_args_to_named_param_map(...args) {
  return {
    input: args[0],
    fields: args[1],
    delimiter: args[2]
  };
}

/**
 * Combine arrays side by side (like Unix paste)
 *
 * Expects unified parameter model from converter:
 *   { inputs: [array1, array2, array3], delimiter: "," }
 *
 * Called from REXX as: PASTE(array1, array2, array3) or PASTE(array1, array2, delimiter=",")
 * The converter transforms this to unified params, which is what we receive here.
 *
 * @param {Object} params - Unified parameter object with inputs and optional delimiter
 * @returns {Array} Array of combined lines
 */
function PASTE(params) {
  // Handle case where we receive a single unified params object
  if (typeof params === 'object' && params !== null && 'inputs' in params) {
    let inputs = params.inputs;
    const delimiter = params.delimiter !== undefined ? params.delimiter : "\t";

    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw new Error('PASTE requires at least one array');
    }

    // Handle stringified JSON arrays from parser limitations
    inputs = inputs.map(item => {
      if (typeof item === 'string' && (item.startsWith('[') || item.startsWith('{'))) {
        try {
          const parsed = JSON.parse(item);
          return Array.isArray(parsed) ? parsed : item;
        } catch (e) {
          return item;
        }
      }
      return item;
    });

    // Verify all inputs are arrays (handle stringified arrays from parser)
    for (let i = 0; i < inputs.length; i++) {
      // If it's not already an array but is a string, try to parse as JSON
      if (!Array.isArray(inputs[i]) && typeof inputs[i] === 'string') {
        try {
          const trimmed = inputs[i].trim();
          // Try to parse as JSON
          if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            inputs[i] = JSON.parse(trimmed);
          }
        } catch (e) {
          // If it fails, that's OK - we'll throw the proper error below
        }
      }

      if (!Array.isArray(inputs[i])) {
        throw new Error(`PASTE argument ${i + 1} must be an array, got ${typeof inputs[i]}`);
      }
    }

    // Find the maximum length
    const maxLength = Math.max(...inputs.map(arr => arr.length));

    const result = [];
    for (let i = 0; i < maxLength; i++) {
      const line = inputs.map(arr => {
        return (i < arr.length) ? arr[i] : '';
      }).join(delimiter);
      result.push(line);
    }

    return result;
  }

  throw new Error('PASTE expects unified parameter model: { inputs: [...], delimiter: "..." }');
}

/**
 * Sibling function: Convert positional arguments to named parameter map for PASTE
 * REXX invocations: PASTE(a, b, c) or PASTE(a, b, c, delimiter=",")
 * Returns: { inputs: [a, b, c], delimiter: "," }
 */
function PASTE_positional_args_to_named_param_map(...args) {
  // Check if last arg is "delimiter=..." (from parser not recognizing named params)
  if (args.length > 0 &&
      typeof args[args.length - 1] === 'string' &&
      args[args.length - 1].startsWith('delimiter=')) {
    // Extract delimiter value from "delimiter=..." string
    const lastArg = args[args.length - 1];
    const delimiterMatch = lastArg.match(/^delimiter=(.*)$/);
    if (delimiterMatch) {
      let delimiter = delimiterMatch[1];
      // Strip surrounding quotes if present
      if ((delimiter.startsWith('"') && delimiter.endsWith('"')) ||
          (delimiter.startsWith("'") && delimiter.endsWith("'"))) {
        delimiter = delimiter.slice(1, -1);
      }
      const inputs = args.slice(0, -1);
      return { inputs, delimiter };
    }
  }

  // All args are arrays to be combined (no custom delimiter)
  return {
    inputs: args
  };
}

/**
 * TEE - Write to file and pass through to output
 *
 * @param {string|Array} input - Data to write
 * @param {string} file - File path to write to
 * @param {boolean} append - Append to file instead of overwrite (default: false)
 * @returns {string|Array} Input data (passed through)
 */
function TEE(input, file, append = false) {
  if (!file) {
    throw new Error('TEE requires a file path');
  }

  append = toBool(append);

  let content;
  if (Array.isArray(input)) {
    content = input.join('\n');
  } else if (typeof input === 'string') {
    content = input;
  } else {
    throw new Error('TEE requires a string or array as input');
  }

  if (isNodeJS) {
    if (append) {
      fs.appendFileSync(file, content + '\n');
    } else {
      fs.writeFileSync(file, content + '\n');
    }
  }

  return input; // Pass through
}

/**
 * XARGS - Build and execute commands from input
 *
 * @param {string|Array} input - Input lines to process
 * @param {string} command - Command template with {} placeholder
 * @param {number} maxArgs - Max arguments per command invocation (default: unlimited)
 * @returns {Array} Results from each command execution
 */
function XARGS(input, command, maxArgs = null) {
  // Normalize parameters
  command = toStr(command);

  if (!command) {
    throw new Error('XARGS requires a command parameter');
  }

  let lines = [];

  if (Array.isArray(input)) {
    lines = input.map(String);
  } else if (typeof input === 'string') {
    // Handle both actual newlines and escaped newlines
    const normalized = input.replace(/\\n/g, '\n');
    lines = normalized.split('\n').filter(line => line.trim().length > 0);
  } else {
    throw new Error('XARGS requires a string or array as input');
  }

  const results = [];
  const maxPerCall = maxArgs ? parseInt(maxArgs) : lines.length;

  // Process in batches
  for (let i = 0; i < lines.length; i += maxPerCall) {
    const batch = lines.slice(i, i + maxPerCall);

    // Replace {} with arguments, or append if no placeholder
    let finalCommand;
    if (command.includes('{}')) {
      finalCommand = command.replace('{}', batch.join(' '));
    } else {
      finalCommand = `${command} ${batch.join(' ')}`;
    }

    // Execute command (simplified - in real use, would need proper command parsing)
    // For now, just return the command that would be executed
    results.push(finalCommand);
  }

  return results;
}

/**
 * NL - Number lines
 *
 * @param {string|Array} input - Lines to number
 * @param {number} [start] - Starting line number (default: 1)
 * @param {string} [format] - Format string (default: "%6d  ")
 * @returns {Array} Lines with line numbers prepended
 */
function NL(input, start = 1, format = "%6d  ") {
  let lines;

  // Convert input to array of lines
  if (Array.isArray(input)) {
    lines = input;
  } else if (typeof input === 'string') {
    // Handle both actual newlines and escaped newlines
    const normalized = input.replace(/\\n/g, '\n');
    lines = normalized.split('\n');
  } else {
    throw new Error('NL input must be a string or array of strings');
  }

  const startNum = typeof start === 'number' ? start : parseInt(start) || 1;

  // Simple format handling - just handle %d and %6d style formats
  const formatFunc = (num) => {
    if (format.includes('%')) {
      // Extract width if specified (e.g., "%6d")
      const match = format.match(/%(\d+)?d/);
      if (match) {
        const width = match[1] ? parseInt(match[1]) : 0;
        const numStr = String(num);
        const padded = numStr.padStart(width, ' ');
        return format.replace(/%\d*d/, padded);
      }
    }
    return `${num}  `;
  };

  return lines.map((line, index) => `${formatFunc(startNum + index)}${line}`);
}

/**
 * REV - Reverse each line
 *
 * @param {string|Array} input - Lines to reverse
 * @returns {Array} Lines with characters reversed
 */
function REV(input) {
  let lines;

  // Convert input to array of lines
  if (Array.isArray(input)) {
    lines = input;
  } else if (typeof input === 'string') {
    // Handle both actual newlines and escaped newlines
    const normalized = input.replace(/\\n/g, '\n');
    lines = normalized.split('\n');
  } else {
    throw new Error('REV input must be a string or array of strings');
  }

  return lines.map(line => line.split('').reverse().join(''));
}

/**
 * TAC - Reverse line order (reverse of cat)
 *
 * @param {string|Array} input - Lines to reverse
 * @returns {Array} Lines in reversed order
 */
function TAC(input) {
  let lines;

  // Convert input to array of lines
  if (Array.isArray(input)) {
    lines = input;
  } else if (typeof input === 'string') {
    // Handle both actual newlines and escaped newlines
    const normalized = input.replace(/\\n/g, '\n');
    lines = normalized.split('\n');
  } else {
    throw new Error('TAC input must be a string or array of strings');
  }

  return lines.slice().reverse();
}

/**
 * FOLD - Wrap lines to specified width
 *
 * @param {string|Array} input - Lines to wrap
 * @param {number} [width] - Maximum line width (default: 80)
 * @returns {Array} Wrapped lines
 */
function FOLD(input, width = 80) {
  let lines;

  // Convert input to array of lines
  if (Array.isArray(input)) {
    lines = input;
  } else if (typeof input === 'string') {
    // Handle both actual newlines and escaped newlines
    const normalized = input.replace(/\\n/g, '\n');
    lines = normalized.split('\n');
  } else {
    throw new Error('FOLD input must be a string or array of strings');
  }

  const maxWidth = typeof width === 'number' ? width : parseInt(width) || 80;
  const result = [];

  for (const line of lines) {
    if (line.length <= maxWidth) {
      result.push(line);
    } else {
      // Wrap the line
      for (let i = 0; i < line.length; i += maxWidth) {
        result.push(line.substring(i, i + maxWidth));
      }
    }
  }

  return result;
}

/**
 * EXPAND - Convert tabs to spaces
 *
 * @param {string|Array} input - Lines to expand
 * @param {number} [tabWidth] - Tab width (default: 8)
 * @returns {Array} Lines with tabs converted to spaces
 */
function EXPAND(input, tabWidth = 8) {
  let lines;

  // Convert input to array of lines
  if (Array.isArray(input)) {
    lines = input;
  } else if (typeof input === 'string') {
    // Handle both actual newlines and escaped newlines
    const normalized = input.replace(/\\n/g, '\n');
    lines = normalized.split('\n');
  } else {
    throw new Error('EXPAND input must be a string or array of strings');
  }

  const width = typeof tabWidth === 'number' ? tabWidth : parseInt(tabWidth) || 8;

  return lines.map(line => {
    // Handle escaped tabs
    const normalizedLine = line.replace(/\\t/g, '\t');
    let result = '';
    let column = 0;

    for (let i = 0; i < normalizedLine.length; i++) {
      if (normalizedLine[i] === '\t') {
        // Add spaces until next tab stop
        const spacesToAdd = width - (column % width);
        result += ' '.repeat(spacesToAdd);
        column += spacesToAdd;
      } else {
        result += normalizedLine[i];
        column++;
      }
    }

    return result;
  });
}

/**
 * DOS2UNIX - Convert DOS/Windows line endings to Unix
 *
 * @param {string|Array} input - Text to convert
 * @returns {string|Array} Text with Unix line endings
 */
function DOS2UNIX(input) {
  if (Array.isArray(input)) {
    // For arrays, just return as-is (already line-separated)
    return input;
  } else if (typeof input === 'string') {
    // Handle escaped sequences first
    const normalized = input.replace(/\\r\\n/g, '\r\n').replace(/\\n/g, '\n');
    // Convert \r\n to \n
    return normalized.replace(/\r\n/g, '\n');
  } else {
    throw new Error('DOS2UNIX input must be a string or array');
  }
}

/**
 * UNIX2DOS - Convert Unix line endings to DOS/Windows
 *
 * @param {string|Array} input - Text to convert
 * @returns {string|Array} Text with DOS line endings
 */
function UNIX2DOS(input) {
  if (Array.isArray(input)) {
    // For arrays, join with \r\n
    return input.join('\r\n');
  } else if (typeof input === 'string') {
    // Handle escaped sequences first
    const normalized = input.replace(/\\n/g, '\n');
    // Convert \n to \r\n (but avoid double conversion)
    return normalized.replace(/\r?\n/g, '\r\n');
  } else {
    throw new Error('UNIX2DOS input must be a string or array');
  }
}

/**
 * FMT - Format paragraph text to specified width
 *
 * @param {string|Array} input - Text to format
 * @param {number} [width] - Maximum line width (default: 75)
 * @returns {Array} Formatted lines
 */
function FMT(input, width = 75) {
  let text;

  if (Array.isArray(input)) {
    text = input.join('\n');
  } else if (typeof input === 'string') {
    text = input.replace(/\\n/g, '\n');
  } else {
    throw new Error('FMT input must be a string or array');
  }

  const maxWidth = typeof width === 'number' ? width : parseInt(width) || 75;
  const paragraphs = text.split(/\n\s*\n/); // Split on blank lines
  const result = [];

  for (const para of paragraphs) {
    // Join all lines in paragraph into one string
    const words = para.replace(/\s+/g, ' ').trim().split(' ');
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length === 0) {
        currentLine = word;
      } else if (currentLine.length + 1 + word.length <= maxWidth) {
        currentLine += ' ' + word;
      } else {
        result.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine.length > 0) {
      result.push(currentLine);
    }

    // Add blank line between paragraphs (except after last)
    if (para !== paragraphs[paragraphs.length - 1]) {
      result.push('');
    }
  }

  return result;
}

/**
 * STRINGS - Extract printable strings from data
 *
 * @param {string|Buffer|Array} input - Data to extract strings from
 * @param {number} [minLength] - Minimum string length (default: 4)
 * @returns {Array} Array of printable strings found
 */
function STRINGS(input, minLength = 4) {
  let data;

  if (isNodeJS && Buffer.isBuffer(input)) {
    data = input.toString('binary');
  } else if (Array.isArray(input)) {
    data = input.join('\n');
  } else if (typeof input === 'string') {
    data = input;
  } else {
    throw new Error('STRINGS input must be a string, buffer, or array');
  }

  const minLen = typeof minLength === 'number' ? minLength : parseInt(minLength) || 4;
  const printableRegex = new RegExp(`[ -~]{${minLen},}`, 'g');
  const matches = data.match(printableRegex);

  return matches || [];
}

/**
 * CRC32 - Calculate CRC32 checksum
 *
 * @param {string|Buffer|Array} input - Data to checksum
 * @returns {string} CRC32 checksum as hex string
 */
function CRC32(input) {
  let data;

  if (isNodeJS && Buffer.isBuffer(input)) {
    data = Array.from(input);
  } else if (Array.isArray(input)) {
    data = input.join('\n').split('').map(c => c.charCodeAt(0));
  } else if (typeof input === 'string') {
    data = input.split('').map(c => c.charCodeAt(0));
  } else {
    throw new Error('CRC32 input must be a string, buffer, or array');
  }

  // CRC32 lookup table
  const table = [];
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    table[i] = crc;
  }

  // Calculate CRC32
  let crc = 0xFFFFFFFF;
  for (const byte of data) {
    crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  }
  crc = (crc ^ 0xFFFFFFFF) >>> 0;

  return crc.toString(16).padStart(8, '0');
}

/**
 * CKSUM - POSIX checksum (CRC + byte count)
 *
 * @param {string|Buffer|Array} input - Data to checksum
 * @returns {string} Checksum and byte count
 */
function CKSUM(input) {
  let data;

  if (isNodeJS && Buffer.isBuffer(input)) {
    data = Array.from(input);
  } else if (Array.isArray(input)) {
    data = input.join('\n').split('').map(c => c.charCodeAt(0));
  } else if (typeof input === 'string') {
    data = input.split('').map(c => c.charCodeAt(0));
  } else {
    throw new Error('CKSUM input must be a string, buffer, or array');
  }

  // CRC32 lookup table (same as CRC32 function)
  const table = [];
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    table[i] = crc;
  }

  const byteCount = data.length;
  let crc = 0;

  // Process data bytes
  for (const byte of data) {
    crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  }

  // Process length
  let len = byteCount;
  while (len > 0) {
    crc = table[(crc ^ len) & 0xFF] ^ (crc >>> 8);
    len >>>= 8;
  }

  crc = (~crc) >>> 0;

  return `${crc} ${byteCount}`;
}

/**
 * SUM_BSD - BSD/SysV checksum
 *
 * @param {string|Buffer|Array} input - Data to checksum
 * @param {string} [algorithm] - 'bsd' or 'sysv' (default: 'bsd')
 * @returns {string} Checksum and block count
 */
function SUM_BSD(input, algorithm = 'bsd') {
  let data;

  if (isNodeJS && Buffer.isBuffer(input)) {
    data = Array.from(input);
  } else if (Array.isArray(input)) {
    data = input.join('\n').split('').map(c => c.charCodeAt(0));
  } else if (typeof input === 'string') {
    data = input.split('').map(c => c.charCodeAt(0));
  } else {
    throw new Error('SUM input must be a string, buffer, or array');
  }

  const algo = String(algorithm).toLowerCase();
  let checksum;

  if (algo === 'sysv' || algo === 's') {
    // SysV algorithm: sum of all bytes mod 2^16
    checksum = 0;
    for (const byte of data) {
      checksum = (checksum + byte) & 0xFFFF;
    }
    // Add high-order carry bits
    checksum = ((checksum & 0xFFFF) + (checksum >> 16)) & 0xFFFF;
  } else {
    // BSD algorithm (default): rotating checksum
    checksum = 0;
    for (const byte of data) {
      checksum = ((checksum >>> 1) | ((checksum & 1) << 15)) & 0xFFFF;
      checksum = (checksum + byte) & 0xFFFF;
    }
  }

  const blocks = Math.ceil(data.length / 1024);
  return `${checksum} ${blocks}`;
}

/**
 * CMP - Compare two files/strings byte-by-byte
 *
 * @param {string|Array} input1 - First input to compare
 * @param {string|Array} input2 - Second input to compare
 * @returns {Object} Comparison result with {equal: boolean, line: number, byte: number, char1: string, char2: string}
 */
function CMP(input1, input2) {
  let data1, data2;

  // Convert inputs to strings
  if (Array.isArray(input1)) {
    data1 = input1.join('\n');
  } else {
    data1 = String(input1);
  }

  if (Array.isArray(input2)) {
    data2 = input2.join('\n');
  } else {
    data2 = String(input2);
  }

  // Compare byte by byte
  let line = 1;
  let col = 1;

  for (let i = 0; i < Math.max(data1.length, data2.length); i++) {
    const c1 = i < data1.length ? data1[i] : undefined;
    const c2 = i < data2.length ? data2[i] : undefined;

    if (c1 !== c2) {
      return {
        equal: false,
        line: line,
        byte: i + 1,
        column: col,
        char1: c1,
        char2: c2,
        message: `Files differ at line ${line}, byte ${i + 1}, column ${col}`
      };
    }

    // Track line and column
    if (c1 === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
  }

  return {
    equal: true,
    message: 'Files are identical'
  };
}

/**
 * COMM - Compare two sorted files line by line
 *
 * @param {string|Array} input1 - First sorted input
 * @param {string|Array} input2 - Second sorted input
 * @param {number} [suppress] - Columns to suppress: 1=only-in-1, 2=only-in-2, 3=in-both (can combine: 12, 13, 23, 123)
 * @returns {Array} Array of comparison results with column indicators
 */
function COMM(input1, input2, suppress = 0) {
  let lines1, lines2;

  // Convert inputs to line arrays
  if (Array.isArray(input1)) {
    lines1 = input1;
  } else {
    lines1 = String(input1).split('\n');
  }

  if (Array.isArray(input2)) {
    lines2 = input2;
  } else {
    lines2 = String(input2).split('\n');
  }

  const suppressNum = parseInt(suppress) || 0;
  const suppress1 = suppressNum.toString().includes('1');
  const suppress2 = suppressNum.toString().includes('2');
  const suppress3 = suppressNum.toString().includes('3');

  const result = [];
  let i = 0, j = 0;

  while (i < lines1.length || j < lines2.length) {
    const line1 = i < lines1.length ? lines1[i] : null;
    const line2 = j < lines2.length ? lines2[j] : null;

    if (line1 === null) {
      // Only line2 remains
      if (!suppress2) {
        result.push('\t' + line2);
      }
      j++;
    } else if (line2 === null) {
      // Only line1 remains
      if (!suppress1) {
        result.push(line1);
      }
      i++;
    } else if (line1 === line2) {
      // Lines match (in both)
      if (!suppress3) {
        result.push('\t\t' + line1);
      }
      i++;
      j++;
    } else if (line1 < line2) {
      // line1 is unique (only in file1)
      if (!suppress1) {
        result.push(line1);
      }
      i++;
    } else {
      // line2 is unique (only in file2)
      if (!suppress2) {
        result.push('\t' + line2);
      }
      j++;
    }
  }

  return result;
}

/**
 * UUENCODE - UUencode data (classic Unix encoding)
 *
 * @param {string|Buffer|Array} input - Data to encode
 * @param {string} [filename] - Filename to include in header (default: 'data.bin')
 * @returns {string} UUencoded text with header and footer
 */
function UUENCODE(input, filename = 'data.bin') {
  let data;

  if (isNodeJS && Buffer.isBuffer(input)) {
    data = Array.from(input);
  } else if (Array.isArray(input)) {
    data = input.join('\n').split('').map(c => c.charCodeAt(0));
  } else if (typeof input === 'string') {
    data = input.split('').map(c => c.charCodeAt(0));
  } else {
    throw new Error('UUENCODE input must be a string, buffer, or array');
  }

  const fname = String(filename);
  const result = [`begin 644 ${fname}`];

  // Encode in chunks of 45 bytes (produces 60 character lines)
  for (let i = 0; i < data.length; i += 45) {
    const chunk = data.slice(i, i + 45);
    let line = String.fromCharCode(chunk.length + 32); // Length character

    // Encode 3 bytes at a time into 4 characters
    for (let j = 0; j < chunk.length; j += 3) {
      const b1 = chunk[j] || 0;
      const b2 = (j + 1 < chunk.length) ? chunk[j + 1] : 0;
      const b3 = (j + 2 < chunk.length) ? chunk[j + 2] : 0;

      // Encode 3 bytes (24 bits) into 4 characters (6 bits each)
      const c1 = (b1 >> 2) & 0x3F;
      const c2 = ((b1 << 4) | (b2 >> 4)) & 0x3F;
      const c3 = ((b2 << 2) | (b3 >> 6)) & 0x3F;
      const c4 = b3 & 0x3F;

      // Convert to printable characters (space = 0, grave = 63)
      // Always output all 4 characters, even for partial groups
      line += String.fromCharCode(c1 + 32);
      line += String.fromCharCode(c2 + 32);
      line += String.fromCharCode(c3 + 32);
      line += String.fromCharCode(c4 + 32);
    }

    result.push(line);
  }

  // Add empty line and end marker
  result.push(String.fromCharCode(32)); // ` ` (length 0)
  result.push('end');

  return result.join('\n');
}

/**
 * UUDECODE - Decode UUencoded data
 *
 * @param {string|Array} input - UUencoded text to decode
 * @returns {string} Decoded data as string
 */
function UUDECODE(input) {
  let lines;

  if (Array.isArray(input)) {
    lines = input;
  } else if (typeof input === 'string') {
    lines = input.split('\n');
  } else {
    throw new Error('UUDECODE input must be a string or array');
  }

  const result = [];
  let inData = false;

  for (const line of lines) {
    // Check for begin marker
    if (line.startsWith('begin ')) {
      inData = true;
      continue;
    }

    // Check for end marker
    if (line === 'end') {
      break;
    }

    // Skip if not in data section
    if (!inData || line.length === 0) {
      continue;
    }

    // First character is the length
    const lineLen = (line.charCodeAt(0) - 32) & 0x3F;
    if (lineLen === 0) continue; // Empty line

    let pos = 1;
    let decoded = 0;

    // Decode 4 characters at a time into 3 bytes
    while (decoded < lineLen && pos + 3 <= line.length) {
      const c1 = (line.charCodeAt(pos++) - 32) & 0x3F;
      const c2 = (line.charCodeAt(pos++) - 32) & 0x3F;
      const c3 = (line.charCodeAt(pos++) - 32) & 0x3F;
      const c4 = (line.charCodeAt(pos++) - 32) & 0x3F;

      // Decode 4 characters (6 bits each) into 3 bytes (8 bits each)
      const b1 = (c1 << 2) | (c2 >> 4);
      const b2 = ((c2 & 0x0F) << 4) | (c3 >> 2);
      const b3 = ((c3 & 0x03) << 6) | c4;

      if (decoded < lineLen) result.push(b1);
      decoded++;
      if (decoded < lineLen) result.push(b2);
      decoded++;
      if (decoded < lineLen) result.push(b3);
      decoded++;
    }
  }

  // Convert bytes to string
  return isNodeJS
    ? Buffer.from(result).toString('utf8')
    : String.fromCharCode(...result);
}

/**
 * BASE32 - Encode/decode Base32
 *
 * @param {string|Buffer} input - Data to encode/decode
 * @param {boolean} [decode] - If true, decode instead of encode (default: false)
 * @returns {string} Encoded or decoded string
 */
function BASE32(input, decode = false) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  decode = toBool(decode);

  if (decode) {
    // Decode Base32 to string
    if (typeof input !== 'string') {
      throw new Error('BASE32 decode requires a string input');
    }

    const cleanInput = input.toUpperCase().replace(/=+$/, '');
    let bits = '';

    for (let i = 0; i < cleanInput.length; i++) {
      const val = alphabet.indexOf(cleanInput[i]);
      if (val === -1) {
        throw new Error(`Invalid Base32 character: ${cleanInput[i]}`);
      }
      bits += val.toString(2).padStart(5, '0');
    }

    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }

    if (isNodeJS) {
      return Buffer.from(bytes).toString('utf8');
    } else {
      return String.fromCharCode(...bytes);
    }
  } else {
    // Encode to Base32
    let bytes;
    if (isNodeJS && Buffer.isBuffer(input)) {
      bytes = Array.from(input);
    } else if (typeof input === 'string') {
      if (isNodeJS) {
        bytes = Array.from(Buffer.from(input, 'utf8'));
      } else {
        bytes = Array.from(input).map(c => c.charCodeAt(0));
      }
    } else {
      throw new Error('BASE32 input must be a string or Buffer');
    }

    let bits = '';
    for (const byte of bytes) {
      bits += byte.toString(2).padStart(8, '0');
    }

    let result = '';
    for (let i = 0; i < bits.length; i += 5) {
      const chunk = bits.substr(i, 5).padEnd(5, '0');
      result += alphabet[parseInt(chunk, 2)];
    }

    // Add padding
    while (result.length % 8 !== 0) {
      result += '=';
    }

    return result;
  }
}

/**
 * XXD - Hex dump in plain format (like xxd -p)
 *
 * @param {string|Buffer} input - Data to convert to hex
 * @param {boolean} [decode] - If true, decode hex to string (default: false)
 * @returns {string} Hex string or decoded string
 */
function XXD(input, decode = false) {
  decode = toBool(decode);

  if (decode) {
    // Decode hex to string
    if (typeof input !== 'string') {
      throw new Error('XXD decode requires a string input');
    }

    const cleanHex = input.replace(/\s/g, '');
    if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
      throw new Error('Invalid hex string');
    }

    const bytes = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substr(i, 2), 16));
    }

    if (isNodeJS) {
      return Buffer.from(bytes).toString('utf8');
    } else {
      return String.fromCharCode(...bytes);
    }
  } else {
    // Encode to hex
    let bytes;
    if (isNodeJS && Buffer.isBuffer(input)) {
      bytes = Array.from(input);
    } else if (typeof input === 'string') {
      if (isNodeJS) {
        bytes = Array.from(Buffer.from(input, 'utf8'));
      } else {
        bytes = Array.from(input).map(c => c.charCodeAt(0));
      }
    } else {
      throw new Error('XXD input must be a string or Buffer');
    }

    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * HEXDUMP - Hex dump with formatting (like hexdump -C)
 *
 * @param {string|Buffer} input - Data to dump
 * @param {number} [width] - Bytes per line (default: 16)
 * @returns {Array} Array of formatted hex dump lines
 */
function HEXDUMP(input, width = 16) {
  let bytes;
  if (isNodeJS && Buffer.isBuffer(input)) {
    bytes = Array.from(input);
  } else if (typeof input === 'string') {
    if (isNodeJS) {
      bytes = Array.from(Buffer.from(input, 'utf8'));
    } else {
      bytes = Array.from(input).map(c => c.charCodeAt(0));
    }
  } else {
    throw new Error('HEXDUMP input must be a string or Buffer');
  }

  const lineWidth = typeof width === 'number' ? width : parseInt(width) || 16;
  const result = [];

  for (let i = 0; i < bytes.length; i += lineWidth) {
    const chunk = bytes.slice(i, i + lineWidth);

    // Offset
    const offset = i.toString(16).padStart(8, '0');

    // Hex bytes
    const hexPart = chunk.map(b => b.toString(16).padStart(2, '0')).join(' ');
    const hexPadded = hexPart.padEnd(lineWidth * 3 - 1, ' ');

    // ASCII representation
    const asciiPart = chunk.map(b => {
      return (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
    }).join('');

    result.push(`${offset}  ${hexPadded}  |${asciiPart}|`);
  }

  // Add final offset
  if (bytes.length > 0) {
    result.push(bytes.length.toString(16).padStart(8, '0'));
  }

  return result;
}

/**
 * OD - Octal dump
 *
 * @param {string|Buffer} input - Data to dump
 * @param {string} [format] - Format: 'octal' (default), 'hex', 'decimal', 'char'
 * @returns {Array} Array of formatted dump lines
 */
function OD(input, format = 'octal') {
  let bytes;
  if (isNodeJS && Buffer.isBuffer(input)) {
    bytes = Array.from(input);
  } else if (typeof input === 'string') {
    if (isNodeJS) {
      bytes = Array.from(Buffer.from(input, 'utf8'));
    } else {
      bytes = Array.from(input).map(c => c.charCodeAt(0));
    }
  } else {
    throw new Error('OD input must be a string or Buffer');
  }

  const fmt = format || 'octal';
  const result = [];
  const bytesPerLine = 16;

  for (let i = 0; i < bytes.length; i += bytesPerLine) {
    const chunk = bytes.slice(i, i + bytesPerLine);

    // Offset in octal
    const offset = i.toString(8).padStart(7, '0');

    // Format bytes based on format type
    let formattedBytes;
    switch (fmt) {
      case 'hex':
      case 'x':
        formattedBytes = chunk.map(b => b.toString(16).padStart(2, '0')).join(' ');
        break;
      case 'decimal':
      case 'd':
        formattedBytes = chunk.map(b => b.toString(10).padStart(3, ' ')).join(' ');
        break;
      case 'char':
      case 'c':
        formattedBytes = chunk.map(b => {
          if (b >= 32 && b <= 126) return String.fromCharCode(b);
          if (b === 0) return '\\0';
          if (b === 9) return '\\t';
          if (b === 10) return '\\n';
          if (b === 13) return '\\r';
          return `\\${b.toString(8).padStart(3, '0')}`;
        }).join(' ');
        break;
      case 'octal':
      case 'o':
      default:
        formattedBytes = chunk.map(b => b.toString(8).padStart(3, '0')).join(' ');
        break;
    }

    result.push(`${offset}  ${formattedBytes}`);
  }

  // Add final offset
  if (bytes.length > 0) {
    result.push(bytes.length.toString(8).padStart(7, '0'));
  }

  return result;
}

/**
 * UNAME - Get system information
 *
 * @param {string} [option] - What to return: 'system'/'s', 'release'/'r', 'version'/'v', 'machine'/'m', 'all'/'a' (default: 'system')
 * @returns {string} System information
 */
function UNAME(option = 'system') {
  if (!isNodeJS) {
    return 'browser';
  }

  const os = require('os');
  const opt = String(option).toLowerCase();

  switch (opt) {
    case 's':
    case 'system':
      return os.platform();
    case 'r':
    case 'release':
      return os.release();
    case 'v':
    case 'version':
      return os.version ? os.version() : os.release();
    case 'm':
    case 'machine':
      return os.arch();
    case 'a':
    case 'all':
      return `${os.platform()} ${os.release()} ${os.arch()}`;
    default:
      return os.platform();
  }
}

/**
 * HOSTNAME - Get system hostname
 *
 * @returns {string} Hostname
 */
function HOSTNAME() {
  if (!isNodeJS) {
    return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  }

  const os = require('os');
  return os.hostname();
}

/**
 * WHOAMI - Get current username
 *
 * @returns {string} Username
 */
function WHOAMI() {
  if (!isNodeJS) {
    return 'browser-user';
  }

  const os = require('os');
  try {
    return os.userInfo().username;
  } catch (e) {
    return 'unknown';
  }
}

/**
 * NPROC - Get number of processors
 *
 * @returns {number} Number of CPU cores
 */
function NPROC() {
  if (!isNodeJS) {
    return typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 1;
  }

  const os = require('os');
  return os.cpus().length;
}

/**
 * ARCH - Get system architecture
 *
 * @returns {string} Architecture (e.g., 'x64', 'arm64')
 */
function ARCH() {
  if (!isNodeJS) {
    return 'unknown';
  }

  const os = require('os');
  return os.arch();
}

/**
 * USERINFO - Get current user information
 *
 * @returns {Object} User information object with uid, gid, username, homedir, shell
 */
function USERINFO() {
  if (!isNodeJS) {
    return { username: 'browser-user', uid: -1, gid: -1, homedir: '/', shell: null };
  }

  const os = require('os');
  try {
    return os.userInfo();
  } catch (e) {
    return { username: 'unknown', uid: -1, gid: -1, homedir: '/', shell: null };
  }
}

/**
 * ENV - Get environment variable(s)
 *
 * @param {string} [name] - Name of environment variable to get (returns all if not specified)
 * @returns {string|Object} Environment variable value or all environment variables
 */
function ENV(name) {
  if (!isNodeJS) {
    return name ? undefined : {};
  }

  if (name) {
    return process.env[String(name)];
  }
  return process.env;
}

/**
 * UPTIME - Get system uptime in seconds
 *
 * @returns {number} System uptime in seconds
 */
function UPTIME() {
  if (!isNodeJS) {
    return typeof performance !== 'undefined' && performance.now
      ? Math.floor(performance.now() / 1000)
      : 0;
  }

  const os = require('os');
  return os.uptime();
}

/**
 * GROUPS - Get user's group memberships
 * Returns array of group IDs/names
 * Node.js only
 */
function GROUPS() {
  if (!isNodeJS) {
    throw new Error('GROUPS is only available in Node.js environment');
  }

  const os = require('os');
  const userInfo = os.userInfo();

  // Return groups array if available (Unix-like systems)
  // On some systems this may not be available
  if (userInfo.groups) {
    return userInfo.groups;
  }

  // On Windows or systems without groups, return array with primary gid
  return [userInfo.gid];
}

/**
 * LOGNAME - Get login name
 * Returns username string
 * Node.js only
 */
function LOGNAME() {
  if (!isNodeJS) {
    throw new Error('LOGNAME is only available in Node.js environment');
  }

  const os = require('os');
  return os.userInfo().username;
}

/**
 * GETCONF - Get system configuration values
 * Supports common config names like PAGE_SIZE, NPROCESSORS_ONLN, etc.
 * Node.js only
 */
function GETCONF(name = 'PAGE_SIZE') {
  if (!isNodeJS) {
    throw new Error('GETCONF is only available in Node.js environment');
  }

  const os = require('os');
  const configName = String(name).toUpperCase();

  // Map common getconf names to Node.js equivalents
  switch (configName) {
    case 'PAGE_SIZE':
    case 'PAGESIZE':
      // Default page size (most systems use 4096)
      return 4096;

    case 'NPROCESSORS_ONLN':
    case '_NPROCESSORS_ONLN':
    case 'NPROC':
      return os.cpus().length;

    case 'HOSTNAME':
      return os.hostname();

    case 'LOGIN':
    case 'LOGNAME':
      return os.userInfo().username;

    case 'TMPDIR':
    case 'TEMP':
    case 'TMP':
      return os.tmpdir();

    case 'HOMEDIR':
    case 'HOME':
      return os.userInfo().homedir;

    case 'SHELL':
      return os.userInfo().shell || '/bin/sh';

    case 'PLATFORM':
      return os.platform();

    case 'ARCH':
    case 'ARCHITECTURE':
      return os.arch();

    case 'ENDIANNESS':
      return os.endianness();

    case 'TOTALMEM':
      return os.totalmem();

    case 'FREEMEM':
      return os.freemem();

    case 'UPTIME':
      return os.uptime();

    default:
      // For unknown config names, return undefined
      return undefined;
  }
}

/**
 * DNSDOMAINNAME - Get DNS domain name from hostname
 * Extracts domain portion from FQDN
 * Node.js only
 */
function DNSDOMAINNAME() {
  if (!isNodeJS) {
    throw new Error('DNSDOMAINNAME is only available in Node.js environment');
  }

  const os = require('os');
  const hostname = os.hostname();

  // If hostname contains dots, extract domain part
  const parts = hostname.split('.');
  if (parts.length > 1) {
    // Remove first part (hostname) and join the rest (domain)
    return parts.slice(1).join('.');
  }

  // No domain in hostname, return empty string
  return '';
}

/**
 * TTY - Check if running in a TTY (terminal)
 * Returns boolean indicating TTY status
 * Node.js only
 */
function TTY() {
  if (!isNodeJS) {
    throw new Error('TTY is only available in Node.js environment');
  }

  // Check if stdin is a TTY
  return process.stdin.isTTY || false;
}

/**
 * FACTOR - Prime factorization
 * Returns array of prime factors
 * Works in both Node.js and browser
 */
function FACTOR(n) {
  const num = parseInt(n);

  if (isNaN(num) || num < 1) {
    throw new Error('FACTOR requires a positive integer');
  }

  if (num === 1) {
    return [1];
  }

  const factors = [];
  let remaining = num;

  // Check for factor 2
  while (remaining % 2 === 0) {
    factors.push(2);
    remaining = remaining / 2;
  }

  // Check odd factors from 3 onwards
  for (let i = 3; i * i <= remaining; i += 2) {
    while (remaining % i === 0) {
      factors.push(i);
      remaining = remaining / i;
    }
  }

  // If remaining is > 2, it's a prime factor
  if (remaining > 2) {
    factors.push(remaining);
  }

  return factors;
}

/**
 * MCOOKIE - Generate random hex cookie
 * Returns 128-bit random hex string (32 characters)
 * Node.js only
 */
function MCOOKIE(bytes = 16) {
  if (!isNodeJS) {
    throw new Error('MCOOKIE is only available in Node.js environment');
  }

  const crypto = require('crypto');
  const numBytes = parseInt(bytes) || 16;
  return crypto.randomBytes(numBytes).toString('hex');
}

/**
 * MKTEMP - Generate temporary file path
 * Returns path to temp file with optional template
 * Node.js only
 */
function MKTEMP(template = 'tmp.XXXXXXXXXX') {
  if (!isNodeJS) {
    throw new Error('MKTEMP is only available in Node.js environment');
  }

  const os = require('os');
  const path = require('path');
  const crypto = require('crypto');

  const tmpDir = os.tmpdir();

  // Replace X's with random characters
  const randomPart = template.replace(/X+/g, (match) => {
    const randomBytes = crypto.randomBytes(Math.ceil(match.length / 2));
    return randomBytes.toString('hex').substring(0, match.length);
  });

  return path.join(tmpDir, randomPart);
}

/**
 * ASCII - Generate ASCII table
 * Returns formatted ASCII table or specific character info
 * Works in both Node.js and browser
 */
function ASCII(char) {
  if (char !== undefined && char !== null) {
    // Return info for specific character
    const input = String(char);
    const firstChar = input.charCodeAt(0);

    if (isNaN(firstChar)) {
      return 'Invalid character';
    }

    const dec = firstChar;
    const hex = dec.toString(16).toUpperCase().padStart(2, '0');
    const oct = dec.toString(8).padStart(3, '0');
    const bin = dec.toString(2).padStart(8, '0');
    const chr = dec >= 32 && dec <= 126 ? String.fromCharCode(dec) :
                dec === 10 ? '\\n' :
                dec === 13 ? '\\r' :
                dec === 9 ? '\\t' :
                dec === 0 ? '\\0' : '^' + String.fromCharCode(dec + 64);

    return `Dec: ${dec}, Hex: 0x${hex}, Oct: 0${oct}, Bin: 0b${bin}, Char: ${chr}`;
  }

  // Return full ASCII table
  const lines = [];
  lines.push('Dec  Hex  Oct  Bin       Char | Dec  Hex  Oct  Bin       Char');
  lines.push('---- ---- ---- --------- ---- | ---- ---- ---- --------- ----');

  for (let i = 0; i < 64; i++) {
    const left = i;
    const right = i + 64;

    const formatChar = (code) => {
      if (code > 127) return '';
      const hex = code.toString(16).toUpperCase().padStart(2, '0');
      const oct = code.toString(8).padStart(3, '0');
      const bin = code.toString(2).padStart(8, '0');
      const chr = code >= 32 && code <= 126 ? String.fromCharCode(code).padEnd(4) :
                  code === 10 ? '\\n  ' :
                  code === 13 ? '\\r  ' :
                  code === 9 ? '\\t  ' :
                  code === 0 ? '\\0  ' :
                  ('^' + String.fromCharCode(code + 64)).padEnd(4);
      return `${String(code).padStart(3)} 0x${hex} 0${oct} 0b${bin} ${chr}`;
    };

    const leftPart = formatChar(left);
    const rightPart = formatChar(right);

    if (rightPart) {
      lines.push(`${leftPart} | ${rightPart}`);
    } else {
      lines.push(leftPart);
    }
  }

  return lines.join('\n');
}

/**
 * YES - Repeat text infinitely or N times
 * Returns array of repeated strings
 * Works in both Node.js and browser
 */
function YES(text = 'y', count = 100) {
  const str = String(text);
  const num = parseInt(count) || 100;

  // Limit to reasonable number to prevent infinite loops
  const limit = Math.min(num, 10000);

  return Array(limit).fill(str);
}

/**
 * TRUE - Always returns true
 * Works in both Node.js and browser
 */
function TRUE() {
  return true;
}

/**
 * FALSE - Always returns false
 * Works in both Node.js and browser
 */
function FALSE() {
  return false;
}

/**
 * CAL - Generate calendar for a month/year
 * Returns formatted calendar string
 * Works in both Node.js and browser
 */
function CAL(month, year) {
  const now = new Date();
  const m = month !== undefined ? parseInt(month) - 1 : now.getMonth();
  const y = year !== undefined ? parseInt(year) : now.getFullYear();

  if (isNaN(m) || m < 0 || m > 11 || isNaN(y)) {
    throw new Error('Invalid month or year');
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const lines = [];

  // Header: "Month Year" centered
  const header = `${monthNames[m]} ${y}`;
  lines.push(header.padStart(10 + header.length / 2).padEnd(20));

  // Day headers
  lines.push('Su Mo Tu We Th Fr Sa');

  // Get first day of month and number of days
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  // Build calendar grid
  let week = ' '.repeat(firstDay * 3); // Padding for first week

  for (let day = 1; day <= daysInMonth; day++) {
    week += String(day).padStart(2) + ' ';

    // Sunday (0) or last day of month
    const currentDay = (firstDay + day - 1) % 7;
    if (currentDay === 6 || day === daysInMonth) {
      lines.push(week.trimEnd());
      week = '';
    }
  }

  return lines.join('\n');
}

/**
 * WHICH - Search for command in PATH
 * Returns path to command or null if not found
 * Node.js only
 */
function WHICH(command) {
  if (!isNodeJS) {
    throw new Error('WHICH is only available in Node.js environment');
  }

  const fs = require('fs');
  const path = require('path');
  const cmd = String(command);

  // Get PATH environment variable
  const pathEnv = process.env.PATH || '';
  const pathDirs = pathEnv.split(path.delimiter);

  // Check for command in each PATH directory
  for (const dir of pathDirs) {
    const fullPath = path.join(dir, cmd);

    try {
      // Check if file exists and is executable
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isFile()) {
          return fullPath;
        }
      }

      // On Windows, also try with .exe, .cmd, .bat extensions
      if (process.platform === 'win32') {
        for (const ext of ['.exe', '.cmd', '.bat', '.com']) {
          const winPath = fullPath + ext;
          if (fs.existsSync(winPath)) {
            const stats = fs.statSync(winPath);
            if (stats.isFile()) {
              return winPath;
            }
          }
        }
      }
    } catch (err) {
      // Skip directories we can't access
      continue;
    }
  }

  return null;
}

/**
 * MKPASSWD - Generate password hash
 * Returns bcrypt-style hash using Node.js crypto
 * Node.js only
 */
function MKPASSWD(password, salt = '$6$') {
  if (!isNodeJS) {
    throw new Error('MKPASSWD is only available in Node.js environment');
  }

  const crypto = require('crypto');
  const pwd = String(password);
  const saltStr = String(salt);

  // Use SHA-512 for password hashing (similar to Unix mkpasswd -m sha-512)
  const hash = crypto.createHash('sha512');
  hash.update(saltStr + pwd);

  return saltStr + hash.digest('base64');
}

/**
 * GZIP - Compress data using gzip
 * Returns compressed Buffer or base64 string
 * Node.js only
 */
function GZIP(input, encoding = 'buffer') {
  if (!isNodeJS) {
    throw new Error('GZIP is only available in Node.js environment');
  }

  const zlib = require('zlib');

  // Convert input to Buffer
  let buffer;
  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (Array.isArray(input)) {
    buffer = Buffer.from(input.join('\n'));
  } else {
    buffer = Buffer.from(String(input));
  }

  // Compress
  const compressed = zlib.gzipSync(buffer);

  // Return based on encoding preference
  const enc = String(encoding).toLowerCase();
  if (enc === 'base64') {
    return compressed.toString('base64');
  } else if (enc === 'hex') {
    return compressed.toString('hex');
  }

  return compressed;
}

/**
 * GUNZIP - Decompress gzip data
 * Returns decompressed string or Buffer
 * Node.js only
 */
function GUNZIP(input, encoding = 'utf8') {
  if (!isNodeJS) {
    throw new Error('GUNZIP is only available in Node.js environment');
  }

  const zlib = require('zlib');

  // Convert input to Buffer
  let buffer;
  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (typeof input === 'string') {
    // Auto-detect encoding: check hex first (more specific), then base64
    const isHex = /^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0;
    const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(input) && !isHex;

    if (isHex) {
      buffer = Buffer.from(input, 'hex');
    } else if (isBase64) {
      buffer = Buffer.from(input, 'base64');
    } else {
      // Assume it's raw binary string
      buffer = Buffer.from(input, 'binary');
    }
  } else {
    buffer = Buffer.from(String(input));
  }

  // Decompress
  const decompressed = zlib.gunzipSync(buffer);

  // Return based on encoding preference
  const enc = String(encoding).toLowerCase();
  if (enc === 'buffer') {
    return decompressed;
  }

  return decompressed.toString(enc);
}

/**
 * ZCAT - Decompress and output gzip data (alias for GUNZIP)
 * Returns decompressed string
 * Node.js only
 */
function ZCAT(input) {
  return GUNZIP(input, 'utf8');
}

/**
 * READLINK - Read symbolic link target
 * Returns the path that the symlink points to
 * Node.js only
 */
function READLINK(linkPath) {
  if (!isNodeJS) {
    throw new Error('READLINK is only available in Node.js environment');
  }

  const fs = require('fs');

  if (!fs.existsSync(linkPath)) {
    throw new Error(`Path does not exist: ${linkPath}`);
  }

  const stats = fs.lstatSync(linkPath);
  if (!stats.isSymbolicLink()) {
    throw new Error(`Not a symbolic link: ${linkPath}`);
  }

  return fs.readlinkSync(linkPath);
}

/**
 * DU - Calculate disk usage
 * Returns total size in bytes (or object with details)
 * Node.js only
 */
function DU(dirPath = '.', detailed = false) {
  if (!isNodeJS) {
    throw new Error('DU is only available in Node.js environment');
  }

  const fs = require('fs');
  const path = require('path');

  if (!fs.existsSync(dirPath)) {
    throw new Error(`Path does not exist: ${dirPath}`);
  }

  let totalSize = 0;
  const fileSizes = [];

  function calculateSize(p) {
    const stats = fs.lstatSync(p);

    if (stats.isFile()) {
      totalSize += stats.size;
      if (detailed) {
        fileSizes.push({ path: p, size: stats.size });
      }
    } else if (stats.isDirectory()) {
      const entries = fs.readdirSync(p);
      for (const entry of entries) {
        calculateSize(path.join(p, entry));
      }
    }
  }

  calculateSize(dirPath);

  if (detailed) {
    return {
      total: totalSize,
      files: fileSizes,
      count: fileSizes.length
    };
  }

  return totalSize;
}

/**
 * RMDIR - Remove directory
 * Returns true on success
 * Node.js only
 */
function RMDIR(dirPath, recursive = false) {
  if (!isNodeJS) {
    throw new Error('RMDIR is only available in Node.js environment');
  }

  const fs = require('fs');

  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory does not exist: ${dirPath}`);
  }

  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${dirPath}`);
  }

  if (toBool(recursive)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } else {
    fs.rmdirSync(dirPath);
  }

  return true;
}

/**
 * TOUCH - Update file timestamps (or create empty file)
 * Returns true on success
 * Node.js only
 */
function TOUCH(filePath, time = null) {
  if (!isNodeJS) {
    throw new Error('TOUCH is only available in Node.js environment');
  }

  const fs = require('fs');

  // Create file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
  }

  // Update timestamps
  const timestamp = time ? new Date(time) : new Date();
  fs.utimesSync(filePath, timestamp, timestamp);

  return true;
}

/**
 * CHMOD - Change file permissions
 * Returns true on success
 * Node.js only
 */
function CHMOD(filePath, mode) {
  if (!isNodeJS) {
    throw new Error('CHMOD is only available in Node.js environment');
  }

  const fs = require('fs');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Path does not exist: ${filePath}`);
  }

  // Handle octal string (e.g., "755") or number
  let modeNum;
  if (typeof mode === 'string') {
    // Parse as octal
    modeNum = parseInt(mode, 8);
  } else {
    modeNum = parseInt(mode);
  }

  fs.chmodSync(filePath, modeNum);

  return true;
}

/**
 * LINK - Create hard link
 * Returns true on success
 * Node.js only
 */
function LINK(existingPath, newPath) {
  if (!isNodeJS) {
    throw new Error('LINK is only available in Node.js environment');
  }

  const fs = require('fs');

  if (!fs.existsSync(existingPath)) {
    throw new Error(`Source path does not exist: ${existingPath}`);
  }

  if (fs.existsSync(newPath)) {
    throw new Error(`Destination already exists: ${newPath}`);
  }

  fs.linkSync(existingPath, newPath);

  return true;
}

/**
 * UNLINK - Remove file or symbolic link
 * Returns true on success
 * Node.js only
 */
function UNLINK(filePath) {
  if (!isNodeJS) {
    throw new Error('UNLINK is only available in Node.js environment');
  }

  const fs = require('fs');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Path does not exist: ${filePath}`);
  }

  fs.unlinkSync(filePath);

  return true;
}

/**
 * CHOWN - Change file owner
 * Returns true on success
 * Node.js only
 */
function CHOWN(filePath, uid, gid = null) {
  if (!isNodeJS) {
    throw new Error('CHOWN is only available in Node.js environment');
  }

  const fs = require('fs');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Path does not exist: ${filePath}`);
  }

  const uidNum = parseInt(uid);
  const gidNum = gid !== null ? parseInt(gid) : -1;

  fs.chownSync(filePath, uidNum, gidNum);

  return true;
}

/**
 * TRUNCATE - Truncate file to specified size
 * Returns true on success
 * Node.js only
 */
function TRUNCATE(filePath, size = 0) {
  if (!isNodeJS) {
    throw new Error('TRUNCATE is only available in Node.js environment');
  }

  const fs = require('fs');

  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  const sizeNum = parseInt(size) || 0;
  fs.truncateSync(filePath, sizeNum);

  return true;
}

/**
 * LN - Create symbolic link
 * Returns true on success
 * Node.js only
 */
function LN(target, linkPath, symbolic = true) {
  if (!isNodeJS) {
    throw new Error('LN is only available in Node.js environment');
  }

  const fs = require('fs');

  if (fs.existsSync(linkPath)) {
    throw new Error(`Link path already exists: ${linkPath}`);
  }

  if (toBool(symbolic)) {
    fs.symlinkSync(target, linkPath);
  } else {
    // Hard link
    if (!fs.existsSync(target)) {
      throw new Error(`Target does not exist: ${target}`);
    }
    fs.linkSync(target, linkPath);
  }

  return true;
}

/**
 * CHGRP - Change file group
 * Returns true on success
 * Node.js only
 */
function CHGRP(filePath, gid) {
  if (!isNodeJS) {
    throw new Error('CHGRP is only available in Node.js environment');
  }

  const fs = require('fs');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Path does not exist: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  const gidNum = parseInt(gid);

  // Change group, keep current uid
  fs.chownSync(filePath, stats.uid, gidNum);

  return true;
}

/**
 * INSTALL - Copy file and set permissions (like install command)
 * Returns true on success
 * Node.js only
 */
function INSTALL(source, destination, mode = '755') {
  if (!isNodeJS) {
    throw new Error('INSTALL is only available in Node.js environment');
  }

  const fs = require('fs');

  if (!fs.existsSync(source)) {
    throw new Error(`Source file does not exist: ${source}`);
  }

  // Copy file
  fs.copyFileSync(source, destination);

  // Set permissions
  let modeNum;
  if (typeof mode === 'string') {
    modeNum = parseInt(mode, 8);
  } else {
    modeNum = parseInt(mode);
  }

  fs.chmodSync(destination, modeNum);

  return true;
}

/**
 * KILL - Send signal to process
 * Returns true on success
 * Node.js only
 */
function KILL(pid, signal = 'SIGTERM') {
  if (!isNodeJS) {
    throw new Error('KILL is only available in Node.js environment');
  }

  const pidNum = parseInt(pid);
  const sig = String(signal).toUpperCase();

  // Send signal to process
  process.kill(pidNum, sig);

  return true;
}

/**
 * GETPID - Get current process ID
 * Returns process ID number
 * Node.js only
 */
function GETPID() {
  if (!isNodeJS) {
    throw new Error('GETPID is only available in Node.js environment');
  }

  return process.pid;
}

/**
 * GETPPID - Get parent process ID
 * Returns parent process ID number
 * Node.js only
 */
function GETPPID() {
  if (!isNodeJS) {
    throw new Error('GETPPID is only available in Node.js environment');
  }

  return process.ppid;
}

/**
 * EXIT - Exit process with code
 * Does not return (exits process)
 * Node.js only
 */
function EXIT(code = 0) {
  if (!isNodeJS) {
    throw new Error('EXIT is only available in Node.js environment');
  }

  const exitCode = parseInt(code) || 0;
  process.exit(exitCode);
}

/**
 * SLEEP - Sleep for specified milliseconds
 * Returns true after sleeping
 * Node.js only (uses busy-wait, not recommended for production)
 */
function SLEEP(ms = 1000) {
  if (!isNodeJS) {
    throw new Error('SLEEP is only available in Node.js environment');
  }

  const duration = parseInt(ms) || 1000;
  const start = Date.now();

  // Busy-wait (blocking sleep)
  // Note: This blocks the event loop - use carefully
  while (Date.now() - start < duration) {
    // Busy wait
  }

  return true;
}

/**
 * GETENV - Get all environment variables or specific variable
 * Returns object or string
 * Node.js only
 */
function GETENV(name = null) {
  if (!isNodeJS) {
    throw new Error('GETENV is only available in Node.js environment');
  }

  // Debug: log what we received
  //console.log('GETENV called with:', name, 'type:', typeof name);

  if (name === null || name === undefined || name === '') {
    // Return all environment variables as a plain object (copy)
    return { ...process.env };
  }

  // Return specific variable
  return process.env[String(name)];
}

/**
 * SETENV - Set environment variable
 * Returns true on success
 * Node.js only
 */
function SETENV(name, value) {
  if (!isNodeJS) {
    throw new Error('SETENV is only available in Node.js environment');
  }

  process.env[String(name)] = String(value);
  return true;
}

/**
 * UNSETENV - Unset environment variable
 * Returns true on success
 * Node.js only
 */
function UNSETENV(name) {
  if (!isNodeJS) {
    throw new Error('UNSETENV is only available in Node.js environment');
  }

  delete process.env[String(name)];
  return true;
}

/**
 * Process Management Operations
 */

/**
 * PS - List running processes
 * Returns array of process objects with pid, ppid, name, cmd, cpu, mem
 * Node.js only
 */
function PS() {
  if (!isNodeJS) {
    throw new Error('PS is only available in Node.js environment');
  }

  const platform = os.platform();
  let output;

  try {
    if (platform === 'win32') {
      // Windows: Use WMIC or Get-Process
      output = child_process.execSync('wmic process get ProcessId,ParentProcessId,Name,CommandLine,WorkingSetSize /format:csv', {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true
      });
    } else {
      // Unix-like: Use ps command with standardized format
      output = child_process.execSync('ps -eo pid,ppid,pcpu,pmem,comm,args', {
        encoding: 'utf8',
        timeout: 10000
      });
    }
  } catch (error) {
    throw new Error(`Failed to list processes: ${error.message}`);
  }

  // Parse the output into structured data
  const processes = [];
  const lines = output.trim().split('\n');

  if (platform === 'win32') {
    // Parse Windows CSV format (skip header lines)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('Node,')) continue;

      const parts = line.split(',');
      if (parts.length >= 4) {
        processes.push({
          pid: parseInt(parts[3]) || 0,
          ppid: parseInt(parts[2]) || 0,
          name: parts[1] || '',
          cmd: parts[4] || parts[1] || '',
          cpu: 0,
          mem: parseInt(parts[5]) || 0
        });
      }
    }
  } else {
    // Parse Unix ps output (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by whitespace, handling multiple spaces
      const parts = line.split(/\s+/);
      if (parts.length >= 5) {
        processes.push({
          pid: parseInt(parts[0]) || 0,
          ppid: parseInt(parts[1]) || 0,
          cpu: parseFloat(parts[2]) || 0,
          mem: parseFloat(parts[3]) || 0,
          name: parts[4] || '',
          cmd: parts.slice(5).join(' ') || parts[4] || ''
        });
      }
    }
  }

  return processes;
}

/**
 * PGREP - Find process IDs by name or pattern
 * Returns array of PIDs matching the pattern
 * Node.js only
 */
function PGREP(pattern, full = false, exact = false) {
  if (!isNodeJS) {
    throw new Error('PGREP is only available in Node.js environment');
  }

  full = toBool(full);
  exact = toBool(exact);
  const platform = os.platform();
  let pids = [];

  try {
    if (platform === 'win32') {
      // Windows: Use tasklist and filter
      const processes = PS();
      const regex = exact ? new RegExp(`^${pattern}$`, 'i') : new RegExp(pattern, 'i');

      pids = processes
        .filter(p => {
          const searchField = full ? p.cmd : p.name;
          return regex.test(searchField);
        })
        .map(p => p.pid);
    } else {
      // Unix-like: Use pgrep command if available
      try {
        let cmd = 'pgrep';
        if (full) cmd += ' -f';
        if (exact) cmd += ' -x';
        cmd += ` "${pattern}"`;

        const output = child_process.execSync(cmd, {
          encoding: 'utf8',
          timeout: 5000
        });

        pids = output.trim().split('\n').map(pid => parseInt(pid)).filter(pid => !isNaN(pid));
      } catch (error) {
        // pgrep not available or no matches, fall back to PS
        if (error.status === 1) {
          // pgrep returns 1 when no processes match
          return [];
        }

        // pgrep command not found, use PS
        const processes = PS();
        const regex = exact ? new RegExp(`^${pattern}$`) : new RegExp(pattern);

        pids = processes
          .filter(p => {
            const searchField = full ? p.cmd : p.name;
            return regex.test(searchField);
          })
          .map(p => p.pid);
      }
    }
  } catch (error) {
    throw new Error(`Failed to search processes: ${error.message}`);
  }

  return pids;
}

/**
 * KILLALL - Kill all processes matching name
 * Returns number of processes killed
 * Node.js only
 */
function KILLALL(name, signal = 'SIGTERM') {
  if (!isNodeJS) {
    throw new Error('KILLALL is only available in Node.js environment');
  }

  const platform = os.platform();
  const sig = String(signal).toUpperCase();

  try {
    if (platform === 'win32') {
      // Windows: Use taskkill
      const output = child_process.execSync(`taskkill /F /IM "${name}" /T`, {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true
      });

      // Parse output to count killed processes
      const matches = output.match(/SUCCESS/g);
      return matches ? matches.length : 0;
    } else {
      // Unix-like: Find processes and kill them
      const pids = PGREP(name, { exact: false });

      let killedCount = 0;
      for (const pid of pids) {
        try {
          process.kill(pid, sig);
          killedCount++;
        } catch (err) {
          // Process might have already exited or permission denied
          // Continue with other processes
        }
      }

      return killedCount;
    }
  } catch (error) {
    // If no processes found, return 0 instead of throwing
    if (error.message && error.message.includes('not found')) {
      return 0;
    }
    throw new Error(`Failed to kill processes: ${error.message}`);
  }
}

/**
 * TOP - Get real-time process information snapshot
 * Returns object with system stats and top processes
 * Node.js only
 */
function TOP(limit = 10, sortBy = 'cpu') {
  if (!isNodeJS) {
    throw new Error('TOP is only available in Node.js environment');
  }

  const n = parseInt(limit) || 10;
  const sortField = String(sortBy) === 'mem' ? 'mem' : 'cpu';

  // Get all processes
  const processes = PS();

  // Sort by requested field
  processes.sort((a, b) => b[sortField] - a[sortField]);

  // Get top N processes
  const topProcesses = processes.slice(0, n);

  // Get system information
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const loadAvg = os.loadavg();
  const uptime = os.uptime();
  const cpus = os.cpus();

  return {
    timestamp: new Date().toISOString(),
    system: {
      uptime: uptime,
      loadAverage: {
        '1min': loadAvg[0],
        '5min': loadAvg[1],
        '15min': loadAvg[2]
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        percentUsed: (usedMem / totalMem) * 100
      },
      cpus: cpus.length,
      cpuModel: cpus[0] ? cpus[0].model : 'Unknown'
    },
    processes: {
      total: processes.length,
      top: topProcesses
    }
  };
}

/**
 * NICE - Run a command with modified scheduling priority
 * Returns object with { exitCode, stdout, stderr }
 * Node.js only
 */
function NICE(command, priority = 10, shell = true) {
  if (!isNodeJS) {
    throw new Error('NICE is only available in Node.js environment');
  }

  shell = toBool(shell);
  const platform = os.platform();

  // Validate priority (-20 to 19 on Unix, not applicable on Windows)
  const niceness = Math.max(-20, Math.min(19, parseInt(priority) || 10));

  try {
    let cmd;
    let execOptions = {
      encoding: 'utf8',
      timeout: 30000,
      shell: shell
    };

    if (platform === 'win32') {
      // Windows: Use start with priority class
      // Priority mapping: below normal, normal, above normal, high
      let windowsPriority = '/normal';
      if (niceness < -10) windowsPriority = '/high';
      else if (niceness < 0) windowsPriority = '/abovenormal';
      else if (niceness > 10) windowsPriority = '/belownormal';
      else if (niceness > 0) windowsPriority = '/low';

      cmd = `start ${windowsPriority} /wait /b ${command}`;
    } else {
      // Unix-like: Use nice command
      cmd = `nice -n ${niceness} ${command}`;
    }

    const output = child_process.execSync(cmd, execOptions);

    return {
      exitCode: 0,
      stdout: output.toString(),
      stderr: ''
    };
  } catch (error) {
    return {
      exitCode: error.status || 1,
      stdout: error.stdout ? error.stdout.toString() : '',
      stderr: error.stderr ? error.stderr.toString() : error.message
    };
  }
}

/**
 * Network Operations
 */

/**
 * HOST - DNS lookup for hostname
 * Returns array of IP addresses or object with detailed info
 * Node.js only
 */
function HOST(hostname, options = {}) {
  if (!isNodeJS) {
    throw new Error('HOST is only available in Node.js environment');
  }

  const { execSync } = require('child_process');
  const os = require('os');
  const { detailed = false, family = 0 } = options;

  try {
    // Special handling for localhost - read /etc/hosts directly to get all entries
    let output;
    if (hostname === 'localhost') {
      const fs = require('fs');
      try {
        const hostsFile = fs.readFileSync('/etc/hosts', 'utf8');
        const localhostLines = hostsFile.split('\n').filter(line =>
          line.includes('localhost') && !line.trim().startsWith('#')
        );
        output = localhostLines.join('\n') || '127.0.0.1 localhost\n::1 localhost';
      } catch (e) {
        output = '127.0.0.1 localhost\n::1 localhost';
      }
    } else {
      // For other hosts, use getent or host command
      try {
        // Try getent first (works on most Linux systems)
        output = execSync(`getent hosts ${hostname}`, { encoding: 'utf8', timeout: 5000 }).trim();
      } catch (e) {
        // Fallback: try host command
        try {
          output = execSync(`host ${hostname}`, { encoding: 'utf8', timeout: 5000 }).trim();
        } catch (e2) {
          throw new Error(`Cannot resolve ${hostname}`);
        }
      }
    }

    // Parse output to extract IPs
    const ips = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Match IP addresses (IPv4 and IPv6)
      const ipv4Match = line.match(/\b(\d{1,3}\.){3}\d{1,3}\b/);
      // IPv6 regex: match addresses like ::1, fe80::1, 2001:db8::1, etc.
      const ipv6Match = line.match(/(([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}|::1?)/);

      if (ipv4Match && (family === 0 || family === 4)) {
        ips.push({ address: ipv4Match[0], family: 4 });
      }
      if (ipv6Match && ipv6Match[0].includes(':') && (family === 0 || family === 6)) {
        ips.push({ address: ipv6Match[0], family: 6 });
      }
    }

    if (ips.length === 0) {
      throw new Error(`No IP addresses found for ${hostname}`);
    }

    if (detailed) {
      // Return detailed info
      const result = {
        hostname: hostname,
        ipv4: ips.filter(ip => ip.family === 4).map(ip => ip.address),
        ipv6: ips.filter(ip => ip.family === 6).map(ip => ip.address),
        all: ips
      };
      return result;
    } else {
      // Simple mode - return array of IP addresses
      return ips.map(ip => ip.address);
    }
  } catch (err) {
    throw new Error(`DNS lookup failed for ${hostname}: ${err.message}`);
  }
}

/**
 * IFCONFIG - Get network interfaces information
 * Returns object with interface details
 * Node.js only
 */
function IFCONFIG(interfaceName = null) {
  if (!isNodeJS) {
    throw new Error('IFCONFIG is only available in Node.js environment');
  }

  const os = require('os');
  const interfaces = os.networkInterfaces();

  if (interfaceName) {
    // Return specific interface
    const iface = interfaces[interfaceName];
    if (!iface) {
      throw new Error(`Network interface '${interfaceName}' not found`);
    }
    return {
      name: interfaceName,
      addresses: iface
    };
  }

  // Return all interfaces in a more usable format
  const result = [];
  for (const [name, addrs] of Object.entries(interfaces)) {
    result.push({
      name,
      addresses: addrs
    });
  }

  return result;
}

/**
 * File Utilities
 */

/**
 * FILESPLIT - Split file into smaller files
 * Returns array of created filenames
 * Node.js only
 */
function FILESPLIT(input, options = {}) {
  if (!isNodeJS) {
    throw new Error('FILESPLIT is only available in Node.js environment');
  }

  const fs = require('fs');
  const path = require('path');

  const {
    lines = 1000,           // Lines per file
    bytes = null,           // Bytes per file (overrides lines if set)
    prefix = 'x',           // Output file prefix
    suffix = '',            // Output file suffix
    numeric = false,        // Use numeric suffixes (00, 01, 02...)
    additionalSuffix = ''   // Additional suffix after the counter
  } = options;

  // Read input
  let content;
  if (typeof input === 'string' && fs.existsSync(input)) {
    // Input is a file path
    content = fs.readFileSync(input, 'utf8');
  } else if (Array.isArray(input)) {
    // Input is an array of lines
    content = input.join('\n');
  } else {
    // Input is a string
    content = String(input);
    // REXX doesn't process escape sequences in strings, so we need to handle them
    // Convert common escape sequences
    content = content.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
  }

  const outputFiles = [];
  let fileIndex = 0;

  const getSuffix = (index) => {
    if (numeric) {
      return String(index).padStart(2, '0');
    } else {
      // Use alphabetic suffixes: aa, ab, ac, ..., az, ba, bb, ...
      // This mimics Unix split behavior
      const first = String.fromCharCode(97 + Math.floor(index / 26));
      const second = String.fromCharCode(97 + (index % 26));
      return first + second;
    }
  };

  if (bytes) {
    // Split by bytes
    let offset = 0;
    while (offset < content.length) {
      const chunk = content.slice(offset, offset + bytes);
      const filename = `${prefix}${getSuffix(fileIndex)}${additionalSuffix}`;
      fs.writeFileSync(filename, chunk);
      outputFiles.push(filename);
      offset += bytes;
      fileIndex++;
    }
  } else {
    // Split by lines
    const allLines = content.split('\n');
    let lineIndex = 0;

    while (lineIndex < allLines.length) {
      const chunk = allLines.slice(lineIndex, lineIndex + lines);
      const filename = `${prefix}${getSuffix(fileIndex)}${additionalSuffix}`;
      fs.writeFileSync(filename, chunk.join('\n') + (lineIndex + lines < allLines.length ? '\n' : ''));
      outputFiles.push(filename);
      lineIndex += lines;
      fileIndex++;
    }
  }

  return outputFiles;
}

/**
 * System Utilities
 */

/**
 * TIMEOUT - Run command with time limit
 * Returns object with {stdout, stderr, status, timedOut, signal}
 * Node.js only
 */
function TIMEOUT(command, ms = 10000, options = {}) {
  if (!isNodeJS) {
    throw new Error('TIMEOUT is only available in Node.js environment');
  }

  const { execSync } = require('child_process');
  const timeout = parseInt(ms) || 10000;

  try {
    const stdout = execSync(command, {
      timeout,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
      ...options
    });

    return {
      stdout: stdout,
      stderr: '',
      status: 0,
      timedOut: false,
      signal: null
    };
  } catch (err) {
    // Check if timed out
    // When execSync times out, it may set killed=true and/or signal='SIGTERM'
    // Also check if signal exists and status is null (common timeout pattern)
    const timedOut = err.killed === true ||
                     (err.signal && err.status === null) ||
                     (err.signal === 'SIGTERM' && err.code !== 0);

    return {
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : '',
      status: err.status !== null && err.status !== undefined ? err.status : (timedOut ? 124 : 1),
      timedOut,
      signal: err.signal || null
    };
  }
}

/**
 * FSYNC - Flush file data to disk
 * Returns true on success
 * Node.js only
 */
function FSYNC(pathOrFd) {
  if (!isNodeJS) {
    throw new Error('FSYNC is only available in Node.js environment');
  }

  const fs = require('fs');

  // Check if it's a file descriptor (number) or path (string)
  if (typeof pathOrFd === 'number') {
    // File descriptor
    fs.fsyncSync(pathOrFd);
  } else {
    // File path - need to open, sync, and close
    const fd = fs.openSync(String(pathOrFd), 'r+');
    try {
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  }

  return true;
}

/**
 * SYNC - Synchronize all filesystems
 * Returns true on success
 * Node.js only
 */
function SYNC() {
  if (!isNodeJS) {
    throw new Error('SYNC is only available in Node.js environment');
  }

  const { execSync } = require('child_process');

  // Run sync command
  execSync('sync');

  return true;
}

/**
 * GETOPT - Parse command-line options
 * Returns {options: {key: value}, arguments: [non-option args]}
 * Works in both Node.js and browser
 */
function GETOPT(args, optstring = '', longopts = []) {
  // Convert args to array if needed
  const argArray = Array.isArray(args) ? args : [args];

  // Parse optstring (e.g., "ab:c::" means -a (no arg), -b (required arg), -c (optional arg))
  const shortOpts = {};
  const optChars = String(optstring).split('');
  let i = 0;
  while (i < optChars.length) {
    const char = optChars[i];
    if (char === ':') {
      i++;
      continue;
    }

    let argType = 'none';
    if (optChars[i + 1] === ':') {
      if (optChars[i + 2] === ':') {
        argType = 'optional';
        i += 2;
      } else {
        argType = 'required';
        i++;
      }
    }

    shortOpts[char] = argType;
    i++;
  }

  // Parse longopts (array like ['verbose', 'output=', 'help'])
  const longOpts = {};
  for (const opt of longopts) {
    if (opt.endsWith('=')) {
      longOpts[opt.slice(0, -1)] = 'required';
    } else {
      longOpts[opt] = 'none';
    }
  }

  const options = {};
  const positional = [];
  let idx = 0;

  while (idx < argArray.length) {
    const arg = argArray[idx];

    // Check for end of options marker
    if (arg === '--') {
      idx++;
      // Everything after -- is positional
      positional.push(...argArray.slice(idx));
      break;
    }

    // Long option
    if (arg.startsWith('--')) {
      const optName = arg.slice(2);
      const [name, value] = optName.split('=', 2);

      if (longOpts[name] !== undefined) {
        if (longOpts[name] === 'required') {
          if (value !== undefined) {
            options[name] = value;
          } else if (idx + 1 < argArray.length && !argArray[idx + 1].startsWith('-')) {
            options[name] = argArray[idx + 1];
            idx++;
          } else {
            throw new Error(`Option --${name} requires an argument`);
          }
        } else {
          options[name] = value !== undefined ? value : true;
        }
      } else {
        // Unknown long option - treat as positional
        positional.push(arg);
      }
      idx++;
      continue;
    }

    // Short option(s)
    if (arg.startsWith('-') && arg.length > 1 && arg !== '-') {
      const chars = arg.slice(1).split('');
      let charIdx = 0;

      while (charIdx < chars.length) {
        const char = chars[charIdx];

        if (shortOpts[char] !== undefined) {
          if (shortOpts[char] === 'required') {
            // Get argument
            const remaining = chars.slice(charIdx + 1).join('');
            if (remaining) {
              options[char] = remaining;
              break; // Rest of string is the argument
            } else if (idx + 1 < argArray.length && !argArray[idx + 1].startsWith('-')) {
              options[char] = argArray[idx + 1];
              idx++;
              break;
            } else {
              throw new Error(`Option -${char} requires an argument`);
            }
          } else if (shortOpts[char] === 'optional') {
            const remaining = chars.slice(charIdx + 1).join('');
            options[char] = remaining || true;
            break;
          } else {
            options[char] = true;
          }
        } else {
          // Unknown option - could treat as error or ignore
          options[char] = true;
        }

        charIdx++;
      }

      idx++;
      continue;
    }

    // Positional argument
    positional.push(arg);
    idx++;
  }

  return {
    options,
    arguments: positional
  };
}

// Export functions only in Node.js environment
// In browser mode, export empty object (these functions won't be used)
if (isNodeJS) {
  module.exports = {
    LS,
    CAT,
    GREP,
    FIND,
    MKDIR,
    CP,
    MV,
    RM,
    STAT,
    BASENAME,
    DIRNAME,
    PATH_JOIN,
    PATH_RESOLVE,
    PATH_EXTNAME,
    PATH_JOIN_positional_args_to_named_param_map,
    HEAD,
    TAIL,
    WC,
    SORT,
    UNIQ,
    CUT,
    CUT_positional_args_to_named_param_map,
    PASTE,
    PASTE_positional_args_to_named_param_map,
    SEQ,
    SHUF,
    SHUF_positional_args_to_named_param_map,
    TEE,
    XARGS,
    NL,
    REV,
    TAC,
    FOLD,
    EXPAND,
    DOS2UNIX,
    UNIX2DOS,
    FMT,
    STRINGS,
    CMP,
    COMM,
    CRC32,
    CKSUM,
    SUM_BSD,
    UUENCODE,
    UUDECODE,
    BASE32,
    XXD,
    HEXDUMP,
    OD,
    UNAME,
    HOSTNAME,
    WHOAMI,
    NPROC,
    ARCH,
    USERINFO,
    ENV,
    UPTIME,
    GROUPS,
    LOGNAME,
    GETCONF,
    DNSDOMAINNAME,
    TTY,
    FACTOR,
    MCOOKIE,
    MKTEMP,
    ASCII,
    YES,
    TRUE,
    FALSE,
    CAL,
    WHICH,
    MKPASSWD,
    GZIP,
    GUNZIP,
    ZCAT,
    READLINK,
    DU,
    RMDIR,
    TOUCH,
    CHMOD,
    LINK,
    UNLINK,
    CHOWN,
    TRUNCATE,
    LN,
    CHGRP,
    INSTALL,
    KILL,
    GETPID,
    GETPPID,
    EXIT,
    SLEEP,
    GETENV,
    SETENV,
    UNSETENV,
    TIMEOUT,
    FSYNC,
    SYNC,
    GETOPT,
    HOST,
    IFCONFIG,
    FILESPLIT,
    PS,
    PGREP,
    KILLALL,
    TOP,
    NICE,
  };
} else if (typeof module !== 'undefined' && module.exports) {
  // Browser mode with module system (webpack) - export empty object
  module.exports = {};
} else {
  // Other environments - do nothing
}
