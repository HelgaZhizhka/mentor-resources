// Run with Node.js >=18 and TypeScript >=4.9 (tsc on PATH).
// Compile selected examples directly from Markdown, then check their behavior.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('../', import.meta.url));
const examples = [
  ['calculate-total', 'Clean-Code-Fundamental-Part1.md', 'calculateTotal'],
  ['debounce', 'Clean-Code-Fundamental-Part4.md', 'debounce'],
  ['process-data', 'TypeScript.md', 'processData'],
  ['get-user', 'TypeScript.md', 'getUser, isUser'],
  ['user-card-equal', 'React.md', 'areEqual'],
  ['user-greeting', 'Clean-Code-Fundamental-Part5.md', 'createUserGreeting'],
];
const temp = mkdtempSync(join(tmpdir(), 'clean-code-examples-'));
const require = createRequire(import.meta.url);
try {
  for (const [id, file, exports] of examples) {
    const markdown = readFileSync(join(root, 'clean-code', file), 'utf8');
    const pattern = new RegExp(`<!-- example: ${id} -->\\s*\x60\x60\x60typescript\\n([\\s\\S]*?)\x60\x60\x60`, 'g');
    const matches = [...markdown.matchAll(pattern)];
    assert.equal(matches.length, 1, `${file}: expected one ${id} example`);
    writeFileSync(join(temp, `${id}.ts`), `${matches[0][1]}\nexport { ${exports} };\n`);
  }
  // Check inference and reject incorrectly typed callers as well as runtime behavior.
  writeFileSync(join(temp, 'type-check.ts'), `
import { debounce } from './debounce';
const search = debounce((query: string, page: number) => query + page, 10);
search('test', 2);
// @ts-expect-error The callback requires a string followed by a number.
search(2, 'test');
// @ts-expect-error Missing a required callback argument.
search('test');
`);
  writeFileSync(join(temp, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2020', module: 'CommonJS', strict: true,
      noUncheckedIndexedAccess: true, noPropertyAccessFromIndexSignature: true,
      types: [], lib: ['ES2020', 'DOM'], outDir: './dist', noEmitOnError: true,
    }, include: ['*.ts'],
  }));
  execFileSync('tsc', ['--project', join(temp, 'tsconfig.json')], { stdio: 'inherit' });
  const load = id => require(join(temp, 'dist', `${id}.js`));

  const { calculateTotal } = load('calculate-total');
  assert.equal(calculateTotal([]), 0);
  assert.equal(calculateTotal([{ price: 10 }, { price: 2.5 }]), 12.5);
  for (const invalid of [null, {}, 'items', [null], [1], [{}], [{ price: '2' }], [{ price: NaN }], [{ price: Infinity }]]) {
    assert.throws(() => calculateTotal(invalid));
  }

  const { processData } = load('process-data');
  assert.deepEqual(processData([]), []);
  assert.deepEqual(processData([{ value: 'a' }, { value: '' }]), ['a', '']);
  for (const invalid of [null, {}, [null], [2], [{}], [{ value: 2 }]]) {
    assert.throws(() => processData(invalid));
  }

  const { debounce } = load('debounce');
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const pending = new Map();
  let nextId = 0;
  try {
    globalThis.setTimeout = (callback, delay) => {
      assert.equal(delay, 300);
      pending.set(++nextId, callback);
      return nextId;
    };
    globalThis.clearTimeout = id => pending.delete(id);
    const calls = [];
    const search = debounce((query, page) => calls.push([query, page]), 300);
    search('old', 1);
    search('latest', 2);
    assert.deepEqual(calls, []);
    assert.equal(pending.size, 1);
    const flush = () => { const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(fn => fn()); };
    flush();
    assert.deepEqual(calls, [['latest', 2]]);
    search('next', 3);
    flush();
    assert.deepEqual(calls, [['latest', 2], ['next', 3]]);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }

  const { getUser, isUser } = load('get-user');
  const user = { id: '1', name: 'Alex', email: 'alex@example.com' };
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      assert.equal(url, '/users/a%2Fb');
      return new Response(JSON.stringify(user));
    };
    assert.deepEqual(await getUser('a/b'), user);
    for (const invalid of [null, [], {}, { ...user, id: 1 }, { ...user, name: null }, { ...user, email: 1 }]) {
      assert.equal(isUser(invalid), false);
      globalThis.fetch = async () => new Response(JSON.stringify(invalid));
      await assert.rejects(getUser('1'), /Invalid user response/);
    }
    globalThis.fetch = async () => new Response('unavailable', { status: 503 });
    await assert.rejects(getUser('1'), /HTTP 503/);
    globalThis.fetch = async () => new Response('invalid JSON');
    await assert.rejects(getUser('1'), SyntaxError);
    globalThis.fetch = async () => { throw new Error('Network unavailable'); };
    await assert.rejects(getUser('1'), /Network unavailable/);
  } finally {
    globalThis.fetch = originalFetch;
  }

  const { areEqual } = load('user-card-equal');
  assert.equal(areEqual({ user }, { user: { ...user } }), true);
  for (const field of ['id', 'name', 'email']) {
    assert.equal(areEqual({ user }, { user: { ...user, [field]: 'changed' } }), false, `changed ${field} must trigger a render`);
  }

  const { createUserGreeting } = load('user-greeting');
  assert.equal(await createUserGreeting(async id => { assert.equal(id, '1'); return user; })('1'), 'Hello, Alex');
  assert.equal(await createUserGreeting(async () => null)('1'), 'User not found');
  await assert.rejects(createUserGreeting(async () => { throw new Error('Offline'); })('1'), /Offline/);
  console.log('PASS: 6 Markdown examples compiled with strict TypeScript; validation, debounce, API errors, prop comparison and dependency injection checked.');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
