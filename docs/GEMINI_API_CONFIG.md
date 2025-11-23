# Gemini API Configuration - GenovaAI

## Overview
GenovaAI mendukung berbagai model Gemini dari Google AI, termasuk model terbaru Gemini 3 dan Gemini 2.5 series.

## Supported Models

### Gemini 3 Series (Latest - November 2025)

#### Gemini 3 Pro Preview
- **Model Code**: `gemini-3-pro-preview`
- **Best For**: Complex tasks requiring advanced reasoning across modalities
- **Context Window**: 1M input / 64k output
- **Knowledge Cutoff**: January 2025
- **Features**: 
  - State-of-the-art reasoning
  - Multimodal understanding
  - Agentic workflows
  - Thinking levels (low/high)
- **Pricing**: $2/$12 per 1M tokens (<200k), $4/$18 (>200k)

#### Gemini 3 Pro Image Preview
- **Model Code**: `gemini-3-pro-image-preview`
- **Best For**: Image generation and editing
- **Context Window**: 65k input / 32k output
- **Pricing**: $2 text input / $0.134 per image

### Gemini 2.5 Series (June-July 2025)

#### Gemini 2.5 Pro
- **Model Code**: `gemini-2.5-pro`
- **Best For**: Advanced reasoning, large datasets, complex code analysis
- **Context Window**: 1M input / 64k output
- **Features**:
  - Advanced thinking
  - Code execution
  - Function calling
  - Google Search grounding
- **Free Tier**: Not available

#### Gemini 2.5 Flash
- **Model Code**: `gemini-2.5-flash`
- **Best For**: Best price-performance ratio, high-volume tasks
- **Context Window**: 1M input / 64k output
- **Features**:
  - Fast response
  - Thinking enabled by default
  - Agentic use cases
- **Free Tier**: 15 RPM, 1M TPM, 1.5K RPD

#### Gemini 2.5 Flash-Lite
- **Model Code**: `gemini-2.5-flash-lite`
- **Best For**: Ultra-fast, cost-efficient high-throughput tasks
- **Context Window**: 1M input / 64k output
- **Free Tier**: 15 RPM, 1M TPM, 1.5K RPD

### Gemini 2.0 Series

#### Gemini 2.0 Flash
- **Model Code**: `gemini-2.0-flash-exp`
- **Best For**: Second generation workhorse
- **Context Window**: 1M tokens
- **Free Tier**: Available

### Legacy Models (1.5 Series)

#### Gemini 1.5 Pro
- **Model Code**: `gemini-1.5-pro-latest`
- **Context Window**: 2M tokens
- **Status**: Still supported but consider migrating to 2.5/3

#### Gemini 1.5 Flash
- **Model Code**: `gemini-1.5-flash-latest`
- **Context Window**: 1M tokens
- **Status**: Still supported but consider migrating to 2.5/3

## Model Selection Guide

### For Extension Users

| Use Case | Recommended Model | Mode |
|----------|------------------|------|
| Quick Q&A | gemini-2.5-flash-lite | Free (User Key/Pool) |
| Standard quiz assistance | gemini-2.5-flash | Free (User Key/Pool) |
| Complex reasoning | gemini-2.5-pro | Premium |
| Advanced multimodal | gemini-3-pro-preview | Premium |
| Image generation | gemini-3-pro-image-preview | Premium |

### Configuration in Extension Session

```typescript
// Default session configuration
{
  "requestMode": "free_pool",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "answerMode": "short"
}

// Premium configuration
{
  "requestMode": "premium",
  "provider": "gemini",
  "model": "gemini-3-pro-preview",
  "answerMode": "long"
}
```

## Thinking Configuration

### Gemini 3 Models

Gemini 3 uses `thinkingLevel` parameter:

```typescript
// Low thinking (faster, less cost)
{
  "thinkingConfig": {
    "thinkingLevel": "low"
  }
}

// High thinking (default, better reasoning)
{
  "thinkingConfig": {
    "thinkingLevel": "high"
  }
}
```

### Gemini 2.5 Models

Gemini 2.5 uses `thinkingBudget` parameter:

```typescript
// Disable thinking (faster)
{
  "thinkingConfig": {
    "thinkingBudget": 0
  }
}

// Enable thinking (default)
{
  "thinkingConfig": {
    "thinkingBudget": 8192
  }
}
```

## API Endpoints

### Get Available Models
```
GET /api/customer/genovaai/models
```

**Response:**
```json
{
  "success": true,
  "data": {
    "free": [
      {
        "code": "gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "provider": "gemini",
        "contextWindow": 1048576,
        "tier": "free"
      },
      {
        "code": "gemini-2.5-flash-lite",
        "name": "Gemini 2.5 Flash-Lite",
        "provider": "gemini",
        "contextWindow": 1048576,
        "tier": "free"
      }
    ],
    "premium": [
      {
        "code": "gemini-3-pro-preview",
        "name": "Gemini 3 Pro Preview",
        "provider": "gemini",
        "contextWindow": 1048576,
        "tier": "premium",
        "creditsPerRequest": 2
      },
      {
        "code": "gemini-2.5-pro",
        "name": "Gemini 2.5 Pro",
        "provider": "gemini",
        "contextWindow": 1048576,
        "tier": "premium",
        "creditsPerRequest": 1
      }
    ]
  }
}
```

### Update Session Model
```
PUT /api/customer/genovaai/sessions/{sessionId}
```

**Request Body:**
```json
{
  "model": "gemini-3-pro-preview",
  "requestMode": "premium"
}
```

## Free Tier Limits

### Per-Model Limits (with Google AI Studio API Key)

| Model | RPM | TPM | TPD |
|-------|-----|-----|-----|
| gemini-2.5-flash | 15 | 1M | 1.5K |
| gemini-2.5-flash-lite | 15 | 1M | 1.5K |
| gemini-2.0-flash-exp | 15 | 1M | 1.5K |
| gemini-1.5-flash | 15 | 1M | 1.5K |
| gemini-1.5-pro | 2 | 32K | 50 |

**RPM**: Requests per minute  
**TPM**: Tokens per minute  
**TPD**: Requests per day

## Environment Variables

```env
# Gemini API (for premium mode if not using OpenRouter)
GEMINI_API_KEY="your-gemini-api-key"

# OpenRouter (alternative for premium models)
OPENROUTER_API_KEY="your-openrouter-api-key"
```

## Migration Guide

### From Gemini 1.5 to 2.5

**Changes:**
- Default model: `gemini-1.5-flash` → `gemini-2.5-flash`
- Thinking is enabled by default in 2.5
- Better reasoning capabilities
- Same context window (1M tokens)

**Update Session:**
```sql
UPDATE "ExtensionSession" 
SET model = 'gemini-2.5-flash' 
WHERE model = 'gemini-1.5-flash';
```

### From Gemini 2.5 to 3.0

**Changes:**
- New thinking level system (low/high)
- Temperature should stay at default (1.0)
- Better multimodal understanding
- State-of-the-art reasoning

**Considerations:**
- Gemini 3 is premium only (no free tier)
- Higher pricing but better quality
- Recommended for complex tasks

## Prompting Best Practices

### For Gemini 3 Models

1. **Be concise**: Direct instructions work best
2. **System instructions**: Use clear system prompts
3. **Context placement**: Put data first, questions last
4. **Temperature**: Keep at default 1.0

```typescript
// Good prompt for Gemini 3
{
  "systemPrompt": "You are a quiz assistant.",
  "question": "Based on the course material above, create 5 multiple choice questions."
}

// Avoid overly verbose prompts
{
  "systemPrompt": "You are an extremely helpful, detailed, thorough...",
  "question": "Please carefully read and analyze..."
}
```

### For Gemini 2.5 Models

1. **Thinking control**: Disable for simple tasks
2. **Temperature**: Can be adjusted (0.0-2.0)
3. **Context management**: Use knowledge files effectively

## Credit Costs

| Model | Credits per Request |
|-------|-------------------|
| gemini-3-pro-preview | 2 credits |
| gemini-2.5-pro | 1 credit |
| gemini-2.5-flash | Free (with API key) |
| gemini-2.5-flash-lite | Free (with API key) |

## Rate Limiting

### Free Mode (User Key)
- Limited by Google's free tier per API key
- Pool mode rotates through available keys

### Premium Mode
- No rate limiting
- Limited by user credits
- Priority processing

## Troubleshooting

### Model Not Available
```json
{
  "success": false,
  "error": "Model gemini-3-pro-preview requires premium mode"
}
```
**Solution**: Switch to premium mode or use a free-tier model

### Rate Limit Exceeded
```json
{
  "success": false,
  "error": "Rate limit exceeded on all available keys"
}
```
**Solution**: Wait or upgrade to premium mode

### Invalid Model Name
```json
{
  "success": false,
  "error": "Model not found"
}
```
**Solution**: Check model code spelling and availability

## Resources

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Model Pricing](https://ai.google.dev/pricing)
- [Google AI Studio](https://aistudio.google.com/)

## Support

For model-specific issues:
- Check Google AI Studio for model status
- Verify API key permissions
- Review rate limits in dashboard
