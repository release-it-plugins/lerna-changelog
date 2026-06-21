// Internal reimplementation of the slice of `lerna-changelog` we relied on:
// list commits in a range, resolve each to its GitHub PR, group by label, and
// render markdown identical to what the old CLI produced. Monorepo
// (`packages/*`) grouping and `lerna.json` support are intentionally dropped.
import fs from 'fs';
import path from 'path';
import { execa } from 'execa';
import hostedGitInfo from 'hosted-git-info';
import pMap from 'p-map';

const UNRELEASED_TAG = '___unreleased___';
const COMMIT_FIX_REGEX = /(fix|close|resolve)(e?s|e?d)? [T#](\d+)/i;

const DEFAULT_LABELS = {
  breaking: ':boom: Breaking Change',
  enhancement: ':rocket: Enhancement',
  bug: ':bug: Bug Fix',
  documentation: ':memo: Documentation',
  internal: ':house: Internal',
};

const DEFAULT_IGNORE_COMMITTERS = [
  'dependabot-bot',
  'dependabot[bot]',
  'dependabot-preview[bot]',
  'greenkeeperio-bot',
  'greenkeeper[bot]',
  'renovate-bot',
  'renovate[bot]',
];

export function findPullRequestId(message) {
  const firstLine = message.split('\n')[0];

  const merge = firstLine.match(/^Merge pull request #(\d+) from /);
  if (merge) return merge[1];

  const squash = firstLine.match(/\(#(\d+)\)$/);
  if (squash) return squash[1];

  const homu = firstLine.match(/^Auto merge of #(\d+) - /);
  if (homu) return homu[1];

  return null;
}

function parseLogMessage(commit) {
  const parts = commit.match(/hash<(.+)> ref<(.*)> message<(.*)> date<(.*)>/) || [];
  if (parts.length === 0) {
    return null;
  }

  return { sha: parts[1], refName: parts[2], summary: parts[3], date: parts[4] };
}

async function listCommits(from, to) {
  const { stdout } = await execa('git', [
    'log',
    '--oneline',
    '--pretty=hash<%h> ref<%D> message<%s> date<%cd>',
    '--date=short',
    `${from}..${to || ''}`,
  ]);

  return stdout.split('\n').filter(Boolean).map(parseLogMessage).filter(Boolean);
}

async function getRootPath() {
  const { stdout } = await execa('git', ['rev-parse', '--show-toplevel']);
  return stdout;
}

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, { encoding: 'utf8' }));
  } catch {
    return undefined;
  }
}

function findRepoFromPkg(pkg) {
  const url = pkg?.repository?.url || pkg?.repository;
  if (!url) return undefined;

  const info = hostedGitInfo.fromUrl(url);
  if (info && info.type === 'github') {
    return `${info.user}/${info.project}`;
  }
}

function loadConfig(rootPath) {
  const pkg = readJSON(path.join(rootPath, 'package.json')) || {};
  const lerna = readJSON(path.join(rootPath, 'lerna.json')) || {};
  const config = pkg.changelog || lerna.changelog || {};

  const repo = config.repo || findRepoFromPkg(pkg);
  if (!repo) {
    throw new Error('Could not infer "repo" from the "package.json" file.');
  }

  return {
    repo,
    labels: config.labels || DEFAULT_LABELS,
    ignoreCommitters: config.ignoreCommitters || DEFAULT_IGNORE_COMMITTERS,
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// How long to wait before retrying a rate-limited GitHub response. Secondary
// rate limits send `Retry-After` (usually a few seconds); otherwise back off
// exponentially, capped so a release never stalls for long.
function retryDelayMs(res, attempt) {
  const retryAfter = Number(res.headers.get('retry-after'));
  if (retryAfter > 0) return retryAfter * 1000;
  return Math.min(1000 * 2 ** attempt, 8000);
}

// `fetchImpl` and `sleepImpl` are injectable for tests.
export async function fetchWithRetry(url, init, options = {}) {
  // global fetch is stable on all supported Node versions (>=20.19); the lint
  // rule keys off the engines floor and flags it conservatively.
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const { attempts = 4, fetchImpl = fetch, sleepImpl = sleep } = options;

  let res;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const isLast = attempt === attempts - 1;

    try {
      res = await fetchImpl(url, init);
    } catch (err) {
      if (isLast) throw err;
      await sleepImpl(retryDelayMs({ headers: { get: () => null } }, attempt));
      continue;
    }

    // 403/429 from GitHub are rate limiting; retry until attempts run out, then
    // fall through and let the caller surface the error.
    if ((res.status === 403 || res.status === 429) && !isLast) {
      await sleepImpl(retryDelayMs(res, attempt));
      continue;
    }

    return res;
  }

  return res;
}

function makeGithubRequest() {
  const auth = process.env.GITHUB_AUTH;
  if (!auth) {
    throw new Error('Must provide GITHUB_AUTH');
  }

  return async (url) => {
    const res = await fetchWithRetry(url, {
      headers: {
        Authorization: `token ${auth}`,
        // GitHub rejects requests without a User-Agent; make-fetch-happen used
        // to set one for us, native fetch does not.
        'User-Agent': '@release-it-plugins/lerna-changelog',
        Accept: 'application/vnd.github+json',
      },
    });

    if (!res.ok) {
      // tolerate non-JSON error bodies (e.g. an HTML 502 page)
      const body = await res.json().catch(() => undefined);
      throw new Error(
        `GitHub fetch error: ${res.status} ${res.statusText}.\n${JSON.stringify(body)}`
      );
    }

    return res.json();
  };
}

function getToday() {
  const date = new Date().toISOString();
  return date.slice(0, date.indexOf('T'));
}

function toCommitInfos(commits) {
  return commits.map((commit) => {
    const { sha, refName, summary: message, date } = commit;

    let tags;
    if (refName.length > 1) {
      const TAG_PREFIX = 'tag: ';
      tags = refName
        .split(', ')
        .filter((ref) => ref.startsWith(TAG_PREFIX))
        .map((ref) => ref.slice(TAG_PREFIX.length));
    }

    return { commitSHA: sha, message, tags, issueNumber: findPullRequestId(message), date };
  });
}

function fillInCategories(commits, labels) {
  for (const commit of commits) {
    if (!commit.githubIssue || !commit.githubIssue.labels) continue;

    const issueLabels = commit.githubIssue.labels.map((label) => label.name.toLowerCase());
    commit.categories = Object.keys(labels)
      .filter((label) => issueLabels.indexOf(label.toLowerCase()) !== -1)
      .map((label) => labels[label]);
  }
}

function groupByRelease(commits) {
  const releaseMap = {};
  let currentTags = [UNRELEASED_TAG];

  for (const commit of commits) {
    if (commit.tags && commit.tags.length > 0) {
      currentTags = commit.tags;
    }

    for (const currentTag of currentTags) {
      if (!releaseMap[currentTag]) {
        const date = currentTag === UNRELEASED_TAG ? getToday() : commit.date;
        releaseMap[currentTag] = { name: currentTag, date, commits: [] };
      }
      releaseMap[currentTag].commits.push(commit);
    }
  }

  return Object.keys(releaseMap).map((tag) => releaseMap[tag]);
}

function ignoreCommitter(login, ignoreCommitters) {
  return ignoreCommitters.some((c) => c === login || login.indexOf(c) > -1);
}

async function getCommitters(commits, request, ignoreCommitters) {
  const committers = {};

  for (const commit of commits) {
    const issue = commit.githubIssue;
    const login = issue && issue.user && issue.user.login;
    if (login && !ignoreCommitter(login, ignoreCommitters) && !committers[login]) {
      committers[login] = await request(`https://api.github.com/users/${login}`);
    }
  }

  return Object.keys(committers).map((k) => committers[k]);
}

function renderContribution(commit, baseIssueUrl) {
  const issue = commit.githubIssue;
  if (!issue) return undefined;

  let markdown = '';

  if (issue.number && issue.pull_request && issue.pull_request.html_url) {
    markdown += `[#${issue.number}](${issue.pull_request.html_url}) `;
  }

  let title = issue.title;
  if (title && title.match(COMMIT_FIX_REGEX)) {
    title = title.replace(COMMIT_FIX_REGEX, `Closes [#$3](${baseIssueUrl}$3)`);
  }

  markdown += `${title} ([@${issue.user.login}](${issue.user.html_url}))`;
  return markdown;
}

function renderContributionList(commits, baseIssueUrl, prefix = '') {
  return commits
    .map((commit) => renderContribution(commit, baseIssueUrl))
    .filter(Boolean)
    .map((rendered) => `${prefix}* ${rendered}`)
    .join('\n');
}

function renderContributor(contributor) {
  const link = `[@${contributor.login}](${contributor.html_url})`;
  return contributor.name ? `${contributor.name} (${link})` : link;
}

function renderContributorList(contributors) {
  const rendered = contributors.map((c) => `- ${renderContributor(c)}`).sort();
  return `#### Committers: ${contributors.length}\n${rendered.join('\n')}`;
}

function renderRelease(release, { categories, baseIssueUrl, unreleasedName }) {
  const grouped = categories
    .map((name) => ({
      name,
      commits: release.commits.filter((c) => c.categories && c.categories.indexOf(name) !== -1),
    }))
    .filter((category) => category.commits.length > 0);

  if (grouped.length === 0) return '';

  const releaseTitle = release.name === UNRELEASED_TAG ? unreleasedName : release.name;
  let markdown = `## ${releaseTitle} (${release.date})`;

  for (const category of grouped) {
    markdown += `\n\n#### ${category.name}\n`;
    markdown += renderContributionList(category.commits, baseIssueUrl);
  }

  if (release.contributors?.length) {
    markdown += `\n\n${renderContributorList(release.contributors)}`;
  }

  return markdown;
}

export function renderMarkdown(releases, options) {
  return releases
    .map((release) => renderRelease(release, options))
    .filter(Boolean)
    .join('\n\n\n');
}

export default async function generateChangelog(options = {}) {
  const { from, to = 'HEAD', nextVersion = 'Unreleased' } = options;
  const rootPath = options.rootPath || (await getRootPath());
  const { repo, labels, ignoreCommitters } = loadConfig(rootPath);

  // `request` and `_rawCommits` are injected by tests; in real use `request`
  // reads GITHUB_AUTH and throws up front if it is missing (matching
  // lerna-changelog's behavior).
  const request = options.request || makeGithubRequest();

  const commits = toCommitInfos(options._rawCommits || (await listCommits(from, to)));

  await pMap(
    commits,
    async (commit) => {
      if (commit.issueNumber) {
        commit.githubIssue = await request(
          `https://api.github.com/repos/${repo}/issues/${commit.issueNumber}`
        );
      }
    },
    { concurrency: 5 }
  );

  fillInCategories(commits, labels);

  const releases = groupByRelease(commits);
  for (const release of releases) {
    release.contributors = await getCommitters(release.commits, request, ignoreCommitters);
  }

  return renderMarkdown(releases, {
    categories: Object.keys(labels).map((key) => labels[key]),
    baseIssueUrl: `https://github.com/${repo}/issues/`,
    unreleasedName: nextVersion,
  });
}
