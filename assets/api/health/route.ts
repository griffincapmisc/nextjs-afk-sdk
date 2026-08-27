/**
 * GET /api/health -- Health check for agent-afk integration.
 *
 * Validates: API key configured, agent-afk importable.
 */
import { NextResponse } from 'next/server';
import { validateEnvironment } from '@/lib/agentConfig';

export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, boolean | string> = {};
  const errors: string[] = [];

  // Check API key
  const env = validateEnvironment();
  checks.apiKey = env.valid;
  if (!env.valid) errors.push(...env.errors);

  // Check agent-afk is importable
  try {
    const afk = await import('agent-afk');
    checks.agentAfk = typeof afk.queryText === 'function';
  } catch {
    checks.agentAfk = false;
    errors.push('agent-afk package not importable');
  }

  const status = errors.length === 0 ? 'healthy' : 'unhealthy';

  return NextResponse.json({
    status,
    checks,
    ...(errors.length > 0 && { errors }),
    timestamp: new Date().toISOString(),
  });
}
