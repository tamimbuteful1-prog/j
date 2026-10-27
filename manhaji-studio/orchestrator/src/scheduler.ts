import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {loadConfig} from './config.ts';
import {claimNext, getTask, heartbeat, logEvent, release, spentSince} from './db.ts';
import {RUNNABLE} from './states.ts';
import {commit, step, type StepCtx} from './pipeline.ts';
import {refreshActionBoard} from './episode.ts';
import {enqueueNextLessons} from './books.ts';
import type {AgentRunner} from './agents.ts';

const LEASE_MS = 5 * 60 * 1000;

/** Run one claimed task through one stage, keeping its lease alive. */
const work = async (episodeId: string, ctx: StepCtx) => {
  const beat = setInterval(() => heartbeat(episodeId, ctx.owner, LEASE_MS), 60_000);
  try {
    const t = getTask(episodeId)!;
    const outcome = await step(t, ctx);
    const after = commit(getTask(episodeId)!, outcome);
    logEvent(episodeId, 'step', {from: t.state, to: after.state, reason: outcome.reason.slice(0, 300)});
    return after;
  } finally {
    clearInterval(beat);
    release(episodeId, ctx.owner);
  }
};

/**
 * The studio loop. Claims tasks up to the slot limits, runs stages in parallel,
 * tops the queue up with the next lessons, and stops cleanly on SIGINT.
 * Crash-safe: a dead worker's lease expires and another worker resumes the stage.
 */
export const runStudio = async (runner: AgentRunner, opts: {once?: boolean; idleExitMs?: number} = {}) => {
  const owner = `${os.hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
  const inflight = new Map<string, Promise<unknown>>();
  let stopping = false;
  let idleSince = Date.now();
  process.once('SIGINT', () => {
    stopping = true;
    console.log('\n⏸  stopping after running stages finish (state is saved)…');
  });

  while (!stopping) {
    const cfg = loadConfig();
    enqueueNextLessons();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const budgetLeft = cfg.budget.daily_usd - spentSince(dayStart.getTime());

    while (!stopping && inflight.size < cfg.slots.global_max && budgetLeft > 0) {
      const t = claimNext(owner, RUNNABLE, cfg.slots, LEASE_MS);
      if (!t) break;
      idleSince = Date.now();
      console.log(`▶ ${t.episode_id}  ${t.state}`);
      const p = work(t.episode_id, {runner, owner})
        .then((after) => console.log(`✓ ${t.episode_id}  ${t.state} → ${after.state}`))
        .catch((e) => console.error(`✗ ${t.episode_id}`, e))
        .finally(() => {
          inflight.delete(t.episode_id);
          refreshActionBoard();
        });
      inflight.set(t.episode_id, p);
    }
    if (budgetLeft <= 0 && inflight.size === 0) console.log('💸 daily budget reached — production paused until tomorrow');
    if (opts.once && inflight.size === 0) break;
    if (opts.idleExitMs && inflight.size === 0 && Date.now() - idleSince > opts.idleExitMs) break;
    await Promise.race([...inflight.values(), new Promise((r) => setTimeout(r, 5000))]);
  }
  await Promise.allSettled([...inflight.values()]);
  refreshActionBoard();
};
