import fs from 'fs';
import path from 'path';
import { describe, test, expect } from 'vitest';
import tmp from 'tmp';
import generateChangelog, {
  findPullRequestId,
  renderMarkdown,
  fetchWithRetry,
} from '../changelog.js';

tmp.setGracefulCleanup();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function rootWithRepo(repo = 'https://github.com/foo/bar') {
  let dir = tmp.dirSync().name;
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ repository: repo }), 'utf8');
  return dir;
}

function makeRequest(map) {
  return async (url) => {
    if (url in map) return map[url];
    throw new Error(`unexpected request url: ${url}`);
  };
}

describe('findPullRequestId', () => {
  test('matches squash-merge subjects', () => {
    expect(findPullRequestId('Add a feature (#123)')).toEqual('123');
  });

  test('matches "Merge pull request" subjects', () => {
    expect(findPullRequestId('Merge pull request #45 from foo/bar')).toEqual('45');
  });

  test('matches homu auto-merge subjects', () => {
    expect(findPullRequestId('Auto merge of #67 - foo:bar, r=baz')).toEqual('67');
  });

  test('returns null when there is no PR reference', () => {
    expect(findPullRequestId('just a plain commit')).toBeNull();
  });
});

describe('renderMarkdown', () => {
  test('rewrites "fixes #N" titles into a Closes link', () => {
    let releases = [
      {
        name: '___unreleased___',
        date: '2020-03-18',
        commits: [
          {
            categories: [':bug: Bug Fix'],
            githubIssue: {
              number: 5,
              title: 'Fixes #99 in the parser',
              user: { login: 'alice', html_url: 'https://github.com/alice' },
              pull_request: { html_url: 'https://github.com/foo/bar/pull/5' },
            },
          },
        ],
      },
    ];

    let markdown = renderMarkdown(releases, {
      categories: [':bug: Bug Fix'],
      baseIssueUrl: 'https://github.com/foo/bar/issues/',
      unreleasedName: 'Unreleased',
    });

    expect(markdown).toEqual(
      '## Unreleased (2020-03-18)\n\n#### :bug: Bug Fix\n' +
        '* [#5](https://github.com/foo/bar/pull/5) Closes [#99](https://github.com/foo/bar/issues/99) in the parser ([@alice](https://github.com/alice))'
    );
  });
});

describe('fetchWithRetry', () => {
  function fakeRes(status, { headers = {}, body = {} } = {}) {
    return {
      status,
      ok: status >= 200 && status < 300,
      headers: { get: (k) => headers[k.toLowerCase()] ?? null },
      json: async () => body,
    };
  }

  test('retries on 403 then succeeds, honoring Retry-After', async () => {
    let calls = 0;
    let slept = [];

    let fetchImpl = async () => {
      calls += 1;
      if (calls === 1) return fakeRes(403, { headers: { 'retry-after': '2' } });
      return fakeRes(200, { body: { ok: true } });
    };

    let res = await fetchWithRetry(
      'http://example.test',
      {},
      { fetchImpl, sleepImpl: async (ms) => slept.push(ms) }
    );

    expect(calls).toBe(2);
    expect(slept).toEqual([2000]);
    expect(res.status).toBe(200);
  });

  test('gives up after the configured attempts and returns the last response', async () => {
    let calls = 0;
    let fetchImpl = async () => {
      calls += 1;
      return fakeRes(403);
    };

    let res = await fetchWithRetry(
      'http://example.test',
      {},
      { attempts: 3, fetchImpl, sleepImpl: async () => {} }
    );

    expect(calls).toBe(3);
    expect(res.status).toBe(403);
  });
});

describe('generateChangelog', () => {
  test('produces lerna-changelog-identical markdown for a single release', async () => {
    let rootPath = rootWithRepo();

    let rawCommits = [
      { sha: 'aaa', refName: 'HEAD -> master', summary: 'Add a cool feature (#1)', date: today() },
      { sha: 'bbb', refName: '', summary: 'Fix a bug (#2)', date: today() },
      { sha: 'ccc', refName: '', summary: 'Bump a dep (#3)', date: today() },
      { sha: 'ddd', refName: '', summary: 'commit without a PR', date: today() },
    ];

    let request = makeRequest({
      'https://api.github.com/repos/foo/bar/issues/1': {
        number: 1,
        title: 'Add a cool feature',
        labels: [{ name: 'enhancement' }],
        user: { login: 'alice', html_url: 'https://github.com/alice' },
        pull_request: { html_url: 'https://github.com/foo/bar/pull/1' },
      },
      'https://api.github.com/repos/foo/bar/issues/2': {
        number: 2,
        title: 'Fix a bug',
        labels: [{ name: 'bug' }],
        user: { login: 'bob', html_url: 'https://github.com/bob' },
        pull_request: { html_url: 'https://github.com/foo/bar/pull/2' },
      },
      'https://api.github.com/repos/foo/bar/issues/3': {
        number: 3,
        title: 'Bump a dep',
        labels: [{ name: 'internal' }],
        // a bot login that is in the default ignore list
        user: { login: 'dependabot[bot]', html_url: 'https://github.com/apps/dependabot' },
        pull_request: { html_url: 'https://github.com/foo/bar/pull/3' },
      },
      'https://api.github.com/users/alice': {
        login: 'alice',
        html_url: 'https://github.com/alice',
        name: 'Alice A',
      },
      'https://api.github.com/users/bob': {
        login: 'bob',
        html_url: 'https://github.com/bob',
        name: null,
      },
    });

    let markdown = await generateChangelog({
      from: 'v1.0.0',
      rootPath,
      request,
      _rawCommits: rawCommits,
    });

    expect(markdown).toEqual(
      [
        `## Unreleased (${today()})`,
        '',
        '#### :rocket: Enhancement',
        '* [#1](https://github.com/foo/bar/pull/1) Add a cool feature ([@alice](https://github.com/alice))',
        '',
        '#### :bug: Bug Fix',
        '* [#2](https://github.com/foo/bar/pull/2) Fix a bug ([@bob](https://github.com/bob))',
        '',
        '#### :house: Internal',
        '* [#3](https://github.com/foo/bar/pull/3) Bump a dep ([@dependabot[bot]](https://github.com/apps/dependabot))',
        '',
        // dependabot is excluded from the committers list via ignoreCommitters
        '#### Committers: 2',
        '- Alice A ([@alice](https://github.com/alice))',
        '- [@bob](https://github.com/bob)',
      ].join('\n')
    );
  });

  test('throws when repo cannot be inferred', async () => {
    let rootPath = tmp.dirSync().name; // no package.json

    await expect(
      generateChangelog({ from: 'v1.0.0', rootPath, request: makeRequest({}), _rawCommits: [] })
    ).rejects.toThrow(/Could not infer "repo"/);
  });
});
