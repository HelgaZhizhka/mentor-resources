import { type Node } from '@babel/types';
import { z } from 'zod';

import { type Violation } from '../types.js';

import { parseTypeScript, walk } from './ts-ast-utils.js';
import { type CheckerContext, type MechChecker } from './types.js';
import { buildViolation } from './violation-helpers.js';

const configSchema = z.object({
  allowed: z.array(z.number()).default([0, 1, -1]),
  file_suffixes: z.array(z.string().min(1)).min(1),
});

export const magicNumbersScan: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const allowed = new Set(config.allowed);
  const isCandidate = makeFilePredicate(config.file_suffixes);
  const files = await ctx.repoReader.listFiles(isCandidate);
  const violations: Violation[] = [];
  for (const path of files) {
    const content = await ctx.repoReader.readFile(path);
    if (content === undefined) continue;
    violations.push(...scanFile(ctx, path, content, allowed));
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
  allowed: ReadonlySet<number>
): readonly Violation[] => {
  const violations: Violation[] = [];
  try {
    const ast = parseTypeScript(content, path);
    walk(ast.program, (node) => {
      if (isMagicNumber(node, allowed)) {
        const literal = (node as unknown as { value: number }).value;
        violations.push(
          buildViolation(ctx.criterion, {
            file: path,
            line: node.loc?.start.line ?? 1,
            ruleId: 'magic-number-candidate',
            message: `Numeric literal '${literal.toString()}' used directly.`,
            pointsDelta: 0,
          })
        );
      }
    });
  } catch {
    // Parse failure — skip silently.
  }
  return violations;
};

const isMagicNumber = (node: Node, allowed: ReadonlySet<number>): boolean => {
  if (node.type !== 'NumericLiteral') return false;
  const value = (node as { value: number }).value;
  return !allowed.has(value);
};
