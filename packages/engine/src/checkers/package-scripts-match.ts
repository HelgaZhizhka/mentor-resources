import { z } from 'zod';

import { type CheckerContext, type MechChecker } from './types.js';
import { buildViolation } from './violation-helpers.js';

const PACKAGE_JSON_PATH = 'package.json';

const scriptMatcherSchema = z.object({
  name: z.string().min(1),
  contains: z.array(z.string().min(1)).min(1),
});

const configSchema = z.object({
  scripts: z.array(scriptMatcherSchema).min(1),
});

type PackageJson = {
  readonly scripts?: Record<string, string>;
};

export const packageScriptsMatch: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const pkg = await readPackageJson(ctx);
  if (pkg === undefined) {
    return [
      buildViolation(ctx.criterion, {
        file: PACKAGE_JSON_PATH,
        line: 1,
        ruleId: 'package-scripts-match-no-pkg',
        message: 'package.json not found.',
      }),
    ];
  }
  const scripts = pkg.scripts ?? {};
  const failed = config.scripts.filter(
    (matcher) => !scriptMatches(scripts[matcher.name], matcher.contains)
  );
  if (failed.length === 0) return [];
  const details = failed
    .map((m) => `'${m.name}' (must contain ${m.contains.map((s) => `'${s}'`).join(' + ')})`)
    .join('; ');

  return [
    buildViolation(ctx.criterion, {
      file: PACKAGE_JSON_PATH,
      line: 1,
      ruleId: 'package-scripts-match-missing',
      message: `Missing or incorrect package.json scripts: ${details}.`,
    }),
  ];
};

const readPackageJson = async (ctx: CheckerContext): Promise<PackageJson | undefined> => {
  const raw = await ctx.repoReader.readFile(PACKAGE_JSON_PATH);
  if (raw === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    return parsed as PackageJson;
  } catch {
    return undefined;
  }
};

const scriptMatches = (script: string | undefined, needles: readonly string[]): boolean => {
  if (script === undefined) return false;
  return needles.every((needle) => script.includes(needle));
};
