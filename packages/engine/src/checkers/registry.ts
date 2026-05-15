import { depPresence } from './dep-presence.js';
import { eslintPluginPresence } from './eslint-plugin-presence.js';
import { eslintRuleConfigured } from './eslint-rule-configured.js';
import { forbiddenImports } from './forbidden-imports.js';
import { htmlBodyAllowedTags } from './html-body-allowed-tags.js';
import { magicNumbersScan } from './magic-numbers-scan.js';
import { packageScriptsMatch } from './package-scripts-match.js';
import { type MechChecker } from './types.js';
import { typescriptAnyUsage } from './typescript-any-usage.js';

const REGISTRY: Readonly<Record<string, MechChecker>> = {
  'dep-presence': depPresence,
  'eslint-plugin-presence': eslintPluginPresence,
  'eslint-rule-configured': eslintRuleConfigured,
  'forbidden-imports': forbiddenImports,
  'html-body-allowed-tags': htmlBodyAllowedTags,
  'magic-numbers-scan': magicNumbersScan,
  'package-scripts-match': packageScriptsMatch,
  'typescript-any-usage': typescriptAnyUsage,
};

export const getChecker = (checkerId: string): MechChecker | undefined => REGISTRY[checkerId];

export const listCheckerIds = (): readonly string[] => Object.keys(REGISTRY);
