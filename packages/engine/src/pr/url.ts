import { PRFetchError } from '../errors.js';

export type PRLocation = {
  readonly owner: string;
  readonly repo: string;
  readonly number: number;
};

const DECIMAL_RADIX = 10;

export const parsePRUrl = (rawUrl: string): PRLocation => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch (error) {
    throw new PRFetchError(`Not a valid URL: ${rawUrl}`, rawUrl, error);
  }
  if (parsed.hostname !== 'github.com') {
    throw new PRFetchError(`Not a github.com URL: ${rawUrl}`, rawUrl);
  }
  const segments = parsed.pathname.split('/').filter((segment) => segment.length > 0);
  const [owner, repo, pullSegment, numberRaw] = segments;
  if (
    owner === undefined ||
    repo === undefined ||
    pullSegment !== 'pull' ||
    numberRaw === undefined
  ) {
    throw new PRFetchError(`Not a pull-request URL: ${rawUrl}`, rawUrl);
  }
  const number = Number.parseInt(numberRaw, DECIMAL_RADIX);
  if (!Number.isInteger(number) || number <= 0) {
    throw new PRFetchError(`PR number is not a positive integer: ${numberRaw}`, rawUrl);
  }
  return { owner, repo, number };
};
