





## v8.0.0 (2025-06-18)

#### :boom: Breaking Change
* [#307](https://github.com/release-it-plugins/lerna-changelog/pull/307) Support release-it 17, 18, and 19 (drop support for 14, 15, and 16). ([@rwjblue](https://github.com/rwjblue))
* [#306](https://github.com/release-it-plugins/lerna-changelog/pull/306) Update Node requirement to v20 ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#308](https://github.com/release-it-plugins/lerna-changelog/pull/308) Update dependencies ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v7.0.0 (2024-05-27)

#### :boom: Breaking Change
* [#302](https://github.com/release-it-plugins/lerna-changelog/pull/302) Bumps to node@18 ([@scalvert](https://github.com/scalvert))

#### :bug: Bug Fix
* [#303](https://github.com/release-it-plugins/lerna-changelog/pull/303) Fixes lodash import that isn't playing nice with ESM ([@scalvert](https://github.com/scalvert))

#### :house: Internal
* [#304](https://github.com/release-it-plugins/lerna-changelog/pull/304) Upgrades ci workflow to use node@18, upgrades action versions ([@scalvert](https://github.com/scalvert))

#### Committers: 2
- Markus Sanin ([@mkszepp](https://github.com/mkszepp))
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v6.1.0 (2024-01-15)

#### :rocket: Enhancement
* [#298](https://github.com/release-it-plugins/lerna-changelog/pull/298) Add support for `release-it@17.0.0` ([@juancarlosjr97](https://github.com/juancarlosjr97))

#### :house: Internal
* [#299](https://github.com/release-it-plugins/lerna-changelog/pull/299) Add `release-it@^17` to CI configuration. ([@rwjblue](https://github.com/rwjblue))
* [#283](https://github.com/release-it-plugins/lerna-changelog/pull/283) Updating actions to standardize between repos ([@scalvert](https://github.com/scalvert))

#### Committers: 3
- Juan Carlos Blanco Delgado ([@juancarlosjr97](https://github.com/juancarlosjr97))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v6.0.0 (2023-07-11)

#### :boom: Breaking Change
* [#279](https://github.com/release-it-plugins/lerna-changelog/pull/279) Release it 16 ([@scalvert](https://github.com/scalvert))

#### :bug: Bug Fix
* [#241](https://github.com/release-it-plugins/lerna-changelog/pull/241) Fix changelog generation on windows ([@patricklx](https://github.com/patricklx))

#### :house: Internal
* [#281](https://github.com/release-it-plugins/lerna-changelog/pull/281) Converting to vitest over jest ([@scalvert](https://github.com/scalvert))
* [#244](https://github.com/release-it-plugins/lerna-changelog/pull/244) Ensure we test latest `release-it@15` version in CI ([@rwjblue](https://github.com/rwjblue))
* [#242](https://github.com/release-it-plugins/lerna-changelog/pull/242) Avoid duplicate linting ([@rwjblue](https://github.com/rwjblue))

#### Committers: 4
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Patrick Pircher ([@patricklx](https://github.com/patricklx))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v5.0.0 (2022-07-20)

#### :boom: Breaking Change
* [#208](https://github.com/release-it-plugins/release-it-lerna-changelog/pull/208) Fix compatibility with `release-it` v15 ([@bertdeblock](https://github.com/bertdeblock))

#### :bug: Bug Fix
* [#223](https://github.com/release-it-plugins/release-it-lerna-changelog/pull/223) Bumps release-it to include fixed exports ([@scalvert](https://github.com/scalvert))

#### :house: Internal
* [#222](https://github.com/release-it-plugins/release-it-lerna-changelog/pull/222) Move test to __tests__ directory ([@scalvert](https://github.com/scalvert))

#### Committers: 2
- Bert De Block ([@bertdeblock](https://github.com/bertdeblock))
- Steve Calvert ([@scalvert](https://github.com/scalvert))


## v4.0.1 (2021-10-25)

#### :bug: Bug Fix
* [#163](https://github.com/rwjblue/release-it-lerna-changelog/pull/163) fix: include CJS wrapper in published files ([@alexlafroscia](https://github.com/alexlafroscia))

#### Committers: 1
- Alex LaFroscia ([@alexlafroscia](https://github.com/alexlafroscia))


## v4.0.0 (2021-10-15)

#### :boom: Breaking Change
* [#158](https://github.com/rwjblue/release-it-lerna-changelog/pull/158) Migrate to using ESM ([@rwjblue](https://github.com/rwjblue))
* [#149](https://github.com/rwjblue/release-it-lerna-changelog/pull/149) Drop support for Node 10 ([@rwjblue](https://github.com/rwjblue))

#### :bug: Bug Fix
* [#148](https://github.com/rwjblue/release-it-lerna-changelog/pull/148) Update Lerna-changelog to 2.2.0 ([@elwayman02](https://github.com/elwayman02))

#### :house: Internal
* [#157](https://github.com/rwjblue/release-it-lerna-changelog/pull/157) Update dependencies/devDependencies to latest ([@rwjblue](https://github.com/rwjblue))
* [#151](https://github.com/rwjblue/release-it-lerna-changelog/pull/151) Migrate from yarn to npm ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Jordan Hawker ([@elwayman02](https://github.com/elwayman02))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v3.1.0 (2020-10-29)

#### :rocket: Enhancement
* [#91](https://github.com/rwjblue/release-it-lerna-changelog/pull/91) Insert new changelog content before the first h2 existing element ([@Turbo87](https://github.com/Turbo87))

#### Committers: 1
- Tobias Bieniek ([@Turbo87](https://github.com/Turbo87))


## v3.0.0 (2020-10-20)

#### :boom: Breaking Change
* [#87](https://github.com/rwjblue/release-it-lerna-changelog/pull/87) Make `release-it` a peer dependency (require host project to provide). ([@rwjblue](https://github.com/rwjblue))
* [#89](https://github.com/rwjblue/release-it-lerna-changelog/pull/89) Drop Node 11 and 13 support. ([@rwjblue](https://github.com/rwjblue))
* [#88](https://github.com/rwjblue/release-it-lerna-changelog/pull/88) Drop `release-it@13` support. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v2.4.0 (2020-09-08)

#### :rocket: Enhancement
* [#78](https://github.com/rwjblue/release-it-lerna-changelog/pull/78) Make compatible with release-it@14 ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v2.3.0 (2020-04-27)

#### :rocket: Enhancement
* [#42](https://github.com/rwjblue/release-it-lerna-changelog/pull/42) Leverage new `getChangelog` hook. ([@rwjblue](https://github.com/rwjblue))

#### :bug: Bug Fix
* [#47](https://github.com/rwjblue/release-it-lerna-changelog/pull/47) Ensure that even if there are no changes, we add _something_ to `CHANGELOG.md.` ([@rwjblue](https://github.com/rwjblue))
* [#48](https://github.com/rwjblue/release-it-lerna-changelog/pull/48) Ensure `CHANGELOG.md` has correct version when `git.tagName` is not present ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#44](https://github.com/rwjblue/release-it-lerna-changelog/pull/44) Only run CI for branch pushes to master and PRs. ([@rwjblue](https://github.com/rwjblue))
* [#43](https://github.com/rwjblue/release-it-lerna-changelog/pull/43) Add Node 14 CI run. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v2.2.0 (2020-04-20)

#### :rocket: Enhancement
* [#37](https://github.com/rwjblue/release-it-lerna-changelog/pull/37) Use `editor` if present on `$PATH`. ([@rwjblue](https://github.com/rwjblue))

#### :bug: Bug Fix
* [#38](https://github.com/rwjblue/release-it-lerna-changelog/pull/38) Ensure custom changelog is displayed initially on release-it@13.5.3+. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v2.1.2 (2020-03-27)

#### :bug: Bug Fix
* [#22](https://github.com/rwjblue/release-it-lerna-changelog/pull/22) Ensure `--dry-run` does not launch editor. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v2.1.1 (2020-03-25)

#### :bug: Bug Fix
* [#19](https://github.com/rwjblue/release-it-lerna-changelog/pull/19) Prevent error when no tags exist. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v2.1.0 (2020-03-19)

#### :rocket: Enhancement
* [#12](https://github.com/rwjblue/release-it-lerna-changelog/pull/12) Show lerna-changelog output _before_ version prompt. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v2.0.0 (2020-03-10)

#### :boom: Breaking Change
* [#5](https://github.com/rwjblue/release-it-lerna-changelog/pull/5) Drop Node 8 support. ([@rwjblue](https://github.com/rwjblue))

#### :rocket: Enhancement
* [#8](https://github.com/rwjblue/release-it-lerna-changelog/pull/8) Add ability to open generated changelog for editing. ([@rwjblue](https://github.com/rwjblue))
* [#6](https://github.com/rwjblue/release-it-lerna-changelog/pull/6) Update lerna-changelog to 1.x. ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#7](https://github.com/rwjblue/release-it-lerna-changelog/pull/7) Update all dependencies / devDependencies. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v1.0.3 (2019-05-17)

#### :memo: Documentation
* [#4](https://github.com/rwjblue/release-it-lerna-changelog/pull/4) Add `keywords` for discoverability ([@webpro](https://github.com/webpro))

#### Committers: 1
- Lars Kappert ([@webpro](https://github.com/webpro))

## v1.0.2 (2019-05-07)

#### :rocket: Enhancement
* [#2](https://github.com/rwjblue/release-it-lerna-changelog/pull/2) Avoid duplicating version info in release notes. ([@rwjblue](https://github.com/rwjblue))

#### :bug: Bug Fix
* [#3](https://github.com/rwjblue/release-it-lerna-changelog/pull/3) Ensure git.tagName formatting works properly. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v1.0.1 (2019-05-06)

#### :memo: Documentation
* [#1](https://github.com/rwjblue/release-it-lerna-changelog/pull/1) Add README and documentation. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))



