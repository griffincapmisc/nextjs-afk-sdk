---
name: nextjs-afk-sdk
description: "Integrate the agent-afk SDK into an existing Next.js project to enable programmatic AI agent invocation through API routes. Use when the user wants to add agent-afk capabilities, set up skill invocation endpoints, or configure SDK integration for Next.js applications. Works with any Next.js 14+ project with App Router."
---

# Next.js + agent-afk SDK Integration

## Overview

Integrate the `agent-afk` npm package into an existing Next.js application, enabling programmatic agent invocation through API routes. agent-afk exports `queryText`, `query`, and `queryStructured` as one-call helpers that own the full session lifecycle -- no manual session management, no permission mode configuration, no headless env vars.

**Key advantage over Claude Agent SDK:** agent-afk's API is significantly simpler. `queryText(prompt, opts)` is a single async call that returns a string. No `settingSources`, no `permissionMode`, no `TERM=dumb` ceremony.

## When to Use This Skill

Use when the user requests:
- "Add agent-afk to this Next.js project"
- "Set up API routes for AI agent invocation"
- "Integrate agent-afk SDK with Next.js"
- "Add programmatic agent execution to my app"
- "Deploy a Next.js app with agent-afk"

**Prerequisites:**
- Existing Next.js 14+ project with App Router (src/app or app directory)
- Node.js 20+ installed
- pnpm installed (or npm/yarn)
- ANTHROPIC_API_KEY available

## Workflow

Follow these phases in order.

### Phase 1: Validate Project

Verify the current directory is a valid Next.js project.

```bash
node ~/.afk/skills/nextjs-afk-sdk/scripts/validate-project.js
```

If validation fails, inform the user and ask whether to fix issues or create a new project first.

Note the app directory location (src/app vs app) for subsequent phases.

### Phase 2: Install agent-afk

```bash
pnpm add agent-afk
```

Or if pnpm is unavailable: `npm install agent-afk`

Verify installation: check package.json includes `"agent-afk"` in dependencies.

### Phase 3: Create Library Infrastructure

Create `src/lib/` (or `lib/` if app dir is at root) and copy utility files:

1. **src/lib/agentConfig.ts** -- Copy from `~/.afk/skills/nextjs-afk-sdk/assets/lib/agentConfig.ts`
   - Exports: `validateEnvironment()`, `buildQueryOptions()`, `buildSkillPrompt()`
   - Configures model, budget, and tool options

2. **src/lib/logger.ts** -- Copy from `~/.afk/skills/nextjs-afk-sdk/assets/lib/logger.ts`
   - Exports: `logInfo()`, `logError()`, `logWarn()`, `logDebug()`, `createSessionLogger()`

### Phase 4: Create API Routes

Create API routes for agent invocation and health checking:

1. **src/app/api/agent/route.ts** -- Copy from `~/.afk/skills/nextjs-afk-sdk/assets/api/agent/route.ts`
   - POST endpoint for agent invocation
   - Accepts: `{ prompt, skillName?, model?, maxTurns?, maxBudgetUsd? }`
   - Returns: `{ success, answer?, error? }`
   - **CRITICAL:** `export const runtime = 'nodejs'` -- NOT 'edge'

2. **src/app/api/health/route.ts** -- Copy from `~/.afk/skills/nextjs-afk-sdk/assets/api/health/route.ts`
   - GET endpoint for health checking
   - Validates API key and agent-afk availability

Adjust paths if app directory is at root (app/) instead of src/app/.

### Phase 5: Configure Next.js

Update `next.config.ts` to add `output: 'standalone'` (required for Docker deployment).

If no next.config.ts exists, copy from `~/.afk/skills/nextjs-afk-sdk/assets/next.config.ts`.

### Phase 6: Create Deployment Config

Copy deployment files:

1. **Dockerfile** -- Copy from `~/.afk/skills/nextjs-afk-sdk/assets/Dockerfile`
   - Multi-stage build, installs agent-afk globally
   - Copies `.afk/skills/` if present

2. **railway.json** -- Copy from `~/.afk/skills/nextjs-afk-sdk/assets/railway.json`

3. **.env.example** -- Copy from `~/.afk/skills/nextjs-afk-sdk/assets/.env.example`

### Phase 7: Configure Environment

Create `.env.local` from `.env.example` and prompt the user to add their API key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Phase 8: Update README

Add an "agent-afk Integration" section to README.md covering:

- API endpoints with request/response examples
- Environment variables
- Local development setup
- Deployment instructions (Railway)
- curl examples for testing

Example curl for the agent endpoint:
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is 2+2?"}'
```

### Phase 9: Test Locally

1. Start dev server: `pnpm dev`
2. Test health: `curl http://localhost:3000/api/health`
3. Test agent: `curl -X POST http://localhost:3000/api/agent -H "Content-Type: application/json" -d '{"prompt": "What is 2+2?"}'`

If health returns "unhealthy", check ANTHROPIC_API_KEY in .env.local and restart the dev server.

### Phase 10: Deployment Guidance

Provide Railway deployment instructions:

1. `git add . && git commit -m "Add agent-afk SDK integration" && git push`
2. Create Railway project from GitHub repo
3. Set ANTHROPIC_API_KEY in Railway Variables tab
4. Railway auto-detects Dockerfile and deploys
5. Verify: `curl https://your-app.railway.app/api/health`

**Vercel is NOT compatible** -- agent-afk requires Node.js runtime, not Edge.

## Variations

### Streaming Response (SSE)

For real-time streaming to the client, use `query()` instead of `queryText()`:

```typescript
import { query } from 'agent-afk';
import { buildQueryOptions } from '@/lib/agentConfig';

export async function POST(request: NextRequest) {
  const { prompt, model } = await request.json();
  const options = buildQueryOptions({ model });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of query(prompt, options)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

### Structured Output

For typed, validated responses using Zod:

```typescript
import { queryStructured } from 'agent-afk';
import { z } from 'zod';

const AnalysisSchema = z.object({
  summary: z.string(),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
});

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  const result = await queryStructured(
    `Analyze this text: ${text}`,
    AnalysisSchema,
    { model: 'sonnet' }
  );
  return NextResponse.json({ success: true, analysis: result });
}
```

### Custom Tools

Register in-process tools that the agent can invoke:

```typescript
import { queryText, tool } from 'agent-afk';
import { z } from 'zod';

const weatherTool = tool(
  'get_weather',
  'Get the current weather for a city',
  z.object({ city: z.string() }),
  async ({ city }) => {
    const res = await fetch(`https://api.weather.example/${city}`);
    const data = await res.json();
    return { content: JSON.stringify(data) };
  },
);

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();
  const answer = await queryText(prompt, {
    model: 'sonnet',
    customTools: [weatherTool],
  });
  return NextResponse.json({ success: true, answer });
}
```

## Technical Notes

**Why agent-afk over Claude Agent SDK:**
- `queryText()` is a single async call -- no generator iteration needed for simple cases
- `queryStructured()` gives typed Zod-validated responses with automatic retry
- `tool()` enables custom in-process tools -- Claude Agent SDK has no equivalent
- No `settingSources` config -- skills auto-load from `~/.afk/skills/` and `<cwd>/.afk/`
- No `permissionMode` -- no interactive permission layer exists
- No headless env vars -- no subprocess or terminal to suppress

**Models:**
- `sonnet` -- Recommended (balanced speed/capability)
- `haiku` -- Faster, lower cost
- `opus` -- Most capable, higher cost

**Security:**
- Never commit .env.local or API keys
- Rate-limit /api/agent before production (agent calls are expensive)
- API routes are server-side only -- keys never reach the client

**Performance:**
- First request may be slow (cold start)
- `maxBudgetUsd` caps spend per request (default $0.50)
- Use haiku for simple tasks, sonnet for complex ones
