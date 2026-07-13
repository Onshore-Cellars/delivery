import prisma from '@/lib/prisma'
import type { Agent, Team, DecisionExample, ExecutionOutcome } from './types'
import { opsAgents } from './ops'
import { supportAgents } from './support'
import { marketingAgents } from './marketing'
import { financeAgents } from './finance'
import { itAgents } from './it'
import { growthAgents } from './growth'
import { complianceAgents } from './compliance'

export * from './types'

export const AGENTS: Agent[] = [...opsAgents, ...supportAgents, ...marketingAgents, ...financeAgents, ...itAgents, ...growthAgents, ...complianceAgents]

export function findAgent(team: string, kind: string): Agent | undefined {
  return AGENTS.find(a => a.team === team && a.kind === kind)
}

/** Recent human decisions for a kind — the training signal fed back to run(). */
async function recentDecisions(team: string, kind: string, take = 8): Promise<DecisionExample[]> {
  const rows = await prisma.agentTask.findMany({
    where: { team, kind, status: { in: ['APPROVED', 'REJECTED', 'EXECUTED', 'FAILED'] } },
    orderBy: { decidedAt: 'desc' },
    take,
    select: { title: true, summary: true, status: true, feedback: true },
  })
  return rows.map(r => ({
    title: r.title, summary: r.summary,
    decision: (r.status === 'REJECTED' ? 'REJECTED' : 'APPROVED') as 'APPROVED' | 'REJECTED',
    feedback: r.feedback,
  }))
}

async function policyFor(team: string, kind: string) {
  const p = await prisma.agentPolicy.findUnique({ where: { key: `${team}:${kind}` } })
  return { autoApprove: p?.autoApprove ?? false, minConfidence: p?.minConfidence ?? 0.85 }
}

/** Execute an approved task via its agent. */
export async function executeAgentTask(taskId: string): Promise<ExecutionOutcome> {
  const task = await prisma.agentTask.findUnique({ where: { id: taskId } })
  if (!task) return { ok: false, error: 'Task not found' }
  // Only execute a task that was actually approved — a latent guard so this can
  // never run for a REJECTED/EXECUTED/FAILED task even if a caller slips up.
  if (!['APPROVED', 'AUTO_APPROVED'].includes(task.status)) {
    return { ok: false, error: `Task is not approved (status ${task.status})` }
  }
  const agent = findAgent(task.team, task.kind)
  if (!agent) return { ok: false, error: `No agent for ${task.team}:${task.kind}` }
  let payload: Record<string, unknown> = {}
  try { payload = JSON.parse(task.payload || '{}') } catch { /* ignore */ }

  const outcome: ExecutionOutcome = await agent.execute(payload).catch((e): ExecutionOutcome => ({ ok: false, error: e instanceof Error ? e.message : 'Execution threw' }))
  await prisma.agentTask.update({
    where: { id: taskId },
    data: {
      status: outcome.ok ? 'EXECUTED' : 'FAILED',
      executedAt: new Date(),
      executionResult: outcome.result ?? null,
      error: outcome.error ?? null,
    },
  })
  return outcome
}

export interface RunSummary { proposed: number; created: number; autoExecuted: number; skipped: number }

/**
 * Run every agent (optionally filtered by team). Creates PENDING tasks, or
 * AUTO_APPROVED-then-executed tasks where policy allows and confidence clears
 * the bar. Deduplicates against still-open proposals.
 */
export async function runAgents(teams?: Team[]): Promise<RunSummary> {
  const agents = teams ? AGENTS.filter(a => teams.includes(a.team)) : AGENTS
  const summary: RunSummary = { proposed: 0, created: 0, autoExecuted: 0, skipped: 0 }

  for (const agent of agents) {
    let proposals: Awaited<ReturnType<Agent['run']>> = []
    try {
      proposals = await agent.run({ recentDecisions: await recentDecisions(agent.team, agent.kind) })
    } catch (e) {
      console.error(`Agent ${agent.team}:${agent.kind} run failed:`, e)
      continue
    }
    const policy = await policyFor(agent.team, agent.kind)

    for (const p of proposals) {
      summary.proposed++
      // Dedupe: skip if an open task with the same key already exists.
      if (p.dedupeKey) {
        const open = await prisma.agentTask.findFirst({
          where: { dedupeKey: p.dedupeKey, status: { in: ['PENDING', 'APPROVED', 'AUTO_APPROVED'] } },
          select: { id: true },
        })
        if (open) { summary.skipped++; continue }
      }

      const confidence = p.confidence ?? 0.6
      // Guarded agents (money-moving / customer-contact) can never auto-run,
      // even if a policy row says autoApprove — the flag is a hard rail.
      const auto = !agent.guarded && policy.autoApprove && confidence >= policy.minConfidence

      const task = await prisma.agentTask.create({
        data: {
          team: p.team, kind: p.kind, title: p.title, summary: p.summary,
          reasoning: p.reasoning ?? '', confidence, payload: JSON.stringify(p.payload ?? {}),
          relatedType: p.relatedType ?? null, relatedId: p.relatedId ?? null, dedupeKey: p.dedupeKey ?? null,
          status: auto ? 'AUTO_APPROVED' : 'PENDING',
          decidedAt: auto ? new Date() : null,
        },
      })
      summary.created++
      if (auto) {
        await executeAgentTask(task.id)
        summary.autoExecuted++
      }
    }
  }
  return summary
}
