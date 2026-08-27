# nextjs-afk-sdk

An [agent-afk](https://github.com/griffinwork40/agent-afk) skill that integrates the `agent-afk` SDK into Next.js projects, giving you production-ready API routes for programmatic AI agent invocation.

## What It Does

Adds to any Next.js 14+ App Router project:

- **`POST /api/agent`** -- Invoke an AI agent with a prompt (and optionally a named skill)
- **`GET /api/health`** -- Health check for SDK configuration
- **Deployment config** -- Dockerfile + Railway setup, ready for production
- **Utility libraries** -- SDK configuration, structured logging

## Quick Start

### Install as an AFK Skill

```bash
# Clone into your AFK skills directory
git clone https://github.com/griffinwork40/nextjs-afk-sdk.git ~/.afk/skills/nextjs-afk-sdk
```

The skill auto-loads in all future AFK sessions. Then in any session, tell the agent:

> "Add agent-afk to this Next.js project"

### What Gets Created

```
your-nextjs-project/
├── src/
│   ├── app/api/
│   │   ├── agent/route.ts      # Main agent endpoint
│   │   └── health/route.ts     # Health check
│   └── lib/
│       ├── agentConfig.ts      # SDK configuration
│       └── logger.ts           # Structured logging
├── Dockerfile                  # Production deployment
├── railway.json                # Railway config
├── .env.example                # Environment template
└── next.config.ts              # Standalone output
```

## API Usage

### Basic Query

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is 2+2?"}'
```

```json
{"success": true, "answer": "2+2 equals 4."}
```

### With a Named Skill

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Analyze this codebase", "skillName": "diagnose"}'
```

### Request Options

```json
{
  "prompt": "Your prompt here",
  "skillName": "optional-skill-name",
  "model": "sonnet",
  "maxTurns": 30,
  "maxBudgetUsd": 0.50
}
```

## SDK Features

This skill uses three main exports from `agent-afk`:

### `queryText(prompt, opts)` -- Simple One-Shot

Returns a `Promise<string>`. Owns the full session lifecycle.

```typescript
import { queryText } from 'agent-afk';

const answer = await queryText('Explain quantum computing', {
  model: 'sonnet',
  maxBudgetUsd: 0.50,
});
```

### `query(prompt, opts)` -- Streaming

Returns an `AsyncGenerator<OutputEvent>` for real-time SSE streaming.

```typescript
import { query } from 'agent-afk';

for await (const event of query('Write a story', { model: 'sonnet' })) {
  // Stream events to client
}
```

### `queryStructured(prompt, schema, opts)` -- Typed Output

Returns a Zod-validated typed response with automatic retry on parse failure.

```typescript
import { queryStructured } from 'agent-afk';
import { z } from 'zod';

const result = await queryStructured(
  'Analyze this text',
  z.object({
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number(),
  }),
  { model: 'sonnet' }
);
```

### `tool()` -- Custom In-Process Tools

Register tools the agent can invoke during execution:

```typescript
import { queryText, tool } from 'agent-afk';
import { z } from 'zod';

const weatherTool = tool(
  'get_weather',
  'Get current weather for a city',
  z.object({ city: z.string() }),
  async ({ city }) => {
    const data = await fetch(`https://api.weather.example/${city}`).then(r => r.json());
    return { content: JSON.stringify(data) };
  },
);

const answer = await queryText('What is the weather in NYC?', {
  model: 'sonnet',
  customTools: [weatherTool],
});
```

## Deployment

### Railway (Recommended)

1. Push to GitHub
2. Create Railway project from your repo
3. Set `ANTHROPIC_API_KEY` in Railway Variables
4. Railway auto-detects the Dockerfile and deploys
5. Verify: `curl https://your-app.railway.app/api/health`

### Other Platforms

Any Docker-capable platform works (Render, Fly.io, Google Cloud Run).

**Vercel is NOT compatible** -- agent-afk requires the Node.js runtime, not Edge.

## Requirements

- Next.js 14+ with App Router
- Node.js 20+
- `ANTHROPIC_API_KEY` from [Anthropic Console](https://console.anthropic.com/)

## Why agent-afk over Claude Agent SDK?

| Feature | agent-afk | Claude Agent SDK |
|---------|-----------|-----------------|
| Simple query | `queryText(prompt)` -- one call | `query({prompt, options})` -- iterate generator |
| Structured output | `queryStructured(prompt, zodSchema)` | Not available |
| Custom tools | `tool(name, desc, schema, handler)` | Not available |
| Skill loading | Automatic | Requires `settingSources` config |
| Permission bypass | Not needed (no permission layer) | Requires `permissionMode: 'bypassPermissions'` |
| Headless mode | Not needed (no subprocess) | Requires `TERM=dumb, CI=true` env vars |

## License

MIT
