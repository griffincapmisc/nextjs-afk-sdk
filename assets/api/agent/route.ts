/**
 * POST /api/agent -- Invoke agent-afk programmatically.
 *
 * Accepts: { prompt, skillName?, model?, maxTurns?, maxBudgetUsd? }
 * Returns: { success, answer?, error? }
 *
 * For streaming, see the SSE variation in the skill's SKILL.md.
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryText } from 'agent-afk';
import { validateEnvironment, buildQueryOptions, buildSkillPrompt } from '@/lib/agentConfig';
import { logInfo, logError } from '@/lib/logger';

// CRITICAL: Must be 'nodejs' -- agent-afk requires Node.js runtime, not Edge
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  const reqId = crypto.randomUUID().slice(0, 8);

  try {
    // Validate environment
    const env = validateEnvironment();
    if (!env.valid) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error', details: env.errors },
        { status: 500 }
      );
    }

    // Parse request
    const body = await request.json();
    const { prompt, skillName, model, maxTurns, maxBudgetUsd, allowedTools } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'prompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (prompt.length > 100_000) {
      return NextResponse.json(
        { success: false, error: 'prompt exceeds 100KB limit' },
        { status: 400 }
      );
    }

    logInfo('agent', `Request ${reqId}`, { skillName, model, promptLength: prompt.length });

    // Build the final prompt (with optional skill invocation)
    const finalPrompt = skillName
      ? buildSkillPrompt(skillName, prompt)
      : prompt;

    // Build options
    const options = buildQueryOptions({ model, maxTurns, maxBudgetUsd, allowedTools });

    // Execute -- queryText owns the full session lifecycle
    const answer = await queryText(finalPrompt, options);

    logInfo('agent', `Request ${reqId} complete`, { answerLength: answer.length });

    return NextResponse.json({ success: true, answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logError('agent', `Request ${reqId} failed`, { error: message });

    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : message,
      },
      { status: 500 }
    );
  }
}
