// this will be populated inside the static `isEnabled` method just below
let RealPlugin;

module.exports = class FakeCJSWrapperPlugin {
  static async isEnabled(...args) {
    // we use the async of this method to enable us to absorb the dynamic
    // import statement

    // dynamic `import()` statements work on Node ^12.17.0 and >= 14; which
    // is within our support range; we can remove this inline disable
    // when https://github.com/mysticatea/eslint-plugin-node/pull/256 (or another
    // PR like it) lands

    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let RealPluginModule = await import('./index.js');
    RealPlugin = RealPluginModule.default;

    return RealPlugin.isEnabled(...args);
  }

  static disablePlugin(...args) {
    return RealPlugin.disablePlugin(...args);
  }

  constructor(...args) {
    // now we just use the "real plugin" as is
    return new RealPlugin(...args);
  }
};
