# Control Bus - Distributed Application Coordination

A general-purpose control bus architecture enabling secure coordination, monitoring, and automation across distributed Rexx applications, specifically designed for Controlled Web Mode execution.

## Historical Context


## Control Bus Architecture

The control bus provides a unified communication infrastructure for distributed Rexx applications, supporting real-time coordination, progress monitoring, and fault-tolerant automation.

### Core Components

```
┌─────────────────┐    Control Bus Protocol    ┌─────────────────┐
│                 │◄─────────────────────────►│                 │
│   Director      │     PostMessage/RPC        │   Worker/Agent  │
│   (Coordinator) │                            │   (Executor)    │
│                 │◄─────────────────────────►│                 │
└─────────────────┘                            └─────────────────┘
        │                                               │
        ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│ Control Logic   │                            │ Business Logic  │
│ - Orchestration │                            │ - Task Execution│
│ - Monitoring    │                            │ - Progress      │
│ - Error Recovery│                            │ - Status        │
└─────────────────┘                            └─────────────────┘
```

**Director**: Orchestrates execution, monitors progress, handles control flow
**Worker/Agent**: Executes business logic, reports progress via CHECKPOINT
**Control Bus**: Secure bidirectional communication channel
**Protocol**: Structured message format for coordination

## Message Protocols

The control bus supports two complementary message protocols optimized for different coordination patterns.

### JSON-RPC Protocol (Fine-Grained Control)

Individual function calls for real-time application control:

```rexx
-- Director coordinates individual operations
ADDRESS calculator
clear                    -- Single operation: calculator.clear()
press button="5"         -- Single operation: calculator.press("5")
press button="+"         -- Single operation: calculator.press("+")
LET result = getDisplay  -- Single operation: calculator.getDisplay()

-- Inspect worker capabilities
LET methods = _inspect
SAY "Available operations: " || methods
```

**JavaScript Worker Implementation:**
```javascript
// Worker exposes callable methods
const calculatorAPI = {
  clear: () => display.textContent = "0",
  press: (key) => handleKeyPress(key),
  getDisplay: () => display.textContent,
  _inspect: () => JSON.stringify(Object.keys(calculatorAPI))
};

// Handle incoming JSON-RPC calls
window.addEventListener('message', (event) => {
  const { method, params } = event.data;
  if (calculatorAPI[method]) {
    const result = calculatorAPI[method](...params);
    event.source.postMessage({ result }, event.origin);
  }
});
```

### Rexx-RPC Protocol (Script-Level Coordination)

Complete script execution with progress monitoring and flow control:

```rexx
-- Worker executes complete automation script
DO i = 1 TO totalRecords
  -- Execute business logic
  LET record = processRecord(i)
  LET processed = processed + 1
  
  -- Report progress to director
  CHECKPOINT("processing", processed, totalRecords)
  
  -- Check for director control commands
  IF CHECKPOINT_RESPONSE.action = "pause" THEN DO
    SAY "Pausing execution at director request..."
    CHECKPOINT("paused", processed, totalRecords)
    -- Wait for resume command
  ENDIF
  
  IF CHECKPOINT_RESPONSE.action = "abort" THEN DO
    SAY "Aborting execution at director request..."
    LEAVE
  ENDIF
END

CHECKPOINT("completed", processed, totalRecords)
```

**JavaScript Director Implementation:**
```javascript
class ControlBusDirector {
  constructor(workerFrame) {
    this.worker = workerFrame;
    this.controlState = 'running';
    this.setupMessageHandling();
  }
  
  executeScript(rexxCode) {
    const request = {
      type: 'rexx-execute',
      code: rexxCode,
      streaming: true,
      requestId: this.generateId()
    };
    
    this.worker.postMessage(request, '*');
  }
  
  pauseExecution() {
    this.controlState = 'paused';
    // Next CHECKPOINT will receive pause command
  }
  
  resumeExecution() {
    this.controlState = 'running';
    // Send resume command to worker
    this.worker.postMessage({ type: 'control', action: 'resume' }, '*');
  }
  
  setupMessageHandling() {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'rexx-progress') {
        this.handleProgress(event.data);
      }
    });
  }
  
  handleProgress(progress) {
    const { checkpoint, params, variables } = progress;
    
    // Update UI with progress
    console.log(`Progress: ${checkpoint}`, params);
    
    // Send control response based on director state
    const response = {
      type: 'checkpoint-response',
      action: this.controlState,
      timestamp: Date.now()
    };
    
    event.source.postMessage(response, event.origin);
  }
}
```

## CHECKPOINT Function Reference

The CHECKPOINT function provides the primary interface for worker-to-director communication and progress monitoring.

### Function Signature
```rexx
CHECKPOINT(checkpointId, [param1, param2, ...])
```

**Parameters:**
- `checkpointId`: String identifier for this checkpoint (e.g., "processing", "completed")
- `param1, param2, ...`: Optional parameters providing context (counters, status, data)

**Returns:**
- Control bus response object with director commands and metadata

### Basic Usage
```rexx
-- Simple progress checkpoint
CHECKPOINT("started", "Data processing initiated")

-- Progress with counters
CHECKPOINT("progress", currentRecord, totalRecords)

-- Status with multiple parameters
CHECKPOINT("validation", validRecords, errorRecords, totalRecords)

-- Completion checkpoint
CHECKPOINT("completed", "Processing finished successfully")
```

### Advanced Control Flow
```rexx
-- Handle director control commands
LET response = CHECKPOINT("ready", "Awaiting instructions")

SELECT
  WHEN response.action = "pause" THEN DO
    SAY "Director requested pause..."
    CHECKPOINT("paused", "Execution paused")
    -- Wait for resume
  END
  
  WHEN response.action = "abort" THEN DO
    SAY "Director requested abort..."
    CHECKPOINT("aborted", "Execution terminated")
    EXIT
  END
  
  WHEN response.action = "continue" THEN DO
    SAY "Continuing execution..."
    -- Proceed with normal flow
  END
  
  OTHERWISE
    SAY "Unknown director command: " || response.action
END
```

### Variable Sharing with Director
```rexx
-- CHECKPOINT automatically shares variables with director
LET processedCount = 0
LET errorCount = 0
LET currentFile = "data.csv"

DO WHILE hasMoreData
  -- Process data
  LET processedCount = processedCount + 1
  
  -- Variables are automatically shared via CHECKPOINT
  CHECKPOINT("processing", processedCount)
  -- Director can access: variables.processedCount, variables.currentFile
END
```

## Director/Worker Communication Patterns

### Event-Driven Coordination

**Director Event Loop:**
```javascript
class ControlBusDirector {
  constructor() {
    this.workers = new Map();
    this.activeJobs = new Map();
  }
  
  // Register worker and establish communication
  registerWorker(workerId, iframe) {
    const worker = {
      id: workerId,
      iframe: iframe,
      status: 'idle',
      lastCheckpoint: null,
      variables: {}
    };
    
    this.workers.set(workerId, worker);
    this.setupWorkerEventHandling(worker);
  }
  
  setupWorkerEventHandling(worker) {
    const handleMessage = (event) => {
      if (event.source !== worker.iframe.contentWindow) return;
      
      switch (event.data.type) {
        case 'rexx-progress':
          this.handleWorkerProgress(worker, event.data);
          break;
          
        case 'rexx-complete':
          this.handleWorkerCompletion(worker, event.data);
          break;
          
        case 'rexx-error':
          this.handleWorkerError(worker, event.data);
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    worker.messageHandler = handleMessage;
  }
  
  handleWorkerProgress(worker, progress) {
    // Update worker state
    worker.lastCheckpoint = progress.checkpoint;
    worker.variables = { ...worker.variables, ...progress.variables };
    worker.status = 'running';
    
    // Log progress
    console.log(`Worker ${worker.id}: ${progress.checkpoint}`, progress.params);
    
    // Broadcast to UI
    this.broadcastProgress(worker.id, progress);
    
    // Send control response
    const response = this.generateControlResponse(worker, progress);
    worker.iframe.contentWindow.postMessage(response, '*');
  }
  
  generateControlResponse(worker, progress) {
    const job = this.activeJobs.get(worker.id);
    
    return {
      type: 'checkpoint-response',
      action: job?.controlState || 'continue',
      timestamp: Date.now(),
      metadata: {
        workerId: worker.id,
        checkpoint: progress.checkpoint
      }
    };
  }
}
```

**Worker Event Loop:**
```javascript
class ControlBusWorker {
  constructor() {
    this.interpreter = new Interpreter(null);
    this.controlBus = this.setupControlBus();
  }
  
  setupControlBus() {
    // Override CHECKPOINT function to send progress
    const originalCheckpoint = this.interpreter.builtInFunctions.CHECKPOINT;
    
    this.interpreter.builtInFunctions.CHECKPOINT = (...params) => {
      // Call original CHECKPOINT (sets variables)
      const result = originalCheckpoint.call(this.interpreter, ...params);
      
      // Send progress to director
      const progress = {
        type: 'rexx-progress',
        timestamp: Date.now(),
        checkpoint: params[0],
        params: params.slice(1),
        variables: this.extractPublicVariables(),
        requestId: this.currentRequestId
      };
      
      parent.postMessage(progress, '*');
      
      // Wait for control response
      return this.waitForControlResponse();
    };
  }
  
  async waitForControlResponse() {
    return new Promise((resolve) => {
      const handleResponse = (event) => {
        if (event.data.type === 'checkpoint-response') {
          window.removeEventListener('message', handleResponse);
          resolve(event.data);
        }
      };
      
      window.addEventListener('message', handleResponse);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        resolve({ action: 'continue', timeout: true });
      }, 5000);
    });
  }
  
  extractPublicVariables() {
    // Extract non-private variables for director
    const variables = {};
    for (const [name, value] of this.interpreter.variables) {
      if (!name.startsWith('_')) {  // Skip private variables
        variables[name] = value;
      }
    }
    return variables;
  }
}
```

### Fault Tolerance and Recovery

```javascript
class FaultTolerantDirector extends ControlBusDirector {
  constructor() {
    super();
    this.heartbeatInterval = 30000; // 30 seconds
    this.responseTimeout = 10000;   // 10 seconds
    this.setupHeartbeat();
  }
  
  setupHeartbeat() {
    setInterval(() => {
      for (const [workerId, worker] of this.workers) {
        if (worker.status === 'running') {
          this.sendHeartbeat(worker);
        }
      }
    }, this.heartbeatInterval);
  }
  
  sendHeartbeat(worker) {
    const heartbeat = {
      type: 'heartbeat',
      timestamp: Date.now()
    };
    
    worker.iframe.contentWindow.postMessage(heartbeat, '*');
    
    // Set timeout for response
    setTimeout(() => {
      if (!worker.lastHeartbeatResponse || 
          Date.now() - worker.lastHeartbeatResponse > this.responseTimeout) {
        this.handleWorkerTimeout(worker);
      }
    }, this.responseTimeout);
  }
  
  handleWorkerTimeout(worker) {
    console.warn(`Worker ${worker.id} timeout - attempting recovery`);
    worker.status = 'timeout';
    
    // Attempt recovery
    this.recoverWorker(worker);
  }
  
  async recoverWorker(worker) {
    try {
      // Try to restart worker
      worker.iframe.src = worker.iframe.src; // Reload iframe
      
      // Wait for worker to come back online
      await this.waitForWorkerReady(worker);
      
      // Resume from last checkpoint
      await this.resumeFromCheckpoint(worker);
      
      worker.status = 'running';
      console.log(`Worker ${worker.id} recovered successfully`);
      
    } catch (error) {
      console.error(`Failed to recover worker ${worker.id}:`, error);
      worker.status = 'failed';
      this.handleWorkerFailure(worker, error);
    }
  }
}
```

## Transport Adapters

The control bus supports pluggable transport adapters for different communication mechanisms.

### PostMessage Adapter (Default)
```javascript
class PostMessageAdapter {
  constructor(targetWindow, targetOrigin = '*') {
    this.target = targetWindow;
    this.origin = targetOrigin;
    this.messageHandlers = new Map();
  }
  
  send(message) {
    this.target.postMessage(message, this.origin);
  }
  
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }
  
  setupMessageHandling() {
    window.addEventListener('message', (event) => {
      const { type } = event.data;
      const handlers = this.messageHandlers.get(type) || [];
      
      for (const handler of handlers) {
        try {
          handler(event.data, event);
        } catch (error) {
          console.error(`Error in message handler for ${type}:`, error);
        }
      }
    });
  }
}
```

### WebSocket Adapter (Future)
```javascript
class WebSocketAdapter {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.messageHandlers = new Map();
    this.setupWebSocketHandling();
  }
  
  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }
  
  setupWebSocketHandling() {
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const handlers = this.messageHandlers.get(message.type) || [];
        
        for (const handler of handlers) {
          handler(message, event);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }
}
```

## Multi-Application Coordination

### Workflow Orchestration
```rexx
-- Director coordinates multiple workers
ADDRESS workflow_director

-- Stage 1: Data validation
EXECUTE_ON_WORKER worker="validator" script="CALL validateData source='input.csv'"
WAIT_FOR_COMPLETION worker="validator"

-- Stage 2: Data processing (parallel)
EXECUTE_ON_WORKER worker="processor1" script="CALL processChunk start=1 end=1000"
EXECUTE_ON_WORKER worker="processor2" script="CALL processChunk start=1001 end=2000"
EXECUTE_ON_WORKER worker="processor3" script="CALL processChunk start=2001 end=3000"

-- Wait for all processors to complete
WAIT_FOR_ALL workers="processor1,processor2,processor3"

-- Stage 3: Results aggregation
EXECUTE_ON_WORKER worker="aggregator" script="CALL aggregateResults"
WAIT_FOR_COMPLETION worker="aggregator"

SAY "Workflow completed successfully"
```

### Cross-Application Data Flow
```rexx
-- Calculator to spreadsheet data flow
ADDRESS calculator
clear
press button="100"
press button="*"
press button="1.08"  -- Add 8% tax
press button="="
LET taxedAmount = getDisplay

-- Send result to spreadsheet
ADDRESS spreadsheet  
setCellValue row=5 col=3 value=taxedAmount
LET formula = "=C5*12"  -- Annual calculation
setCellFormula row=6 col=3 formula=formula
LET annualAmount = getCellValue row=6 col=3

-- Display final result
SAY "Monthly: " || taxedAmount
SAY "Annual: " || annualAmount

-- Log to audit trail
CHECKPOINT("calculation_complete", taxedAmount, annualAmount)
```

## Error Handling and Recovery

### Error Propagation
```rexx
-- Worker error handling with control bus integration
SIGNAL ON ERROR NAME HandleError

DO i = 1 TO 1000
  -- Process record
  LET result = processRecord(i)
  
  IF result.error THEN DO
    -- Report error via control bus
    CHECKPOINT("error", i, result.errorMessage)
    
    -- Check director guidance
    IF CHECKPOINT_RESPONSE.action = "skip" THEN
      ITERATE  -- Skip this record
    ELSE IF CHECKPOINT_RESPONSE.action = "abort" THEN
      LEAVE    -- Stop processing
    ELSE
      -- Retry with director parameters
      LET retryResult = processRecord(i, CHECKPOINT_RESPONSE.params)
    ENDIF
  ENDIF
  
  CHECKPOINT("progress", i, 1000)
END

EXIT

HandleError:
SAY "Fatal error occurred: " || ERROR_MESSAGE
CHECKPOINT("fatal_error", ERROR_MESSAGE, ERROR_FUNCTION)
EXIT 1
```

### Director Error Recovery
```javascript
class ErrorRecoveryDirector extends ControlBusDirector {
  handleWorkerError(worker, error) {
    console.error(`Worker ${worker.id} error:`, error);
    
    // Determine recovery strategy
    const recovery = this.determineRecoveryStrategy(worker, error);
    
    switch (recovery.strategy) {
      case 'retry':
        this.retryOperation(worker, recovery);
        break;
        
      case 'fallback':
        this.executeFallbackPlan(worker, recovery);
        break;
        
      case 'abort':
        this.abortWorker(worker, recovery);
        break;
        
      case 'escalate':
        this.escalateError(worker, error);
        break;
    }
  }
  
  determineRecoveryStrategy(worker, error) {
    // Analyze error type and context
    const errorType = this.classifyError(error);
    const attempts = worker.retryCount || 0;
    
    if (errorType === 'transient' && attempts < 3) {
      return { strategy: 'retry', delay: 1000 * Math.pow(2, attempts) };
    } else if (errorType === 'data' && this.hasFallbackData()) {
      return { strategy: 'fallback', fallbackSource: 'backup' };
    } else if (errorType === 'critical') {
      return { strategy: 'escalate', severity: 'high' };
    } else {
      return { strategy: 'abort', reason: 'unrecoverable' };
    }
  }
  
  async retryOperation(worker, recovery) {
    worker.retryCount = (worker.retryCount || 0) + 1;
    
    // Wait before retry
    await this.delay(recovery.delay);
    
    // Send retry command
    const retryCommand = {
      type: 'control',
      action: 'retry',
      attempt: worker.retryCount,
      timestamp: Date.now()
    };
    
    worker.iframe.contentWindow.postMessage(retryCommand, '*');
  }
}
```

## Performance Optimization

### Message Batching
```javascript
class BatchingControlBus {
  constructor() {
    this.messageBatch = [];
    this.batchTimeout = null;
    this.maxBatchSize = 10;
    this.batchDelay = 100; // ms
  }
  
  sendMessage(message) {
    this.messageBatch.push(message);
    
    if (this.messageBatch.length >= this.maxBatchSize) {
      this.flushBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushBatch(), this.batchDelay);
    }
  }
  
  flushBatch() {
    if (this.messageBatch.length === 0) return;
    
    const batch = {
      type: 'message-batch',
      messages: this.messageBatch,
      timestamp: Date.now()
    };
    
    this.transport.send(batch);
    
    this.messageBatch = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}
```

### Progress Throttling
```rexx
-- Throttle CHECKPOINT calls for high-frequency operations
LET lastCheckpointTime = 0
LET checkpointInterval = 1000  -- 1 second minimum between checkpoints

DO i = 1 TO 1000000
  -- Process item
  LET processed = processItem(i)
  
  -- Only checkpoint every second or on significant events
  LET currentTime = NOW timestamp=true
  IF (currentTime - lastCheckpointTime) > checkpointInterval OR 
     processed.critical OR 
     i = 1000000 THEN DO
    CHECKPOINT("progress", i, 1000000, processed.status)
    LET lastCheckpointTime = currentTime
  ENDIF
END
```

## Security Considerations

### Message Validation
```javascript
class SecureControlBus {
  constructor() {
    this.allowedOrigins = new Set(['https://trusted.example.com']);
    this.messageSchema = this.loadMessageSchema();
  }
  
  validateMessage(event) {
    // Origin validation
    if (!this.allowedOrigins.has(event.origin)) {
      console.warn(`Rejected message from unauthorized origin: ${event.origin}`);
      return false;
    }
    
    // Schema validation
    if (!this.messageSchema.validate(event.data)) {
      console.warn('Message failed schema validation:', event.data);
      return false;
    }
    
    // Rate limiting
    if (this.isRateLimited(event.origin)) {
      console.warn(`Rate limit exceeded for origin: ${event.origin}`);
      return false;
    }
    
    return true;
  }
  
  handleMessage(event) {
    if (!this.validateMessage(event)) {
      return;
    }
    
    // Process validated message
    this.processMessage(event.data);
  }
}
```

### Capability-Based Security
```rexx
-- Worker declares required capabilities
CHECKPOINT("capabilities", "calculator,spreadsheet,file-read")

-- Director validates and grants capabilities
-- Only operations within granted capabilities are allowed
```

## Best Practices

### Director Implementation
- **Separation of concerns**: Keep coordination logic separate from business logic
- **Error resilience**: Implement comprehensive error handling and recovery
- **Performance monitoring**: Track message latency and worker performance
- **Resource management**: Monitor worker memory and CPU usage
- **Security**: Validate all messages and implement origin checking

### Worker Implementation
- **Regular checkpoints**: Call CHECKPOINT at appropriate intervals
- **Progress granularity**: Balance between too frequent and too sparse updates
- **Error handling**: Use SIGNAL ON ERROR for robust error management
- **Variable hygiene**: Keep variable scope clean for director visibility
- **Graceful shutdown**: Handle abort commands properly

### Control Bus Protocol
- **Message versioning**: Include protocol version in all messages
- **Idempotency**: Design messages to be safely redelivered
- **Timeout handling**: Implement appropriate timeouts for all operations
- **Message ordering**: Don't rely on message delivery order
- **Backward compatibility**: Maintain compatibility across protocol versions

## Function Reference

### CHECKPOINT Function
```rexx
CHECKPOINT(checkpointId, [param1, param2, ...])
```
- Reports progress and status to director
- Returns control response from director
- Automatically shares current variable state
- Supports pause/resume/abort control flow

### Control Response Object
Properties available in CHECKPOINT_RESPONSE:
- `action`: Control action ("continue", "pause", "resume", "abort")
- `timestamp`: Response timestamp
- `metadata`: Additional director-provided data
- `params`: Parameters for retry or modified execution

### Message Types

**Director → Worker:**
- `rexx-execute`: Execute Rexx script
- `control`: Control commands (pause/resume/abort)
- `heartbeat`: Connectivity check

**Worker → Director:**
- `rexx-progress`: Progress update via CHECKPOINT
- `rexx-complete`: Script execution completed
- `rexx-error`: Error during execution
- `heartbeat-response`: Heartbeat acknowledgment

**See also:**
- [Application Addressing](16-application-addressing.md) for ADDRESS statement integration
- [Dynamic Execution](15-interpret.md) for INTERPRET and script execution
- [Security Functions](12-security-functions.md) for message validation and encryption
- [Output and Debugging](17-output-debug.md) for logging and diagnostics