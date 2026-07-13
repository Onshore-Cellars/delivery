// Shared types for the autonomous operations layer.

export type Team = 'SUPPORT' | 'OPS' | 'MARKETING' | 'FINANCE' | 'IT' | 'GROWTH' | 'COMPLIANCE'

export const TEAMS: Team[] = ['SUPPORT', 'OPS', 'MARKETING', 'FINANCE', 'IT', 'GROWTH', 'COMPLIANCE']

/** A proposal an agent wants a human (or policy) to approve before it runs. */
export interface ProposedTask {
  team: Team
  kind: string
  title: string
  summary: string
  reasoning?: string
  confidence?: number // 0..1
  payload?: Record<string, unknown>
  relatedType?: string
  relatedId?: string
  /** While an open task with this key exists, the same thing isn't re-proposed. */
  dedupeKey?: string
}

/** Prior human decisions for a kind, passed to run() so agents improve. */
export interface DecisionExample {
  title: string
  summary: string
  decision: 'APPROVED' | 'REJECTED'
  feedback?: string | null
}

export interface RunContext {
  /** Recent human decisions for this agent's kind(s), newest first. */
  recentDecisions: DecisionExample[]
}

export interface ExecutionOutcome {
  ok: boolean
  result?: string
  error?: string
}

export interface Agent {
  team: Team
  kind: string
  label: string
  description: string
  /**
   * Hard safety rail: guarded agents move money or contact customers and can
   * NEVER be auto-approved — every proposal requires an explicit human
   * decision, regardless of any AgentPolicy row. Enforced in runAgents() and
   * the policy API (belt and braces).
   */
  guarded?: boolean
  /** Inspect the platform and return proposals (no side-effects here). */
  run(ctx: RunContext): Promise<ProposedTask[]>
  /** Perform the approved action. Only called after approval / auto-approval. */
  execute(payload: Record<string, unknown>): Promise<ExecutionOutcome>
}
