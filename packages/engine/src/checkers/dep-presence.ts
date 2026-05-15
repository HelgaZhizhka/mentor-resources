import { z } from 'zod';

import { type CheckerContext, type MechChecker } from './types.js';
import { buildViolation } from './violation-helpers.js';

const PACKAGE_JSON_PATH = 'package.json';

const configSchema = z.object({
  packages: z.array(z.string().min(1)).min(1),
  location: z.enum(['dependencies', 'devDependencies', 'any']).default('any'),
});

type PackageJson = {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
};

export const depPresence: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const pkg = await readPackageJson(ctx);
  if (pkg === undefined) {
    return [
      buildViolation(ctx.criterion, {
        file: PACKAGE_JSON_PATH,
        line: 1,
        ruleId: 'dep-presence-no-pkg',
        message: 'package.json not found.',
      }),
    ];
  }
  const candidates = collectDepNames(pkg, config.location);
  const found = config.packages.some((name) => candidates.has(name));
  if (found) return [];
  return [
    buildViolation(ctx.criterion, {
      file: PACKAGE_JSON_PATH,
      line: 1,
      ruleId: 'dep-presence-missing',
      message: `None of [${config.packages.join(', ')}] found in ${config.location}.`,
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

const collectDepNames = (
  pkg: PackageJson,
  location: 'dependencies' | 'devDependencies' | 'any'
): ReadonlySet<string> => {
  const names = new Set<string>();
  if (location !== 'devDependencies') {
    for (const key of Object.keys(pkg.dependencies ?? {})) names.add(key);
  }
  if (location !== 'dependencies') {
    for (const key of Object.keys(pkg.devDependencies ?? {})) names.add(key);
  }
  return names;
};
