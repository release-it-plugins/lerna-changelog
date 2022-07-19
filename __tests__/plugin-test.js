import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import tmp from 'tmp';
import { factory, runTasks } from 'release-it/test/util';
import Plugin from '../index.js';

const EDITOR = process.env.EDITOR || null;
const PATH = process.env.PATH;

tmp.setGracefulCleanup();

const require = createRequire(import.meta.url);

const LERNA_PATH = require.resolve('lerna-changelog/bin/cli');
const namespace = 'release-it-lerna-changelog';

function resetPATH() {
  process.env.PATH = PATH;
}

function resetEDITOR() {
  if (EDITOR === null) {
    delete process.env.EDITOR;
  } else {
    process.env.EDITOR = EDITOR;
  }
}

async function buildEditorCommand(commandName = 'fake-editor') {
  let tmpdir = tmp.dirSync().name;

  let editor = `${tmpdir}/${commandName}`;
  let output = tmp.fileSync().name;

  let fakeCommand = `#!${process.execPath}
'use strict';
const fs = require('fs');

fs.writeFileSync('${output}', \`args: \${process.argv.slice(2).join(' ')}\`, 'utf-8');
`;

  fs.writeFileSync(editor, fakeCommand, { encoding: 'utf-8' });
  fs.chmodSync(editor, 0o755);

  return { editor, output };
}

class TestPlugin extends Plugin {
  constructor() {
    super(...arguments);

    this.responses = {
      // always assume v1.0.0 unless specifically overridden
      'git describe --tags --abbrev=0': 'v1.0.0',

      [`${LERNA_PATH} --next-version=Unreleased --from=v1.0.0`]:
        '## Unreleased (2020-03-18)\n\nThe changelog',
    };

    this.commands = [];
    this.shell.execFormattedCommand = async (command, options) => {
      this.commands.push([command, options]);
      if (this.responses[command]) {
        let response = this.responses[command];

        if (typeof response === 'string') {
          return Promise.resolve(response);
        } else if (typeof response === 'object' && response !== null && response.reject === true) {
          return Promise.reject(response.value);
        }
      }
    };
  }

  async _launchEditor(tmpFile) {
    this.launchedTmpFile = tmpFile;

    return super._launchEditor(tmpFile);
  }
}

function buildPlugin(config = {}, _Plugin = TestPlugin) {
  const options = { [namespace]: config };
  const plugin = factory(_Plugin, { namespace, options });

  return plugin;
}

describe('release-it-lerna-changelog', () => {
  test('it invokes lerna-changelog', async () => {
    let plugin = buildPlugin();

    await runTasks(plugin);

    expect(plugin.commands).toStrictEqual([
      ['git describe --tags --abbrev=0', { write: false }],
      [`${LERNA_PATH} --next-version=Unreleased --from=v1.0.0`, { write: false }],
    ]);
  });

  test('it honors custom git.tagName formatting', async () => {
    let infile = tmp.fileSync().name;
    let plugin = buildPlugin({ infile });

    plugin.config.setContext({ git: { tagName: 'v${version}' } });

    await runTasks(plugin);

    expect(plugin.commands).toStrictEqual([
      ['git describe --tags --abbrev=0', { write: false }],
      [`${LERNA_PATH} --next-version=Unreleased --from=v1.0.0`, { write: false }],
    ]);

    const changelog = fs.readFileSync(infile, { encoding: 'utf8' });
    expect(changelog).toEqual(`## v1.0.1 (2020-03-18)\n\nThe changelog\n\n`);
  });

  test('it sets the changelog without version information onto the config', async () => {
    let infile = tmp.fileSync().name;
    let plugin = buildPlugin({ infile });

    await runTasks(plugin);

    const { changelog } = plugin.config.getContext();
    expect(changelog).toEqual('The changelog');
  });

  test('it prints something to CHANGELOG.md when lerna-changelog returns no content', async () => {
    let infile = tmp.fileSync().name;
    let plugin = buildPlugin({ infile });

    plugin.responses[`${LERNA_PATH} --next-version=Unreleased --from=v1.0.0`] = '';

    await runTasks(plugin);

    const changelog = fs.readFileSync(infile, { encoding: 'utf8' });
    expect(changelog).toEqual(`## 1.0.1 (${new Date().toISOString().slice(0, 10)})\n\n`);
  });

  test('it uses the first commit when no tags exist', async () => {
    let infile = tmp.fileSync().name;

    let plugin = buildPlugin({ infile });
    plugin.config.setContext({ git: { tagName: 'v${version}' } });

    Object.assign(plugin.responses, {
      'git describe --tags --abbrev=0': {
        reject: true,
        value: 'hahahahaah, does not exist',
      },
      'git rev-list --max-parents=0 HEAD': 'aabc',
      [`${LERNA_PATH} --next-version=Unreleased --from=aabc`]: `## Unreleased\n\nThe changelog\n## v1.0.0\n\nThe old changelog`,
    });

    await runTasks(plugin);

    expect(plugin.commands).toStrictEqual([
      ['git describe --tags --abbrev=0', { write: false }],
      ['git rev-list --max-parents=0 HEAD', { write: false }],
      [`${LERNA_PATH} --next-version=Unreleased --from=aabc`, { write: false }],
    ]);

    const changelog = fs.readFileSync(infile, { encoding: 'utf8' });
    expect(changelog.trim()).toEqual('## v1.0.1\n\nThe changelog\n## v1.0.0\n\nThe old changelog');
  });

  test('it writes the changelog to the specified file when it did not exist', async () => {
    let infile = tmp.fileSync().name;
    fs.unlinkSync(infile);

    let plugin = buildPlugin({ infile });
    plugin.config.setContext({ git: { tagName: 'v${version}' } });

    Object.assign(plugin.responses, {
      'git rev-list --max-parents=0 HEAD': 'aabc',
      [`${LERNA_PATH} --next-version=Unreleased --from=aabc`]: `## Unreleased\n\nThe changelog\n## v1.0.0\n\nThe old changelog`,
    });

    await runTasks(plugin);

    expect(plugin.commands).toStrictEqual([
      ['git describe --tags --abbrev=0', { write: false }],
      [`${LERNA_PATH} --next-version=Unreleased --from=v1.0.0`, { write: false }],
      ['git rev-list --max-parents=0 HEAD', { write: false }],
      [`${LERNA_PATH} --next-version=Unreleased --from=aabc`, { write: false }],
      [`git add ${infile}`, {}],
    ]);

    const changelog = fs.readFileSync(infile, { encoding: 'utf8' });
    expect(changelog.trim()).toEqual('## v1.0.1\n\nThe changelog\n## v1.0.0\n\nThe old changelog');
  });

  test('prepends the changelog to the existing file', async () => {
    let infile = tmp.fileSync().name;
    let plugin = buildPlugin({ infile });
    plugin.config.setContext({ git: { tagName: 'v${version}' } });

    fs.writeFileSync(infile, 'Old contents', { encoding: 'utf8' });

    await runTasks(plugin);

    const changelog = fs.readFileSync(infile);
    expect(changelog.toString().trim()).toEqual(
      '## v1.0.1 (2020-03-18)\n\nThe changelog\n\nOld contents'
    );
  });

  test('adds the changelog after an existing first level heading', async () => {
    let infile = tmp.fileSync().name;
    let plugin = buildPlugin({ infile });
    plugin.config.setContext({ git: { tagName: 'v${version}' } });

    fs.writeFileSync(infile, '# Changelog\n\n## v1.0.0\n\nThe old changelog', { encoding: 'utf8' });

    await runTasks(plugin);

    const changelog = fs.readFileSync(infile);
    expect(changelog.toString().trim()).toEqual(
      '# Changelog\n\n## v1.0.1 (2020-03-18)\n\nThe changelog\n\n## v1.0.0\n\nThe old changelog'
    );
  });

  test('uses launchEditor command', async () => {
    let infile = tmp.fileSync().name;

    let { editor, output } = await buildEditorCommand();

    let plugin = buildPlugin({ infile, launchEditor: `${editor} \${file}` });

    await runTasks(plugin);

    expect(fs.readFileSync(output, 'utf-8')).toEqual(`args: ${plugin.launchedTmpFile}`);
  });

  test('does not launch the editor for dry-run', async () => {
    let infile = tmp.fileSync().name;

    let { editor, output } = await buildEditorCommand();

    let plugin = buildPlugin({ infile, launchEditor: `${editor} \${file}` });

    plugin.config.options['dry-run'] = true;

    await runTasks(plugin);

    expect(fs.readFileSync(output, 'utf-8')).toEqual(``);
  });

  test('detects default editor from $EDITOR if launchEditor is `true`', async () => {
    let infile = tmp.fileSync().name;

    let { editor, output } = await buildEditorCommand();

    let plugin = buildPlugin({ infile, launchEditor: true });

    try {
      process.env.EDITOR = editor;
      await runTasks(plugin);

      expect(fs.readFileSync(output, 'utf-8')).toEqual(`args: ${plugin.launchedTmpFile}`);
    } finally {
      resetEDITOR();
    }
  });

  test('detects default editor via `editor` if launchEditor is `true`', async () => {
    let infile = tmp.fileSync().name;

    let { editor, output } = await buildEditorCommand('editor');

    let plugin = buildPlugin({ infile, launchEditor: true });

    try {
      delete process.env.EDITOR;
      process.env.PATH = `${path.dirname(editor)}:${process.env.PATH}`;
      await runTasks(plugin);

      expect(fs.readFileSync(output, 'utf-8')).toEqual(`args: ${plugin.launchedTmpFile}`);
    } finally {
      resetPATH();
      resetEDITOR();
    }
  });

  test('throws if launchEditor is `true`, no $EDITOR present, and `editor` is not found on $PATH', async () => {
    let infile = tmp.fileSync().name;

    let plugin = buildPlugin({ infile, launchEditor: true });

    try {
      delete process.env.EDITOR;
      process.env.PATH = '';

      await runTasks(plugin);
    } catch (error) {
      expect(plugin.commands).toStrictEqual([
        ['git describe --tags --abbrev=0', { write: false }],
        [`${LERNA_PATH} --next-version=Unreleased --from=v1.0.0`, { write: false }],
      ]);

      expect(error.message).toEqual(
        `release-it-lerna-changelog configured to launch your editor but no editor was found (tried $EDITOR and searching $PATH for \`editor\`).`
      );
    } finally {
      resetEDITOR();
      resetPATH();
    }
  });

  test('launches configured editor, updates infile, and propogates changes to context', async () => {
    let fakeEditorFile = tmp.fileSync().name;
    // using a function here so it is easier to author (vs a giant string interpolation)
    function fakeEditor() {
      let fs = require('fs');
      let fileName = process.argv[2];

      let contents = fs.readFileSync(fileName, { encoding: 'utf8' });
      fs.writeFileSync(fileName, `${contents}\nExtra stuff!`, { encoding: 'utf8' });
    }
    fs.writeFileSync(fakeEditorFile, `${fakeEditor.toString()}\nfakeEditor();`, {
      encoding: 'utf8',
    });

    let infile = tmp.fileSync().name;
    let plugin = buildPlugin({
      infile,
      launchEditor: `${process.execPath} ${fakeEditorFile} \${file}`,
    });
    plugin.config.setContext({ git: { tagName: 'v${version}' } });

    await runTasks(plugin);

    const changelogFileContents = fs.readFileSync(infile);
    expect(changelogFileContents.toString().trim()).toEqual(
      '## v1.0.1 (2020-03-18)\n\nThe changelog\nExtra stuff!'
    );

    const { changelog } = plugin.config.getContext();
    expect(changelog).toEqual('The changelog\nExtra stuff!');
  });
});
