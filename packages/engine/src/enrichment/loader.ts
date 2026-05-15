import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import yaml from 'js-yaml';
import { ZodError } from 'zod';

import { describeError, EnrichmentInvalidError, EnrichmentNotFoundError } from '../errors.js';
import { enrichmentFileSchema, type EnrichmentFileRaw } from '../schemas.js';
import { type Enrichment, type EnrichmentEntry } from '../types.js';

export type EnrichmentLoaderOptions = {
  readonly rubricsDir: string;
};

const ENRICHMENT_SUFFIX = '.enrichment.yaml';

export class EnrichmentLoader {
  private readonly rubricsDir: string;

  constructor(options: EnrichmentLoaderOptions) {
    this.rubricsDir = options.rubricsDir;
  }

  async load(rubricId: string): Promise<Enrichment> {
    if (path.basename(rubricId) !== rubricId) {
      throw new EnrichmentInvalidError(rubricId, ['rubricId must not contain path separators']);
    }
    const filePath = path.join(this.rubricsDir, `${rubricId}${ENRICHMENT_SUFFIX}`);
    const raw = await this.readFile(filePath, rubricId);
    const parsed = this.parseYaml(raw, rubricId);
    const validated = this.validate(parsed, rubricId);
    return this.toEnrichment(validated);
  }

  private async readFile(filePath: string, rubricId: string): Promise<string> {
    try {
      return await readFile(filePath, 'utf8');
    } catch (error) {
      if (isFsErrorCode(error, 'ENOENT')) {
        const available = await this.listAvailableRubrics();
        throw new EnrichmentNotFoundError(rubricId, available);
      }
      throw new EnrichmentInvalidError(
        rubricId,
        [`could not read ${filePath}: ${describeError(error)}`],
        error
      );
    }
  }

  private async listAvailableRubrics(): Promise<string[]> {
    try {
      const entries = await readdir(this.rubricsDir);
      return entries
        .filter((name) => name.endsWith(ENRICHMENT_SUFFIX))
        .map((name) => name.slice(0, -ENRICHMENT_SUFFIX.length))
        .sort();
    } catch {
      return [];
    }
  }

  private parseYaml(raw: string, rubricId: string): unknown {
    try {
      return yaml.load(raw);
    } catch (error) {
      throw new EnrichmentInvalidError(
        rubricId,
        [`YAML parse failed: ${describeError(error)}`],
        error
      );
    }
  }

  private validate(value: unknown, rubricId: string): EnrichmentFileRaw {
    try {
      return enrichmentFileSchema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map(
          (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`
        );
        throw new EnrichmentInvalidError(rubricId, issues, error);
      }
      throw new EnrichmentInvalidError(rubricId, [describeError(error)], error);
    }
  }

  private toEnrichment(raw: EnrichmentFileRaw): Enrichment {
    const criteria = new Map<string, EnrichmentEntry>();
    for (const [criterionId, entry] of Object.entries(raw.criteria)) {
      criteria.set(criterionId, {
        method: entry.method,
        checkerId: entry.checker_id,
        llmFocus: entry.llm_focus,
        checkerConfig: entry.checker_config,
      });
    }
    return {
      rubricId: raw.rubric_id,
      sourceCommit: raw.source_commit,
      sourcePath: raw.source_path,
      criteria,
    };
  }
}

const isFsErrorCode = (value: unknown, code: string): boolean =>
  typeof value === 'object' && value !== null && 'code' in value && value.code === code;
