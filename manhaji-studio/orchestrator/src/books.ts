import fs from 'node:fs';
import path from 'node:path';
import {P} from './paths.ts';
import {loadConfig, loadSubjects, saveSubject} from './config.ts';
import {readContract} from './contracts.ts';
import {insertTask, listTasks, logEvent, openDb} from './db.ts';
import type {AgentRunner} from './agents.ts';

type BookIndex = {
  book_id: string;
  subject: string;
  grade: string;
  semester?: string;
  status: 'ok' | 'partial' | 'blocked';
  notes?: string;
  units: {unit: string; title: string; lessons: {lesson: string; title: string; page_from: number; page_to: number; readable: boolean; notes?: string}[]}[];
};

/** Register a textbook PDF for a subject/grade (copies it under books/<subject>/<grade>/). */
export const addBook = (subjectId: string, grade: string, pdf: string, opts: {semester?: string; title?: string}) => {
  const subjects = loadSubjects();
  const s = subjects.find((x) => x.id === subjectId);
  if (!s) throw new Error(`unknown subject ${subjectId} (have: ${subjects.map((x) => x.id).join(', ')})`);
  if (!s.grades[grade]) throw new Error(`${subjectId} has no standalone book track for ${grade} — not creating one`);
  if (!fs.existsSync(pdf)) throw new Error(`no such file ${pdf}`);
  const dir = path.join(P.books, subjectId.toLowerCase(), grade);
  fs.mkdirSync(dir, {recursive: true});
  const dst = path.join(dir, path.basename(pdf));
  if (path.resolve(pdf) !== path.resolve(dst)) fs.copyFileSync(pdf, dst);
  const id = `${subjectId}-${grade}-S${opts.semester ?? '1'}`;
  const relFile = path.relative(P.root, dst);
  s.grades[grade].books = [...s.grades[grade].books.filter((b) => b.id !== id), {id, file: relFile, semester: opts.semester ?? '1', title: opts.title}];
  saveSubject(s);
  openDb().prepare('INSERT OR REPLACE INTO books (id, subject, grade, file, semester, title) VALUES (?, ?, ?, ?, ?, ?)').run(id, subjectId, grade, relFile, opts.semester ?? '1', opts.title ?? null);
  logEvent(null, 'book_added', {id, file: relFile});
  return id;
};

/** Book ingestion: the Writer agent reads the PDF table of contents into books/<id>.index.json. */
export const indexBook = async (bookId: string, runner: AgentRunner) => {
  const b = openDb().prepare('SELECT * FROM books WHERE id = ?').get(bookId) as {id: string; subject: string; grade: string; file: string; semester: string} | undefined;
  if (!b) throw new Error(`unknown book ${bookId}`);
  const out = path.join(P.books, `${bookId}.index.json`);
  const r = await runner({
    role: 'writer',
    episodeId: bookId,
    stage: 'BOOK_INDEX',
    prompt: `Book ingestion for ${bookId} (${b.subject} ${b.grade}, semester ${b.semester}). PDF: ${b.file}.
Read the table of contents and verify each lesson's start page inside the book (pdfinfo, pdftotext -f/-l; pdftoppm to LOOK at pages when text extraction is poor).
Write ${path.relative(P.root, out)} following contracts/book_index.schema.json: every unit (two-digit "01") and lesson (two-digit) with PDF page_from/page_to,
readable=false for any lesson whose essential content (text/figures/tables) cannot be read reliably. Do not invent lessons. Return blocked if this is not a ${b.subject} book for ${b.grade}.`,
  });
  if (r.status !== 'done') throw new Error(`book indexing ${r.status}: ${r.blocked_reason ?? r.summary}`);
  const idx = readContract<BookIndex>('book_index', out);
  return registerLessons(idx, b.file);
};

/** Create lesson rows for NEW lessons only (already-known lessons are never duplicated). */
export const registerLessons = (idx: BookIndex, file: string) => {
  const d = openDb();
  const ins = d.prepare(`INSERT OR IGNORE INTO lessons (episode_id, book_id, subject, grade, unit, unit_title, lesson, title, page_from, page_to, semester) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  let added = 0;
  const unreadable: string[] = [];
  for (const u of idx.units)
    for (const l of u.lessons) {
      const id = `${idx.subject}-${idx.grade}-U${u.unit}-L${l.lesson}`;
      if (!l.readable) {
        unreadable.push(`${id} ${l.title}`);
        continue;
      }
      added += Number(ins.run(id, idx.book_id, idx.subject, idx.grade, u.unit, u.title, l.lesson, l.title, l.page_from, l.page_to, idx.semester ?? null).changes);
    }
  d.prepare('UPDATE books SET indexed_at = ? WHERE id = ?').run(Date.now(), idx.book_id);
  logEvent(null, 'book_indexed', {book: idx.book_id, file, added, unreadable});
  return {added, unreadable};
};

/** Keep each grade's queue topped up with the next un-produced lessons (in book order). */
export const enqueueNextLessons = (perGradeQueued = loadConfig().slots.per_grade) => {
  const tasks = listTasks();
  const known = new Set(tasks.map((t) => t.episode_id));
  const queuedByGrade = new Map<string, number>();
  for (const t of tasks) if (t.state === 'QUEUED') queuedByGrade.set(`${t.subject}-${t.grade}`, (queuedByGrade.get(`${t.subject}-${t.grade}`) ?? 0) + 1);
  const lessons = openDb().prepare('SELECT episode_id, subject, grade FROM lessons ORDER BY subject, grade, semester, unit, lesson').all() as {episode_id: string; subject: string; grade: string}[];
  let added = 0;
  for (const l of lessons) {
    const k = `${l.subject}-${l.grade}`;
    if (known.has(l.episode_id) || (queuedByGrade.get(k) ?? 0) >= perGradeQueued) continue;
    if (insertTask({episode_id: l.episode_id, subject: l.subject, grade: l.grade})) {
      queuedByGrade.set(k, (queuedByGrade.get(k) ?? 0) + 1);
      added++;
    }
  }
  return added;
};
