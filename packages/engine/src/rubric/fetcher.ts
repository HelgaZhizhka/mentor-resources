import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

import { RubricFetchError } from '../errors.js';
import { type HttpClient } from '../http.js';

export type RubricFetcherOptions = {
  readonly httpClient: HttpClient;
  readonly cacheDir?: string;
  readonly repoOwner?: string;
  readonly repoName?: string;
};

const RAW_HOST = 'https://raw.githubusercontent.com';
const HTTP_OK = 200;

export class RubricFetcher {
  private readonly httpClient: HttpClient;
  private readonly cacheDir: string;
  private readonly repoOwner: string;
  private readonly repoName: string;

  constructor(options: RubricFetcherOptions) {
    this.httpClient = options.httpClient;
    this.cacheDir = options.cacheDir ?? path.join(homedir(), '.pocket-mentor', 'cache');
    this.repoOwner = options.repoOwner ?? 'rolling-scopes-school';
    this.repoName = options.repoName ?? 'tasks';
  }

  async fetch(commitSha: string, repoPath: string): Promise<string> {
    const cachePath = this.cachePathFor(commitSha, repoPath);
    const cached = await readCached(cachePath);
    if (cached !== undefined) {
      return cached;
    }
    const url = buildRawUrl(this.repoOwner, this.repoName, commitSha, repoPath);
    const response = await this.requestRubric(url);
    await writeCached(cachePath, response);
    return response;
  }

  private async requestRubric(url: string): Promise<string> {
    try {
      const response = await this.httpClient.get(url);
      if (response.status !== HTTP_OK) {
        throw new RubricFetchError(
          `Unexpected status ${response.status.toString()} fetching ${url}`,
          url
        );
      }
      return response.text;
    } catch (error) {
      if (error instanceof RubricFetchError) throw error;
      throw new RubricFetchError(`HTTP request failed for ${url}`, url, error);
    }
  }

  private cachePathFor(commitSha: string, repoPath: string): string {
    const base = path.resolve(this.cacheDir);
    const resolved = path.resolve(base, commitSha, repoPath);
    if (!resolved.startsWith(base + path.sep)) {
      throw new RubricFetchError(
        `Unsafe cache path resolved outside cache dir: ${resolved}`,
        repoPath
      );
    }
    return resolved;
  }
}

const buildRawUrl = (
  repoOwner: string,
  repoName: string,
  commitSha: string,
  repoPath: string
): string => {
  const normalisedPath = repoPath.startsWith('/') ? repoPath.slice(1) : repoPath;
  return `${RAW_HOST}/${repoOwner}/${repoName}/${commitSha}/${normalisedPath}`;
};

const readCached = async (cachePath: string): Promise<string | undefined> => {
  try {
    return await readFile(cachePath, 'utf8');
  } catch {
    return undefined;
  }
};

const writeCached = async (cachePath: string, content: string): Promise<void> => {
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, content, 'utf8');
};
