# @locator/swc-plugin

SWC plugin for LocatorJS that adds `data-source` attributes to JSX elements for use with Next.js App Router and Turbopack.

## Installation

```bash
npm install @locator/swc-plugin
# or
yarn add @locator/swc-plugin
# or
pnpm add @locator/swc-plugin
```

## Usage

### Next.js Configuration

Add the plugin to your `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    swcPlugins: [
      [
        '@locator/swc-plugin',
        {
          // Optional configuration
          enabled: process.env.NODE_ENV === 'development',
          production: false,
          excludeTags: ['Fragment'], // Tags to exclude from transformation
        }
      ]
    ]
  }
}

module.exports = nextConfig
```

### Turbopack Configuration

When using Turbopack (Next.js 13.4+):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.tsx': {
          loaders: [
            {
              loader: '@locator/swc-plugin',
              options: {
                enabled: process.env.NODE_ENV === 'development',
              }
            }
          ]
        },
        '*.jsx': {
          loaders: [
            {
              loader: '@locator/swc-plugin',
              options: {
                enabled: process.env.NODE_ENV === 'development',
              }
            }
          ]
        }
      }
    }
  }
}

module.exports = nextConfig
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable the plugin |
| `production` | `boolean` | `false` | Disable in production mode |
| `excludeTags` | `string[]` | `[]` | List of JSX element names to exclude |

## How It Works

The plugin transforms JSX elements by adding a `data-source` attribute with the format:

```
data-source="<filepath>:<line>:<column>"
```

For example:

```jsx
// Input: app/page.tsx
function HomePage() {
  return <div>Hello World</div>
}

// Output:
function HomePage() {
  return <div data-source="/app/page.tsx:2:10">Hello World</div>
}
```

This allows the LocatorJS browser extension to identify the source location of any JSX element in your code.

## Building from Source

To build the SWC plugin from source, you need Rust and the `wasm32-wasi` target installed:

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add the wasm32-wasi target
rustup target add wasm32-wasi

# Build the plugin
cargo build --target wasm32-wasi --release
```

The built plugin will be available at `target/wasm32-wasi/release/locatorjs_swc_plugin.wasm`.

## Testing

Run the tests with:

```bash
cargo test
```

## Compatibility

- Next.js 13.4+ with App Router
- Turbopack
- SWC (any version that supports plugins)

## License

MIT