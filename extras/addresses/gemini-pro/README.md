# Gemini Pro ADDRESS Library for RexxJS

Advanced Google Gemini Pro integration for RexxJS, providing access to Gemini's most capable models with enhanced features and fine-tuning support.

## Installation

**Requirements:**
- Google Cloud Project with Gemini API enabled
- Service account credentials or API key
- `@google-cloud/generative-ai` npm package

```bash
npm install @google-cloud/generative-ai
```

## Quick Start

### Advanced Text Generation

```rexx
REQUIRE "./extras/addresses/gemini-pro/gemini-pro-address.js"

ADDRESS GEMINI_PRO
"message text='Explain quantum entanglement' model='gemini-pro-vision' max_tokens=1000"

SAY RESULT
```

### With Vision (Image Analysis)

```rexx
ADDRESS GEMINI_PRO
"analyze image_url='https://example.com/image.jpg' prompt='What is in this image?'"

SAY RESULT.analysis
```

## Core Methods

### `message text="<prompt>"`
Advanced message generation with Pro-tier features.

**Parameters:**
- `text` (string, required) - The prompt
- `model` (string, optional) - Model choice (default: gemini-pro)
- `temperature` (number, optional) - Creativity level (0.0-2.0)
- `max_tokens` (number, optional) - Response length (default: 2048)
- `top_p` (number, optional) - Diversity control (0.0-1.0)
- `top_k` (number, optional) - Token selection (1-40)
- `system_prompt` (string, optional) - System context

**Returns:**
- `success` (boolean) - Request successful
- `content` (string) - Generated content
- `model` (string) - Model used
- `finish_reason` (string) - Generation stop reason
- `usage` (object) - Detailed token usage

### `analyze image_url="<url>" prompt="<prompt>"`
Analyze images with Gemini Pro Vision.

**Parameters:**
- `image_url` (string, required) - URL to image
- `prompt` (string, required) - Analysis prompt
- `detail_level` (string, optional) - low, medium, high

**Returns:**
- `success` (boolean) - Analysis successful
- `analysis` (string) - Image analysis result
- `entities` (array) - Detected objects/entities
- `confidence` (number) - Confidence level

### `batch_process texts="[...]"`
Process multiple prompts efficiently.

**Parameters:**
- `texts` (array, required) - Array of prompts to process
- `model` (string, optional) - Model to use
- `concurrent` (number, optional) - Concurrent requests

**Returns:**
- `success` (boolean) - Batch successful
- `results` (array) - Results for each prompt
- `total_tokens` (number) - Combined token usage

## Available Models

- `gemini-pro` - Text-only, most capable
- `gemini-pro-vision` - Multimodal with image understanding
- `gemini-1.5-pro` - Latest Pro model

## Usage Examples

### Image Analysis Pipeline

```rexx
ADDRESS GEMINI_PRO
"analyze image_url='https://example.com/photo.jpg' prompt='Describe what you see' detail_level='high'"

result = RESULT
SAY "Objects detected: " || RESULT.entities.COUNT
DO item OVER RESULT.entities
  SAY "  - " || item.name || " (" || item.confidence || "%)"
END
```

### Batch Text Analysis

```rexx
texts = ARRAY('Analyze this review...', 'Summarize this article...', 'Translate this text...')

ADDRESS GEMINI_PRO
"batch_process texts='" || JSON(texts) || "' concurrent=3"

DO result OVER RESULT.results
  SAY result.content
END
```

### Complex Reasoning

```rexx
ADDRESS GEMINI_PRO
"message text='Solve this logic puzzle: If all roses are flowers, and some flowers fade quickly, can we conclude some roses fade quickly?' temperature=0.5"

SAY "Analysis: " || RESULT.content
```

### Multi-Turn Conversation

```rexx
ADDRESS GEMINI_PRO
"message text='What is machine learning?' system_prompt='You are an AI tutor'"
first = RESULT.content

ADDRESS GEMINI_PRO
"message text='Give real-world examples' system_prompt='You are an AI tutor' context='" || first || "'"
second = RESULT.content

SAY first
SAY second
```

## Advanced Configuration

### Fine-Tuning Support

```rexx
ADDRESS GEMINI_PRO
"tune model_name='my-custom-model' training_data=training_file.jsonl epochs=3"

SAY "Model created: " || RESULT.model_id
```

### Token Management

```rexx
ADDRESS GEMINI_PRO
"count_tokens text='Long document content...'"

tokens = RESULT.tokens
cost = tokens * 0.0001  -- Cost per token varies by model

SAY "Estimated tokens: " || tokens
SAY "Estimated cost: $" || cost
```

## Security & Authentication

### Using Service Account

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### API Key Method

```rexx
ADDRESS GEMINI_PRO
"message text='Hello' api_key='AIza...'"
```

## Error Handling

```rexx
ADDRESS GEMINI_PRO
LET result = message text="Request..."

IF result.success THEN
  SAY "✓ " || result.content
ELSE IF result.rate_limited THEN
  SAY "Rate limited, retry after " || result.retry_after || " seconds"
ELSE IF result.invalid_input THEN
  SAY "Invalid request: " || result.error
ELSE
  SAY "Error: " || result.error
```

## Performance Tips

1. **Batch Processing**: Use batch_process for multiple requests
2. **Model Selection**: Choose appropriate model for task complexity
3. **Temperature**: Lower for factual, higher for creative
4. **Token Budget**: Plan token usage to stay within quotas
5. **Caching**: Cache common responses

## Integration Examples

### With Document Processing

```rexx
REQUIRE "./extras/addresses/file-functions.js"
REQUIRE "./extras/addresses/gemini-pro/gemini-pro-address.js"

-- Read document
document = READFILE("report.pdf")

ADDRESS GEMINI_PRO
"message text='Summarize: " || document || "' max_tokens=500"

SAY RESULT.content
```

### Multi-Model Pipeline

```rexx
-- Use Gemini Pro for complex analysis
ADDRESS GEMINI_PRO
"message text='Complex analysis task here'"
analysis = RESULT.content

-- Fall back to standard Gemini if needed
IF analysis.error THEN
  ADDRESS GEMINI
  "message text='Fallback task'"
END
```

## Best Practices

### ✅ Do:
- Use appropriate models for task complexity
- Implement exponential backoff for rate limits
- Monitor token usage and costs
- Cache results for repeated queries
- Test with smaller batches first

### ❌ Don't:
- Leave API keys in source code
- Ignore rate limit responses
- Send unencrypted sensitive data
- Use unnecessarily high token limits
- Exceed quota without monitoring

## Costs & Quotas

Gemini Pro pricing:
- Input tokens: ~$0.005 per 1M
- Output tokens: ~$0.015 per 1M
- Image analysis: Additional per image cost

Monitor usage in Google Cloud Console.

---

**Part of the RexxJS extras collection** - accessing Google's most advanced AI through REXX programs.
