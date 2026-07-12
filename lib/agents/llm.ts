import { askJSON, aiEnabled, AI_MODEL } from '@/lib/ai'
import type { DecisionExample } from './types'

export { aiEnabled }

/**
 * Turn recent human decisions into a learning block for the system prompt, so
 * the agent's proposals visibly bend toward what the operator approves and away
 * from what they reject. This is the feedback loop, expressed as few-shot text.
 */
export function learningBlock(decisions: DecisionExample[]): string {
  if (!decisions.length) return ''
  const lines = decisions.slice(0, 8).map(d => {
    const verdict = d.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED'
    const fb = d.feedback ? ` — operator note: "${d.feedback}"` : ''
    return `- [${verdict}] ${d.title}${fb}`
  })
  return `\n\nLEARN FROM PAST DECISIONS (the operator's judgement — match approvals, avoid what was rejected):\n${lines.join('\n')}`
}

/**
 * Ask the model for a JSON object, folding in the learning block. Returns null
 * if the AI is unavailable or the response can't be parsed — callers must have a
 * non-AI fallback so agents keep working without a key.
 */
export async function llmJson<T>(opts: {
  system: string
  prompt: string
  decisions?: DecisionExample[]
  maxTokens?: number
  smart?: boolean
}): Promise<T | null> {
  if (!aiEnabled()) return null
  const system = opts.system + learningBlock(opts.decisions || [])
  return askJSON<T>(opts.prompt, system, opts.smart ? AI_MODEL : undefined, opts.maxTokens ?? 1200)
}
