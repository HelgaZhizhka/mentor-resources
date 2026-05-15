import { z } from 'zod';

import { type CheckerContext, type MechChecker } from './types.js';
import { buildViolation } from './violation-helpers.js';

const ESLINT_CONFIG_PATHS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc',
];

const configSchema = z.object({
  plugin: z.string().min(1),
  markers: z.array(z.string().min(1)).min(1),
});

export const eslintPluginPresence: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const finding = await findEslintConfig(ctx);
  if (finding === undefined) {
    return [
      buildViolation(ctx.criterion, {
        file: 'eslint.config.js',
        line: 1,
        ruleId: 'eslint-plugin-presence-no-config',
        message: 'No ESLint config found.',
      }),
    ];
  }
  const hasPlugin = config.markers.some((marker) => finding.content.includes(marker));
  if (hasPlugin) return [];
  return [
    buildViolation(ctx.criterion, {
      file: finding.path,
      line: 1,
      ruleId: 'eslint-plugin-not-configured',
      message: `${finding.path} does not reference the '${config.plugin}' plugin.`,
    }),
  ];
};

const findEslintConfig = async (
  ctx: CheckerContext
): Promise<{ path: string; content: string } | undefined> => {
  for (const path of ESLINT_CONFIG_PATHS) {
    const content = await ctx.repoReader.readFile(path);
    if (content !== undefined) return { path, content };
  }
  return undefined;
};
