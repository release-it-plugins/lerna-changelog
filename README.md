# release-it-lerna-changelog

This package is a [release-it](https://github.com/release-it/release-it) plugin
(using [`release-it`'s plugin
API](https://github.com/release-it/release-it/tree/master/docs/plugins)) that
integrates [lerna-changelog](https://github.com/lerna/lerna-changelog) into the
`release-it` pipeline.

## Usage

Installation using your projects normal package manager, for example:

```
# npm
npm install --save-dev release-it-lerna-changelog

# yarn add --dev release-it-lerna-changelog
```

Once installed, configure `release-it` to use the plugin. 

Either via `package.json`:

```json
{
  "release-it": {
    "plugins": {
      "release-it-lerna-changelog": {}
    }
  }
}
```

Or via `.release-it.json`:

```json
{
  "plugins": {
    "release-it-lerna-changelog": {}
  }
}
```

## Configuration

`release-it-lerna-changelog` supports one configuration option, `infile`. When
specified, this option represents the file name to prepend changelog
information to during a release.

For example, given the following configuration (in `package.json`):

```json
{
  "release-it": {
    "plugins": {
      "release-it-lerna-changelog": {
        "infile": "CHANGELOG.md",
        "launchEditor": true
      }
    }
  }
}
```

The two options that `release-it-lerna-changelog` is aware of are:

* `infile` -- This represents the filename to put the changelog information into.
* `launchEditor` -- When set to `true`, `release-it-lerna-changelog` will
  invoke the `$EDITOR` from your environment passing it the path to a temp file
  that you can edit to customize the exact changelog contents. When set to a string,
  that specific editor will be executed (as opposed to leveraging `$EDITOR`).

Each release will run `lerna-changelog` and prepend the results into `CHANGELOG.md`.

## License

This project is licensed under the [MIT License](LICENSE.md).
