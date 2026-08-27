/**
 * agent-afk SDK configuration builder.
 *
 * Unlike the Claude Agent SDK, agent-afk's query helpers (queryText, query,
 * queryStructured) own the full session lifecycle -- construct, stream, close.
 * No settingSources, permissionMode, or headless env vars needed.
 */
import type { QueryOptions } from 'agent-afk';

/** Default model for API route invocations. */
export const DEFAULT_MODEL = 'sonnet';

/** Default max budget per request (USD). */
export const DEFAULT_MAX_BUDGET_USD = 0.50;

/** Default max turns per request. */
export const DEFAULT_MAX_TURNS = 30;

/** Validate that the required environment variables are set. */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    errors.push('ANTHROPIC_API_KEY is not set');
  }

  return { valid: errors.length === 0, errors };
}

/** Build QueryOptions from request parameters. */
export function buildQueryOptions(opts?: {
  model?: string;
  maxTurns?: number;
  maxBudgetUsd?: number;
  allowedTools?: string[];
}): QueryOptions {
  const options: QueryOptions = {
    model: opts?.model ?? DEFAULT_MODEL,
    maxBudgetUsd: opts?.maxBudgetUsd ?? DEFAULT_MAX_BUDGET_USD,
  };

  if (opts?.maxTurns) {
    options.maxTurns = opts.maxTurns;
  }

  if (opts?.allowedTools) {
    options.tools = { allowedTools: opts.allowedTools };
  }

  return options;
}

/**
 * Build a prompt that invokes a named skill.
 * agent-afk's skill router recognizes natural-language directives
 * and slash-command patterns.
 */
export function buildSkillPrompt(skillName: string, userPrompt: string): string {
  return `Use the ${skillName} skill to: ${userPrompt}`;
}
