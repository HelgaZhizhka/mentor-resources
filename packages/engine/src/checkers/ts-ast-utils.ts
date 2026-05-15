import { parse, type ParseResult } from '@babel/parser';
import { type Node } from '@babel/types';

export const parseTypeScript = (source: string, filename: string): ParseResult =>
  parse(source, {
    sourceType: 'module',
    sourceFilename: filename,
    plugins: ['typescript', 'jsx', 'decorators-legacy'],
    errorRecovery: true,
  });

export const walk = (node: Node, visit: (node: Node) => void): void => {
  visit(node);
  for (const key of Object.keys(node)) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const child of value) {
        if (isNode(child)) walk(child, visit);
      }
    } else if (isNode(value)) {
      walk(value, visit);
    }
  }
};

const isNode = (value: unknown): value is Node =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  typeof (value as { type: unknown }).type === 'string';
