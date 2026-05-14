import { RequestError } from '@octokit/request-error';
import { type Octokit } from '@octokit/rest';

import { describeError, GitHubAuthError, PRFetchError } from '../errors.js';
import { type PRContext, type PRFile, type PRFileStatus } from '../types.js';

import { parsePRUrl, type PRLocation } from './url.js';

export type PRFetcherOptions = {
  readonly octokit: Octokit;
};

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const GITHUB_MAX_PER_PAGE = 100;

const PR_FILE_STATUSES = new Set<string>([
  'added',
  'modified',
  'removed',
  'renamed',
  'copied',
  'changed',
  'unchanged',
]);

const toPRFileStatus = (status: string): PRFileStatus => {
  if (!PR_FILE_STATUSES.has(status)) {
    throw new Error(`Unknown PR file status: ${status}`);
  }
  return status as PRFileStatus;
};

export class PRFetcher {
  private readonly octokit: Octokit;

  constructor(options: PRFetcherOptions) {
    this.octokit = options.octokit;
  }

  async fetch(prUrl: string): Promise<PRContext> {
    const location = parsePRUrl(prUrl);
    const [metadata, files, diff] = await Promise.all([
      this.fetchMetadata(location, prUrl),
      this.fetchFiles(location, prUrl),
      this.fetchDiff(location, prUrl),
    ]);
    return {
      url: prUrl,
      owner: location.owner,
      repo: location.repo,
      number: location.number,
      baseSha: metadata.base.sha,
      headSha: metadata.head.sha,
      title: metadata.title,
      body: metadata.body,
      diff,
      files,
    };
  }

  private async fetchMetadata(
    location: PRLocation,
    prUrl: string
  ): Promise<{
    title: string;
    body: string | null;
    base: { sha: string };
    head: { sha: string };
  }> {
    try {
      const response = await this.octokit.pulls.get({
        owner: location.owner,
        repo: location.repo,
        pull_number: location.number,
      });
      return {
        title: response.data.title,
        body: response.data.body,
        base: { sha: response.data.base.sha },
        head: { sha: response.data.head.sha },
      };
    } catch (error) {
      throw wrapGitHubError(error, prUrl, `Failed to fetch PR metadata for ${prUrl}`);
    }
  }

  private async fetchFiles(location: PRLocation, prUrl: string): Promise<readonly PRFile[]> {
    try {
      const files = await this.octokit.paginate(this.octokit.pulls.listFiles, {
        owner: location.owner,
        repo: location.repo,
        pull_number: location.number,
        per_page: GITHUB_MAX_PER_PAGE,
      });
      return files.map(
        (file): PRFile => ({
          filename: file.filename,
          status: toPRFileStatus(file.status),
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch,
          previousFilename: file.previous_filename,
        })
      );
    } catch (error) {
      throw wrapGitHubError(error, prUrl, `Failed to list PR files for ${prUrl}`);
    }
  }

  private async fetchDiff(location: PRLocation, prUrl: string): Promise<string> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner: location.owner,
        repo: location.repo,
        pull_number: location.number,
        headers: { accept: 'application/vnd.github.diff' },
      });
      if (typeof response.data !== 'string') {
        throw new PRFetchError(`Unexpected non-string diff response for ${prUrl}`, prUrl);
      }
      return response.data;
    } catch (error) {
      throw wrapGitHubError(error, prUrl, `Failed to fetch PR diff for ${prUrl}`);
    }
  }
}

const wrapGitHubError = (error: unknown, prUrl: string, message: string): Error => {
  if (error instanceof PRFetchError || error instanceof GitHubAuthError) {
    return error;
  }
  if (error instanceof RequestError) {
    if (error.status === HTTP_UNAUTHORIZED || error.status === HTTP_FORBIDDEN) {
      return new GitHubAuthError(
        `GitHub authentication failed (status ${error.status.toString()}). Check 'gh auth status' or GITHUB_TOKEN.`,
        error
      );
    }
    return new PRFetchError(
      `${message}: HTTP ${error.status.toString()} ${error.message}`,
      prUrl,
      error
    );
  }
  return new PRFetchError(`${message}: ${describeError(error)}`, prUrl, error);
};
