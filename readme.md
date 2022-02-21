![LocatorJS](./docs/logo-noborders.png)

Find any component in code faster than ever.

A plugin for your React dev-stack that allows you to **click trough from your "localhost" to your IDE**.

Works with Babel-based dev-stacks like

- NextJS
- Create React App
- Ionic React
- and anything you can add Babel plugins to

Works with most popular IDEs

- VSCode
- Webstorm
- Atom
- you can define a custom link

![Intro](./docs/intro.gif)

## 1. Install

First install it

```sh
    npm install @locator/runtime
    npm install --save-dev @locator/babel-jsx
```

or

```sh
    yarn add @locator/runtime
    yarn add --dev @locator/babel-jsx
```

## 2. Setup

### NextJS

add file `babel.config.js` to the root of your project.

```javascript
module.exports = {
  presets: ["next/babel"],
  // enabled only on development
  plugins:
    process.env.NODE_ENV === "development" ? ["@locator/babel-jsx/dist"] : [],
};
```

### Babel

add `"locatorjs"` plugin to your plugins in `babel.config.js`.

```javascript
module.exports = {
  plugins:
    process.env.NODE_ENV === "development" ? ["@locator/babel-jsx/dist"] : [],
};
```

### Create React App

for proper customisation you need to install https://github.com/gsoft-inc/craco.
Then add babel plugin in `craco.config.js`

```javascript
module.exports = {
  babel: {
    plugins:
      process.env.NODE_ENV === "development" ? ["@locator/babel-jsx/dist"] : [],
  },
};
```

### Storybook

add `.babelrc` to `.storybook` folder.

```json
{
  "plugins": ["@locator/babel-jsx/dist"]
}
```

Note that we don't add `process.env.NODE_ENV === "development"` to the `.babelrc` file, because we expect that we will want to have LocatorJS even in production.

### Ionic React

Ionic React is based on Create React App so for proper customisation you need to install https://github.com/gsoft-inc/craco.
Then add babel plugin in `craco.config.js`

```javascript
module.exports = {
  babel: {
    plugins:
      process.env.NODE_ENV === "development" ? ["@locator/babel-jsx/dist"] : [],
  },
};
```

## 3. Run

Run your development environment.

Each developer in your team can choose their own target Editor.

## 4. Tell others in your team

Because it will appear to everybody working on the project in development mode, don't forget to notify them so they are not confused with this new addition to their environment.

Feel free to use and modify this template.

```
👋 Hey team, I have added LocatorJS to our repo. It is a tool that helps you quickly find any component in our codebase just by clicking on the component.

If it gets too annoying, click on "hide". You can then use it by holding option/alt.

Let me know about any problems.

More info at https://github.com/infi-pc/locatorjs, you can give them a ⭐️ on GitHub if you like.
```

Each developer can setup their own IDE.

## Using

### Controls

- **Option/Alt+d:** Enable/disable selection
- **Press and hold Option/Alt**: Make boxes clickable on full surface (which can be more convinient than clicking on label)

### Disable LocatorJS on a single machine

if you need to disable LocatorJS on your machine, but don't want to change shared settings, add `LOCATORJS=disabled` to your cookies.

### Custom link

you can create custom links

#### available variables

- `filePath`: full path on your device
- `line`
- `column`

## Troubleshooting

### LocatorJS is not working

Locator is made of two parts: compiler and runtime.
Compiler adds data-locator-id attributes to JSX components.
**Check some of your components and make sure they have data-locator-id attribute.** If they are missing, check if the Babel plugin is properly installed.

## Contributions

Feel free to create issue or pull request.

[more info](./contributig.md)
