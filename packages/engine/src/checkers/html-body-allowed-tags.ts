import { NodeType, parse, type HTMLElement } from 'node-html-parser';
import { z } from 'zod';

import { type Violation } from '../types.js';

import { type CheckerContext, type MechChecker } from './types.js';
import { buildViolation } from './violation-helpers.js';

const configSchema = z.object({
  allowed_tags: z.array(z.string().min(1)).min(1),
  html_paths: z.array(z.string().min(1)).min(1),
});

export const htmlBodyAllowedTags: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const allowed = new Set(config.allowed_tags.map((tag) => tag.toLowerCase()));
  const finding = await findHtml(ctx, config.html_paths);
  if (finding === undefined) {
    return [
      buildViolation(ctx.criterion, {
        file: config.html_paths[0] ?? 'index.html',
        line: 1,
        ruleId: 'html-body-no-html',
        message: `No HTML file found at expected paths: ${config.html_paths.join(', ')}.`,
      }),
    ];
  }
  return checkBody(ctx, finding.path, finding.content, allowed);
};

const findHtml = async (
  ctx: CheckerContext,
  candidates: readonly string[]
): Promise<{ path: string; content: string } | undefined> => {
  for (const path of candidates) {
    const content = await ctx.repoReader.readFile(path);
    if (content !== undefined) return { path, content };
  }
  return undefined;
};

const checkBody = (
  ctx: CheckerContext,
  path: string,
  raw: string,
  allowed: ReadonlySet<string>
): readonly Violation[] => {
  const root = parse(raw);
  const body = root.querySelector('body');
  if (body === null) {
    return [
      buildViolation(ctx.criterion, {
        file: path,
        line: 1,
        ruleId: 'html-body-missing',
        message: `${path} has no <body> element.`,
      }),
    ];
  }
  const disallowed: string[] = [];
  for (const child of body.childNodes) {
    if (!isHtmlElement(child)) continue;
    const tag = child.tagName.toLowerCase();
    if (!allowed.has(tag)) {
      disallowed.push(`<${tag}>`);
    }
  }
  if (disallowed.length === 0) return [];
  return [
    buildViolation(ctx.criterion, {
      file: path,
      line: 1,
      ruleId: 'html-body-disallowed-tag',
      message: `<body> contains disallowed elements: ${disallowed.join(', ')}. Only ${[...allowed].map((t) => `<${t}>`).join(', ')} are permitted.`,
    }),
  ];
};

const isHtmlElement = (node: unknown): node is HTMLElement =>
  typeof node === 'object' &&
  node !== null &&
  'nodeType' in node &&
  (node as { nodeType: unknown }).nodeType === NodeType.ELEMENT_NODE;
