export type CriterionMethod = 'mech' | 'llm' | 'hybrid';

export type PenaltyKind = 'fixed' | 'zero-category';

export type Penalty = {
  readonly kind: PenaltyKind;
  readonly points?: number;
  readonly reason: string;
};

export type Criterion = {
  readonly id: string;
  readonly title: string;
  readonly pointsMax: number;
  readonly text: string;
  readonly category?: string;
  readonly penalty?: Penalty;
};

export type EnrichmentEntry = {
  readonly method: CriterionMethod;
  readonly checkerId?: string;
  readonly llmFocus?: string;
  readonly checkerConfig?: Readonly<Record<string, unknown>>;
};

export type Enrichment = {
  readonly rubricId: string;
  readonly sourceCommit: string;
  readonly sourcePath: string;
  readonly criteria: ReadonlyMap<string, EnrichmentEntry>;
};

export type ViolationSeverity = 'error' | 'warning' | 'info';

export type CommentSide = 'LEFT' | 'RIGHT';

export type Violation = {
  readonly criterionId: string;
  readonly ruleId: string;
  readonly file: string;
  readonly line: number;
  readonly side: CommentSide;
  readonly severity: ViolationSeverity;
  readonly message: string;
  readonly pointsDelta: number;
  readonly rationale?: string;
};

export type PRFileStatus =
  | 'added'
  | 'modified'
  | 'removed'
  | 'renamed'
  | 'copied'
  | 'changed'
  | 'unchanged';

export type PRFile = {
  readonly filename: string;
  readonly status: PRFileStatus;
  readonly additions: number;
  readonly deletions: number;
  readonly patch?: string;
  readonly previousFilename?: string;
};

export type PRContext = {
  readonly url: string;
  readonly owner: string;
  readonly repo: string;
  readonly number: number;
  readonly baseSha: string;
  readonly headSha: string;
  readonly title: string;
  readonly body: string | null;
  readonly diff: string;
  readonly files: readonly PRFile[];
};
