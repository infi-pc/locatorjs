# LocatorJS compatibility package

`locatorjs` keeps the original package name working by re-exporting
[`@locator/runtime`](https://www.npmjs.com/package/@locator/runtime). New
integrations should install `@locator/runtime` directly and use
[`@locator/babel-jsx`](https://www.npmjs.com/package/@locator/babel-jsx) when
build-time JSX source metadata is needed.

See the [LocatorJS repository](https://github.com/infi-pc/locatorjs) for setup
instructions and examples.
