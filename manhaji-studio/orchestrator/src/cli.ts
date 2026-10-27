#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {P, ep} from './paths.ts';
import {getTask, insertTask, listTasks, openDb, spentOn, spentSince} from './db.ts';
import {sdkRunner} from './agents.ts';
import {addBook, indexBook, enqueueNextLessons} from './books.ts';
import {runStudio} from './scheduler.ts';
import {approve, reject, retry} from './pipeline.ts';
import {mediaStatus, preparePublicDir, prepareMedia} from './media.ts';
import {renderEpisode, resolveEpisode, stillsAt, syncRegistry} from './render.ts';
import {refreshActionBoard, scaffoldEpisode} from './episode.ts';

const HELP = `MANHAJI studio

  status [ID]                         queue overview, or one episode's history
  add-book <SUBJ> <GRADE> <pdf> [--semester 1] [--title "…"]
  index-book <BOOK_ID>                Writer agent indexes lessons + pages (new lessons only)
  enqueue <EPISODE_ID>                queue one lesson (must be indexed, or have source/lesson_reference.json)
  enqueue --next                      top up every grade's queue from indexed books
  run [--once]                        start the autonomous studio loop (Ctrl-C = graceful stop)
  approve <ID> script|final           human approval gate (config: approvals.*)
  reject  <ID> script|final "notes"   send back with notes
  retry <ID>                          resume a BLOCKED/FAILED episode from where it stopped
  media <ID>                          assembly tool: probe hook, conform voice-over, write final/assembly_plan.json
  resolve <ID> preview|final          resolve line-anchored beats into seconds
  render <ID> preview|final           render with the shared engine
  stills <ID> preview|final <sec…>    extract stills for inspection
  board                               refresh ACTION_REQUIRED.md
`;

const main = async () => {
  const [cmd, ...a] = process.argv.slice(2);
  openDb();
  switch (cmd) {
    case 'status': {
      if (a[0]) {
        const t = getTask(a[0]);
        if (!t) throw new Error(`no task ${a[0]}`);
        console.log(t);
        console.log(`spent: $${spentOn(a[0]).toFixed(2)}`);
        const ev = openDb().prepare('SELECT at, kind, data FROM events WHERE episode_id = ? ORDER BY id DESC LIMIT 15').all(a[0]) as {at: number; kind: string; data: string}[];
        for (const e of ev.reverse()) console.log(new Date(e.at).toISOString(), e.kind, e.data.slice(0, 160));
        return;
      }
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      const ts = listTasks();
      console.log(`episodes: ${ts.length} · spent today: $${spentSince(day.getTime()).toFixed(2)}`);
      for (const t of ts) console.log(`${t.episode_id.padEnd(26)} ${t.state.padEnd(26)} rev${t.revision} ${t.blocked_reason ? '⚠ ' + t.blocked_reason.split('\n')[0].slice(0, 70) : ''}`);
      return;
    }
    case 'add-book': {
      const [sub, grade, pdf] = a;
      const opt = (k: string) => (a.includes(k) ? a[a.indexOf(k) + 1] : undefined);
      console.log('book id:', addBook(sub, grade, pdf, {semester: opt('--semester'), title: opt('--title')}));
      return;
    }
    case 'index-book':
      console.log(await indexBook(a[0], sdkRunner));
      return;
    case 'enqueue': {
      if (a[0] === '--next') {
        console.log(`queued ${enqueueNextLessons()} lesson(s)`);
        return;
      }
      const id = a[0];
      const [subject, grade] = id.split('-');
      const indexed = openDb().prepare('SELECT 1 FROM lessons WHERE episode_id = ?').get(id);
      if (!indexed && !fs.existsSync(path.join(ep(id).source, 'lesson_reference.json'))) throw new Error(`${id} is not indexed and has no source/lesson_reference.json`);
      scaffoldEpisode(id);
      console.log(insertTask({episode_id: id, subject, grade}) ? `queued ${id}` : `${id} already exists`);
      return;
    }
    case 'run':
      await runStudio(sdkRunner, {once: a.includes('--once')});
      return;
    case 'approve':
      console.log(approve(a[0], a[1] as 'script' | 'final').state);
      return;
    case 'reject':
      console.log(reject(a[0], a[1] as 'script' | 'final', a.slice(2).join(' ')).state);
      return;
    case 'retry':
      console.log(retry(a[0]).state);
      return;
    case 'media': {
      console.log(mediaStatus(a[0]));
      const plan = prepareMedia(a[0]);
      console.log(JSON.stringify(plan, null, 2));
      return;
    }
    case 'resolve': {
      const tl = resolveEpisode(a[0], (a[1] ?? 'preview') as 'preview' | 'final');
      preparePublicDir(a[0]);
      syncRegistry();
      console.log(`total ${tl.totalSec}s · ${tl.scenes.length} scenes · ${Object.keys(tl.beats).length} beats`);
      for (const s of tl.scenes) console.log(`  ${s.id}  ${s.start.toFixed(2)} → ${s.end.toFixed(2)}`);
      for (const [k, v] of Object.entries(tl.beats)) console.log(`  beat ${k.padEnd(18)} ${v.toFixed(2)}s`);
      if (tl.warnings.length) console.log('warnings:\n  ' + tl.warnings.join('\n  '));
      return;
    }
    case 'render': {
      const r = await renderEpisode(a[0], (a[1] ?? 'preview') as 'preview' | 'final', `cli:${process.pid}`);
      console.log(r.file);
      return;
    }
    case 'stills': {
      const mode = a[1] as 'preview' | 'final';
      const file = mode === 'final' ? path.join(ep(a[0]).final, 'final.mp4') : path.join(ep(a[0]).motion, 'preview.mp4');
      for (const f of stillsAt(file, a.slice(2).map(Number), path.join(ep(a[0]).quality, 'stills', `${mode}-manual`))) console.log(f);
      return;
    }
    case 'board':
      refreshActionBoard();
      console.log(fs.readFileSync(P.actionBoard, 'utf8'));
      return;
    default:
      console.log(HELP);
  }
};

main().catch((e) => {
  console.error('✗', (e as Error).message);
  process.exit(1);
});
