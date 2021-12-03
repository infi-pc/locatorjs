![Intro](./docs/logo-noborders.png)

Find any component in code faster than ever.

A plugin for your React dev-stack that allows you to **click trough from your "localhost" to your IDE**.

Works with Babel-based dev-stacks like 
- NextJS 
- Create React App (with Craco) 
- and anything you can add Babel plugins

Works with most popular IDEs 
- VSCode 
- Webstorm 
- Atom
- you can define custom link

![Intro](./docs/intro.gif)

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

### Controls
- **Option/Alt+d:** Enable/disable selection
- **Press and hold Option/Alt**: Make boxes clickable on full surface (which can be more convinient than clicking on label)

### Custom link template variables

#### available variables
- `filePath`: full path on your device
- `line`
- `column`

## Contributions
Feel free to create issue or pull request. 