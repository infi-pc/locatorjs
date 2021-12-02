# LocatorJS

Find any component in code faster than ever.

A plugin for your React dev-stack that allows you to click trough from your "localhost" to your IDE.

## 1. Install

First install it
```sh
    npm install locatorjs
```
or
```sh
    yarn install locatorjs
```

## 2. Setup
### NextJS

add file `babel.config.js` to the root of your project.

```javascript
  module.exports = {
    presets: ["next/babel"],
    // enabled only on development
    plugins: process.env.NODE_ENV === "development" ? ["locatorjs/dist"] : [],
  };
```

### Babel

add `"locatorjs"` plugin to your plugins in `babel.config.js`.

```javascript
  module.exports = {
    plugins: process.env.NODE_ENV === "development" ? ["locatorjs/dist"] : [],
  };
```

## Contributions
Feel free to create issue or pull request. 