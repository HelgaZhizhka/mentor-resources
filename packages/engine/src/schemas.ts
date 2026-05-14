import { z } from 'zod';

const criterionMethodSchema = z.enum(['mech', 'llm', 'hybrid']);

export const enrichmentEntrySchema = z
  .object({
    method: criterionMethodSchema,
    checker_id: z.string().min(1).optional(),
    llm_focus: z.string().min(1).optional(),
  })
  .refine(
    (entry): boolean => {
      if (entry.method === 'mech') {
        return entry.checker_id !== undefined;
      }
      if (entry.method === 'llm') {
        return entry.llm_focus !== undefined;
      }
      return entry.checker_id !== undefined || entry.llm_focus !== undefined;
    },
    {
      message:
        "method='mech' requires checker_id; method='llm' requires llm_focus; method='hybrid' requires at least one",
    }
  );

const gitShaPattern = /^[a-f0-9]{40}$/;

export const enrichmentFileSchema = z.object({
  rubric_id: z.string().min(1),
  source_commit: z
    .string()
    .regex(gitShaPattern, 'source_commit must be a 40-char lowercase Git SHA'),
  source_path: z.string().min(1),
  criteria: z.record(z.string().min(1), enrichmentEntrySchema),
});

const penaltySchema = z
  .object({
    kind: z.enum(['fixed', 'zero-category']),
    points: z.number().optional(),
    reason: z.string().min(1),
  })
  .refine((penalty) => penalty.kind !== 'fixed' || penalty.points !== undefined, {
    message: "penalty with kind='fixed' must include a points value",
  });

export const criterionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  pointsMax: z.number().int().nonnegative(),
  text: z.string().min(1),
  category: z.string().min(1).optional(),
  penalty: penaltySchema.optional(),
});

export const criterionListSchema = z.array(criterionSchema);

export type EnrichmentFileRaw = z.infer<typeof enrichmentFileSchema>;
export type CriterionRaw = z.infer<typeof criterionSchema>;
