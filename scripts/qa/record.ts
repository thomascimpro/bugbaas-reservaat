import {open, mkdir, readFile, unlink} from 'node:fs/promises';
import {dirname} from 'node:path';

export type QaResult = 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIP_REUSED';
export type QaActorType = 'human' | 'agent' | 'ci';
export type QaRecord = {
  runId: string;
  taskId: string;
  testId: string;
  result: QaResult;
  actor: string;
  actorType: QaActorType;
  revision: string;
  testRevision: string;
  environment: string;
  startedAt: string;
  scope: string[];
  origin: 'direct' | 'reused';
  evidencePath?: string;
  previousRunId?: string;
  skipReason?: string;
  /** Identity of the implementer, if established; never inferred from OS file owner. */
  builder?: string;
  /** Human or independent reviewer; omitted until actually reviewed. */
  reviewer?: string;
  reviewDecision?: 'APPROVED' | 'CHANGES_REQUESTED';
};

const ALLOWED_FIELDS = new Set<keyof QaRecord>([
  'runId', 'taskId', 'testId', 'result', 'actor', 'actorType', 'revision',
  'testRevision', 'environment', 'startedAt', 'scope', 'origin',
  'evidencePath', 'previousRunId', 'skipReason', 'builder', 'reviewer',
  'reviewDecision',
]);

// Reject credential strings and accurate lat/long coordinate pairs, not only
// obvious full URLs; evidence is intended to be a reference, not raw secrets.
const SENSITIVE_TEXT = [
  /\bBearer\s+[A-Za-z0-9._~+\/-]{8,}/i,
  /\bsk-proj-[A-Za-z0-9_-]{12,}/i,
  /\bghp_[A-Za-z0-9]{20,}/i,
  /(?:[?&]|\b)(?:token|api[_-]?key|secret|password)=\S+/i,
  /\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/,
  /-----BEGIN [\w ]*PRIVATE KEY-----/i,
  /\b(?:latitude|longitude|lat|lng|lon)["']?\s*[:=]\s*[-+]?\d/i,
  /(?:^|[^\d])[-+]?(?:[0-8]?\d|90)\.\d{4,}\s*[,;]\s*[-+]?(?:(?:1[0-7]\d)|(?:\d?\d)|180)\.\d{4,}(?:$|[^\d])/,
];
const SHA_RE = /^(?:[a-f\d]{40}|[a-f\d]{64}|sha256:[a-f\d]{64})$/i;

function safeText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 512) {
    throw new Error(`${field}: non-empty text of at most 512 characters is required`);
  }
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* Literal percent text. */ }
  if (value !== value.trim() || /[\x00-\x1f\x7f]/.test(value) ||
      SENSITIVE_TEXT.some((pattern) => pattern.test(value) || pattern.test(decoded))) {
    throw new Error(`${field}: unsafe or sensitive content`);
  }
  return value;
}

function optionalText(data: Record<string, unknown>, key: string): string | undefined {
  return data[key] === undefined ? undefined : safeText(data[key], key);
}

function relativePath(value: unknown, field: string): string {
  const path = safeText(value, field);
  if (
    path.startsWith('/') || path.startsWith('\\') || /[\\:?*<>"|%]/.test(path) ||
    /^(?:https?:\/\/|[A-Za-z]:)/i.test(path) ||
    path.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    throw new Error(`${field}: must be a safe project-relative path`);
  }
  return path;
}

export function validateRecord(input: unknown): QaRecord {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('QaRecord must be an object');
  }
  const data = input as Record<string, unknown>;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_FIELDS.has(key as keyof QaRecord)) {
      throw new Error(`Unexpected QaRecord field: ${key}`);
    }
  }
  const runId = safeText(data.runId, 'runId');
  if (!/^QA-[A-Za-z\d_-]{3,80}$/.test(runId)) {
    throw new Error('runId must start with QA- and contain only safe identifier characters');
  }
  const taskId = safeText(data.taskId, 'taskId');
  if (!/^BB-[A-Za-z\d-]+$/.test(taskId)) throw new Error('taskId is not a BB task ID');
  const testId = safeText(data.testId, 'testId');
  if (!/^[A-Za-z\d][A-Za-z\d_-]*$/.test(testId)) throw new Error('testId is invalid');
  const result = data.result;
  if (!['PASS', 'FAIL', 'BLOCKED', 'SKIP_REUSED'].includes(result as string)) {
    throw new Error('result must be PASS, FAIL, BLOCKED or SKIP_REUSED');
  }
  const actor = safeText(data.actor, 'actor');
  const actorType = data.actorType;
  if (!['human', 'agent', 'ci'].includes(actorType as string)) {
    throw new Error('actorType must be human, agent or ci');
  }
  const revision = safeText(data.revision, 'revision');
  const testRevision = safeText(data.testRevision, 'testRevision');
  if (!SHA_RE.test(revision)) throw new Error('revision must identify a Git SHA or SHA-256 input fingerprint');
  if (!SHA_RE.test(testRevision)) throw new Error('testRevision must identify a Git SHA or SHA-256 test fingerprint');
  const environment = safeText(data.environment, 'environment');
  const startedAt = safeText(data.startedAt, 'startedAt');
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(startedAt) ||
      Number.isNaN(Date.parse(startedAt)) ||
      new Date(startedAt).toISOString().replace('.000Z', 'Z') !== startedAt.replace('.000Z', 'Z')) {
    throw new Error('startedAt must be an ISO-8601 UTC timestamp');
  }
  if (!Array.isArray(data.scope) || data.scope.length === 0 ||
      data.scope.length > 100) {
    throw new Error('scope must have 1–100 project-relative paths');
  }
  const scope = data.scope.map((p) => relativePath(p, 'scope'));
  if (new Set(scope).size !== scope.length) throw new Error('scope must not contain duplicate paths');
  const origin = data.origin;
  if (origin !== 'direct' && origin !== 'reused') throw new Error('origin must be direct or reused');

  const evidencePath = data.evidencePath === undefined ? undefined :
    relativePath(data.evidencePath, 'evidencePath');
  if (result === 'PASS' && !evidencePath) throw new Error('PASS requires evidencePath');
  if (evidencePath && /(?:^|\/)\.env(?:\.|$)|\.(?:sqlite(?:-(?:wal|shm))?|db|pem|key|jks|keystore|p12|pfx)$/i.test(evidencePath)) {
    throw new Error('evidencePath: sensitive evidence file type is not allowed');
  }
  const previousRunId = optionalText(data, 'previousRunId');
  const skipReason = optionalText(data, 'skipReason');
  if (result === 'SKIP_REUSED') {
    if (origin !== 'reused') throw new Error('origin must be reused for SKIP_REUSED');
    if (!previousRunId || !/^QA-[A-Za-z\d_-]{3,80}$/.test(previousRunId)) {
      throw new Error('previousRunId must reference a prior QA run');
    }
    if (!skipReason || skipReason.length < 12) {
      throw new Error('skipReason must explain why inputs are unchanged');
    }
  } else if (origin !== 'direct' || previousRunId !== undefined || skipReason !== undefined) {
    throw new Error('origin and previousRunId/skipReason conflict with a direct test result');
  }

  const builder = optionalText(data, 'builder');
  const reviewer = optionalText(data, 'reviewer');
  const reviewDecision = data.reviewDecision;
  if (reviewDecision !== undefined) {
    if (!reviewer) throw new Error('reviewer identity required for reviewDecision');
    if (reviewDecision !== 'APPROVED' && reviewDecision !== 'CHANGES_REQUESTED') {
      throw new Error('reviewDecision must be APPROVED or CHANGES_REQUESTED');
    }
  }

  return {
    runId, taskId, testId, result: result as QaResult, actor,
    actorType: actorType as QaActorType, revision, testRevision,
    environment, startedAt, scope, origin,
    ...(evidencePath === undefined ? {} : {evidencePath}),
    ...(previousRunId === undefined ? {} : {previousRunId}),
    ...(skipReason === undefined ? {} : {skipReason}),
    ...(builder === undefined ? {} : {builder}),
    ...(reviewer === undefined ? {} : {reviewer}),
    ...(reviewDecision === undefined ? {} : {reviewDecision: reviewDecision as 'APPROVED' | 'CHANGES_REQUESTED'}),
  };
}

function parseExisting(raw: string, file: string): QaRecord[] {
  if (!raw) return [];
  if (!raw.endsWith('\n')) throw new Error('Existing QA registry ends with an incomplete line; refusing to append');
  const lines = raw.slice(0, -1).split('\n');
  const ids = new Set<string>();
  return lines.map((line, i) => {
    try {
      const record = validateRecord(JSON.parse(line));
      if (ids.has(record.runId)) throw new Error('Duplicate historical runId');
      ids.add(record.runId);
      return record;
    } catch {
      // A malformed JSON error can include sensitive fragments of the input.
      throw new Error(`Invalid existing QA record in ${file}, line ${i + 1}`);
    }
  });
}

function verifyPrevious(rec: QaRecord, prior: QaRecord[]): void {
  if (rec.origin !== 'reused') return;
  const previous = prior.find((entry) => entry.runId === rec.previousRunId);
  if (!previous) throw new Error(`previousRunId ${rec.previousRunId} was not found`);
  if (previous.result !== 'PASS' || previous.origin !== 'direct') {
    throw new Error('previousRunId must reference a direct PASS, not another reuse or failure');
  }
  if (previous.testId !== rec.testId || previous.taskId !== rec.taskId ||
      previous.revision !== rec.revision ||
      previous.testRevision !== rec.testRevision ||
      previous.environment !== rec.environment ||
      JSON.stringify([...previous.scope].sort()) !== JSON.stringify([...rec.scope].sort())) {
    throw new Error('previousRunId cannot be reused: test, revision, testRevision, environment or scope does not match');
  }
}

/**
 * Validated append-only JSONL. The separate exclusive lock serializes
 * simultaneous writers (including separate Node processes) before duplicate
 * runId and reuse checks; it never rewrites or truncates the evidence file.
 */
export async function appendRecord(file: string, record: QaRecord): Promise<void> {
  const candidate = validateRecord(record);
  await mkdir(dirname(file), {recursive: true});
  const lock = `${file}.lock`;
  let guard: Awaited<ReturnType<typeof open>> | undefined;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      guard = await open(lock, 'wx', 0o600);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  if (!guard) throw new Error(`QA record lock is held too long: ${file}`);
  try {
    let raw = '';
    try {
      raw = await readFile(file, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const existing = parseExisting(raw, file);
    if (existing.some((entry) => entry.runId === candidate.runId)) {
      throw new Error(`Duplicate runId: ${candidate.runId}`);
    }
    verifyPrevious(candidate, existing);
    if (raw && !raw.endsWith('\n')) {
      throw new Error('Existing QA registry ends with an incomplete line; refusing to append');
    }
    const output = await open(file, 'a', 0o600);
    try {
      await output.writeFile(`${JSON.stringify(candidate)}\n`, 'utf8');
      await output.sync();
    } finally {
      await output.close();
    }
  } finally {
    await guard.close();
    await unlink(lock);
  }
}
