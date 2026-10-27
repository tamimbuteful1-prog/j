import {DatabaseSync} from 'node:sqlite';
import {P} from './paths.ts';
import type {State} from './states.ts';

/**
 * Durable production state. Everything the studio knows lives here, so a crash,
 * timeout or reboot never loses progress: the scheduler resumes from the last
 * committed state of every task.
 */
export type Task = {
  episode_id: string;
  subject: string;
  grade: string;
  state: State;
  /** where a REVISION_REQUIRED / BLOCKED task should return to */
  resume_state: State | null;
  revision: number;
  rounds: Record<string, number>;
  failures: number;
  blocked_reason: string | null;
  lease_owner: string | null;
  lease_until: number | null;
  /** do not pick before this time (polling back-off / retry delay) */
  not_before: number | null;
  priority: number;
  created_at: number;
  updated_at: number;
};

let db: DatabaseSync | null = null;

export const openDb = (file = P.db) => {
  if (db) return db;
  db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY, subject TEXT NOT NULL, grade TEXT NOT NULL, file TEXT NOT NULL,
      semester TEXT, title TEXT, indexed_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS lessons (
      episode_id TEXT PRIMARY KEY, book_id TEXT NOT NULL, subject TEXT NOT NULL, grade TEXT NOT NULL,
      unit TEXT NOT NULL, unit_title TEXT, lesson TEXT NOT NULL, title TEXT NOT NULL,
      page_from INTEGER NOT NULL, page_to INTEGER NOT NULL, semester TEXT
    );
    CREATE TABLE IF NOT EXISTS tasks (
      episode_id TEXT PRIMARY KEY, subject TEXT NOT NULL, grade TEXT NOT NULL,
      state TEXT NOT NULL, resume_state TEXT, revision INTEGER NOT NULL DEFAULT 1,
      rounds TEXT NOT NULL DEFAULT '{}', failures INTEGER NOT NULL DEFAULT 0, blocked_reason TEXT,
      lease_owner TEXT, lease_until INTEGER, not_before INTEGER, priority INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, episode_id TEXT, at INTEGER NOT NULL,
      kind TEXT NOT NULL, data TEXT
    );
    CREATE TABLE IF NOT EXISTS costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, episode_id TEXT NOT NULL, agent TEXT NOT NULL,
      stage TEXT NOT NULL, usd REAL NOT NULL, turns INTEGER, session_id TEXT, at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS locks (name TEXT PRIMARY KEY, owner TEXT NOT NULL, until INTEGER NOT NULL);
  `);
  return db;
};

export const closeDb = () => {
  db?.close();
  db = null;
};

const rowToTask = (r: Record<string, unknown>): Task => ({
  ...(r as unknown as Task),
  rounds: JSON.parse(String(r.rounds ?? '{}')),
});

export const getTask = (id: string): Task | null => {
  const r = openDb().prepare('SELECT * FROM tasks WHERE episode_id = ?').get(id) as Record<string, unknown> | undefined;
  return r ? rowToTask(r) : null;
};

export const listTasks = (): Task[] => (openDb().prepare('SELECT * FROM tasks ORDER BY priority DESC, created_at').all() as Record<string, unknown>[]).map(rowToTask);

export const insertTask = (t: Pick<Task, 'episode_id' | 'subject' | 'grade'> & {priority?: number}) => {
  const now = Date.now();
  const r = openDb()
    .prepare(`INSERT OR IGNORE INTO tasks (episode_id, subject, grade, state, created_at, updated_at, priority) VALUES (?, ?, ?, 'QUEUED', ?, ?, ?)`)
    .run(t.episode_id, t.subject, t.grade, now, now, t.priority ?? 0);
  if (r.changes) logEvent(t.episode_id, 'enqueued', {});
  return r.changes > 0;
};

export const updateTask = (id: string, patch: Partial<Omit<Task, 'episode_id'>>) => {
  const cur = getTask(id);
  if (!cur) throw new Error(`no task ${id}`);
  const next = {...cur, ...patch, updated_at: Date.now()};
  openDb()
    .prepare(
      `UPDATE tasks SET state=?, resume_state=?, revision=?, rounds=?, failures=?, blocked_reason=?, lease_owner=?, lease_until=?, not_before=?, priority=?, updated_at=? WHERE episode_id=?`,
    )
    .run(next.state, next.resume_state, next.revision, JSON.stringify(next.rounds), next.failures, next.blocked_reason, next.lease_owner, next.lease_until, next.not_before, next.priority, next.updated_at, id);
  return next;
};

export const logEvent = (episodeId: string | null, kind: string, data: unknown) =>
  openDb().prepare('INSERT INTO events (episode_id, at, kind, data) VALUES (?, ?, ?, ?)').run(episodeId, Date.now(), kind, JSON.stringify(data));

export const recordCost = (episodeId: string, agent: string, stage: string, usd: number, turns: number, sessionId: string) =>
  openDb().prepare('INSERT INTO costs (episode_id, agent, stage, usd, turns, session_id, at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(episodeId, agent, stage, usd, turns, sessionId, Date.now());

export const spentSince = (sinceMs: number) => Number((openDb().prepare('SELECT COALESCE(SUM(usd),0) AS s FROM costs WHERE at >= ?').get(sinceMs) as {s: number}).s);

export const spentOn = (episodeId: string) => Number((openDb().prepare('SELECT COALESCE(SUM(usd),0) AS s FROM costs WHERE episode_id = ?').get(episodeId) as {s: number}).s);

/** Cross-process mutex (e.g. one heavy render at a time). Expires so a crash never deadlocks. */
export const tryLock = (name: string, owner: string, ttlMs: number) => {
  const now = Date.now();
  const d = openDb();
  d.exec('BEGIN IMMEDIATE');
  try {
    const r = d.prepare('SELECT owner, until FROM locks WHERE name = ?').get(name) as {owner: string; until: number} | undefined;
    if (r && r.until > now && r.owner !== owner) {
      d.exec('COMMIT');
      return false;
    }
    d.prepare('INSERT OR REPLACE INTO locks (name, owner, until) VALUES (?, ?, ?)').run(name, owner, now + ttlMs);
    d.exec('COMMIT');
    return true;
  } catch (e) {
    d.exec('ROLLBACK');
    throw e;
  }
};

export const unlock = (name: string, owner: string) => openDb().prepare('DELETE FROM locks WHERE name = ? AND owner = ?').run(name, owner);

/**
 * Atomically claim the next runnable task respecting slot limits.
 * A lease that expired (crashed worker) is claimable again → automatic resume.
 */
export const claimNext = (owner: string, runnable: State[], slots: {per_grade: number; global_max: number}, leaseMs: number): Task | null => {
  const d = openDb();
  const now = Date.now();
  d.exec('BEGIN IMMEDIATE');
  try {
    const active = d.prepare('SELECT grade, COUNT(*) AS n FROM tasks WHERE lease_until > ? GROUP BY grade').all(now) as {grade: string; n: number}[];
    const total = active.reduce((a, r) => a + Number(r.n), 0);
    if (total >= slots.global_max) {
      d.exec('COMMIT');
      return null;
    }
    const busy = new Map(active.map((r) => [r.grade, Number(r.n)]));
    const placeholders = runnable.map(() => '?').join(',');
    const candidates = d
      .prepare(`SELECT * FROM tasks WHERE state IN (${placeholders}) AND (lease_until IS NULL OR lease_until < ?) AND (not_before IS NULL OR not_before <= ?) ORDER BY priority DESC, created_at`)
      .all(...runnable, now, now) as Record<string, unknown>[];
    const pick = candidates.map(rowToTask).find((t) => (busy.get(t.grade) ?? 0) < slots.per_grade);
    if (!pick) {
      d.exec('COMMIT');
      return null;
    }
    d.prepare('UPDATE tasks SET lease_owner=?, lease_until=?, updated_at=? WHERE episode_id=?').run(owner, now + leaseMs, now, pick.episode_id);
    d.exec('COMMIT');
    return {...pick, lease_owner: owner, lease_until: now + leaseMs};
  } catch (e) {
    d.exec('ROLLBACK');
    throw e;
  }
};

export const heartbeat = (id: string, owner: string, leaseMs: number) =>
  openDb().prepare('UPDATE tasks SET lease_until=? WHERE episode_id=? AND lease_owner=?').run(Date.now() + leaseMs, id, owner);

export const release = (id: string, owner: string) => openDb().prepare('UPDATE tasks SET lease_owner=NULL, lease_until=NULL WHERE episode_id=? AND lease_owner=?').run(id, owner);
