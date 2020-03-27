const { EOL } = require('os');
const fs = require('fs');
const { Plugin } = require('release-it');
const { format } = require('release-it/lib/util');
const tmp = require('tmp');
const execa = require('execa');

const LERNA_PATH = require.resolve('lerna-changelog/bin/cli');

// using a const here, because we may need to change this value in the future
// and this makes it much simpler
const UNRELEASED = 'Unreleased';

module.exports = class LernaChangelogGeneratorPlugin extends Plugin {
  async init() {
    let from = (await this.getTagForHEAD()) || (await this.getFirstCommit());
    let changelog = await this._execLernaChangelog(from);

    this.setContext({ changelog });
  }

  get nextVersion() {
    let { version } = this.config.getContext();
    let nextVersion = this.getTagNameFromVersion(version);

    return nextVersion;
  }

  getTagNameFromVersion(version) {
    let tagName = this.config.getContext('git.tagName');

    return format(tagName, { version });
  }

  async getTagForHEAD() {
    try {
      return await this.exec('git describe --tags --abbrev=0', { options: { write: false } });
    } catch (error) {
      return null;
    }
  }

  async getFirstCommit() {
    if (this._firstCommit) {
      return this._firstCommit;
    }

    this._firstCommit = await this.exec(`git rev-list --max-parents=0 HEAD`, {
      options: { write: false },
    });

    return this._firstCommit;
  }

  async _execLernaChangelog(from) {
    let changelog = await this.exec(`${LERNA_PATH} --next-version=${UNRELEASED} --from=${from}`, {
      options: { write: false },
    });

    return changelog;
  }

  async processChangelog(_changelog) {
    let changelog = _changelog.replace(UNRELEASED, this.nextVersion);

    let finalChangelog = await this.reviewChangelog(changelog);

    return finalChangelog;
  }

  async _launchEditor(tmpFile) {
    // do not launch the editor for dry runs
    if (this.global.isDryRun) {
      return;
    }

    let editorCommand;

    if (typeof this.options.launchEditor === 'boolean') {
      let EDITOR = process.env.EDITOR;
      if (!EDITOR) {
        let error = new Error(
          `release-it-lerna-changelog configured to use $EDITOR but no $EDITOR was found`
        );
        this.log.error(error.message);

        throw error;
      }

      // `${file}` is interpolated just below
      editorCommand = EDITOR + ' ${file}';
    } else {
      editorCommand = this.options.launchEditor;
    }

    editorCommand = editorCommand.replace('${file}', tmpFile);

    await execa.command(editorCommand, { stdio: 'inherit' });
  }

  async reviewChangelog(changelog) {
    if (!this.options.launchEditor) {
      return changelog;
    }

    let tmpFile = tmp.fileSync().name;
    fs.writeFileSync(tmpFile, changelog, { encoding: 'utf-8' });

    await this._launchEditor(tmpFile);

    let finalChangelog = fs.readFileSync(tmpFile, { encoding: 'utf-8' });

    return finalChangelog;
  }

  async writeChangelog(changelog) {
    const { infile } = this.options;

    let hasInfile = false;
    try {
      fs.accessSync(infile);
      hasInfile = true;
    } catch (err) {
      this.debug(err);
    }

    if (!hasInfile) {
      // generate an initial CHANGELOG.md with all of the versions
      let firstCommit = await this.getFirstCommit();

      if (firstCommit) {
        changelog = await this._execLernaChangelog(firstCommit, this.nextVersion);
        changelog = changelog.replace(UNRELEASED, this.nextVersion);

        this.debug({ changelog });
      } else {
        // do something when there is no commit? not sure what our options are...
      }
    }

    if (this.global.isDryRun) {
      this.log.log(`! Prepending ${infile} with release notes.`);
    } else {
      let currentFileData = hasInfile ? fs.readFileSync(infile, { encoding: 'utf8' }) : '';
      fs.writeFileSync(infile, changelog + EOL + EOL + currentFileData, { encoding: 'utf8' });
    }

    if (!hasInfile) {
      await this.exec(`git add ${infile}`);
    }
  }

  async beforeRelease() {
    // this is populated in `init`
    let changelog = this.getContext('changelog') || '';
    let processedChangelog = await this.processChangelog(changelog);

    this.debug({ changelog: processedChangelog });

    // remove first two lines to prevent release notes
    // from including the version number/date (it looks odd
    // in the Github/Gitlab UIs)
    let changelogWithoutVersion = processedChangelog
      .split(EOL)
      .slice(2)
      .join(EOL);

    this.config.setContext({ changelog: changelogWithoutVersion });

    if (this.options.infile) {
      await this.writeChangelog(processedChangelog);
    }
  }
};
