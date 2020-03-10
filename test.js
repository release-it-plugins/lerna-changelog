const fs = require('fs');
const tmp = require('tmp');
const test = require('ava');
const { factory, runTasks } = require('release-it/test/util');
const Plugin = require('./index');
const EDITOR = process.env.EDITOR || null;

tmp.setGracefulCleanup();

const namespace = 'release-it-lerna-changelog';

function resetEDITOR() {
  if (EDITOR === null) {
    delete process.env.EDITOR;
  } else {
    process.env.EDITOR = EDITOR;
  }
}

async function buildEditorCommand() {
  let editor = tmp.fileSync().name;
  let output = tmp.fileSync().name;

  let fakeCommand = `#!${process.execPath}
'use strict';
const fs = require('fs');

fs.writeFileSync('${output}', \`args: \${process.argv.slice(2).join(' ')}\`, 'utf-8');
`;

  await fs.writeFileSync(editor, fakeCommand, { encoding: 'utf-8' });

  return { editor: `${process.execPath} ${editor}`, output };
}

class TestPlugin extends Plugin {
  constructor() {
    super(...arguments);

    this.commands = [];
    this.shell.execFormattedCommand = async (command, options) => {
      this.commands.push([command, options]);
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

test('it invokes lerna-changelog', async t => {
  let plugin = buildPlugin();

  await runTasks(plugin);

  t.deepEqual(plugin.commands, [
    [`git show-ref --tags --quiet --verify -- "refs/tags/1.0.0"`, { write: false }],
    [`${plugin.lernaPath} --next-version=1.0.1 --from=1.0.0`, { write: false }],
  ]);
});

test('it honors custom git.tagName formatting', async t => {
  let plugin = buildPlugin();

  plugin.config.setContext({ git: { tagName: 'v${version}' } });

  await runTasks(plugin);

  t.deepEqual(plugin.commands, [
    [`git show-ref --tags --quiet --verify -- "refs/tags/v1.0.0"`, { write: false }],
    [`${plugin.lernaPath} --next-version=v1.0.1 --from=v1.0.0`, { write: false }],
  ]);
});

test('it sets the changelog without version information onto the config', async t => {
  let infile = tmp.fileSync().name;
  let plugin = buildPlugin({ infile });

  plugin.getChangelog = () => Promise.resolve('## v9.9.9 (2019-01-01)\n\nThe changelog');

  await runTasks(plugin);

  const { changelog } = plugin.config.getContext();
  t.is(changelog, 'The changelog');
});

test('it writes the changelog to the specified file when it did not exist', async t => {
  let infile = tmp.fileSync().name;
  let plugin = buildPlugin({ infile });

  plugin.getChangelog = () => Promise.resolve('## v9.9.9 (2019-01-01)\n\nThe changelog');

  await runTasks(plugin);

  const changelog = fs.readFileSync(infile);
  t.is(changelog.toString().trim(), '## v9.9.9 (2019-01-01)\n\nThe changelog');
});

test('prepends the changelog to the existing file', async t => {
  let infile = tmp.fileSync().name;
  let plugin = buildPlugin({ infile });
  plugin.getChangelog = () => Promise.resolve('## v9.9.9 (2019-01-01)\n\nThe changelog');

  fs.writeFileSync(infile, 'Old contents', { encoding: 'utf8' });

  await runTasks(plugin);

  const changelog = fs.readFileSync(infile);
  t.is(changelog.toString().trim(), '## v9.9.9 (2019-01-01)\n\nThe changelog\n\nOld contents');
});

test('uses launchEditor command', async t => {
  let infile = tmp.fileSync().name;

  let { editor, output } = await buildEditorCommand();

  let plugin = buildPlugin({ infile, launchEditor: `${editor} \${file}` });

  await runTasks(plugin);

  t.is(fs.readFileSync(output, 'utf-8'), `args: ${plugin.launchedTmpFile}`);
});

test('detects default editor if launchEditor is `true`', async t => {
  let infile = tmp.fileSync().name;

  let { editor, output } = await buildEditorCommand();

  let plugin = buildPlugin({ infile, launchEditor: true });

  try {
    process.env.EDITOR = editor;
    await runTasks(plugin);

    t.is(fs.readFileSync(output, 'utf-8'), `args: ${plugin.launchedTmpFile}`);
  } finally {
    resetEDITOR();
  }
});

test('throws if launchEditor is `true` and no $EDITOR present', async t => {
  let infile = tmp.fileSync().name;

  let plugin = buildPlugin({ infile, launchEditor: true });

  try {
    delete process.env.EDITOR;

    await runTasks(plugin);
  } catch (error) {
    t.deepEqual(plugin.commands, [
      [`git show-ref --tags --quiet --verify -- "refs/tags/1.0.0"`, { write: false }],
      [`${plugin.lernaPath} --next-version=1.0.1 --from=1.0.0`, { write: false }],
    ]);

    t.is(
      error.message,
      `release-it-lerna-changelog configured to use $EDITOR but no $EDITOR was found`
    );
  } finally {
    resetEDITOR();
  }
});

test('launches configured editor, updates infile, and propogates changes to context', async t => {
  class TestPlugin extends Plugin {
    constructor() {
      super(...arguments);

      this.commands = [];
    }

    async _execLernaChangelog() {
      return '## v9.9.9 (2019-01-01)\n\nThe changelog';
    }

    async _launchEditor(tmpFile) {
      let originalChangelog = await this._execLernaChangelog();

      fs.writeFileSync(tmpFile, originalChangelog + '\nExtra stuff!', { encoding: 'utf-8' });
    }
  }

  let infile = tmp.fileSync().name;
  let plugin = buildPlugin({ infile, launchEditor: 'foo-editor -w ${file}' }, TestPlugin);

  await runTasks(plugin);

  const changelogFileContents = fs.readFileSync(infile);
  t.is(
    changelogFileContents.toString().trim(),
    '## v9.9.9 (2019-01-01)\n\nThe changelog\nExtra stuff!'
  );

  const { changelog } = plugin.config.getContext();
  t.is(changelog, 'The changelog\nExtra stuff!');
});
