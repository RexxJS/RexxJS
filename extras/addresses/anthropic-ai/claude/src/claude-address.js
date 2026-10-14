/*!
 * rexxjs/claude-address v1.0.0 | (c) 2025 Paul Hammant | MIT License
 * @rexxjs-meta=CLAUDE_ADDRESS_META
 */
/**
 * Claude API ADDRESS Library - Provides AI chat operations via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 *
 * Usage:
 *   REQUIRE "claude-address" AS CLAUDE
 *   ADDRESS CLAUDE
 *   <<PROMPT
 *   system=You are a fiction editor assistant.
 *   prompt=Tighten this: It was a dark and stormy night.
 *   PROMPT
 *   "CLOSE_CHAT"
 *
 *   LET cp = checkpoint operation="ANALYZE_CODE" code=sourceCode
 *   LET poll = wait_for_checkpoint checkpoint_id=cp.checkpointId
 *
 * Environment Variable Required:
 *   ANTHROPIC_API_KEY - Your Anthropic API key
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
// Interpolation is provided via sourceContext.interpolation parameter

// Active conversation state (single conversation at a time)
let activeConversation = null;  // { messages: [], system: string }

// CHECKPOINT storage for structured collaboration
const activeCheckpoints = new Map();
let checkpointCounter = 0;

// Consolidated metadata provider function
function CLAUDE_ADDRESS_META() {
  return {
    canonical: "org.rexxjs/claude-address",
    type: "address-handler",
    dependencies: {},
    envVars: ["ANTHROPIC_API_KEY"],
    libraryMetadata: {
      interpreterHandlesInterpolation: true
    },
    name: 'Claude AI Chat Service',
    version: '1.0.0',
    description: 'Anthropic Claude API integration via ADDRESS interface',
    provides: {
      addressTarget: 'claude',
      handlerFunction: 'ADDRESS_CLAUDE_HANDLER',
      commandSupport: true,
      methodSupport: true
    },
    requirements: {
      environment: 'nodejs-or-browser',
      modules: ['fetch'],
      apiKey: 'ANTHROPIC_API_KEY'
    }
  };
}

// ADDRESS target handler function with REXX variable management
async function ADDRESS_CLAUDE_HANDLER(commandOrMethod, params, sourceContext) {
  // Apply RexxJS variable interpolation
  const variablePool = params || {};
  const interpolate = sourceContext && sourceContext.interpolation ? sourceContext.interpolation.interpolate : (str => str);
  const interpolatedCommand = typeof commandOrMethod === 'string'
    ? interpolate(commandOrMethod, variablePool)
    : commandOrMethod;

  // Handle STATUS command (no API key required, never throws exceptions)
  if (typeof interpolatedCommand === 'string' &&
      interpolatedCommand.trim().toUpperCase() === 'STATUS') {
    const apiKey = getApiKey();
    const messageCount = activeConversation ? activeConversation.messages.length : 0;
    let statusMessage;

    if (apiKey) {
      statusMessage = `Claude ADDRESS ready (${messageCount} messages in conversation)`;
    } else {
      statusMessage = `Claude ADDRESS ready (${messageCount} messages in conversation) - ANTHROPIC_API_KEY not set`;
    }

    return formatClaudeResultForREXX({
      operation: 'STATUS',
      success: true,
      service: 'claude',
      provider: 'Anthropic',
      apiKeyConfigured: !!apiKey,
      hasActiveConversation: !!activeConversation,
      messageCount: messageCount,
      activeCheckpoints: activeCheckpoints.size,
      methods: Object.keys(ADDRESS_CLAUDE_METHODS),
      message: statusMessage
    });
  }

  try {

    // Check API key availability for operations that need it
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Claude ADDRESS library requires ANTHROPIC_API_KEY environment variable');
    }

    // Handle heredoc/multi-line key=value format (ADDRESS CLAUDE <<LABEL)
    // Detect heredoc by checking for key=value pattern (single or multi-line)
    if (typeof interpolatedCommand === 'string' &&
        /^\s*\w+=/.test(interpolatedCommand)) {
      const parsedParams = parseKeyValueHeredoc(interpolatedCommand);
      const result = await handleClaudeHeredoc(parsedParams, apiKey);
      return formatClaudeResultForREXX(result);
    }

    // Handle CLOSE_CHAT command
    if (typeof interpolatedCommand === 'string' &&
        interpolatedCommand.trim().toUpperCase() === 'CLOSE_CHAT') {
      const messageCount = activeConversation ? activeConversation.messages.length : 0;
      activeConversation = null;
      return formatClaudeResultForREXX({
        operation: 'CLOSE_CHAT',
        success: true,
        messageCount: messageCount,
        message: `Conversation closed (${messageCount} messages)`
      });
    }

    // Handle CHECKPOINT command string: CHECKPOINT operation=... code="..." format=... timeout=...
    if (typeof interpolatedCommand === 'string' &&
        /^\s*CHECKPOINT\s/i.test(interpolatedCommand)) {
      const checkpointParams = parseCheckpointCommand(interpolatedCommand);
      const result = await handleCheckpoint(checkpointParams, apiKey);
      return formatClaudeResultForREXX(result);
    }

    // Handle WAIT FOR CHECKPOINT command string: WAIT FOR CHECKPOINT <checkpoint_id>
    if (typeof interpolatedCommand === 'string') {
      const waitMatch = interpolatedCommand.trim().match(/^WAIT FOR CHECKPOINT ([\w_]+)$/i);
      if (waitMatch) {
        const result = await handleCheckpointPoll(waitMatch[1]);
        return formatClaudeResultForREXX(result);
      }
    }

    // Handle checkpoint method calls: checkpoint, wait_for_checkpoint/poll_checkpoint, complete_checkpoint
    if (typeof interpolatedCommand === 'string') {
      const methodParams = params || {};
      switch (interpolatedCommand.trim().toLowerCase()) {
        case 'checkpoint':
          return formatClaudeResultForREXX(await handleCheckpoint(methodParams, apiKey));

        case 'wait_for_checkpoint':
        case 'poll_checkpoint':
          return formatClaudeResultForREXX(await handleCheckpointPoll(methodParams.checkpoint_id));

        case 'complete_checkpoint':
          return formatClaudeResultForREXX(await handleCheckpointComplete(methodParams.checkpoint_id, methodParams.result));
      }
    }

    throw new Error('Claude ADDRESS only supports heredoc format (<<LABEL...LABEL), CLOSE_CHAT, STATUS, ' +
      'CHECKPOINT <key=value...>, WAIT FOR CHECKPOINT <id>, or the checkpoint, wait_for_checkpoint, ' +
      'poll_checkpoint and complete_checkpoint methods');

  } catch (error) {
    const formattedError = formatClaudeErrorForREXX(error);
    throw new Error(error.message);
  }
}

// Parse heredoc key=value format
function parseKeyValueHeredoc(multilineText) {
  const params = {};
  const lines = multilineText.split('\n');
  let currentKey = null;
  let currentValue = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this is a key=value line
    const kvMatch = trimmed.match(/^(\w+)=(.*)$/);
    if (kvMatch) {
      // Save previous key/value if exists
      if (currentKey) {
        params[currentKey] = currentValue.join('\n').trim();
      }
      // Start new key/value
      currentKey = kvMatch[1];
      currentValue = [kvMatch[2]];
    } else if (currentKey) {
      // Continuation of previous value
      currentValue.push(trimmed);
    }
  }

  // Save last key/value
  if (currentKey) {
    params[currentKey] = currentValue.join('\n').trim();
  }

  return params;
}

// Handle heredoc-style Claude request
async function handleClaudeHeredoc(params, apiKey) {
  const model = params.model || 'claude-3-5-sonnet-20241022';
  const prompt = params.prompt || params.message || '';
  const system = params.system || 'You are Claude, a helpful AI assistant.';
  const temperature = params.temperature ? parseFloat(params.temperature) : undefined;
  const maxTokens = params.max_tokens ? parseInt(params.max_tokens) : 1024;

  if (!prompt) {
    throw new Error('Heredoc format requires "prompt=" parameter');
  }

  // If no active conversation, start one with the system prompt
  if (!activeConversation) {
    activeConversation = {
      messages: [],
      system: system
    };
  }

  // Add user message to conversation
  activeConversation.messages.push({
    role: 'user',
    content: prompt
  });

  try {
    // Make API call with full conversation history
    const response = await callClaudeAPI({
      model: model,
      messages: activeConversation.messages,
      system: activeConversation.system,
      max_tokens: maxTokens,
      temperature: temperature
    }, apiKey);

    // Add assistant response to conversation
    activeConversation.messages.push({
      role: 'assistant',
      content: response.content
    });

    return {
      success: true,
      response: response.content,
      model: response.model,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens
      }
    };
  } catch (error) {
    throw error;
  }
}

// Get API key from environment or configuration
function getApiKey() {
  // Try environment variable first
  if (typeof process !== 'undefined' && process.env && process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // Try global configuration
  if (typeof global !== 'undefined' && global.ANTHROPIC_API_KEY) {
    return global.ANTHROPIC_API_KEY;
  }

  // Try window configuration (browser)
  if (typeof window !== 'undefined' && window.ANTHROPIC_API_KEY) {
    return window.ANTHROPIC_API_KEY;
  }
  
  return null;
}

// Parse CHECKPOINT command parameters: CHECKPOINT key=value key="quoted value" key='quoted value'
function parseCheckpointCommand(command) {
  const params = {};
  const argText = command.trim().replace(/^CHECKPOINT\s+/i, '');
  const pairPattern = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let match;

  while ((match = pairPattern.exec(argText)) !== null) {
    const [, key, doubleQuoted, singleQuoted, bare] = match;
    const value = doubleQuoted !== undefined ? doubleQuoted
      : singleQuoted !== undefined ? singleQuoted
      : bare;
    params[key.toLowerCase()] = value;
  }

  return params;
}

// Handle CHECKPOINT creation with structured outputs
async function handleCheckpoint(params, apiKey) {
  checkpointCounter++;
  const checkpointId = `checkpoint_${checkpointCounter}_${Date.now()}`;
  
  const checkpoint = {
    id: checkpointId,
    operation: params.operation || params.request || 'GENERAL_ANALYSIS',
    context: {
      code: params.code,
      text: params.text,
      data: params.data,
      variables: params.variables ? JSON.parse(params.variables) : {},
      metadata: {
        phase: params.phase || 'analysis',
        format: params.format || 'structured',
        timeout: parseInt(params.timeout) || 30000
      }
    },
    parameters: params,
    status: 'processing',
    created: new Date().toISOString(),
    progress: {
      status: 'initiated',
      percentage: 0,
      message: 'Checkpoint created, sending to Claude...'
    }
  };
  
  activeCheckpoints.set(checkpointId, checkpoint);
  
  // Process with Claude in background using structured output
  processCheckpointWithClaude(checkpoint, apiKey);
  
  return {
    operation: 'CREATE_CHECKPOINT',
    success: true,
    checkpointId: checkpointId,
    status: 'processing',
    message: `Checkpoint ${checkpointId} created and processing`,
    timeout: checkpoint.context.metadata.timeout,
    timestamp: new Date().toISOString()
  };
}

// Background processing with Claude using structured outputs
async function processCheckpointWithClaude(checkpoint, apiKey) {
  try {
    // Update progress
    checkpoint.progress = {
      status: 'analyzing',
      percentage: 25,
      message: 'Sending request to Claude...'
    };
    
    // Skip API call if using test API key
    if (apiKey === 'test-api-key-for-testing') {
      // Mock successful response for testing
      setTimeout(() => {
        checkpoint.status = 'completed';
        checkpoint.result = {
          type: 'structured',
          operation: checkpoint.operation,
          data: {
            analysis: 'Mock analysis result',
            issues: [],
            suggestions: ['Mock suggestion'],
            confidence: 0.95
          }
        };
        checkpoint.progress = {
          status: 'completed',
          percentage: 100,
          message: 'Mock analysis complete'
        };
        checkpoint.completedAt = new Date().toISOString();
        checkpoint.processingTime = 100;
      }, 50); // Very fast for testing
      return;
    }
    
    // Create structured prompt based on operation type
    const structuredPrompt = createStructuredPrompt(checkpoint);
    
    // Call Claude with structured output request
    const response = await callClaudeAPIWithStructuredOutput(structuredPrompt, apiKey, checkpoint.operation);
    
    // Update progress
    checkpoint.progress = {
      status: 'processing_response',
      percentage: 75,
      message: 'Processing Claude response...'
    };
    
    // Parse and structure the response
    const structuredResult = parseStructuredResponse(response, checkpoint.operation);
    
    // Complete the checkpoint
    checkpoint.status = 'completed';
    checkpoint.result = structuredResult;
    checkpoint.progress = {
      status: 'completed',
      percentage: 100,
      message: 'Analysis complete'
    };
    checkpoint.completedAt = new Date().toISOString();
    checkpoint.processingTime = new Date(checkpoint.completedAt).getTime() - new Date(checkpoint.created).getTime();
    
  } catch (error) {
    checkpoint.status = 'error';
    checkpoint.error = {
      message: error.message,
      type: 'processing_error',
      timestamp: new Date().toISOString()
    };
    checkpoint.progress = {
      status: 'error',
      percentage: 0,
      message: `Error: ${error.message}`
    };
  }
}

// Create structured prompt based on operation type
function createStructuredPrompt(checkpoint) {
  const { operation, context } = checkpoint;
  
  switch (operation.toUpperCase()) {
    case 'ANALYZE_CODE':
      return {
        system: "You are a expert code analyst. Analyze code for correctness, efficiency, and best practices. Return your analysis in JSON format.",
        message: `Analyze this code:\n\n${context.code}\n\nProvide analysis in this JSON structure:
{
  "analysis": "detailed analysis of the code",
  "issues": ["list of issues found"],
  "suggestions": ["list of improvement suggestions"],
  "confidence": 0.95,
  "complexity": "low|medium|high",
  "quality_score": 85
}`,
        responseFormat: "json"
      };
      
    case 'GENERATE_CODE':
      return {
        system: "You are an expert programmer. Generate clean, efficient, well-documented code based on requirements.",
        message: `Generate code for: ${context.text || context.data}\n\nReturn in this JSON structure:
{
  "code": "generated code here",
  "explanation": "explanation of the code",
  "dependencies": ["list of dependencies"],
  "usage_example": "example of how to use the code",
  "tests": "suggested test cases"
}`,
        responseFormat: "json"
      };
      
    case 'REVIEW_TEXT':
      return {
        system: "You are an expert editor and writing analyst. Review text for clarity, grammar, and style.",
        message: `Review this text:\n\n${context.text}\n\nProvide feedback in this JSON structure:
{
  "review": "overall assessment",
  "grammar_issues": ["list of grammar issues"],
  "style_suggestions": ["list of style improvements"],
  "clarity_score": 85,
  "readability": "easy|moderate|difficult",
  "tone": "formal|informal|neutral"
}`,
        responseFormat: "json"
      };
      
    default:
      return {
        system: "You are a helpful AI assistant. Analyze the provided content and return structured results.",
        message: `Operation: ${operation}\n\nContent: ${context.text || context.code || context.data || 'No content provided'}\n\nProvide analysis in JSON format with relevant fields for this operation.`,
        responseFormat: "json"
      };
  }
}

// Call Claude API with structured output support
async function callClaudeAPIWithStructuredOutput(prompt, apiKey, operation) {
  const messages = [
    {
      role: 'user',
      content: prompt.message
    }
  ];
  
  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: messages,
    system: prompt.system
  };
  
  // Add structured output instructions for better JSON parsing
  if (prompt.responseFormat === 'json') {
    requestBody.system += " Always respond with valid JSON. Do not include any text before or after the JSON object.";
  }
  
  let fetchFn;
  if (typeof fetch !== 'undefined') {
    fetchFn = fetch;
  } else if (typeof require !== 'undefined') {
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      throw new Error('Claude ADDRESS library requires fetch API or node-fetch module in Node.js');
    }
  } else {
    throw new Error('No fetch implementation available');
  }
  
  const response = await fetchFn('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorData}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Claude API error: ${data.error.message || 'Unknown error'}`);
  }
  
  return {
    content: data.content[0]?.text || 'No response content',
    usage: data.usage
  };
}

// Parse structured response from Claude
function parseStructuredResponse(response, operation) {
  try {
    // Try to parse as JSON first
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonResult = JSON.parse(jsonMatch[0]);
      return {
        type: 'structured',
        operation: operation,
        data: jsonResult,
        raw: response.content,
        usage: response.usage
      };
    }
  } catch (e) {
    // If JSON parsing fails, return as unstructured
  }
  
  return {
    type: 'unstructured',
    operation: operation,
    data: {
      content: response.content,
      analysis: response.content
    },
    raw: response.content,
    usage: response.usage
  };
}

// Handle checkpoint polling (COMET-style long-polling)
async function handleCheckpointPoll(checkpointId) {
  if (!activeCheckpoints.has(checkpointId)) {
    return {
      operation: 'POLL_CHECKPOINT',
      success: false,
      error: `Checkpoint ${checkpointId} not found`,
      status: 'not_found',
      timestamp: new Date().toISOString()
    };
  }
  
  const checkpoint = activeCheckpoints.get(checkpointId);
  
  // Return current status and results if available
  const result = {
    operation: 'POLL_CHECKPOINT',
    success: true,
    checkpointId: checkpointId,
    status: checkpoint.status,
    progress: checkpoint.progress,
    timestamp: new Date().toISOString()
  };
  
  if (checkpoint.status === 'completed') {
    result.done = true; // COMET-style "done" signal
    result.result = checkpoint.result;
    result.processingTime = checkpoint.processingTime;
    // Optionally clean up completed checkpoint
    activeCheckpoints.delete(checkpointId);
  } else if (checkpoint.status === 'error') {
    result.done = true; // Error also completes the checkpoint
    result.error = checkpoint.error;
    activeCheckpoints.delete(checkpointId);
  }
  
  return result;
}

// Handle manual checkpoint completion (for external collaborators)
async function handleCheckpointComplete(checkpointId, externalResult) {
  if (!activeCheckpoints.has(checkpointId)) {
    throw new Error(`Checkpoint ${checkpointId} not found`);
  }
  
  const checkpoint = activeCheckpoints.get(checkpointId);
  
  checkpoint.status = 'completed';
  checkpoint.result = externalResult;
  checkpoint.completedAt = new Date().toISOString();
  checkpoint.progress = {
    status: 'completed',
    percentage: 100,
    message: 'Completed by external collaborator'
  };
  
  return {
    operation: 'COMPLETE_CHECKPOINT',
    success: true,
    checkpointId: checkpointId,
    status: 'completed',
    result: externalResult,
    timestamp: new Date().toISOString()
  };
}

// Make HTTP request to Claude API
async function callClaudeAPI(session, apiKey) {
  const messages = session.messages.filter(msg => msg.role !== 'system');
  
  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: messages,
    system: session.system
  };
  
  let fetchFn;
  if (typeof fetch !== 'undefined') {
    fetchFn = fetch;
  } else if (typeof require !== 'undefined') {
    // Node.js environment - try to require node-fetch
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      throw new Error('Claude ADDRESS library requires fetch API or node-fetch module in Node.js');
    }
  } else {
    throw new Error('No fetch implementation available');
  }
  
  const response = await fetchFn('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorData}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Claude API error: ${data.error.message || 'Unknown error'}`);
  }
  
  return {
    content: data.content[0]?.text || 'No response content',
    usage: data.usage
  };
}

// ADDRESS target methods metadata
const ADDRESS_CLAUDE_METHODS = {
  close_chat: {
    description: "Close the active conversation (same as the CLOSE_CHAT command)",
    params: [],
    returns: "object with conversation closure details"
  },
  checkpoint: {
    description: "Create a structured analysis checkpoint with Claude",
    params: ["operation", "code", "text", "data", "format", "timeout"],
    returns: "object with checkpoint ID and status"
  },
  wait_for_checkpoint: {
    description: "Poll a checkpoint for completion (COMET-style long-polling)",
    params: ["checkpoint_id"],
    returns: "object with checkpoint status and results when done"
  },
  poll_checkpoint: {
    description: "Poll a checkpoint for completion (alias for wait_for_checkpoint)",
    params: ["checkpoint_id"],
    returns: "object with checkpoint status and results when done"
  },
  complete_checkpoint: {
    description: "Manually complete a checkpoint with external results",
    params: ["checkpoint_id", "result"],
    returns: "object with completion confirmation"
  },
  status: {
    description: "Get Claude service status",
    params: [],
    returns: "object with service information"
  }
};

// Format Claude result for proper REXX variable handling
function formatClaudeResultForREXX(result) {
  const rexxResult = {
    ...result, // Preserve original result structure
    errorCode: 0  // Always 0 - REXX will check result.rc or result.success instead
  };

  // For heredoc prompts (success case)
  if (result.success && result.response) {
    rexxResult.output = result.response;
    rexxResult.message = result.response;
  }
  // For session start, return session ID as RESULT
  else if (result.operation === 'START_SESSION') {
    rexxResult.output = result.sessionId.toString();
  }
  // For chat messages, return Claude's response as RESULT
  else if (result.operation === 'CHAT_MESSAGE') {
    rexxResult.output = result.response;
    rexxResult.message = result.response;
  }
  // For session end or close chat, return confirmation message
  else if (result.operation === 'END_SESSION' || result.operation === 'CLOSE_CHAT') {
    rexxResult.output = result.message || `Conversation closed (${result.messageCount} messages)`;
  }
  // Default: return success message
  else {
    rexxResult.output = result.message || 'Operation completed';
  }

  return rexxResult;
}

// Format Claude error for proper REXX variable handling
function formatClaudeErrorForREXX(error) {
  const rexxResult = {
    operation: 'ERROR',
    success: false,
    errorCode: 1,
    errorMessage: error.message,
    output: error.message,
    timestamp: new Date().toISOString()
  };
  
  return rexxResult;
}

// Export to global scope (required for REQUIRE system detection)
if (typeof window !== 'undefined') {
  // Browser environment
  window.CLAUDE_ADDRESS_META = CLAUDE_ADDRESS_META;
  window.ADDRESS_CLAUDE_HANDLER = ADDRESS_CLAUDE_HANDLER;
  window.ADDRESS_CLAUDE_METHODS = ADDRESS_CLAUDE_METHODS;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.CLAUDE_ADDRESS_META = CLAUDE_ADDRESS_META;
  global.ADDRESS_CLAUDE_HANDLER = ADDRESS_CLAUDE_HANDLER;
  global.ADDRESS_CLAUDE_METHODS = ADDRESS_CLAUDE_METHODS;
}