import { type Octokit } from '@octokit/rest';

import { GitHubAuthError, PocketMentorError } from '../errors.js';

import { type RepoReader } from './types.js';

export type OctokitRepoReaderOptions = {
  readonly octokit: Octokit;
  readonly owner: string;
  readonly repo: string;
  readonly ref: string;
};

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const BASE64 = 'base64';

export class OctokitRepoReader implements RepoReader {
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;
  private readonly ref: string;
  private cachedTree: readonly string[] | undefined;

  constructor(options: OctokitRepoReaderOptions) {
    this.octokit = options.octokit;
    this.owner = options.owner;
    this.repo = options.repo;
    this.ref = options.ref;
  }

  async readFile(path: string): Promise<string | undefined> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.ref,
      });
      const data = response.data;
      if (Array.isArray(data) || data.type !== 'file') return undefined;
      if (data.encoding !== BASE64) {
        throw new PocketMentorError(`Unexpected encoding ${data.encoding} for ${path}`);
      }
      return Buffer.from(data.content, 'base64').toString('utf8');
    } catch (error) {
      if (isNotFound(error)) return undefined;
      if (isAuthError(error)) {
        throw new GitHubAuthError(
          `GitHub auth failed reading ${path}: ${describeError(error)}`,
          error
        );
      }
      throw new PocketMentorError(`Failed to read ${path}: ${describeError(error)}`, error);
    }
  }

  async listFiles(predicate: (path: string) => boolean): Promise<readonly string[]> {
    this.cachedTree ??= await this.fetchTree();
    return this.cachedTree.filter((path) => predicate(path));
  }

  private async fetchTree(): Promise<readonly string[]> {
    try {
      const response = await this.octokit.git.getTree({
        owner: this.owner,
        repo: this.repo,
        tree_sha: this.ref,
        recursive: 'true',
      });
      return response.data.tree
        .filter((entry) => entry.type === 'blob' && typeof entry.path === 'string')
        .map((entry) => entry.path ?? '');
    } catch (error) {
      if (isAuthError(error)) {
        throw new GitHubAuthError(
          `GitHub auth failed listing tree at ${this.ref}: ${describeError(error)}`,
          error
        );
      }
      throw new PocketMentorError(
        `Failed to list tree at ${this.ref}: ${describeError(error)}`,
        error
      );
    }
  }
}

const isNotFound = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'status' in error && error.status === 404;

const isAuthError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null || !('status' in error)) return false;
  const status = (error as { status: unknown }).status;
  return status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN;
};

const describeError = (value: unknown): string =>
  value instanceof Error ? value.message : String(value);
