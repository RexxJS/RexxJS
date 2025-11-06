'use strict';

/**
 * REQUIRE system module - Centralized helpers for library loading
 * Extracted from interpreter.js to slim down the main interpreter file
 */

/**
 * Orchestrates dependency-aware loading via the existing interpreter-library-management utilities
 * @param {string} libraryName - Name of the library to require (can be comma-separated list with first preference, second preference, etc.)
 * @param {string|null} asClause - Optional AS clause for naming
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function requireWithDependencies(libraryName, asClause, ctx) {
  // Check if libraryName contains comma-separated preference list
  if (libraryName.includes(',')) {
    const paths = libraryName.split(',').map(p => p.trim()).filter(p => p.length > 0);
    let lastError = null;

    for (const path of paths) {
      try {
        const libraryManagementUtils = ctx.libraryManagementUtils;
        const result = await libraryManagementUtils.requireWithDependencies(
          path,
          ctx.loadingQueue,
          ctx.checkLibraryPermissions,
          ctx.isLibraryLoaded,
          (libName) => ctx.detectAndRegisterAddressTargets(libName, asClause),
          (libName, parentLibName) => loadSingleLibrary(libName, ctx, parentLibName),
          ctx.extractDependencies,
          ctx.dependencyGraph,
          (libName) => ctx.registerLibraryFunctions(libName, asClause)
        );
        // If successful, return immediately
        return result;
      } catch (error) {
        lastError = error;
        // Continue to next preference
      }
    }

    // All preferences failed, throw the last error
    throw lastError || new Error(`Failed to load any of: ${libraryName}`);
  }

  // Single path - original behavior
  const libraryManagementUtils = ctx.libraryManagementUtils;
  return await libraryManagementUtils.requireWithDependencies(
    libraryName,
    ctx.loadingQueue,
    ctx.checkLibraryPermissions,
    ctx.isLibraryLoaded,
    (libName) => ctx.detectAndRegisterAddressTargets(libName, asClause),
    (libName, parentLibName) => loadSingleLibrary(libName, ctx, parentLibName),
    ctx.extractDependencies,
    ctx.dependencyGraph,
    (libName) => ctx.registerLibraryFunctions(libName, asClause)
  );
}

/**
 * Chooses environment-specific require path based on ctx.detectEnvironment()
 * @param {string} libraryName - Name of the library to load
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @param {string} parentLibraryName - Optional parent library name for dependency resolution
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function loadSingleLibrary(libraryName, ctx, parentLibraryName = null) {
  // Check if it's a registry: prefixed library
  if (libraryName.startsWith('registry:')) {
    return await ctx.requireRegistryLibrary(libraryName.substring(9)); // Remove 'registry:' prefix
  }

  // SCRO: Check if we're in remote orchestrated context and should request via CHECKPOINT
  if (ctx.isRemoteOrchestrated() && !ctx.isBuiltinLibrary(libraryName)) {
    return await ctx.requireViaCheckpoint(libraryName);
  }

  // Original single library loading logic
  const env = ctx.detectEnvironment();
  switch (env) {
    case 'nodejs':
      return await ctx.requireNodeJS(libraryName, parentLibraryName);
    case 'web-standalone':
      return await ctx.requireWebStandalone(libraryName);
    case 'web-controlbus':
      return await ctx.requireControlBus(libraryName);
    default:
      throw new Error(`REQUIRE not supported in environment: ${env}`);
  }
}

/**
 * Node environment routing
 * @param {string} libraryName - Name of the library to require
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function requireNodeJS(libraryName, ctx) {
  // Special handling for built-in libraries - only transform bare names (like 'string-functions')
  // Don't transform paths that are already properly formatted (like './src/expectations-address.js')
  if (ctx.isBuiltinLibrary && ctx.isBuiltinLibrary(libraryName) && 
      !libraryName.startsWith('./') && !libraryName.startsWith('../') &&
      !libraryName.includes('/')) {
    const builtinPath = `./${libraryName}.js`;
    return await ctx.requireNodeJSModule(builtinPath);
  }
  
  // Check if it's a local file or npm package (Node.js style)
  if (ctx.isLocalOrNpmModule && ctx.isLocalOrNpmModule(libraryName)) {
    return await ctx.requireNodeJSModule(libraryName);
  }
  
  // Check if it's a registry-style library (namespace/module@version)
  if (ctx.isRegistryStyleLibrary && ctx.isRegistryStyleLibrary(libraryName)) {
    return await ctx.requireRegistryStyleLibrary(libraryName);
  }
  
  // Otherwise use remote Git platform loading (GitHub, GitLab, Azure DevOps, etc.)
  return await ctx.requireRemoteLibrary(libraryName);
}

/**
 * Thin delegation to ctx.loadAndExecuteLibrary() for Node-side remote URL/library loading
 * @param {string} libraryName - Library name or URL
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function requireRemoteLibrary(libraryName, ctx) {
  return await ctx.loadAndExecuteLibrary(libraryName);
}

/**
 * Delegates to ctx.libraryUrlUtils.isLocalOrNpmModule (interpreter-library-url utilities)
 * @param {string} libraryName - Library name to check
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {boolean} True if local or npm module
 */
function isLocalOrNpmModule(libraryName, ctx) {
  return ctx.libraryUrlUtils.isLocalOrNpmModule(libraryName);
}

/**
 * Pattern check for namespace/module[@version]
 * @param {string} libraryName - Library name to check
 * @returns {boolean} True if registry style
 */
function isRegistryStyleLibrary(libraryName) {
  // Pattern: namespace/module or namespace/module@version
  // Examples: rexxjs/sqlite3-address, rexxjs/sqlite3-address@latest, com.example/my-lib@v1.0.0
  return /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(@[a-zA-Z0-9._-]+)?$/.test(libraryName);
}

/**
 * Parses namespace/module@version via parseRegistryLibraryName
 * Uses ctx.lookupPublisherRegistry and ctx.lookupModuleInRegistry
 * Loads via ctx.loadLibraryFromUrl or ctx.requireRemoteLibrary based on environment
 * @param {string} libraryName - Registry-style library name (namespace/module@version)
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function requireRegistryStyleLibrary(libraryName, ctx) {
  try {
    // Parse namespace/module@version
    const parsed = parseRegistryLibraryName(libraryName);
    
    // Step 1: Fetch publisher registry
    const publisherUrl = await ctx.lookupPublisherRegistry(parsed.namespace);
    
    // Step 2: Fetch module registry
    const moduleUrl = await ctx.lookupModuleInRegistry(publisherUrl, parsed.module, parsed.version);
    
    // Step 3: Load the resolved URL using appropriate method for environment
    const env = ctx.detectEnvironment();
    if (env === 'web-standalone' || env === 'web-controlbus') {
      // Use browser loading for web environments
      return await ctx.loadLibraryFromUrl(moduleUrl, libraryName);
    } else {
      // Use Node.js loading for Node.js environment
      // Use ctx.requireRemoteLibrary if available (for testability), otherwise use module function
      if (typeof ctx.requireRemoteLibrary === 'function') {
        return await ctx.requireRemoteLibrary(moduleUrl);
      } else {
        return await requireRemoteLibrary(moduleUrl, ctx);
      }
    }
    
  } catch (error) {
    throw new Error(`Registry resolution failed for ${libraryName}: ${error.message}`);
  }
}

/**
 * Splits namespace/module@version into components { namespace, module, version }
 * @param {string} libraryName - Library name like "namespace/module@version"
 * @returns {Object} Parsed components {namespace, module, version}
 */
function parseRegistryLibraryName(libraryName) {
  const parts = libraryName.split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid registry library name format: ${libraryName}. Expected: namespace/module[@version]`);
  }
  
  const namespace = parts[0];
  const moduleAndVersion = parts[1];
  
  // Split module@version
  const versionSplit = moduleAndVersion.split('@');
  const module = versionSplit[0];
  const version = versionSplit[1] || 'latest'; // Default to latest
  
  return { namespace, module, version };
}

/**
 * Try to load a module from unpkg based on parent's dependencies
 * @param {string} moduleName - Name of the module to load
 * @param {string} parentLibraryName - Parent library name
 * @param {Object} ctx - Context object
 * @returns {Promise<boolean>} True if loaded successfully
 */
async function tryLoadFromUnpkg(moduleName, parentLibraryName, ctx) {
  try {
    // Get parent's metadata to find the version
    const parentDetectionFunction = getLibraryDetectionFunction(parentLibraryName);
    const parentMeta = ctx.getGlobalFunction(parentDetectionFunction, parentLibraryName);

    if (!parentMeta) {
      return false;
    }

    const parentInfo = parentMeta();
    const dependencies = parentInfo.dependencies || {};

    // Check if this dependency is declared
    if (!dependencies[moduleName]) {
      return false;
    }

    const version = dependencies[moduleName];

    console.log(`📦 Resolving ${moduleName}@${version} from unpkg for ${parentLibraryName}...`);

    // Use unpkg resolver to fetch and cache
    // eslint-disable-next-line global-require
    const unpkgResolver = require('./unpkg-resolver');
    const loadedModule = await unpkgResolver.resolveModule(moduleName, version);

    // Register globally so dependency system knows it's satisfied
    const globalScope = typeof window !== 'undefined' ? window : global;
    if (!globalScope.__rexxjs_loaded_modules) {
      globalScope.__rexxjs_loaded_modules = new Map();
    }
    globalScope.__rexxjs_loaded_modules.set(moduleName, loadedModule);

    // Wrap and register as RexxJS library
    const detectionFunction = getLibraryDetectionFunction(moduleName);
    const libNamespace = ctx.getLibraryNamespace(moduleName);

    if (detectionFunction && loadedModule[detectionFunction]) {
      // Already a RexxJS library
      for (const [key, value] of Object.entries(loadedModule)) {
        if (typeof value === 'function') {
          global[key] = value;
        }
      }
      global[libNamespace] = loadedModule;
    } else {
      // Wrap as RexxJS library
      const rexxjsWrapper = wrapNodeJSModule(loadedModule, moduleName);
      global[libNamespace] = rexxjsWrapper;
    }

    ctx.registerLibraryFunctions(moduleName);

    return true;

  } catch (error) {
    console.log(`⚠️  Failed to load ${moduleName} from unpkg: ${error.message}`);
    return false;
  }
}

/**
 * Loads Node.js modules with RexxJS compatibility handling
 * @param {string} libraryName - Name of the library to require
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @param {string} parentLibraryName - Optional parent library for scoped require
 * @returns {Promise<boolean>} True if module loaded successfully
 */
async function requireNodeJSModule(libraryName, ctx, parentLibraryName = null) {
  try {
    // For local file paths, skip native require() and use scoped require execution
    const isLocalFile = libraryName.startsWith('./') || libraryName.startsWith('../') || libraryName.startsWith('/') || /^[A-Za-z]:[\\/]/.test(libraryName);

    if (!isLocalFile) {
      // Check if this module was already loaded via scoped require
      const globalScope = typeof window !== 'undefined' ? window : global;
      if (globalScope.__rexxjs_loaded_modules && globalScope.__rexxjs_loaded_modules.has(libraryName)) {
        const nodeModule = globalScope.__rexxjs_loaded_modules.get(libraryName);

        // Wrap it as a RexxJS library if needed
        const detectionFunction = getLibraryDetectionFunction(libraryName);
        const libNamespace = ctx.getLibraryNamespace(libraryName);

        if (detectionFunction && nodeModule[detectionFunction]) {
          // Already a RexxJS library
          for (const [key, value] of Object.entries(nodeModule)) {
            if (typeof value === 'function') {
              global[key] = value;
            }
          }
          global[libNamespace] = nodeModule;
        } else {
          // Wrap as RexxJS library
          const rexxjsWrapper = wrapNodeJSModule(nodeModule, libraryName);
          global[libNamespace] = rexxjsWrapper;
        }

        ctx.registerLibraryFunctions(libraryName);
        return true;
      }

      // Check if this looks like an npm package dependency (no path separators)
      // and we have a parent with dependencies metadata
      const isNpmPackage = !libraryName.includes('/') && !libraryName.includes('\\');
      if (isNpmPackage && parentLibraryName) {
        // Try to load from unpkg based on parent's dependency declaration
        const loadedFromUnpkg = await tryLoadFromUnpkg(libraryName, parentLibraryName, ctx);
        if (loadedFromUnpkg) {
          return true;
        }
      }

      // Try Node.js native require() for npm modules
      try {
      // Determine which require to use: scoped, global, or local
      let requireFn = require; // default to local require
      const globalScope = typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : {});
      if (globalScope.require) {
        // Prefer global.require (real filesystem) if available
        requireFn = globalScope.require;
      } else if (parentLibraryName && ctx.libraryRequireContexts && ctx.libraryRequireContexts.has(parentLibraryName)) {
        // Fall back to parent's scoped require
        requireFn = ctx.libraryRequireContexts.get(parentLibraryName);
      }

      let nodeModule = requireFn(libraryName);

      // Extract detection function from library code if it's a file path
      let detectionFunction = null;
      if (libraryName.startsWith('./') || libraryName.startsWith('../') || libraryName.startsWith('/') || /^[A-Za-z]:[\\/]/.test(libraryName)) {
        // eslint-disable-next-line global-require
        const fs = require('fs');
        // eslint-disable-next-line global-require
        const path = require('path');
        const filePath = path.resolve(libraryName);
        if (fs.existsSync(filePath)) {
          const libraryCode = fs.readFileSync(filePath, 'utf8');
          detectionFunction = extractMetadataFunctionName(libraryCode);
        }
      }

      // Fall back to registry lookup
      if (!detectionFunction) {
        detectionFunction = getLibraryDetectionFunction(libraryName);
      }

      // Check if it's already a RexxJS-compatible library
      const libNamespace = ctx.getLibraryNamespace(libraryName);

      if (detectionFunction && nodeModule[detectionFunction]) {
        // It's already a RexxJS library
        // Assign all exported functions to global (even if module was cached)
        // This handles cases where tests or other code may have deleted global functions
        for (const [key, value] of Object.entries(nodeModule)) {
          if (typeof value === 'function') {
            global[key] = value;
          }
        }
        global[libNamespace] = nodeModule;
        ctx.registerLibraryFunctions(libraryName);
        return true;
      }
      
      // Auto-wrap Node.js module as RexxJS library
      const rexxjsWrapper = wrapNodeJSModule(nodeModule, libraryName);
      global[libNamespace] = rexxjsWrapper;
      ctx.registerLibraryFunctions(libraryName);

      return true;

      } catch (requireError) {
        // npm module require() failed
        throw new Error(`Failed to load Node.js module ${libraryName}: ${requireError.message}`);
      }
    } else {
      // For local files, always use scoped require execution to ensure proper dependency resolution
      // This ensures that when the file does require('dependency'), it resolves from the file's location
      if (true) {  // Always true for local files
        // eslint-disable-next-line global-require
        const path = require('path');
        // eslint-disable-next-line global-require
        const fs = require('fs');

        // Resolve the file path
        const filePath = path.resolve(libraryName);

        // Read the file content first to check for dependencies
        const libraryCode = fs.readFileSync(filePath, 'utf8');

        // Extract metadata to check for dependencies
        const metadataFunctionName = extractMetadataFunctionName(libraryCode);
        if (metadataFunctionName) {
          try {
            // Execute the META function to get dependencies
            const metaFunc = new Function(libraryCode + `\nreturn ${metadataFunctionName};`)();
            const metadata = metaFunc();
            const dependencies = metadata.dependencies || {};

            // Pre-fetch any npm dependencies from unpkg
            if (Object.keys(dependencies).length > 0) {
              console.log(`📦 Pre-fetching ${Object.keys(dependencies).length} dependencies for ${libraryName}...`);

              // eslint-disable-next-line global-require
              const unpkgResolver = require('./unpkg-resolver');
              for (const [depName, depVersion] of Object.entries(dependencies)) {
                // Check if already cached
                const cachedPath = unpkgResolver.getCachedModulePath(depName, depVersion);
                if (!cachedPath) {
                  console.log(`📥 Downloading ${depName}@${depVersion} from unpkg...`);
                  await unpkgResolver.resolveModule(depName, depVersion);
                }
              }
            }
          } catch (metaErr) {
            // If we can't extract metadata, continue anyway
            console.log(`⚠️  Could not pre-fetch dependencies: ${metaErr.message}`);
          }
        }

        // Create a mock module context for execution
        const mockModule = { exports: {} };

        try {
          // Create a scoped require function that resolves relative to the loaded file
          // eslint-disable-next-line global-require
          const Module = require('module');
          // eslint-disable-next-line global-require
          const path = require('path');
          // eslint-disable-next-line global-require
          const fs = require('fs');

          // Find a path with node_modules for creating the scoped require
          let requireBasePath = path.dirname(filePath);
          // Check if node_modules exists in parent directories
          while (requireBasePath && requireBasePath !== '/' && !fs.existsSync(path.join(requireBasePath, 'node_modules'))) {
            requireBasePath = path.dirname(requireBasePath);
          }
          // If we didn't find node_modules up the tree, try cwd (where the script is running from)
          if (!fs.existsSync(path.join(requireBasePath, 'node_modules')) && fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
            requireBasePath = process.cwd();
          }
          // If we found one, use package.json from there; otherwise use the file path
          const requirePath = fs.existsSync(path.join(requireBasePath, 'package.json'))
            ? path.join(requireBasePath, 'package.json')
            : filePath;

          const scopedRequire = Module.createRequire(requirePath);

          // Make scoped require globally available so libraries can access npm modules
          const globalScope = typeof window !== 'undefined' ? window : global;
          if (!globalScope.require) {
            globalScope.require = scopedRequire;
          }

          // Wrap the scoped require to auto-register dependencies globally and use unpkg as fallback
          const wrappedScopedRequire = (moduleName) => {
            try {
              const result = scopedRequire(moduleName);

              // Make the loaded module available globally so dependency system knows it's satisfied
              // This allows dependencies loaded by the parent module to be available to the require system
              if (result && typeof result === 'object') {
                const moduleSafeName = moduleName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

                // Store the module in a way the require system can find it
                if (!globalScope.__rexxjs_loaded_modules) {
                  globalScope.__rexxjs_loaded_modules = new Map();
                }
                globalScope.__rexxjs_loaded_modules.set(moduleName, result);

                // Also make it available as a global variable
                if (!globalScope[moduleSafeName]) {
                  globalScope[moduleSafeName] = result;
                }
              }

              return result;
            } catch (err) {
              // If scoped require fails and this looks like an npm package, try unpkg
              const isNpmPackage = !moduleName.includes('/') && !moduleName.includes('\\') && !moduleName.startsWith('.');
              if (isNpmPackage) {
                console.log(`⚠️  Scoped require failed for ${moduleName}, trying unpkg...`);

                // Try to load from unpkg synchronously (we need to block here)
                // eslint-disable-next-line global-require
                const unpkgResolver = require('./unpkg-resolver');

                // Get parent's metadata to find the version
                const parentDetectionFunction = extractMetadataFunctionName(libraryCode);
                if (parentDetectionFunction) {
                  try {
                    // Execute the META function to get dependencies
                    const metaFunc = new Function(libraryCode + `\nreturn ${parentDetectionFunction};`)();
                    const parentInfo = metaFunc();
                    const dependencies = parentInfo.dependencies || {};

                    if (dependencies[moduleName]) {
                      const version = dependencies[moduleName];
                      console.log(`📦 Loading ${moduleName}@${version} from unpkg...`);

                      // Synchronous unpkg resolution (we'll need to make this work)
                      // eslint-disable-next-line global-require
                      const Module = require('module');
                      const cachedPath = unpkgResolver.getCachedModulePath(moduleName, version);

                      if (cachedPath) {
                        const result = require(cachedPath);

                        // Register globally
                        if (!globalScope.__rexxjs_loaded_modules) {
                          globalScope.__rexxjs_loaded_modules = new Map();
                        }
                        globalScope.__rexxjs_loaded_modules.set(moduleName, result);

                        return result;
                      } else {
                        console.log(`❌ ${moduleName}@${version} not in cache, cannot load synchronously during module execution`);
                        console.log(`   Module will need to be pre-cached or installed in node_modules`);
                      }
                    }
                  } catch (metaErr) {
                    console.log(`⚠️  Could not extract metadata: ${metaErr.message}`);
                  }
                }
              }

              throw err;
            }
          };

          // Store the scoped require for this library so dependencies can use it
          if (!ctx.libraryRequireContexts) {
            ctx.libraryRequireContexts = new Map();
          }
          ctx.libraryRequireContexts.set(libraryName, scopedRequire);

          // Execute the code with module support - pass scoped require, module, exports as function params
          // Don't pollute global.module/global.exports - just pass them as parameters
          const func = new Function('require', 'module', 'exports', '__filename', '__dirname', libraryCode);
          func(wrappedScopedRequire, mockModule, mockModule.exports, filePath, path.dirname(filePath));

          // If the library exported functions via module.exports, make them globally available
          // Filter out undefined keys to avoid "Cannot assign to read only property 'undefined'" error
          if (mockModule.exports && typeof mockModule.exports === 'object') {
            for (const [key, value] of Object.entries(mockModule.exports)) {
              if (key && key !== 'undefined' && value !== undefined) {
                global[key] = value;
              }
            }
          }
          
          // Verify loading succeeded - use new @rexxjs-meta pattern
          const extractedFunctionName = extractMetadataFunctionName(libraryCode);
          const detectionFunction = extractedFunctionName || getLibraryDetectionFunction(libraryName);

          if (!detectionFunction) {
            throw new Error(
              `Library ${libraryName} does not declare a detection function.\n` +
              `Libraries must include @rexxjs-meta=FUNCTION_NAME in a preserved comment (/*! ... */).\n` +
              `Example: /*! @rexxjs-meta=MY_LIBRARY_META */`
            );
          }

          if (!globalScope[detectionFunction] || typeof globalScope[detectionFunction] !== 'function') {
            console.log(`Looking for detection function: ${detectionFunction}`);
            console.log(`Available global functions:`, Object.keys(globalScope).filter(k => k.includes('META') || k.includes('MAIN')));
            throw new Error(`Library executed but detection function not found: ${detectionFunction}`);
          }

          // Store the metadata provider BEFORE calling registerLibraryFunctions
          // This ensures metadata is available for function/operation discovery
          ctx.libraryMetadataProviders = ctx.libraryMetadataProviders || new Map();
          ctx.libraryMetadataProviders.set(libraryName, detectionFunction);

          // Register the library functions
          ctx.registerLibraryFunctions(libraryName);
        } catch (execError) {
          throw execError;
        }

        return true;
      }
    }

  } catch (error) {
    // Include the full error stack for debugging
    const detailedError = new Error(`Failed to load Node.js module ${libraryName}: ${error.message}`);
    detailedError.stack = `${detailedError.message}\n${error.stack}`;
    throw detailedError;
  }
}

/**
 * Wraps Node.js modules as RexxJS-compatible libraries
 * @param {Object} nodeModule - The Node.js module to wrap
 * @param {string} libraryName - Name of the library
 * @returns {Object} RexxJS-compatible wrapper object
 */
function wrapNodeJSModule(nodeModule, libraryName) {
  const libName = libraryName.split('/').pop().split('.')[0]; // Get base name
  
  const wrapper = {
    // Node.js module wrapper - no hardcoded detection functions
  };
  
  // Convert Node.js exports to RexxJS-style functions
  if (typeof nodeModule === 'object' && nodeModule !== null) {
    Object.entries(nodeModule).forEach(([name, func]) => {
      if (typeof func === 'function') {
        // Convert camelCase to UPPER_CASE for RexxJS conventions
        const rexxjsName = name.replace(/([A-Z])/g, '_$1').toUpperCase();
        wrapper[rexxjsName] = func;
      } else {
        // For non-functions, just preserve as-is
        wrapper[name.toUpperCase()] = func;
      }
    });
  } else if (typeof nodeModule === 'function') {
    // Single function export
    wrapper[libName.toUpperCase()] = nodeModule;
  }
  
  return wrapper;
}

/**
 * Extracts dependencies from library metadata
 * @param {string} libraryName - Name of the library
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<Array>} Array of dependency names
 */
async function extractDependencies(libraryName, ctx) {
  // Extract dependencies from loaded library code
  const dependencies = [];

  // Strip registry: prefix if present (it was already removed during loading)
  const actualLibraryName = libraryName.startsWith('registry:')
    ? libraryName.substring(9) // Remove 'registry:' prefix
    : libraryName;

  // PRIORITY 1: Runtime metadata (works with minified code)
  const detectionFunction = getLibraryDetectionFunction(actualLibraryName);
  const func = ctx.getGlobalFunction(detectionFunction, actualLibraryName);
  if (func) {
    // Store the metadata provider for later use by registerLibraryFunctions
    ctx.libraryMetadataProviders = ctx.libraryMetadataProviders || new Map();
    ctx.libraryMetadataProviders.set(libraryName, detectionFunction);

    try {
      const info = func();
      if (info && info.dependencies) {
        // Handle both array format and object format (package.json style)
        if (Array.isArray(info.dependencies)) {
          return info.dependencies;
        } else if (typeof info.dependencies === 'object' && info.dependencies !== null) {
          // Extract keys from object format: { "jq-wasm": "1.1.0" } -> ["jq-wasm"]
          const deps = Object.keys(info.dependencies);
          console.log(`🔍 Extracted dependency keys:`, deps);
          return deps;
        }
        return [];
      }
    } catch (error) {
      console.warn(`Failed to get runtime dependencies for ${libraryName}: ${error.message}`);
    }

    // Even if no dependencies, return empty array (metadata provider is now stored)
    return [];
  }
  
  // PRIORITY 2: Parse comment metadata from source code
  let libraryCode = '';
  try {
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      const response = await fetch(libraryName);
      if (response.ok) {
        libraryCode = await response.text();
        const commentMetadata = ctx.parseCommentMetadata(libraryCode);
        if (commentMetadata && commentMetadata.dependencies) {
          return commentMetadata.dependencies;
        }
      }
    }
  } catch (error) {
    // Continue to next method
  }

  // PRIORITY 3: Parse from source code (only works if not minified)
  const cached = ctx.libraryCache.get(libraryName);
  if (cached && cached.code) {
    libraryCode = cached.code;
  }
  
  // Parse dependencies from library code comments or metadata
  if (libraryCode) {
    // 1. NEW: Look for function-based metadata provider (@rexxjs-meta=FUNCTION_NAME)
    const metaFunctionPattern = /\/\*!\s*[\s\S]*?@rexxjs-meta=([A-Z_]+)/i;
    const metaFunctionMatch = metaFunctionPattern.exec(libraryCode);
    
    if (metaFunctionMatch) {
      const functionName = metaFunctionMatch[1];
      // The function will be available after library execution, dependency extraction happens later
      // For now, mark it as having function-based metadata
      ctx.libraryMetadataProviders = ctx.libraryMetadataProviders || new Map();
      ctx.libraryMetadataProviders.set(libraryName, functionName);
      
      // Return empty dependencies for now - we'll get them from the function after execution
      return [];
    }
    
    // 2. Look for preserved comment dependencies (survive minification, jQuery-style)
    const preservedCommentPattern = /\/\*!\s*[\s\S]*?@rexxjs-meta\s+(\{[\s\S]*?\})/i;
    const preservedMatch = preservedCommentPattern.exec(libraryCode);
    
    if (preservedMatch) {
      try {
        const depData = JSON.parse(preservedMatch[1]);
        if (depData.dependencies) {
          return Object.keys(depData.dependencies);
        }
      } catch (error) {
        console.warn(`Failed to parse preserved comment dependencies for ${libraryName}: ${error.message}`);
      }
    }
    
    // 3. Look for standardized JSON format (comment-based)
    const jsonDepPattern = /@rexxjs-meta-start\s*\*\s*([\s\S]*?)\s*\*\s*@rexxjs-meta-end/i;
    const jsonMatch = jsonDepPattern.exec(libraryCode);
    
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1].replace(/\*\s*/g, '').trim();
        const depData = JSON.parse(jsonStr);
        return Object.keys(depData.dependencies || {});
      } catch (error) {
        console.warn(`Failed to parse JSON dependencies for ${libraryName}: ${error.message}`);
      }
    }
    
    
    // 4. Final fallback: Legacy comment format
    const depPattern = /\/\*\s*@dependencies?\s+(.*?)\s*\*\//gi;
    const requirePattern = /\/\*\s*@require\s+(.*?)\s*\*\//gi;
    
    let match;
    while ((match = depPattern.exec(libraryCode)) !== null) {
      const deps = match[1].split(/[\s,]+/).filter(dep => dep.trim());
      return deps;
    }

    while ((match = requirePattern.exec(libraryCode)) !== null) {
      const deps = match[1].split(/[\s,]+/).filter(dep => dep.trim());
      return deps;
    }
  }
  
  // No dependencies found
  return [];
}

/**
 * Generates detection function name for library
 * @param {string} libraryName - Name of the library
 * @returns {string} Detection function name
 */
function getLibraryDetectionFunction(libraryName) {
  // Strip registry: prefix if present for lookup
  const lookupName = libraryName.startsWith('registry:') ? libraryName.substring(9) : libraryName;

  // Check the global registry first (for self-registered libraries)
  if (typeof window !== 'undefined' && window.LIBRARY_DETECTION_REGISTRY && window.LIBRARY_DETECTION_REGISTRY.has(lookupName)) {
    return window.LIBRARY_DETECTION_REGISTRY.get(lookupName);
  }
  if (typeof global !== 'undefined' && global.LIBRARY_DETECTION_REGISTRY && global.LIBRARY_DETECTION_REGISTRY.has(lookupName)) {
    return global.LIBRARY_DETECTION_REGISTRY.get(lookupName);
  }

  // For HTTP/HTTPS URLs in browser, check if already cached in library cache
  if ((libraryName.startsWith('http://') || libraryName.startsWith('https://')) && typeof window !== 'undefined') {
    // Try to extract from already-loaded library code if available
    // Note: This is synchronous, so it only works if the library was already fetched
    // The loadHttpsLibraryViaFetch/Script methods will need to cache this
    if (window.__rexxjs_library_code_cache && window.__rexxjs_library_code_cache[libraryName]) {
      return extractMetadataFunctionName(window.__rexxjs_library_code_cache[libraryName]);
    }
    // Return null and let the loading logic handle it
    return null;
  }

  // For local file paths, extract directly from the file
  if (typeof require !== 'undefined') {
    if (libraryName.startsWith('./') || libraryName.startsWith('../') || libraryName.startsWith('/') || /^[A-Za-z]:[\\/]/.test(libraryName)) {
      try {
        // eslint-disable-next-line global-require
        const fs = require('fs');
        // eslint-disable-next-line global-require
        const path = require('path');
        const filePath = path.resolve(libraryName);
        if (fs.existsSync(filePath)) {
          const libraryCode = fs.readFileSync(filePath, 'utf8');
          return extractMetadataFunctionName(libraryCode);
        }
      } catch (error) {
        // Silently continue if file reading fails
      }
    }
  }

  // No auto-generation - libraries must explicitly declare their detection function
  // via @rexxjs-meta=FUNCTION_NAME or by registering in LIBRARY_DETECTION_REGISTRY
  return null;
}

/**
 * Extracts metadata function name from library code
 * @param {string} libraryCode - The library source code
 * @returns {string|null} Metadata function name or null if not found
 */
function extractMetadataFunctionName(libraryCode) {
  // Extract metadata function name from @rexxjs-meta comment
  const metaMatch = libraryCode.match(/@rexxjs-meta=([A-Z_][A-Z0-9_]*)/);
  return metaMatch ? metaMatch[1] : null;
}

/**
 * Registry-style library loading with namespace/library format
 * @param {string} namespacedLibrary - Library name in namespace/library format
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function requireRegistryLibrary(namespacedLibrary, ctx) {
  // Parse namespace/library format: "org.rexxjs/jq-address"
  const parts = namespacedLibrary.split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid registry library format: ${namespacedLibrary}. Expected: namespace/library-name`);
  }

  const [namespace, libraryName] = parts;

  // Step 1: Fetch publisher registry to get the module registry URL
  const publisherRegistryUrl = 'https://rexxjs.org/.list-of-public-lib-publishers.txt';
  const moduleRegistryUrl = await lookupPublisher(namespace, publisherRegistryUrl);

  if (!moduleRegistryUrl) {
    throw new Error(`Unknown namespace '${namespace}' not found in registry at ${publisherRegistryUrl}`);
  }

  // Step 2: Fetch the module registry to get the library URL
  const libraryUrl = await lookupModuleInRegistry(libraryName, moduleRegistryUrl);

  if (!libraryUrl) {
    throw new Error(`Module '${libraryName}' not found in registry for namespace '${namespace}'`);
  }

  // In Node.js/pkg environments, prefer unbundled version for better native module support
  // Replace .bundle.js with .js if we're in Node.js
  const isNodeEnv = typeof process !== 'undefined' && process.versions && process.versions.node;
  const finalUrl = isNodeEnv && libraryUrl.endsWith('.bundle.js')
    ? libraryUrl.replace('.bundle.js', '.js')
    : libraryUrl;

  // Load the library using existing GitHub-style loading
  console.log(`📦 Loading registry library: ${namespacedLibrary} from ${finalUrl}`);
  return await ctx.loadLibraryFromUrl(finalUrl, namespacedLibrary);
}

/**
 * Looks up publisher's module registry URL
 * @param {string} namespace - Publisher namespace (e.g., "org.rexxjs")
 * @param {string} registryUrl - URL of the publisher registry
 * @returns {Promise<string|null>} Module registry URL or null if not found
 */
async function lookupPublisher(namespace, registryUrl) {
  try {
    const response = await fetch(registryUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch registry: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    const namespaceIndex = headers.findIndex(h => h.toLowerCase() === 'namespace');
    const registryUrlIndex = headers.findIndex(h => h.toLowerCase() === 'registry_url');

    if (namespaceIndex === -1 || registryUrlIndex === -1) {
      throw new Error('Registry missing required columns: namespace, registry_url');
    }

    // Look for matching namespace
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values[namespaceIndex] === namespace) {
        return values[registryUrlIndex];
      }
    }

    return null; // Namespace not found
  } catch (error) {
    throw new Error(`Failed to lookup publisher registry: ${error.message}`);
  }
}

/**
 * Looks up module URL in the module registry
 * @param {string} moduleName - Name of the module (e.g., "jq-address")
 * @param {string} registryUrl - URL of the module registry
 * @returns {Promise<string|null>} Module URL or null if not found
 */
async function lookupModuleInRegistry(moduleName, registryUrl) {
  try {
    const response = await fetch(registryUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch module registry: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    // Find the template line
    let urlTemplate = null;
    for (const line of lines) {
      if (line.startsWith('# URL template:')) {
        // Extract template info for reference
        continue;
      }
      if (line.startsWith('#') || line.trim() === '') {
        continue;
      }

      // Parse module entries: module_name,type,url_template
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 3 && parts[0] === moduleName) {
        urlTemplate = parts[2];
        // Replace template variables with defaults
        // {tag} -> latest, {type} -> addresses or functions based on name, {name} -> module name
        const type = moduleName.includes('-address') ? 'addresses' : 'functions';
        return urlTemplate
          .replace('{tag}', 'latest')
          .replace('{type}', type)
          .replace('{name}', moduleName);
      }
    }

    return null; // Module not found
  } catch (error) {
    throw new Error(`Failed to lookup module in registry: ${error.message}`);
  }
}

module.exports = {
  requireWithDependencies,
  loadSingleLibrary,
  requireNodeJS,
  requireRemoteLibrary,
  isLocalOrNpmModule,
  isRegistryStyleLibrary,
  requireRegistryStyleLibrary,
  parseRegistryLibraryName,
  requireNodeJSModule,
  extractDependencies,
  getLibraryDetectionFunction,
  extractMetadataFunctionName,
  requireRegistryLibrary,
  lookupPublisher,
  lookupModuleInRegistry
};