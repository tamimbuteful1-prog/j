import {query} from '@anthropic-ai/claude-agent-sdk';
import {loadConfig, type AgentRole} from './config.ts';
import {schemaOf, validate} from './contracts.ts';
import {P} from './paths.ts';
import {logEvent, recordCost} from './db.ts';

export type AgentResult = {
  status: 'done' | 'blocked' | 'failed';
  summary: string;
  outputs: string[];
  blocked_reason?: string;
  needs_human?: string[];
};

export type AgentCall = {role: AgentRole; episodeId: string; stage: string; prompt: string};

/** Anything that can run an agent. Production = Claude Agent SDK; tests inject a stub. */
export type AgentRunner = (call: AgentCall) => Promise<AgentResult>;

/**
 * Tool surface per role — least privilege. 'dontAsk' denies anything not listed,
 * so an agent can never wander outside its job (no git, no network installs, no rm -rf).
 */
const TOOLS: Record<AgentRole, string[]> = {
  writer: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Skill', 'Bash(pdftotext:*)', 'Bash(pdftoppm:*)', 'Bash(pdfinfo:*)', 'Bash(ls:*)', 'Bash(mkdir:*)'],
  motion: [
    'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Skill',
    'Bash(npx tsc:*)', 'Bash(npm run stills:*)', 'Bash(npm run studio -- resolve:*)', 'Bash(node:*)', 'Bash(ls:*)', 'Bash(mkdir:*)', 'Bash(ffprobe:*)',
  ],
  quality: ['Read', 'Glob', 'Grep', 'Skill', 'Write', 'Bash(pdftotext:*)', 'Bash(pdftoppm:*)', 'Bash(ffprobe:*)', 'Bash(ffmpeg:*)', 'Bash(npm run stills:*)', 'Bash(ls:*)'],
  assembly: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Skill', 'Bash(ffprobe:*)', 'Bash(ffmpeg:*)', 'Bash(npm run studio -- media:*)', 'Bash(npm run stills:*)', 'Bash(ls:*)'],
};

const ROLE_INTRO: Record<AgentRole, string> = {
  writer: 'You are the MANHAJI Writer Agent. Follow the manhaji-writer skill exactly.',
  motion: 'You are the MANHAJI Motion Agent. Follow the manhaji-motion skill exactly.',
  quality: 'You are the MANHAJI Quality Agent — an independent, critical reviewer. Follow the manhaji-quality skill exactly.',
  assembly: 'You are the MANHAJI Assembly Agent. Follow the manhaji-assembly skill exactly.',
};

export const sdkRunner: AgentRunner = async ({role, episodeId, stage, prompt}) => {
  const cfg = loadConfig();
  const started = Date.now();
  logEvent(episodeId, 'agent_start', {role, stage});
  let result: AgentResult | null = null;
  let error: string | null = null;

  const q = query({
    prompt,
    options: {
      cwd: P.root,
      settingSources: ['project'],
      skills: [`manhaji-${role}`],
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: `${ROLE_INTRO[role]}\nEpisode: ${episodeId}. Stage: ${stage}.\nWork only inside episodes/${episodeId}/ (and engine/src/episodes/${episodeId}/ for the motion agent). Never fake success: if something is missing or unverifiable, return status "blocked" with the exact reason.`,
      },
      model: cfg.models[role],
      effort: cfg.effort[role],
      allowedTools: TOOLS[role],
      permissionMode: 'dontAsk',
      maxTurns: 250,
      maxBudgetUsd: cfg.budget.per_agent_run_usd[role],
      outputFormat: {type: 'json_schema', schema: schemaOf('agent_result')},
    },
  });

  for await (const m of q) {
    if (m.type !== 'result') continue;
    recordCost(episodeId, role, stage, m.total_cost_usd ?? 0, m.num_turns ?? 0, m.session_id);
    if (m.subtype === 'success') {
      try {
        result = validate<AgentResult>('agent_result', m.structured_output);
      } catch (e) {
        error = `agent returned an invalid result: ${(e as Error).message}`;
      }
    } else {
      error = `agent stopped: ${m.subtype}`;
    }
  }
  logEvent(episodeId, 'agent_end', {role, stage, ms: Date.now() - started, status: result?.status ?? 'error', error});
  if (!result) return {status: 'failed', summary: error ?? 'agent produced no result', outputs: []};
  return result;
};
