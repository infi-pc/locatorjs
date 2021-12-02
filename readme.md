# LocatorJS

Find any component in code faster than ever.

A plugin for your React dev-stack that allows you to click trough from your "localhost" to your IDE.

Works with Babel-based dev-stacks like NextJS or Create React App (with Craco) and with most popular IDEs like VSCode, Webstorm or Atom. 
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

## 3. Run 
 
Run your development environment. 

Each developer can setup their own IDE.


## Contributions
Feel free to create issue or pull request. 