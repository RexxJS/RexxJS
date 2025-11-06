# Google Gemini ADDRESS Library for RexxJS

This library provides Google Gemini AI integration for RexxJS through the ADDRESS mechanism, enabling REXX programs to leverage Google's advanced LLM capabilities.

## Installation

**Requirements:**
- Google API key (get one at https://ai.google.dev)
- `@google/generative-ai` npm package

```bash
npm install @google/generative-ai
```

## Quick Start

### Basic Text Generation

```rexx
REQUIRE "./extras/addresses/gemini-address/gemini-address.js"

ADDRESS GEMINI
"message text='Write a creative story about a robot' max_length=500"

SAY RESULT  -- Outputs: Gemini's generated story
```

### With Model Selection

```rexx
ADDRESS GEMINI
"message text='Solve this math problem: 5x + 10 = 50' model='gemini-2.0-flash'"

SAY RESULT
```

## Core Methods

### `message text="<prompt>"`
Send a message to Gemini for text generation.

**Parameters:**
- `text` (string, required) - The prompt/message
- `model` (string, optional) - Gemini model version (default: gemini-2.0-flash)
- `temperature` (number, optional) - Randomness (0.0-2.0, default: 1.0)
- `max_length` (number, optional) - Maximum response length (default: 2048)
- `system_prompt` (string, optional) - System context

**Returns:**
- `success` (boolean) - Request success
- `content` (string) - Gemini's response
- `model` (string) - Model used
- `finish_reason` (string) - Why generation stopped
- `usage` (object) - Token statistics

### `count_tokens text="<text>"`
Estimate tokens without making an API call.

**Returns:**
- `success` (boolean) - Operation success
- `tokens` (number) - Estimated token count

## Available Models

- `gemini-2.0-flash` - Latest, fastest model (recommended)
- `gemini-1.5-pro` - Most capable, better for complex tasks
- `gemini-1.5-flash` - Faster, lower cost
- `gemini-pro` - Standard model

## Usage Examples

### Content Analysis

```rexx
ADDRESS GEMINI
"message text='Analyze the sentiment of this review: The product is amazing but the shipping was slow' system_prompt='You are a sentiment analysis expert'"

SAY "Sentiment: " || RESULT.content
```

### Code Generation

```rexx
ADDRESS GEMINI
"message text='Generate JavaScript code for a simple TODO app' model='gemini-2.0-flash' max_length=1000"

SAY RESULT.content
```

### Summarization

```rexx
long_text = "Long article content here..."

ADDRESS GEMINI
"message text='Summarize in 3 bullet points: " || long_text || "' max_length=200"

SAY "Summary: " || RESULT.content
```

### Translation

```rexx
ADDRESS GEMINI
"message text='Translate to Spanish: Hello, how are you?' system_prompt='You are a translator. Respond only with the translation.'"

SAY RESULT.content
```

## Environment Configuration

Set your API key via environment variable:

```bash
export GOOGLE_API_KEY="AIza..."
```

Or in your REXX script:

```rexx
ADDRESS GEMINI
"message text='Hello' api_key='AIza...'"
```

## Error Handling

```rexx
ADDRESS GEMINI
LET result = message text="What is 2+2?"

IF result.success THEN
  SAY "✓ Response: " || result.content
ELSE
  SAY "❌ Error: " || result.error
```

## Cost Optimization

- Gemini API has free tier with quota limits
- Use `count_tokens` to estimate costs
- Reuse model instances for multiple requests
- Cache responses for common queries

## Safety & Filtering

Gemini includes built-in safety filtering:

```rexx
ADDRESS GEMINI
"message text='Dangerous request' model='gemini-2.0-flash'"

IF result.blocked = true THEN
  SAY "Request blocked by safety filter"
```

## Integration with Other Handlers

```rexx
REQUIRE "./src/expectations-address.js"
REQUIRE "./extras/addresses/gemini-address/gemini-address.js"

ADDRESS GEMINI
"message text='Write a haiku' max_length=50"

ADDRESS EXPECTATIONS
"{RESULT.success} should equal true"
```

## Best Practices

### ✅ Do:
- Provide clear, specific prompts
- Use system prompts for consistent behavior
- Monitor token usage
- Implement error handling
- Cache responses when appropriate

### ❌ Don't:
- Hard-code API keys in scripts
- Use generic vague prompts
- Ignore rate limits
- Send sensitive information
- Exceed quota without monitoring

## Limitations

- API rate limits vary by tier
- Maximum input/output token limits
- Knowledge cutoff date for training data
- Some regions may have restrictions

## Advantages Over Competitors

| Feature | Gemini | Others |
|---------|--------|--------|
| Speed | ⚡ Very fast | Varies |
| Free tier | ✅ Generous | Limited |
| Cost | 💰 Competitive | Higher |
| Accuracy | 🎯 Excellent | Good |
| Integration | 🔗 Easy | Varies |

---

**Part of the RexxJS extras collection** - bringing Google Gemini's capabilities to REXX programs.
