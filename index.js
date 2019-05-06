const { EOL } = require('os');
const fs = require('fs');
const { Plugin } = require('release-it');

module.exports = class LernaChangelogGeneratorPlugin extends Plugin {
  get lernaPath() {
    return require.resolve('lerna-changelog/bin/cli');
  }

  async hasTag(tag) {
    try {
      await this.exec(`git rev-parse --verify ${tag}`, { options: { write: false } });
      return true;
    } catch (e) {
      this.debug(`hasTag(${tag}): ${e}`);
      return false;
    }
  }

  async getFirstCommit() {
    let firstCommit = await this.exec(`git rev-list --max-parents=0 HEAD`);

    return firstCommit;
  }

  async getChangelog(_from) {
    let { version, latestVersion } = this.config.getContext();
    let from = _from || `v${latestVersion}`;

    if (!(await this.hasTag(from))) {
      from = await this.getFirstCommit();
    }

    return this.exec(`${this.lernaPath} --next-version=v${version} --from=${from}`, {
      options: { write: false },
    });
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
      let firstCommit = await this.getFirstCommit();

      if (firstCommit) {
        changelog = await this.getChangelog(firstCommit);
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
    let changelog = (await this.getChangelog()) || this.config.getContext().changelog || '';

    this.debug({ changelog });

    // remove first two lines to prevent release notes
    // from including the version number/date (it looks odd
    // in the Github/Gitlab UIs)
    let changelogWithoutVersion = changelog
      .split(EOL)
      .slice(2)
      .join(EOL);

    this.config.setContext({ changelog: changelogWithoutVersion });

    if (this.options.infile) {
      await this.writeChangelog(changelog);
    }
  }
};
