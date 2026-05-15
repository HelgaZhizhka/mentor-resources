import { type Criterion, type Violation } from '../types.js';

export type ViolationInput = {
  readonly file: string;
  readonly line: number;
  readonly message: string;
  readonly ruleId: string;
  readonly pointsDelta?: number;
  readonly rationale?: string;
};

export const buildViolation = (criterion: Criterion, input: ViolationInput): Violation => ({
  criterionId: criterion.id,
  ruleId: input.ruleId,
  file: input.file,
  line: input.line,
  side: 'RIGHT',
  severity: 'error',
  message: input.message,
  pointsDelta: input.pointsDelta ?? -criterion.pointsMax,
  rationale: input.rationale,
});

export const buildPenaltyViolation = (criterion: Criterion, input: ViolationInput): Violation => ({
  criterionId: criterion.id,
  ruleId: input.ruleId,
  file: input.file,
  line: input.line,
  side: 'RIGHT',
  severity: 'error',
  message: input.message,
  pointsDelta: -(criterion.penalty?.points ?? 0),
  rationale: input.rationale,
});
