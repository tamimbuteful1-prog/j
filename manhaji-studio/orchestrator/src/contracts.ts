import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import {P} from './paths.ts';

export type ContractName =
  | 'lesson_reference'
  | 'lesson_analysis'
  | 'idea_candidates'
  | 'script'
  | 'storyboard'
  | 'qa_review'
  | 'agent_result'
  | 'assembly_plan'
  | 'book_index';

const ajv = new (Ajv as unknown as typeof Ajv.default)({allErrors: true, strict: false});
const cache = new Map<ContractName, ReturnType<typeof ajv.compile>>();

export const schemaOf = (name: ContractName) => JSON.parse(fs.readFileSync(path.join(P.contracts, `${name}.schema.json`), 'utf8'));

const validator = (name: ContractName) => {
  if (!cache.has(name)) cache.set(name, ajv.compile(schemaOf(name)));
  return cache.get(name)!;
};

export class ContractError extends Error {
  constructor(public file: string, public errors: string[]) {
    super(`${path.basename(file)} violates its contract:\n  - ${errors.slice(0, 12).join('\n  - ')}`);
  }
}

export const validate = <T = unknown>(name: ContractName, data: unknown, file: string = name): T => {
  const v = validator(name);
  if (!v(data)) throw new ContractError(file, (v.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}${e.params && 'allowedValues' in e.params ? ` ${JSON.stringify(e.params.allowedValues)}` : ''}`));
  return data as T;
};

/** Read + validate a JSON artifact. Throws ContractError with readable reasons. */
export const readContract = <T = unknown>(name: ContractName, file: string): T => {
  if (!fs.existsSync(file)) throw new ContractError(file, ['file is missing']);
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new ContractError(file, [`invalid JSON: ${(e as Error).message}`]);
  }
  return validate<T>(name, data, file);
};

export const writeJson = (file: string, data: unknown) => {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, file);
};
