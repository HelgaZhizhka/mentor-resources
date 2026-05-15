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
  rule: z.string().min(1),
  hint: z.string().optional(),
});

export const eslintRuleConfigured: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const finding = await findEslintConfig(ctx);
  if (finding === undefined) {
    return [
      buildViolation(ctx.criterion, {
        file: 'eslint.config.js',
        line: 1,
        ruleId: 'eslint-rule-no-config',
        message: 'No ESLint config found.',
      }),
    ];
  }
  if (!referencesRule(finding.content, config.rule)) {
    const hint = config.hint === undefined ? '' : ` ${config.hint}`;
    return [
      buildViolation(ctx.criterion, {
        file: finding.path,
        line: 1,
        ruleId: 'eslint-rule-not-configured',
        message: `${finding.path} does not configure rule '${config.rule}'.${hint}`,
      }),
    ];
  }
  return [];
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

const referencesRule = (configContent: string, ruleName: string): boolean => {
  const variations = [`'${ruleName}'`, `"${ruleName}"`];
  return variations.some((variant) => configContent.includes(variant));
};
