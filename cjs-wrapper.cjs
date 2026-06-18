// this will be populated inside the static `isEnabled` method just below
let RealPlugin;

module.exports = class FakeCJSWrapperPlugin {
  static async isEnabled(...args) {
    // we use the async of this method to enable us to absorb the dynamic
    // import statement

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
