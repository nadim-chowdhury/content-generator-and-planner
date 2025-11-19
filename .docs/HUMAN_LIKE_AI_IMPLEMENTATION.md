# Human-Like AI & Multiple API Keys Implementation

## Overview

This implementation makes all AI-generated content sound more human and natural, while supporting multiple OpenAI API keys for load balancing and rate limit management.

## Key Features

### 1. Human-Like Content Generation
- **Natural Language Prompts**: All system prompts rewritten to sound conversational and authentic
- **Higher Temperature**: Increased from 0.7-0.8 to 0.85-0.9 for more creative, human-like responses
- **Authentic Tone**: Prompts explicitly instruct AI to write "like a real person" and avoid robotic language
- **Realistic Expectations**: Prompts emphasize being honest and realistic, not inflating numbers

### 2. Multiple API Key Support
- **Automatic Key Rotation**: Round-robin selection across all available keys
- **Health Monitoring**: Tracks errors and rate limits per key
- **Automatic Failover**: Switches to next key on errors or rate limits
- **Key Recovery**: Automatically reactivates keys after cooldown periods
- **Load Balancing**: Distributes requests evenly across all keys

## Implementation Details

### Centralized OpenAI Service

**Location**: `backend/src/common/openai/openai.service.ts`

**Features**:
- Manages multiple API keys from environment variables
- Automatic rotation and failover
- Rate limit handling
- Error tracking and recovery
- Human-like prompt transformation

### Environment Variables

```bash
# Primary API key (required)
OPENAI_API_KEY="sk-..."

# Additional API keys (optional, comma or space separated)
OPENAI_API_KEYS="sk-...,sk-...,sk-..."

# Model to use (default: gpt-4o)
OPENAI_MODEL="gpt-4o"
```

### Updated Services

All services now use the centralized `OpenAIService`:

1. **IdeasService** - Content idea generation
2. **AiToolsService** - All AI tools (script, rewrite, optimize, etc.)
3. **PredictionService** - Engagement predictions
4. **AiTasksService** - Kanban task generation
5. **PostingTimeSuggestionsService** - Optimal posting times

### Human-Like Prompt Examples

**Before**:
```
You are an expert content idea generator for social media creators. 
Generate exactly 10 comprehensive content ideas in JSON format.
```

**After**:
```
I'm a content creator working on Instagram in the fitness niche. 
I need 10 fresh, creative content ideas that will really connect with my audience.

Each idea should feel authentic and natural - like it came from a real person, not AI.
Write everything naturally - like you're a real creator brainstorming ideas, 
not an AI generating content. Make it feel authentic and human.
```

## Benefits

### Human-Like Content
- ✅ Content sounds natural and conversational
- ✅ Avoids robotic or overly formal language
- ✅ More engaging and relatable to audiences
- ✅ Authentic tone throughout

### Multiple API Keys
- ✅ Higher throughput (distribute across keys)
- ✅ Better rate limit handling
- ✅ Automatic failover on errors
- ✅ No single point of failure
- ✅ Cost optimization (use multiple accounts)

## Usage

The service automatically:
1. Loads all API keys from environment variables
2. Rotates between keys for each request
3. Monitors key health and errors
4. Switches keys on rate limits or errors
5. Recovers keys after cooldown periods

No code changes needed - just configure multiple keys in environment variables.

## Monitoring

You can check API key statistics:
```typescript
const stats = openaiService.getApiKeyStats();
// Returns array with usage stats for each key
```

## Example Configuration

```bash
# .env file
OPENAI_API_KEY="sk-primary-key-here"
OPENAI_API_KEYS="sk-key-2,sk-key-3,sk-key-4"
OPENAI_MODEL="gpt-4o"
```

The system will automatically use all 4 keys, rotating between them for optimal performance.

