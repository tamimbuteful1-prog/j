/**
 * Episode state machine.
 *
 *  QUEUED → RESEARCHING → WRITING → SCRIPT_QA → [AWAITING_SCRIPT_APPROVAL] → STORYBOARD
 *         → PRODUCING → RENDERING → MOTION_QA → AWAITING_MEDIA → ASSEMBLING
 *         → FINAL_RENDER → FINAL_QA → [AWAITING_FINAL_APPROVAL] → COMPLETED
 *
 *  side states: REVISION_REQUIRED (returns to the owning stage), BLOCKED (needs a human), FAILED
 *
 * The presenter records the voice-over as soon as the script is approved — in parallel
 * with motion production. AWAITING_MEDIA passes straight through if the files are already there.
 */
export const STATES = [
  'QUEUED',
  'RESEARCHING',
  'WRITING',
  'SCRIPT_QA',
  'AWAITING_SCRIPT_APPROVAL',
  'STORYBOARD',
  'PRODUCING',
  'RENDERING',
  'MOTION_QA',
  'AWAITING_MEDIA',
  'ASSEMBLING',
  'FINAL_RENDER',
  'FINAL_QA',
  'AWAITING_FINAL_APPROVAL',
  'COMPLETED',
  'REVISION_REQUIRED',
  'BLOCKED',
  'FAILED',
] as const;

export type State = (typeof STATES)[number];

/** States the scheduler actively works on. AWAITING_MEDIA is polled (cheap file check). */
export const RUNNABLE: State[] = [
  'QUEUED',
  'RESEARCHING',
  'WRITING',
  'SCRIPT_QA',
  'STORYBOARD',
  'PRODUCING',
  'RENDERING',
  'MOTION_QA',
  'AWAITING_MEDIA',
  'ASSEMBLING',
  'FINAL_RENDER',
  'FINAL_QA',
  'REVISION_REQUIRED',
];

/** Waiting on a person — never picked by the scheduler. */
export const HUMAN_STATES: State[] = ['AWAITING_SCRIPT_APPROVAL', 'AWAITING_FINAL_APPROVAL', 'BLOCKED'];

const T: Record<State, State[]> = {
  QUEUED: ['RESEARCHING', 'BLOCKED', 'FAILED'],
  RESEARCHING: ['WRITING', 'BLOCKED', 'FAILED'],
  WRITING: ['SCRIPT_QA', 'BLOCKED', 'FAILED'],
  SCRIPT_QA: ['AWAITING_SCRIPT_APPROVAL', 'STORYBOARD', 'REVISION_REQUIRED', 'BLOCKED', 'FAILED'],
  AWAITING_SCRIPT_APPROVAL: ['STORYBOARD', 'REVISION_REQUIRED', 'BLOCKED'],
  STORYBOARD: ['PRODUCING', 'BLOCKED', 'FAILED'],
  PRODUCING: ['RENDERING', 'BLOCKED', 'FAILED'],
  RENDERING: ['MOTION_QA', 'REVISION_REQUIRED', 'BLOCKED', 'FAILED'],
  MOTION_QA: ['AWAITING_MEDIA', 'REVISION_REQUIRED', 'BLOCKED', 'FAILED'],
  AWAITING_MEDIA: ['ASSEMBLING', 'AWAITING_MEDIA'],
  ASSEMBLING: ['FINAL_RENDER', 'REVISION_REQUIRED', 'BLOCKED', 'FAILED'],
  FINAL_RENDER: ['FINAL_QA', 'REVISION_REQUIRED', 'BLOCKED', 'FAILED'],
  FINAL_QA: ['AWAITING_FINAL_APPROVAL', 'COMPLETED', 'REVISION_REQUIRED', 'BLOCKED', 'FAILED'],
  AWAITING_FINAL_APPROVAL: ['COMPLETED', 'REVISION_REQUIRED', 'BLOCKED'],
  COMPLETED: [],
  REVISION_REQUIRED: ['WRITING', 'STORYBOARD', 'PRODUCING', 'ASSEMBLING', 'FINAL_RENDER', 'BLOCKED'],
  BLOCKED: [...STATES.filter((s) => s !== 'COMPLETED' && s !== 'BLOCKED')] as State[],
  FAILED: ['QUEUED'],
};

export const canTransition = (from: State, to: State) => T[from].includes(to);

export const assertTransition = (from: State, to: State) => {
  if (!canTransition(from, to)) throw new Error(`illegal transition ${from} → ${to}`);
};

/** Which stage a QA finding owner sends the episode back to. */
export const revisionTarget = (owner: 'writer' | 'motion' | 'assembly', afterRecording: boolean): State => {
  if (owner === 'writer') return 'WRITING';
  if (owner === 'motion') return 'PRODUCING';
  return afterRecording ? 'ASSEMBLING' : 'PRODUCING';
};
