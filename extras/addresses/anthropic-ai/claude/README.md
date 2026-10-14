# Claude ADDRESS Library for RexxJS

This library provides integration with Anthropic's Claude AI assistant for RexxJS through the ADDRESS mechanism, allowing REXX programs to interact with Claude for natural language processing, code generation, analysis, and general AI assistance.

## Quick Start

```rexx
/* Set up your API key first */
REQUIRE "claude-address.js"
ADDRESS CLAUDE
<<PROMPT
system=You are a helpful REXX programming assistant.
prompt=How do I reverse a string in REXX?
PROMPT
SAY RESULT.message
```

## Installation

```bash
npm install  # Installs @anthropic-ai/sdk dependency
npm test
```

**Requirements:**
- Anthropic API key (set `ANTHROPIC_API_KEY` environment variable)
- Internet connection for API access

## Setup

### API Key Configuration

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Or set it programmatically:
```rexx
ADDRESS SYSTEM
"export ANTHROPIC_API_KEY=your-key-here"
```

### Get API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Generate an API key
4. Set the `ANTHROPIC_API_KEY` environment variable

## ADDRESS Target: `claude`

Once loaded, this library registers the `claude` ADDRESS target. It accepts exactly these
commands; anything else raises an error listing them:

| Command | Style | What it does |
|---|---|---|
| `key=value` heredoc (`<<LABEL ... LABEL`) | command string | Send a prompt in the active conversation |
| `CLOSE_CHAT` / `close_chat` | command string or method | Discard the active conversation |
| `STATUS` / `status` | command string or method | Report service status (needs no API key) |
| `CHECKPOINT key=value ...` | command string | Create a structured-analysis checkpoint |
| `WAIT FOR CHECKPOINT <id>` | command string | Poll a checkpoint |
| `checkpoint` | method | Create a structured-analysis checkpoint |
| `wait_for_checkpoint` / `poll_checkpoint` | method | Poll a checkpoint |
| `complete_checkpoint` | method | Complete a checkpoint with an external result |

Every command except `STATUS` requires `ANTHROPIC_API_KEY`.

## Usage Patterns

### Prompts (heredoc)

```rexx
ADDRESS CLAUDE
<<PROMPT
system=You are a REXX language expert who provides concise, accurate code examples.
prompt=Show me a REXX loop example
PROMPT
SAY RESULT.message
```

Heredoc keys: `prompt` (or `message`, required) and `system` (used when the conversation
starts). `model`, `temperature` and `max_tokens` are parsed but not yet passed to the API,
which currently always uses `claude-3-5-sonnet-20241022` with `max_tokens` 4000. A value
may continue over following lines that are not themselves `key=value`.

### Multi-turn Conversations

There is a single active conversation. Each heredoc prompt is added to it, so follow-ups
keep context until `CLOSE_CHAT`:

```rexx
ADDRESS CLAUDE
<<Q1
prompt=I'm working on a data processing script
Q1
<<Q2
prompt=How can I parse CSV files efficiently?
Q2
"CLOSE_CHAT"
```

## Available Methods

### `checkpoint`
Create a structured analysis checkpoint with Claude using COMET-style long-polling.

**Parameters:**
- `operation` - Type of analysis: "ANALYZE_CODE", "GENERATE_CODE", "REVIEW_TEXT", or custom
- `code` - Code to analyze (for ANALYZE_CODE operations)
- `text` - Text content (for REVIEW_TEXT or GENERATE_CODE operations)
- `data` - Generic data for custom operations
- `format` - Response format (optional, defaults to "structured")
- `timeout` - Checkpoint timeout in milliseconds (optional, default 30000)

**Returns:** Object with `checkpointId`, `status`, and `timeout`

### `wait_for_checkpoint` / `poll_checkpoint`
Poll a checkpoint for completion using long-polling architecture.

**Parameters:**
- `checkpoint_id` - The checkpoint ID to poll

**Returns:** Object with `status`, `progress`, and `result` when `done: true`

### `complete_checkpoint`
Manually complete a checkpoint (for external collaborators).

**Parameters:**
- `checkpoint_id` - The checkpoint ID to complete
- `result` - The completion result data

**Returns:** Object with completion confirmation

### `close_chat`
Discard the active conversation. Same as the `CLOSE_CHAT` command.

### `status`
Get Claude service status.

**Returns:** Object with `service`, `provider`, `apiKeyConfigured`, `hasActiveConversation`,
`messageCount`, `activeCheckpoints` and `methods`

## Claude Models

Requests currently always use `claude-3-5-sonnet-20241022`; the heredoc `model=` key is
not yet honoured (see Prompts above).

## CHECKPOINT Technology - Structured Collaboration

The Claude ADDRESS library implements the **CHECKPOINT** pattern from CHECKPOINT-TECH.md, enabling structured collaboration with Claude using COMET-style long-polling.

### Code Analysis Example

```rexx
ADDRESS CLAUDE
/* Create analysis checkpoint */
LET sourceCode = "function fibonacci(n) { if (n <= 1) return n; return fibonacci(n-1) + fibonacci(n-2); }"
LET analysisCheckpoint = checkpoint operation="ANALYZE_CODE" code=sourceCode format="structured"

/* COMET-style polling loop */
DO WHILE isDone <> "true"
    LET pollResult = wait_for_checkpoint checkpoint_id=analysisCheckpoint.checkpointId
    SAY "Progress:" pollResult.progress.percentage "%"
    
    IF pollResult.done = "true" THEN DO
        LET isDone = "true"
        SAY "Analysis:" pollResult.result.data.analysis
        SAY "Issues found:" pollResult.result.data.issues.length
        SAY "Quality score:" pollResult.result.data.quality_score
    END
END
```

### Command-Style CHECKPOINT

```rexx
ADDRESS CLAUDE
"CHECKPOINT operation=GENERATE_CODE text='Create an email validation function' format=structured"
/* RESULT.checkpointId is the id to poll */
"WAIT FOR CHECKPOINT" RESULT.checkpointId
```

Values may be bare, `"double-quoted"` or `'single-quoted'`.

### Text Review Example

```rexx
ADDRESS CLAUDE
LET document = "This document may contains some errors."
LET reviewCheckpoint = checkpoint operation="REVIEW_TEXT" text=document

/* Poll until complete */
DO UNTIL reviewResult.done = "true"
    LET reviewResult = wait_for_checkpoint checkpoint_id=reviewCheckpoint.checkpointId
    IF reviewResult.done = "true" THEN DO
        SAY "Grammar issues:" reviewResult.result.data.grammar_issues.length
        SAY "Readability:" reviewResult.result.data.readability
    END
END
```

### External Collaborator Pattern

```rexx
ADDRESS CLAUDE
/* Create checkpoint for external processing */
LET checkpoint = checkpoint operation="CUSTOM_ANALYSIS" data=myData

/* External system can complete it manually */
LET externalResult = '{"analysis": "completed", "score": 0.95}'
LET completion = complete_checkpoint checkpoint_id=checkpoint.checkpointId result=externalResult
```

## Advanced Features

### Structured Output Operations

Supported operation types:
- **ANALYZE_CODE** - Code analysis with issues, suggestions, quality scores
- **GENERATE_CODE** - Code generation with explanations and examples
- **REVIEW_TEXT** - Text analysis with grammar, style, and readability feedback  
- **Custom Operations** - Generic analysis for any content type

### Progress Monitoring

```rexx
ADDRESS CLAUDE
LET checkpoint = checkpoint operation="ANALYZE_CODE" code=myCode
DO WHILE status <> "completed"
    LET poll = wait_for_checkpoint checkpoint_id=checkpoint.checkpointId
    SAY poll.progress.message "(" || poll.progress.percentage || "%)"
    IF poll.status = "error" THEN
        SAY "Error:" poll.error.message
END
```

## Error Handling

A failed request (missing API key, API error, unrecognised command) raises an error in the
REXX program. `wait_for_checkpoint` on an unknown id returns `success: false` with
`status: "not_found"`; `complete_checkpoint` on an unknown id raises an error.

## REXX Integration

Standard REXX variables are set:
- **RC** - Return code (0 = success)
- **RESULT** - The result object; `RESULT.message` holds Claude's reply for heredoc prompts

## Testing

Run the test suite:

```bash
npm test
```

The specs cover heredoc prompts, `CLOSE_CHAT`, `STATUS`, metadata, API key validation, and
checkpoint creation, polling and completion. They make no network calls: `fetch` is mocked,
and the checkpoint spec uses the `test-api-key-for-testing` key, which makes the library
complete checkpoints with a canned result.

## Rate Limits and Costs

- Anthropic enforces API rate limits
- Usage is billed by tokens (input + output)
- Monitor usage through the Anthropic Console
- Consider implementing local caching for repeated queries

## Security Notes

- Never commit API keys to version control
- Use environment variables for key management
- Consider implementing usage quotas
- Validate and sanitize prompts from user input
- Be mindful of sensitive data in prompts

## Environment Compatibility

- **Node.js**: Uses the global `fetch` (Node 18+) or `node-fetch`
- **Browser**: Supported with appropriate CORS setup

## Best Practices

1. **System Prompts**: Set a clear, specific `system=` on the first prompt
2. **Prompt Engineering**: Be specific and clear in prompts
3. **Error Handling**: Always handle API failures gracefully
4. **Token Management**: Monitor usage to control costs
5. **Context Management**: `CLOSE_CHAT` between unrelated conversations

## Integration

This library integrates with:
- RexxJS core interpreter
- Standard REXX ADDRESS mechanism
- Anthropic Claude API
- REXX variable and error handling systems

Part of the RexxJS extras collection.

## Support

- [Anthropic Documentation](https://docs.anthropic.com/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [RexxJS Documentation](../../../README.md)