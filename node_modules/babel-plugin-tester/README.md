<div>
<h1>babel-plugin-tester</h1>

<p>Utilities for testing babel plugins</p>
</div>

---

<!-- prettier-ignore-start -->
[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npmtrends]
[![MIT License][license-badge]][license]

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-17-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
[![PRs Welcome][prs-badge]][prs]
[![Code of Conduct][coc-badge]][coc]
<!-- prettier-ignore-end -->

## The problem

You're writing a babel plugin and want to write tests for it.

## This solution

This is a fairly simple abstraction to help you write tests for your babel
plugin. It works with `jest` (my personal favorite) and most of it should also
work with `mocha` and `jasmine`.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Usage](#usage)
  - [import](#import)
  - [Invoke](#invoke)
  - [options](#options)
  - [Test Objects](#test-objects)
- [Examples](#examples)
  - [Full Example + Docs](#full-example--docs)
  - [Simple Example](#simple-example)
- [Defaults](#defaults)
  - [Un-string snapshot serializer](#un-string-snapshot-serializer)
  - [Prettier formatter](#prettier-formatter)
- [Inspiration](#inspiration)
- [Other Solutions](#other-solutions)
- [Issues](#issues)
  - [🐛 Bugs](#-bugs)
  - [💡 Feature Requests](#-feature-requests)
- [Contributors ✨](#contributors-)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `devDependencies`:

```
npm install --save-dev babel-plugin-tester
```

## Usage

### import

```javascript
import pluginTester from 'babel-plugin-tester'
// or
const pluginTester = require('babel-plugin-tester').default
```

### Invoke

```javascript
import yourPlugin from '../your-plugin'

pluginTester({
  plugin: yourPlugin,
  tests: {
    /* your test objects */
  },
})
```

### options

#### plugin

Your babel plugin. For example:

```javascript
pluginTester({
  plugin: identifierReversePlugin,
  tests: {
    /* your test objects */
  },
})

// normally you would import this from your plugin module
function identifierReversePlugin() {
  return {
    name: 'identifier reverse',
    visitor: {
      Identifier(idPath) {
        idPath.node.name = idPath.node.name.split('').reverse().join('')
      },
    },
  }
}
```

#### pluginName

This is used for the `describe` title as well as the test titles.

#### pluginOptions

This can be used to pass options into your plugin at transform time. This option
can be overwritten using the test object.

##### babel.config.js

To use [babel.config.js](https://babeljs.io/docs/en/configuration) instead of
.babelrc, set babelOptions to the config object:

```
pluginTester({
  plugin: yourPlugin,
  ...
  babelOptions: require('./babel.config.js'),
  ...
  tests: {
    /* your test objects */
  },
});

```

#### title

This can be used to specify a title for the describe block (rather than using
the `pluginName`).

#### filename

Relative paths from the other options will be relative to this. Normally you'll
provide this as `filename: __filename`. The only `options` property affected by
this value is `fixtures`. Test Object properties affected by this value are:
`fixture` and `outputFixture`. If those properties are not absolute paths, then
they will be `path.join`ed with `path.dirname` of the `filename`.

#### endOfLine

This is used to control which line endings the output from babel should have

| Options    | Description                        |
| ---------- | ---------------------------------- |
| `lf`       | Unix - default                     |
| `crlf`     | Windows                            |
| `auto`     | Use the system default             |
| `preserve` | Use the line ending from the input |

#### fixtures

This is a path to a directory with this format:

```
__fixtures__
├── first-test # test title will be: "first test"
│   ├── code.js # required
│   └── output.js # required
└── second-test
    ├── .babelrc # optional
    ├── options.json # optional
    ├── code.js
    └── output.js
```

With this you could make your test config like so:

```javascript
pluginTester({
  plugin,
  fixtures: path.join(__dirname, '__fixtures__'),
})
```

And it would run two tests. One for each directory in `__fixtures__`, with
plugin options set to the content of `options.json`

Options are inherited, placing a `options.json` file in `__fixtures__` would add
those options to all fixtures.

#### tests

You provide test objects as the `tests` option to `babel-plugin-tester`. You can
either provide the `tests` as an object of test objects or an array of test
objects.

If you provide the tests as an object, the key will be used as the title of the
test.

If you provide an array, the title will be derived from it's index and a
specified `title` property or the `pluginName`.

Read more about test objects below.

#### babel

Use this to provide your own implementation of babel. This is particularly
useful if you want to use a different version of babel than what's included in
this package.

#### fixtureOutputExt

Use this to provide your own fixture output file extension. This is particularly
useful if you are testing typescript input. If ommited fixture input file
extension will be used.

#### ...rest

The rest of the options you provide will be [`lodash.merge`][lodash.merge]d with
each test object. Read more about those next!

### Test Objects

A minimal test object can be:

1. A `string` representing code
2. An `object` with a `code` property

Here are the available properties if you provide an object:

#### code

The code that you want to run through your babel plugin. This must be provided
unless you provide a `fixture` instead. If there's no `output` or
`outputFixture` and `snapshot` is not `true`, then the assertion is that this
code is unchanged by the plugin.

#### title

If provided, this will be used instead of the `pluginName`. If you're using the
object API, then the `key` of this object will be the title (see example below).

#### output

If this is provided, the result of the plugin will be compared with this output
for the assertion. It will have any indentation stripped and will be trimmed as
a convenience for template literals.

#### fixture

If you'd rather put your `code` in a separate file, you can specify a filename
here. If it's an absolute path, that's the file that will be loaded, otherwise,
this will be `path.join`ed with the `filename` path.

#### outputFixture

If you'd rather put your `output` in a separate file, you can specify this
instead (works the same as `fixture`).

#### only

To run only this test. Useful while developing to help focus on a single test.
Can be used on multiple tests.

#### skip

To skip running this test. Useful for when you're working on a feature that is
not yet supported.

#### snapshot

If you'd prefer to take a snapshot of your output rather than compare it to
something you hard-code, then specify `snapshot: true`. This will take a
snapshot with both the source code and the output, making the snapshot easier to
understand.

#### error

If a particular test case should be throwing an error, you can that using one of
the following:

```javascript
{
  // ...
  error: true,
  error: 'should have this exact message',
  error: /should pass this regex/,
  error: SyntaxError, // should be instance of this constructor
  error: err => {
    if (err instanceof SyntaxError && /message/.test(err.message)) {
      return true; // test will fail if function doesn't return `true`
    }
  },
}
```

#### setup

If you need something set up before a particular test is run, you can do this
with `setup`. This function will be run before the test runs. It can return a
function which will be treated as a `teardown` function. It can also return a
promise. If that promise resolves to a function, that will be treated as a
`teardown` function.

#### teardown

If you set up some state, it's quite possible you want to tear it down. You can
either define this as its own property, or you can return it from the `setup`
function. This can likewise return a promise if it's asynchronous.

#### formatResult

This defaults to a function which formats your code output with prettier. If you
have prettier configured, then it will use your configuration. If you don't then
it will be default configuration.

If you'd like to specify your own, then feel free to do so. Here's the API:

```javascript
function customFormatter(code, {filename}) {
  // format the code
  return formattedCode
}
```

Learn more about the built-in formatter below.

The use case for this originally was for testing codemods and formatting their
result with `prettier-eslint`.

## Examples

### Full Example + Docs

```javascript
import pluginTester from 'babel-plugin-tester'
import identifierReversePlugin from '../identifier-reverse-plugin'

// NOTE: you can use beforeAll, afterAll, beforeEach, and afterEach
// right here if you need

pluginTester({
  // required
  plugin: identifierReversePlugin,

  // will default to 'unknown plugin'
  pluginName: 'identifier reverse',

  // defaults to the plugin name
  title: 'describe block title',

  // used to test specific plugin options
  pluginOptions: {
    optionA: true,
  },

  // only necessary if you use fixture or outputFixture in your tests
  filename: __filename,

  // these will be `lodash.mergeWith`d with the test objects
  // below are the defaults:
  babelOptions: {
    parserOpts: {},
    generatorOpts: {},
    babelrc: false,
    configFile: false,
  },

  // use jest snapshots (only works with jest)
  snapshot: false,

  // defaults to a function that formats with prettier
  formatResult: customFormatFunction,

  // tests as objects
  tests: {
    // the key is the title
    // the value is the code that is unchanged (because `snapshot: false`)
    // test title will be: `1. does not change code with no identifiers`
    'does not change code with no identifiers': '"hello";',

    // test title will be: `2. changes this code`
    'changes this code': {
      // input to the plugin
      code: 'var hello = "hi";',
      // expected output
      output: 'var olleh = "hi";',
    },
  },

  // tests as an array
  tests: [
    // should be unchanged by the plugin (because `snapshot: false`)
    // test title will be: `1. identifier reverse`
    '"hello";',
    {
      // test title will be: `2. identifier reverse`
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
    },
    {
      // test title will be: `3. unchanged code`
      title: 'unchanged code',
      // because this is an absolute path, the `fixtures` above will not be
      // used to resolve this path.
      fixture: path.join(__dirname, 'some-path', 'unchanged.js'),
      // no output, outputFixture, or snapshot, so the assertion will be that
      // the plugin does not change this code.
    },
    {
      // because these are not absolute paths, they will be joined with the
      // `fixtures` path provided above
      fixture: '__fixtures__/changed.js',
      // because outputFixture is provided, the assertion will be that the
      // plugin will change the contents of `changed.js` to the contents of
      // `changed-output.js`
      outputFixture: '__fixtures__/changed-output.js',
    },
    {
      // as a convenience, this will have the indentation striped and it will
      // be trimmed.
      code: `
        function sayHi(person) {
          return 'Hello ' + person + '!'
        }
      `,
      // this will take a jest snapshot. The snapshot will have both the
      // source code and the transformed version to make the snapshot file
      // easier to understand.
      snapshot: true,
    },
    {
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
      // this can be used to overwrite the setting set above
      pluginOptions: {
        optionA: false,
      },
    },
    {
      title: 'unchanged code',
      setup() {
        // runs before this test
        return function teardown() {
          // runs after this tests
        }
        // can also return a promise
      },
      teardown() {
        // runs after this test
        // can return a promise
      },
    },
  ],
})
```

### Simple Example

```javascript
import pluginTester from 'babel-plugin-tester'
import identifierReversePlugin from '../identifier-reverse-plugin'

pluginTester({
  plugin: identifierReversePlugin,
  snapshot: true,
  tests: [
    {code: '"hello";', snapshot: false},
    {
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
    },
    `
      function sayHi(person) {
        return 'Hello ' + person + '!'
      }
      console.log(sayHi('Jenny'))
    `,
  ],
})
```

## Defaults

### Un-string snapshot serializer

If you're using jest and snapshots, then the snapshot output could have a bunch
of bothersome `\"` to escape quotes because when Jest serializes a string, it
will wrap everything in double quotes. This isn't a huge deal, but it makes the
snapshots harder to read. So we automatically add a snapshot serializer for you
to remove those.

If you don't like that, then do this:

```diff
- import pluginTester from 'babel-plugin-tester'
+ import pluginTester from 'babel-plugin-tester/pure'
```

### Prettier formatter

By default, a formatter is included which formats your results with
[`prettier`](https://prettier.io). It will look for a prettier configuration
relative to the file that's being tested or the current working directory. If it
can't find one, then it uses the default configuration for prettier.

This makes your snapshots easier to read. But if you'd like to not have that,
then you can either import the `pure` file (as shown above) or you can override
the `formatResult` option:

```javascript
pluginTester({
  // ... other options
  formatResult: r => r,
  // ... more options
})
```

## Inspiration

I've been thinking about this for a while. The API was inspired by:

- ESLint's [RuleTester][ruletester]
- [@thejameskyle][@thejameskyle]'s [tweet][jamestweet]

## Other Solutions

- [`@babel/helper-plugin-test-runner`][@babel/helper-plugin-test-runner]

## Issues

_Looking to contribute? Look for the [Good First Issue][good-first-issue]
label._

### 🐛 Bugs

Please file an issue for bugs, missing documentation, or unexpected behavior.

[**See Bugs**][bugs]

### 💡 Feature Requests

Please file an issue to suggest new features. Vote on feature requests by adding
a 👍. This helps maintainers prioritize what to work on.

[**See Feature Requests**][requests]

## Contributors ✨

Thanks goes to these people ([emoji key][emojis]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://kentcdodds.com"><img src="https://avatars.githubusercontent.com/u/1500684?v=3?s=100" width="100px;" alt=""/><br /><sub><b>Kent C. Dodds</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds" title="Documentation">📖</a> <a href="#infra-kentcdodds" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://thejameskyle.com/"><img src="https://avatars3.githubusercontent.com/u/952783?v=3?s=100" width="100px;" alt=""/><br /><sub><b>james kyle</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=thejameskyle" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=thejameskyle" title="Documentation">📖</a> <a href="https://github.com/babel-utils/babel-plugin-tester/pulls?q=is%3Apr+reviewed-by%3Athejameskyle" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=thejameskyle" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/bbohen"><img src="https://avatars1.githubusercontent.com/u/1894628?v=3?s=100" width="100px;" alt=""/><br /><sub><b>Brad Bohen</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/issues?q=author%3Abbohen" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://www.krwelch.com"><img src="https://avatars0.githubusercontent.com/u/1295580?v=3?s=100" width="100px;" alt=""/><br /><sub><b>Kyle Welch</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch" title="Documentation">📖</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/kontrollanten"><img src="https://avatars3.githubusercontent.com/u/6680299?v=4?s=100" width="100px;" alt=""/><br /><sub><b>kontrollanten</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kontrollanten" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/rubennorte"><img src="https://avatars3.githubusercontent.com/u/117921?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Rubén Norte</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=rubennorte" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=rubennorte" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://andreneves.work"><img src="https://avatars2.githubusercontent.com/u/3869532?v=4?s=100" width="100px;" alt=""/><br /><sub><b>André Neves</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=andrefgneves" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=andrefgneves" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/merceyz"><img src="https://avatars0.githubusercontent.com/u/3842800?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kristoffer K.</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=merceyz" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=merceyz" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/lifeart"><img src="https://avatars2.githubusercontent.com/u/1360552?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alex Kanunnikov</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=lifeart" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=lifeart" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://solverfox.dev"><img src="https://avatars3.githubusercontent.com/u/12292047?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sebastian Silbermann</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=eps1lon" title="Code">💻</a></td>
    <td align="center"><a href="http://ololos.space/"><img src="https://avatars1.githubusercontent.com/u/3940079?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Andrey Los</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/issues?q=author%3ARIP21" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/charlesbodman"><img src="https://avatars2.githubusercontent.com/u/231894?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Charles Bodman</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=charlesbodman" title="Documentation">📖</a></td>
    <td align="center"><a href="https://michaeldeboey.be"><img src="https://avatars3.githubusercontent.com/u/6643991?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Michaël De Boey</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=MichaelDeBoey" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/yuyaryshev"><img src="https://avatars0.githubusercontent.com/u/18558421?v=4?s=100" width="100px;" alt=""/><br /><sub><b>yuyaryshev</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=yuyaryshev" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/CzBuCHi"><img src="https://avatars0.githubusercontent.com/u/12444673?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Marek Buchar</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=CzBuCHi" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=CzBuCHi" title="Tests">⚠️</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=CzBuCHi" title="Documentation">📖</a></td>
    <td align="center"><a href="https://twitter.com/_jayphelps"><img src="https://avatars1.githubusercontent.com/u/762949?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jay Phelps</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/pulls?q=is%3Apr+reviewed-by%3Ajayphelps" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://www.mathiassoeholm.com"><img src="https://avatars0.githubusercontent.com/u/1747242?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mathias</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=mathiassoeholm" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification.
Contributions of any kind welcome!

## LICENSE

MIT

<!-- prettier-ignore-start -->
[npm]: https://www.npmjs.com
[node]: https://nodejs.org
[build-badge]: https://img.shields.io/travis/babel-utils/babel-plugin-tester.svg?style=flat-square
[build]: https://travis-ci.org/babel-utils/babel-plugin-tester
[coverage-badge]: https://img.shields.io/codecov/c/github/babel-utils/babel-plugin-tester.svg?style=flat-square
[coverage]: https://codecov.io/github/babel-utils/babel-plugin-tester
[version-badge]: https://img.shields.io/npm/v/babel-plugin-tester.svg?style=flat-square
[package]: https://www.npmjs.com/package/babel-plugin-tester
[downloads-badge]: https://img.shields.io/npm/dm/babel-plugin-tester.svg?style=flat-square
[npmtrends]: https://www.npmtrends.com/babel-plugin-tester
[license-badge]: https://img.shields.io/npm/l/babel-plugin-tester.svg?style=flat-square
[license]: https://github.com/babel-utils/babel-plugin-tester/blob/master/other/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/babel-utils/babel-plugin-tester/blob/master/other/CODE_OF_CONDUCT.md
[emojis]: https://github.com/all-contributors/all-contributors#emoji-key
[all-contributors]: https://github.com/all-contributors/all-contributors

[@babel/helper-plugin-test-runner]: https://github.com/babel/babel/tree/master/packages/babel-helper-plugin-test-runner
[@thejameskyle]: https://github.com/thejameskyle
[jamestweet]: https://twitter.com/thejameskyle/status/864359438819262465
[lodash.mergewith]: https://lodash.com/docs/4.17.4#mergeWith
[ruletester]: http://eslint.org/docs/developer-guide/working-with-rules#rule-unit-tests
<!-- prettier-ignore-end -->
