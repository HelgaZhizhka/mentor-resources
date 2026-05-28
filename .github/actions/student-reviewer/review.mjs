import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Stack detection ──────────────────────────────────────────────────────────

function detectStack(workspace) {
  const pkgPath = join(workspace, 'package.json');
  if (!existsSync(pkgPath)) return 'html-css';

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const deps = {
    ...pkg.dependencies ?? {},
    ...pkg.devDependencies ?? {},
  };

  if ('@angular/core' in deps) return 'angular';
  if ('react' in deps && 'typescript' in deps) return 'react-ts';
  if ('typescript' in deps) return 'typescript';
  return 'vanilla-js';
}

// ── Reference loading ────────────────────────────────────────────────────────

const REFS_DIR = join(__dirname, 'references', 'clean-code');

function loadRef(filename) {
  const filePath = join(REFS_DIR, filename);
  if (!existsSync(filePath)) {
    console.warn(`Warning: reference file not found: ${filename}`);
    return '';
  }
  return readFileSync(filePath, 'utf8');
}

function fundamentals() {
  return [1, 2, 3, 4, 5, 6]
    .map(n => loadRef(`Clean-Code-Fundamental-Part${n}.md`))
    .filter(Boolean)
    .join('\n\n---\n\n');
}

function buildReferences(stack) {
  switch (stack) {
    case 'html-css':
      return [loadRef('HTML.md'), loadRef('CSS.md')].join('\n\n---\n\n');
    case 'vanilla-js':
      return fundamentals();
    case 'typescript':
      return [loadRef('TypeScript.md'), fundamentals()].join('\n\n---\n\n');
    case 'react-ts':
      return [loadRef('React.md'), loadRef('TypeScript.md'), fundamentals()].join('\n\n---\n\n');
    default:
      return '';
  }
}

export { detectStack, buildReferences };
