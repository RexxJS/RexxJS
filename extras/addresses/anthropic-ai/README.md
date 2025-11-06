# Anthropic Claude ADDRESS Library for RexxJS

This library provides AI-powered text generation and analysis through Claude, Anthropic's LLM, integrated with RexxJS via the ADDRESS mechanism.

## Installation

**Requirements:**
- Anthropic API key (get one at https://console.anthropic.com)
- `@anthropic-ai/sdk` npm package

```bash
npm install @anthropic-ai/sdk
```

## Quick Start

### Basic Text Generation

```rexx
REQUIRE "./extras/addresses/anthropic-ai/claude/src/claude-address.js"

ADDRESS CLAUDE
"message text='Write a haiku about programming'"

SAY RESULT  // Outputs: Claude's haiku response
```

### With System Prompt and Parameters

```rexx
ADDRESS CLAUDE
"message text='Explain quantum computing' model='claude-3-opus-20250219' temperature=0.7 max_tokens=500"

SAY RESULT
```

## Core Methods

### `message text="<prompt>"`
Send a message to Claude and receive a response.

**Parameters:**
- `text` (string, required) - The prompt/message to send
- `model` (string, optional) - Claude model version (default: claude-3-5-sonnet-20241022)
- `temperature` (number, optional) - Randomness (0.0-1.0, default: 0.7)
- `max_tokens` (number, optional) - Maximum response length (default: 2048)
- `system` (string, optional) - System prompt for context

**Returns:**
- `success` (boolean) - Request success
- `content` (string) - Claude's response
- `model` (string) - Model used
- `stop_reason` (string) - Why Claude stopped generating
- `usage` (object) - Token usage statistics

### `count_tokens text="<text>"`
Count tokens in a prompt without making an API call.

**Returns:**
- `success` (boolean) - Operation success
- `tokens` (number) - Number of tokens

## Available Models

- `claude-3-5-sonnet-20241022` - Balanced performance and speed (recommended)
- `claude-3-opus-20250219` - Most powerful, best for complex tasks
- `claude-3-haiku-20240307` - Fast and efficient for simple tasks

## Usage Examples

### Code Analysis
```rexx
ADDRESS CLAUDE
"message text='Analyze this code for security issues: let password = \"admin123\"; fetch(/api/user, {headers: {auth: password}})' system='You are a security expert'"

SAY RESULT
```

### Content Generation
```rexx
ADDRESS CLAUDE
"message text='Generate 3 creative business names for a coffee shop' max_tokens=200"

SAY RESULT
```

### Question Answering
```rexx
ADDRESS CLAUDE
"message text='What are the main differences between async/await and promises in JavaScript?'"

SAY RESULT
```

## Environment Configuration

Set your API key via environment variable:

```bash
export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxx"
```

Or provide it in your REXX script:

```rexx
ADDRESS CLAUDE
"message text='Hello' api_key='sk-ant-xxxxxxxxxxxxx'"
```

## Error Handling

```rexx
ADDRESS CLAUDE
LET result = message text="What is 2+2?"

IF result.success THEN
  SAY "✓ Response: " || result.content
ELSE
  SAY "❌ Error: " || result.error
```

## Rate Limiting & Costs

- Monitor token usage to control costs
- Anthropic charges per token (input and output)
- Use `count_tokens` to estimate costs before sending requests
- Implement exponential backoff for rate limits

## Integration with Other Handlers

Combine with EXPECTATIONS for testing:

```rexx
REQUIRE "./src/expectations-address.js"
REQUIRE "./extras/addresses/anthropic-ai/claude/src/claude-address.js"

ADDRESS CLAUDE
"message text='Say hello' max_tokens=10"

ADDRESS EXPECTATIONS
"{RESULT.success} should equal true"
"{RESULT.content} should contain 'hello'"
```

## Best Practices

### ✅ Do:
- Use specific, detailed prompts for better results
- Provide system prompts to set context
- Cache responses for repeated queries
- Monitor token usage
- Use appropriate models for task complexity

### ❌ Don't:
- Hard-code API keys in scripts (use environment variables)
- Use overly broad prompts
- Forget to handle errors
- Exceed rate limits without backoff
- Store sensitive data in prompts

## Limitations

- Rate limits apply based on API tier
- Max token output depends on model
- Real-time information has a knowledge cutoff
- No internet access for current information

---

**Part of the RexxJS extras collection** - bringing powerful AI capabilities to REXX programs with clean, readable syntax.
