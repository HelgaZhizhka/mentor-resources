import { z } from 'zod';

import { type Violation } from '../types.js';

import { type CheckerContext, type MechChecker } from './types.js';
import { buildPenaltyViolation } from './violation-helpers.js';

const IMPORT_PATTERN = /(?:from|import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
const NEWLINE = '\n';

const configSchema = z.object({
  packages: z.array(z.string().min(1)).min(1),
  file_suffixes: z.array(z.string().min(1)).min(1),
});

export const forbiddenImports: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const forbidden = new Set(config.packages);
  const isCandidate = makeFilePredicate(config.file_suffixes);
  const files = await ctx.repoReader.listFiles(isCandidate);
  const violations: Violation[] = [];
  for (const path of files) {
    const content = await ctx.repoReader.readFile(path);
    if (content === undefined) continue;
    violations.push(...scanFile(ctx, path, content, forbidden));
  }
  return violations;
};

const makeFilePredicate =
  (suffixes: readonly string[]) =>
  (path: string): boolean =>
    suffixes.some((suffix) => path.endsWith(suffix)) && !path.includes('node_modules/');

const scanFile = (
  ctx: CheckerContext,
  path: string,
  content: string,
  forbidden: ReadonlySet<string>
): readonly Violation[] => {
  const violations: Violation[] = [];
  const lines = content.split(NEWLINE);
  for (const [i, line] of lines.entries()) {
    for (const match of line.matchAll(IMPORT_PATTERN)) {
      const importPath = match[1];
      if (importPath === undefined) continue;
      const pkg = extractPackageName(importPath);
      if (pkg !== undefined && forbidden.has(pkg)) {
        violations.push(
          buildPenaltyViolation(ctx.criterion, {
            file: path,
            line: i + 1,
            ruleId: 'forbidden-import',
            message: `Forbidden import of '${pkg}'. ${ctx.criterion.penalty?.reason ?? 'Penalty applies.'}`,
          })
        );
      }
    }
  }
  return violations;
};

const extractPackageName = (importPath: string): string | undefined => {
  if (importPath.startsWith('.') || importPath.startsWith('/')) return undefined;
  const parts = importPath.split('/');
  if (importPath.startsWith('@')) {
    return parts.length >= 2 ? `${parts[0] ?? ''}/${parts[1] ?? ''}` : undefined;
  }
  return parts[0];
};
