const fs = require('fs');
const tmp = require('tmp');
const test = require('ava');
const { factory, runTasks } = require('release-it/test/util');
const Plugin = require('./index');

tmp.setGracefulCleanup();

const namespace = 'release-it-lerna-changelog';

class TestPlugin extends Plugin {
  constructor() {
    super(...arguments);

    this.commands = [];
  }

  exec() {
    this.commands.push([...arguments]);
  }
}

function buildPlugin(config = {}) {
  const options = { [namespace]: config };
  const plugin = factory(TestPlugin, { namespace, options });

  return plugin;
}

test('it invokes lerna-changelog', async t => {
  let plugin = buildPlugin();

  await runTasks(plugin);

  t.deepEqual(plugin.commands, [
    [`git rev-parse --verify v1.0.0`, { options: { write: false } }],
    [`${plugin.lernaPath} --next-version=v1.0.1 --from=v1.0.0`, { options: { write: false } }],
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
