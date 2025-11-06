/**
 * @rexxjs-meta=GCP_ADDRESS_META
 * @provides: addressTarget=GCP
 * @interpreterHandlesInterpolation: true
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { parseCommand } = require('../_shared/provisioning-shared-utils');

// Enhanced parameter parsing for consistent key="value" syntax
const parseKeyValueParams = (paramString) => {
  const params = {};
  // Support both quoted and unquoted values: key="value" or key=value
  // For unquoted values, capture until the next key= pattern or end of string
  const regex = /(\w+)=(?:["']([^"']*)["']|([^"'\s]\S*(?:\s+(?!\w+=)[^\s]\S*)*))/g;
  let match;

  while ((match = regex.exec(paramString)) !== null) {
    params[match[1]] = match[2] || match[3]; // Use quoted value (match[2]) or unquoted (match[3])
  }

  return params;
};

// Parse result chain syntax (command → variable)
const parseResultChain = (command) => {
  const chainMatch = command.match(/^(.+?)\s*→\s*(\w+)\s*$/);
  if (chainMatch) {
    return {
      command: chainMatch[1].trim(),
      resultVar: chainMatch[2].trim()
    };
  }
  return { command: command.trim(), resultVar: null };
};

// Replace @variable references with actual values
const resolveVariableReferences = (command, variableStore) => {
  return command.replace(/@(\w+)/g, (match, varName) => {
    if (variableStore && variableStore[varName]) {
      return JSON.stringify(variableStore[varName]);
    }
    return match;
  });
};

// Parse HEREDOC with @SECTION markers
const parseHeredocSections = (heredocContent) => {
  const sections = {};
  const lines = heredocContent.split('\n');
  let currentSection = 'main';
  let currentCommands = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('@SECTION ')) {
      // Save previous section
      if (currentCommands.length > 0) {
        sections[currentSection] = currentCommands.join('\n');
      }
      
      // Start new section
      currentSection = trimmed.substring(9).trim();
      currentCommands = [];
    } else if (trimmed && !trimmed.startsWith('#')) {
      // Add command to current section
      currentCommands.push(trimmed);
    }
  }
  
  // Save final section
  if (currentCommands.length > 0) {
    sections[currentSection] = currentCommands.join('\n');
  }
  
  return sections;
};

// Execute sectioned HEREDOC workflow
const executeSectionedWorkflow = async (sections, gcpHandler) => {
  const results = {};
  
  for (const [sectionName, commands] of Object.entries(sections)) {
    try {
      // Split commands by line and execute each
      const commandLines = commands.split('\n').filter(line => line.trim());
      const sectionResults = [];
      
      for (const command of commandLines) {
        const result = await gcpHandler.execute(command.trim());
        sectionResults.push(result);
      }
      
      results[sectionName] = {
        success: true,
        commands: commandLines,
        results: sectionResults,
        stdout: sectionResults.map(r => r.stdout || '').join('\n'),
        stderr: sectionResults.map(r => r.stderr || '').join('\n')
      };
    } catch (error) {
      results[sectionName] = {
        success: false,
        error: error.message,
        commands: commands.split('\n').filter(line => line.trim())
      };
    }
  }
  
  return results;
};

const GCP_ADDRESS_META = {
  name: 'GCP',
  description: 'Google Cloud Platform unified orchestration interface with enhanced grammar and rate limiting',
  version: '2.1.0',
  provides: { addressTarget: 'GCP' },
  libraryMetadata: {
    interpreterHandlesInterpolation: true
  },
  services: ['SHEETS', 'BIGQUERY', 'FIRESTORE', 'STORAGE', 'PUBSUB', 'FUNCTIONS', 'RUN', 'COMPUTE', 'RATELIMIT'],
  grammar: {
    features: ['aliases', 'result-chains', 'natural-language', 'batch-operations', 'sections', 'rate-limiting'],
    examples: {
      'alias-usage': 'SHEETS ALIAS orders="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"',
      'result-chains': 'SHEETS SELECT * FROM orders.\'Sales\' → sales_data',
      'natural-language': 'SHEETS SELECT * FROM \'Orders\' WHERE amount ABOVE 1000',
      'batch-operations': 'SHEETS BATCH ["SELECT * FROM \'Q1\'", "SELECT * FROM \'Q2\'"]',
      'standardized-params': 'STORAGE UPLOAD file="report.pdf" bucket="company-docs" as="reports/monthly.pdf"',
      'rate-limiting': 'RATELIMIT SET sheets 50 60',
      'sectioned-workflow': `@SECTION data-extraction
SHEETS SELECT * FROM orders WHERE date IS today → daily_orders

@SECTION analytics  
BIGQUERY INSERT INTO staging SELECT * FROM @daily_orders

@SECTION notifications
PUBSUB PUBLISH topic="alerts" message="Daily report ready"`
    },
    'rate-limiting': {
      description: 'Local rate limiting for all GCP API calls',
      commands: {
        'RATELIMIT ENABLE': 'Enable rate limiting for all services',
        'RATELIMIT DISABLE': 'Disable rate limiting for all services',
        'RATELIMIT STATUS': 'Show current rate limit status and usage',
        'RATELIMIT RESET [service]': 'Reset rate limit counters',
        'RATELIMIT SET service requests window_seconds': 'Set rate limit for a service',
        'RATELIMIT HELP': 'Show help for rate limiting commands'
      },
      services: ['global', 'sheets', 'bigquery', 'firestore', 'storage', 'pubsub', 'functions', 'run'],
      defaults: {
        requests: 100,
        windowSeconds: 60,
        enabled: false
      }
    }
  }
};

// Global instance for handler reuse
let gcpHandler = null;

// Service-specific handlers
let serviceHandlers = null;

// Global variable store for result chains
let globalVariableStore = {};

// Global alias store for sheet references
let globalAliasStore = {};

// Rate limiting management
class RateLimiter {
  constructor() {
    this.limits = {
      global: { requests: 100, window: 60000 }, // 100 requests per minute by default
      sheets: { requests: 100, window: 60000 },
      docs: { requests: 60, window: 60000 }, // Google Docs API: 60 requests per minute
      slides: { requests: 100, window: 60000 }, // Google Slides API: 100 requests per minute
      apps_script: { requests: 20, window: 60000 }, // Apps Script API: 20 requests per 60 seconds
      bigquery: { requests: 100, window: 60000 },
      storage: { requests: 100, window: 60000 },
      firestore: { requests: 100, window: 60000 },
      pubsub: { requests: 100, window: 60000 },
      functions: { requests: 100, window: 60000 },
      run: { requests: 100, window: 60000 }
    };

    this.counters = {};
    this.enabled = false;
  }

  setLimit(service, requests, windowMs) {
    if (service === 'global' || this.limits[service]) {
      this.limits[service] = { requests, window: windowMs };
      // Reset counter for this service
      delete this.counters[service];
      return true;
    }
    return false;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  async checkLimit(service = 'global') {
    if (!this.enabled) return true;

    const now = Date.now();
    const limit = this.limits[service] || this.limits.global;
    
    if (!this.counters[service]) {
      this.counters[service] = { count: 0, windowStart: now };
    }

    const counter = this.counters[service];
    
    // Reset window if expired
    if (now - counter.windowStart >= limit.window) {
      counter.count = 0;
      counter.windowStart = now;
    }

    // Check if limit exceeded
    if (counter.count >= limit.requests) {
      const timeUntilReset = limit.window - (now - counter.windowStart);
      throw new Error(`Rate limit exceeded for ${service}. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds. Limit: ${limit.requests} requests per ${limit.window / 1000} seconds.`);
    }

    counter.count++;
    return true;
  }

  getStatus() {
    const now = Date.now();
    const status = { enabled: this.enabled, limits: this.limits, current: {} };
    
    for (const [service, counter] of Object.entries(this.counters)) {
      const limit = this.limits[service] || this.limits.global;
      const timeInWindow = now - counter.windowStart;
      const remaining = Math.max(0, limit.requests - counter.count);
      const resetIn = Math.max(0, limit.window - timeInWindow);
      
      status.current[service] = {
        used: counter.count,
        remaining,
        resetInMs: resetIn,
        resetInSeconds: Math.ceil(resetIn / 1000)
      };
    }
    
    return status;
  }

  reset(service = null) {
    if (service) {
      delete this.counters[service];
    } else {
      this.counters = {};
    }
  }
}

let globalRateLimiter = new RateLimiter();

// Initialize handlers on first use
const initGcpHandler = async () => {
  if (!gcpHandler) {
    gcpHandler = new UnifiedGcpHandler();
    await gcpHandler.initialize();
  }
  return gcpHandler;
};

// Variable interpolation - resolve {variable} patterns from context
// Implements same pattern as expectations-address.js (lines 706-729)
function resolveVariablesInCommand(commandString, context) {
  if (!context || typeof context !== 'object') return commandString;

  // Replace {variable} patterns with actual values from context
  return commandString.replace(/\{(\w+(?:\.\w+)*)\}/g, (match, path) => {
    const keys = path.split('.');
    let value = context;

    for (const key of keys) {
      if (value == null) return match; // Keep original if not found
      value = value[key];
    }

    return value !== undefined ? value : match;
  });
}

// ADDRESS target handler function
async function ADDRESS_GCP_HANDLER(commandOrMethod, paramsOrContext, sourceContext) {
  const handler = await initGcpHandler();

  // Handle command-string style (primary usage)
  // When called from RexxJS interpreter: (commandString, contextObject, sourceContextObject)
  // When called as method: (methodName, paramsObject)
  if (typeof commandOrMethod === 'string' &&
      (!paramsOrContext || typeof paramsOrContext === 'object' && !paramsOrContext.params)) {

    // Interpolate {variable} patterns from context (global variable pool)
    let commandString = resolveVariablesInCommand(commandOrMethod, paramsOrContext);

    // Check if this is a HEREDOC with @SECTION markers
    if (commandString.includes('@SECTION ')) {
      const sections = parseHeredocSections(commandString);
      return await executeSectionedWorkflow(sections, handler);
    }

    // Pass variable pool (context) to execute() for declarative syntax interpolation
    return await handler.execute(commandString, paramsOrContext || {});
  }

  // Handle method-call style (backward compatibility)
  return await handler.handle(commandOrMethod, paramsOrContext);
}

// ============================================
// Service-Specific Command Languages
// ============================================

// ============================================================================
// SheetsHandler - Now loaded lazily from gcp-handlers/sheets-handler.js
// ============================================================================

// ============================================================================
// DocsHandler - Now loaded lazily from gcp-handlers/docs-handler.js
// ============================================================================

// ============================================================================
// SlidesHandler - Now loaded lazily from gcp-handlers/slides-handler.js
// ============================================================================

// ============================================================================
// AppsScriptHandler - Now loaded lazily from gcp-handlers/apps-script-handler.js
// ============================================================================

// ============================================================================
// BigQueryHandler - Now loaded lazily from gcp-handlers/bigquery-handler.js
// ============================================================================

// FirestoreHandler - extracted to gcp-handlers/firestore-handler.js
// StorageHandler - extracted to gcp-handlers/storage-handler.js
// PubSubHandler - extracted to gcp-handlers/pubsub-handler.js
// Legacy cloud functions and cloud run handlers remain
// FunctionsHandler - extracted to gcp-handlers/functions-handler.js
// CloudRunHandler - extracted to gcp-handlers/cloud-run-handler.js
// ============================================
// Unified GCP Handler
// ============================================

class UnifiedGcpHandler {
  constructor() {
    this.runtime = 'gcp';
    this.project = null; // Will be set from gcloud config or params
    this.region = 'us-central1';

    // Service handlers - lazy loaded for better modularity
    this.services = {
      sheets: null, // Lazy loaded from gcp-handlers/sheets-handler.js
      docs: null, // Lazy loaded from gcp-handlers/docs-handler.js
      slides: null, // Lazy loaded from gcp-handlers/slides-handler.js
      apps_script: null, // Lazy loaded from gcp-handlers/apps-script-handler.js
      bigquery: null, // Lazy loaded from gcp-handlers/bigquery-handler.js
      billing: null, // Lazy loaded from gcp-handlers/billing-handler.js
      firestore: null, // Lazy loaded from gcp-handlers/firestore-handler.js
      storage: null, // Lazy loaded from gcp-handlers/storage-handler.js
      pubsub: null, // Lazy loaded from gcp-handlers/pubsub-handler.js
      functions: null, // Lazy loaded from gcp-handlers/functions-handler.js
      run: null // Lazy loaded from gcp-handlers/cloud-run-handler.js
    };

    // Child process reference
    this.spawn = spawn;
    this.fs = fs;
    this.path = path;
  }

  async initialize(config = {}) {
    // Merge configuration
    Object.assign(this, config);

    // Auto-detect project if not set
    if (!this.project) {
      try {
        const result = await this.execCommand('gcloud', ['config', 'get-value', 'project']);
        if (result.stdout && result.stdout.trim()) {
          this.project = result.stdout.trim();
        }
      } catch (e) {
        // Project will need to be set explicitly
      }
    }

    // Initialize service handlers (skip null/lazy-loaded services)
    for (const service of Object.values(this.services)) {
      if (service && typeof service.initialize === 'function') {
        await service.initialize();
      }
    }

    return this;
  }

  // Lazy load service handlers for better modularity
  async ensureSheetsHandler() {
    if (!this.services.sheets) {
      const { SheetsHandler } = require('./gcp-handlers/sheets-handler.js');
      this.services.sheets = new SheetsHandler(this, parseKeyValueParams);
      if (typeof this.services.sheets.initialize === 'function') {
        await this.services.sheets.initialize();
      }
    }
    return this.services.sheets;
  }

  async ensureAppsScriptHandler() {
    if (!this.services.apps_script) {
      const { AppsScriptHandler } = require('./gcp-handlers/apps-script-handler.js');
      this.services.apps_script = new AppsScriptHandler(this, parseKeyValueParams);
      if (typeof this.services.apps_script.initialize === 'function') {
        await this.services.apps_script.initialize();
      }
    }
    return this.services.apps_script;
  }

  async ensureBigQueryHandler() {
    if (!this.services.bigquery) {
      const { BigQueryHandler } = require('./gcp-handlers/bigquery-handler.js');
      this.services.bigquery = new BigQueryHandler(this, parseKeyValueParams);
      if (typeof this.services.bigquery.initialize === 'function') {
        await this.services.bigquery.initialize();
      }
    }
    return this.services.bigquery;
  }

  async ensureBillingHandler() {
    if (!this.services.billing) {
      const { BillingHandler } = require('./gcp-handlers/billing-handler.js');
      this.services.billing = new BillingHandler(this, parseKeyValueParams);
      if (typeof this.services.billing.initialize === 'function') {
        await this.services.billing.initialize();
      }
    }
    return this.services.billing;
  }

  async ensureDocsHandler() {
    if (!this.services.docs) {
      const { DocsHandler } = require('./gcp-handlers/docs-handler.js');
      this.services.docs = new DocsHandler(this, parseKeyValueParams);
      if (typeof this.services.docs.initialize === 'function') {
        await this.services.docs.initialize();
      }
    }
    return this.services.docs;
  }

  async ensureSlidesHandler() {
    if (!this.services.slides) {
      const { SlidesHandler } = require('./gcp-handlers/slides-handler.js');
      this.services.slides = new SlidesHandler(this, parseKeyValueParams);
      if (typeof this.services.slides.initialize === 'function') {
        await this.services.slides.initialize();
      }
    }
    return this.services.slides;
  }

  // Generic service handler loader for all extracted handlers
  async getServiceHandler(serviceName) {
    if (this.services[serviceName] === null) {
      const handlerMap = {
        firestore: './gcp-handlers/firestore-handler.js',
        storage: './gcp-handlers/storage-handler.js',
        pubsub: './gcp-handlers/pubsub-handler.js',
        functions: './gcp-handlers/functions-handler.js',
        run: './gcp-handlers/cloud-run-handler.js',
        monitoring: './gcp-handlers/monitoring-handler.js',
        logging: './gcp-handlers/logging-handler.js',
        dns: './gcp-handlers/dns-handler.js',
        secrets: './gcp-handlers/secret-manager-handler.js',
        tasks: './gcp-handlers/cloud-tasks-handler.js',
        scheduler: './gcp-handlers/cloud-scheduler-handler.js',
        artifacts: './gcp-handlers/artifact-registry-handler.js',
        spanner: './gcp-handlers/spanner-handler.js'
      };

      if (handlerMap[serviceName]) {
        const HandlerClass = require(handlerMap[serviceName]);
        this.services[serviceName] = new HandlerClass(this, parseKeyValueParams);
        if (typeof this.services[serviceName].initialize === 'function') {
          await this.services[serviceName].initialize();
        }
      } else {
        throw new Error(`Unknown service: ${serviceName}`);
      }
    }
    return this.services[serviceName];
  }

  async getAuth(scopes) {
    // Use Google Application Default Credentials
    // This will automatically use GOOGLE_APPLICATION_CREDENTIALS env var
    try {
      const { GoogleAuth } = require('google-auth-library');
      console.log('[GCP Auth] GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

      // Default scopes if none provided
      const authScopes = scopes || [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ];

      const auth = new GoogleAuth({
        scopes: authScopes
      });
      const client = await auth.getClient();
      console.log('[GCP Auth] Successfully created auth client with scopes:', authScopes);
      return client;
    } catch (e) {
      console.error('[GCP Auth] Failed to get Google auth:', e.message);
      return null;
    }
  }

  // New unified execute method for string commands
  async execute(command, variablePool = {}) {
    const trimmed = command.trim();

    if (!trimmed) {
      throw new Error('Empty command');
    }

    // Store variable pool for handlers to access (read-only)
    this.variablePool = Object.freeze({ ...variablePool });

    // Extract service identifier
    const firstWord = trimmed.split(/\s+/)[0].toUpperCase();

    // Handle rate limiting commands first
    if (firstWord === 'RATELIMIT') {
      return await this.handleRateLimit(trimmed.substring(9).trim());
    }

    // Route to appropriate service handler (no shorthand codes)
    switch (firstWord) {
      case 'SHEET':
      case 'SHEETS':
        await globalRateLimiter.checkLimit('sheets');
        const sheetsHandler = await this.ensureSheetsHandler();
        return await sheetsHandler.handle(trimmed.substring(firstWord.length).trim());

      case 'DOC':
      case 'DOCS':
        await globalRateLimiter.checkLimit('docs');
        const docsHandler = await this.ensureDocsHandler();
        return await docsHandler.execute(trimmed.substring(firstWord.length).trim());

      case 'SLIDE':
      case 'SLIDES':
        await globalRateLimiter.checkLimit('slides');
        const slidesHandler = await this.ensureSlidesHandler();
        return await slidesHandler.execute(trimmed.substring(firstWord.length).trim());

      case 'BIGQUERY':
        await globalRateLimiter.checkLimit('bigquery');
        const bigqueryHandler = await this.ensureBigQueryHandler();
        return await bigqueryHandler.handle(trimmed.substring(firstWord.length).trim());

      case 'BILLING':
        await globalRateLimiter.checkLimit('billing');
        const billingHandler = await this.ensureBillingHandler();
        return await billingHandler.execute(trimmed.substring(firstWord.length).trim());

      case 'FIRESTORE':
        await globalRateLimiter.checkLimit('firestore');
        return await (await this.getServiceHandler('firestore')).handle(trimmed.substring(firstWord.length).trim());

      case 'STORAGE':
        await globalRateLimiter.checkLimit('storage');
        return await (await this.getServiceHandler('storage')).handle(trimmed.substring(firstWord.length).trim());

      case 'PUBSUB':
        await globalRateLimiter.checkLimit('pubsub');
        return await (await this.getServiceHandler('pubsub')).handle(trimmed.substring(firstWord.length).trim());

      case 'FUNCTIONS':
      case 'FUNCTION':
        await globalRateLimiter.checkLimit('functions');
        return await (await this.getServiceHandler('functions')).handle(trimmed.substring(firstWord.length).trim());

      case 'RUN':
        await globalRateLimiter.checkLimit('run');
        return await (await this.getServiceHandler('run')).handle(trimmed.substring(firstWord.length).trim());

      case 'APPS_SCRIPT':
        await globalRateLimiter.checkLimit('apps_script');
        const appsScriptHandler = await this.ensureAppsScriptHandler();
        return await appsScriptHandler.execute(trimmed.substring(firstWord.length).trim());

      // Legacy gcloud-like syntax for backward compatibility
      case 'DEPLOY':
      case 'LIST':
      case 'DELETE':
      case 'CREATE':
        await globalRateLimiter.checkLimit('global');
        return await this.handleLegacyCommand(trimmed);

      default:
        throw new Error(`Unknown GCP service: ${firstWord}. Available services: SHEETS, APPS_SCRIPT, BIGQUERY, FIRESTORE, STORAGE, PUBSUB, FUNCTIONS, RUN, RATELIMIT`);
    }
  }

  async handleRateLimit(command) {
    const trimmed = command.trim();
    const upperCommand = trimmed.toUpperCase();

    // RATELIMIT ENABLE
    if (upperCommand === 'ENABLE') {
      globalRateLimiter.enable();
      return {
        success: true,
        action: 'enabled',
        message: 'Rate limiting enabled for all GCP services'
      };
    }

    // RATELIMIT DISABLE
    if (upperCommand === 'DISABLE') {
      globalRateLimiter.disable();
      return {
        success: true,
        action: 'disabled',
        message: 'Rate limiting disabled for all GCP services'
      };
    }

    // RATELIMIT STATUS
    if (upperCommand === 'STATUS') {
      return {
        success: true,
        action: 'status',
        ...globalRateLimiter.getStatus()
      };
    }

    // RATELIMIT RESET [service]
    if (upperCommand.startsWith('RESET')) {
      const parts = trimmed.split(/\s+/);
      const service = parts[1] ? parts[1].toLowerCase() : null;
      globalRateLimiter.reset(service);
      return {
        success: true,
        action: 'reset',
        service: service || 'all',
        message: service ? `Rate limit counter reset for ${service}` : 'All rate limit counters reset'
      };
    }

    // RATELIMIT SET service requests window_seconds
    if (upperCommand.startsWith('SET ')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length < 4) {
        throw new Error('Invalid RATELIMIT SET syntax. Use: RATELIMIT SET service requests window_seconds');
      }

      const service = parts[1].toLowerCase();
      const requests = parseInt(parts[2]);
      const windowSeconds = parseInt(parts[3]);

      if (isNaN(requests) || isNaN(windowSeconds) || requests <= 0 || windowSeconds <= 0) {
        throw new Error('Requests and window_seconds must be positive numbers');
      }

      const windowMs = windowSeconds * 1000;
      const success = globalRateLimiter.setLimit(service, requests, windowMs);

      if (!success) {
        throw new Error(`Unknown service: ${service}. Available services: global, sheets, bigquery, firestore, storage, pubsub, functions, run`);
      }

      return {
        success: true,
        action: 'set_limit',
        service,
        requests,
        windowSeconds,
        message: `Rate limit set for ${service}: ${requests} requests per ${windowSeconds} seconds`
      };
    }

    // RATELIMIT help or unknown command
    if (upperCommand === 'HELP' || !trimmed) {
      return {
        success: true,
        action: 'help',
        commands: {
          'RATELIMIT ENABLE': 'Enable rate limiting for all services',
          'RATELIMIT DISABLE': 'Disable rate limiting for all services',
          'RATELIMIT STATUS': 'Show current rate limit status and usage',
          'RATELIMIT RESET [service]': 'Reset rate limit counters (all services or specific service)',
          'RATELIMIT SET service requests window_seconds': 'Set rate limit for a service',
          'RATELIMIT HELP': 'Show this help message'
        },
        services: ['global', 'sheets', 'bigquery', 'firestore', 'storage', 'pubsub', 'functions', 'run'],
        examples: {
          'Enable rate limiting': 'RATELIMIT ENABLE',
          'Set sheets limit to 50 requests per 30 seconds': 'RATELIMIT SET sheets 50 30',
          'Check current status': 'RATELIMIT STATUS',
          'Reset all counters': 'RATELIMIT RESET',
          'Reset only sheets counter': 'RATELIMIT RESET sheets'
        }
      };
    }

    throw new Error(`Unknown RATELIMIT command: ${trimmed.split(' ')[0]}. Use RATELIMIT HELP for available commands.`);
  }

  async handleLegacyCommand(command) {
    // Handle legacy gcloud-like commands for backward compatibility
    const parts = command.split(/\s+/);
    const action = parts[0].toLowerCase();
    const resource = parts[1] ? parts[1].toLowerCase() : '';

    // Parse remaining arguments
    const params = {};
    let currentArg = null;

    for (let i = 2; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith('--')) {
        currentArg = part.substring(2);
        params[currentArg] = true;
      } else if (currentArg) {
        params[currentArg] = part;
      } else {
        if (!params.name) {
          params.name = part;
        }
      }
    }

    // Map to legacy methods
    const method = `${action}_${resource}`;
    return await this.handle(method, params);
  }

  // Core execution method
  async execCommand(command, args = [], options = {}) {
    // Apply global rate limiting to all gcloud commands
    await globalRateLimiter.checkLimit('global');
    
    return new Promise((resolve, reject) => {
      const proc = this.spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout: stdout.trim(), stderr: stderr.trim() });
        } else {
          resolve({
            success: false,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code
          });
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    UnifiedGcpHandler,
    AddressGcpHandler: UnifiedGcpHandler, // Alias for backward compatibility
    // Export as function (not constant) for RexxJS metadata detection
    GCP_ADDRESS_META: function() { return GCP_ADDRESS_META; },
    ADDRESS_GCP_HANDLER,
    // Export utility functions for testing
    parseKeyValueParams
  };
}

// Register as global for RexxJS
const globalScope = (typeof global !== 'undefined') ? global : (typeof window !== 'undefined') ? window : {};
if (typeof globalScope === 'object') {
  globalScope.UnifiedGcpHandler = UnifiedGcpHandler;
  globalScope.AddressGcpHandler = UnifiedGcpHandler; // Alias for backward compatibility

  // Store metadata constant before overwriting with function
  const GCP_META_DATA = GCP_ADDRESS_META;

  globalScope.ADDRESS_GCP_HANDLER = ADDRESS_GCP_HANDLER;

  // Export metadata as a function for @rexxjs-meta detection
  globalScope.GCP_ADDRESS_META = function() {
    return GCP_META_DATA;
  };

}
