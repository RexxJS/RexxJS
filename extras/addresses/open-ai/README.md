# OpenAI ADDRESS Library for RexxJS

This library provides OpenAI API integration for RexxJS through the ADDRESS mechanism, enabling REXX programs to leverage GPT models for text generation, chat, and embeddings.

## Installation

**Requirements:**
- OpenAI API key (get one at https://platform.openai.com/api-keys)
- `openai` npm package

```bash
npm install openai
```

## Quick Start

### Chat Completion

```rexx
REQUIRE "./extras/addresses/open-ai/openai-address.js"

ADDRESS OPENAI
"chat message='Hello, how can I learn programming?' model='gpt-4o'"

SAY RESULT.content
```

### Text Completion

```rexx
ADDRESS OPENAI
"complete prompt='Once upon a time' max_tokens=100 model='gpt-3.5-turbo'"

SAY RESULT.text
```

## Core Methods

### `chat message="<text>" model="<model>"`
Send a chat message to GPT models.

**Parameters:**
- `message` (string, required) - Chat message
- `model` (string, optional) - GPT model (default: gpt-4o-mini)
- `temperature` (number, optional) - Randomness (0.0-2.0, default: 0.7)
- `max_tokens` (number, optional) - Response length (default: 2048)
- `system` (string, optional) - System prompt for context
- `conversation_id` (string, optional) - For multi-turn chats

**Returns:**
- `success` (boolean) - Request successful
- `content` (string) - ChatGPT's response
- `model` (string) - Model used
- `tokens_used` (object) - Input and output token counts
- `finish_reason` (string) - Why response ended

### `complete prompt="<text>"`
Generate text completion.

**Parameters:**
- `prompt` (string, required) - Prompt text
- `model` (string, optional) - Completion model (default: text-davinci-003)
- `max_tokens` (number, optional) - Maximum length
- `temperature` (number, optional) - Creativity level

**Returns:**
- `success` (boolean) - Operation successful
- `text` (string) - Completed text
- `usage` (object) - Token usage

### `embeddings text="<text>"`
Generate text embeddings for similarity analysis.

**Parameters:**
- `text` (string, required) - Text to embed
- `model` (string, optional) - Embedding model (default: text-embedding-3-small)

**Returns:**
- `success` (boolean) - Operation successful
- `embedding` (array) - Vector embedding

## Available Models

### Chat Models
- `gpt-4o` - Latest, most capable
- `gpt-4o-mini` - Fast and cost-effective (recommended)
- `gpt-4-turbo` - Previous generation, high performance
- `gpt-3.5-turbo` - Older, lower cost

### Completion Models
- `text-davinci-003` - Most capable completion
- `text-curie-001` - Faster, lower cost

## Usage Examples

### Conversational AI

```rexx
ADDRESS OPENAI
"chat message='What is AI?' model='gpt-4o' system='You are a helpful AI tutor'"

response1 = RESULT.content
SAY "AI: " || response1

ADDRESS OPENAI
"chat message='Give me an example' conversation_id='chat_123' model='gpt-4o'"

response2 = RESULT.content
SAY "Example: " || response2
```

### Content Generation

```rexx
ADDRESS OPENAI
"chat message='Write a professional email requesting a meeting' max_tokens=300"

email = RESULT.content
SAY email
```

### Code Analysis

```rexx
code_snippet = "function add(a, b) { return a + b; }"

ADDRESS OPENAI
"chat message='Analyze this code: " || code_snippet || "' system='You are a code reviewer'"

SAY RESULT.content
```

### Text Classification

```rexx
review = "This product is amazing! Highly recommend it."

ADDRESS OPENAI
"chat message='Classify sentiment (positive/negative/neutral): " || review || "' max_tokens=10"

sentiment = RESULT.content
SAY "Sentiment: " || sentiment
```

### Batch Processing

```rexx
queries = ARRAY('Explain quantum computing', 'What is machine learning', 'How does AI work')

DO query OVER queries
  ADDRESS OPENAI
  "chat message='" || query || "' model='gpt-4o-mini'"

  SAY query || " => " || RESULT.content
  SAY ""
END
```

## Environment Configuration

### Using API Key

```bash
export OPENAI_API_KEY="sk-proj-xxxxx"
```

### In Script

```rexx
ADDRESS OPENAI
"chat message='Hello' api_key='sk-proj-xxxxx'"
```

## Error Handling

```rexx
ADDRESS OPENAI
LET result = chat message="Request..."

IF result.success THEN
  SAY "✓ " || result.content
ELSE IF result.error_type = 'rate_limit_error' THEN
  SAY "Rate limited, retry after " || result.retry_after
ELSE IF result.error_type = 'authentication_error' THEN
  SAY "Invalid API key"
ELSE
  SAY "Error: " || result.error
```

## Cost Management

### Token Counting

```rexx
ADDRESS OPENAI
"count_tokens text='How much will this cost?'"

tokens = RESULT.count
estimated_cost = tokens * 0.000005  -- Varies by model

SAY "Estimated tokens: " || tokens
SAY "Estimated cost: $" || estimated_cost
```

### Budget Monitoring

```rexx
-- Use max_tokens to limit costs
ADDRESS OPENAI
"chat message='Long response topic' max_tokens=50 model='gpt-4o-mini'"

SAY RESULT.content
```

## Best Practices

### ✅ Do:
- Use gpt-4o-mini for routine tasks
- Set reasonable max_tokens limits
- Cache responses for repeated queries
- Monitor API usage
- Implement error handling

### ❌ Don't:
- Hard-code API keys in source
- Send sensitive personal data
- Ignore rate limits
- Use old models unnecessarily
- Make redundant API calls

## Pricing Comparison

| Model | Input Cost | Output Cost | Speed | Use Case |
|-------|-----------|------------|-------|----------|
| gpt-4o | ✓✓ | ✓✓ | ⚡ | General purpose |
| gpt-4o-mini | ✓ | ✓ | ⚡⚡ | Quick tasks (recommended) |
| gpt-3.5-turbo | ✓ | ✓ | ⚡⚡⚡ | Cost-critical |

## Integration with Other Handlers

### With SQLite

```rexx
REQUIRE "./extras/addresses/sqlite3/sqlite-address.js"
REQUIRE "./extras/addresses/open-ai/openai-address.js"

-- Get data from database
ADDRESS SQLITE3
"SELECT * FROM feedback LIMIT 10"
feedback = RESULT

-- Analyze with GPT
ADDRESS OPENAI
"chat message='Summarize these reviews: " || feedback || "'"

summary = RESULT.content
SAY summary
```

### With File System

```rexx
-- Read file
REQUIRE "./extras/addresses/file-functions.js"
content = READFILE("document.txt")

-- Analyze with GPT
ADDRESS OPENAI
"chat message='Summarize: " || content || "' max_tokens=200"

SAY "Summary: " || RESULT.content
```

## Advanced Features

### Multi-Turn Conversation

```rexx
conversation = ARRAY()

-- First turn
ADDRESS OPENAI
"chat message='Explain neural networks' conversation_id='conv_1'"
conversation.ADD(RESULT.content)

-- Follow-up
ADDRESS OPENAI
"chat message='Can you provide code examples?' conversation_id='conv_1'"
conversation.ADD(RESULT.content)

DO response OVER conversation
  SAY response || CRLF
END
```

---

**Part of the RexxJS extras collection** - bringing OpenAI's GPT capabilities to REXX programs with clean, readable syntax.
