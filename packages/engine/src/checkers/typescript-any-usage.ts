import { z } from 'zod';

import { type Violation } from '../types.js';

import { parseTypeScript, walk } from './ts-ast-utils.js';
import { type CheckerContext, type MechChecker } from './types.js';
import { buildPenaltyViolation, buildViolation } from './violation-helpers.js';

const TSCONFIG_PATH = 'tsconfig.json';

const configSchema = z.object({
  file_suffixes: z.array(z.string().min(1)).min(1),
  check_tsconfig_strict: z.boolean().default(false),
});

type TsconfigJson = {
  readonly compilerOptions?: { readonly strict?: boolean };
};

export const typescriptAnyUsage: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const violations: Violation[] = [];
  if (config.check_tsconfig_strict) {
    const strictViolation = await checkTsconfigStrict(ctx);
    if (strictViolation !== undefined) violations.push(strictViolation);
  }
  const isCandidate = makeFilePredicate(config.file_suffixes);
  const files = await ctx.repoReader.listFiles(isCandidate);
  for (const path of files) {
    const content = await ctx.repoReader.readFile(path);
    if (content === undefined) continue;
    violations.push(...scanFile(ctx, path, content));
  }
  return violations;
};

const makeFilePredicate =
  (suffixes: readonly string[]) =>
  (path: string): boolean =>
    suffixes.some((suffix) => path.endsWith(suffix)) && !path.includes('node_modules/');

const scanFile = (ctx: CheckerContext, path: string, content: string): readonly Violation[] => {
  const violations: Violation[] = [];
  try {
    const ast = parseTypeScript(content, path);
    walk(ast.program, (node) => {
      if (node.type === 'TSAnyKeyword') {
        violations.push(
          buildPenaltyViolation(ctx.criterion, {
            file: path,
            line: node.loc?.start.line ?? 1,
            ruleId: 'explicit-any',
            message: `Explicit 'any' type used. ${ctx.criterion.penalty?.reason ?? 'TypeScript penalty applies.'}`,
          })
        );
      }
    });
  } catch {
    // Parse failure — skip silently.
  }
  return violations;
};

const checkTsconfigStrict = async (ctx: CheckerContext): Promise<Violation | undefined> => {
  const raw = await ctx.repoReader.readFile(TSCONFIG_PATH);
  if (raw === undefined) {
    return buildViolation(ctx.criterion, {
      file: TSCONFIG_PATH,
      line: 1,
      ruleId: 'tsconfig-missing',
      message: 'tsconfig.json not found.',
      pointsDelta: 0,
    });
  }
  let parsed: TsconfigJson | undefined;
  try {
    const candidate: unknown = JSON.parse(raw);
    if (typeof candidate === 'object' && candidate !== null) {
      parsed = candidate as TsconfigJson;
    }
  } catch {
    return buildViolation(ctx.criterion, {
      file: TSCONFIG_PATH,
      line: 1,
      ruleId: 'tsconfig-unparseable',
      message: 'tsconfig.json could not be parsed.',
      pointsDelta: 0,
    });
  }
  if (parsed?.compilerOptions?.strict !== true) {
    return buildViolation(ctx.criterion, {
      file: TSCONFIG_PATH,
      line: 1,
      ruleId: 'tsconfig-not-strict',
      message: 'tsconfig.json does not set compilerOptions.strict: true.',
      pointsDelta: 0,
    });
  }
  return undefined;
};
