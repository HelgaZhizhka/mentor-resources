import { type Criterion, type Violation } from '../types.js';

export type RepoReader = {
  readFile(path: string): Promise<string | undefined>;
  listFiles(predicate: (path: string) => boolean): Promise<readonly string[]>;
};

export type CheckerContext = {
  readonly criterion: Criterion;
  readonly checkerConfig: Readonly<Record<string, unknown>>;
  readonly repoReader: RepoReader;
};

export type MechChecker = (ctx: CheckerContext) => Promise<readonly Violation[]>;
