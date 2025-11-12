# clad-ui + Vite Compatibility Investigation Report

**Date:** 2025-10-28
**Project:** clad-ui-vite-test
**Status:** ❌ **INCOMPATIBLE** - clad-ui@2.0.1 cannot work with Vite

---

## Executive Summary

After extensive investigation and multiple configuration attempts, **clad-ui@2.0.1 is fundamentally incompatible with Vite** due to architectural differences between Vite and Webpack. The package ships untransformed Linaria CSS-in-JS code that requires Babel/Webpack build-time transformation, which Vite's architecture cannot provide for dependencies.

---

## Project Context

### Goal
Migrate a Next.js application using clad-ui to Vite for faster development experience.

### Current Setup
- **Framework:** React 18.3.1 + Vite 6.0.11
- **Package:** clad-ui@2.0.1
- **CSS-in-JS:** Linaria (@linaria/core 6.2.0, @wyw-in-js/vite 0.4.0)
- **Working Reference:** ct-next-starterkit (Next.js + Webpack)

---

## The Core Problem

### What clad-ui Ships

clad-ui@2.0.1 ships **untransformed Linaria code** in its distribution:

```javascript
// node_modules/clad-ui/dist/css/baseline.js
import { css } from '@linaria/core';
import theme from '@clad-ui/theme';

const baselineStyles = css`
  :global() {
    body {
      font-family: ${theme.fonts.body};
      color: ${theme.colors.textPrimary};
    }
  }
`;
export default baselineStyles;
```

**This code requires build-time transformation** to work:
- The `css` template literal must be processed by Babel with Linaria preset
- The CSS must be extracted to separate files
- Class names must be generated and substituted

### Runtime Error

When loaded in browser without transformation:

```
Uncaught Error: Using the "css" tag in runtime is not supported.
Make sure you have set up the Babel plugin correctly.
    at css (chunk-JWP7H5MC.js:5:9)
    at baseline.js:4:27
```

---

## Why Next.js/Webpack Works

### Configuration Analysis: withCladUi.mjs

The Next.js starterkit uses a custom Webpack configuration that forces Linaria transformation on clad-ui:

```javascript
// /Users/anh.duong/Documents/ChoTot/ct-next-starterkit/withCladUi.mjs

function withCladUi(nextConfig = {}) {
  return withLinaria(withTranspileCladUI(nextConfig));
}

const withTranspileCladUI = (nextConfig) => ({
  ...nextConfig,
  // ✅ Forces Next.js to transpile clad-ui from node_modules
  transpilePackages: ['clad-ui'],

  webpack(config, options) {
    // Traverses Webpack rules and modifies Linaria loader
    traverseRules(config.module.rules);

    // Adds custom loader pipeline
    config.module.rules.push({
      test: /\.[jt]sx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: '@wyw-in-js/webpack-loader',
          options: {
            babelOptions: {
              presets: ['next/babel', '@wyw-in-js'],
            },
          },
        },
      ],
    });

    return config;
  },
});

function traverseRules(rules) {
  for (const rule of rules) {
    // 🔑 THE KEY: Modify Linaria loader to process clad-ui from node_modules
    if (rule?.use?.[0]?.loader?.toString().includes('linaria')) {
      // Exclude all node_modules EXCEPT clad-ui
      rule.exclude = /node_modules(?!.*clad-ui)/;
    }
  }
}
```

### How Webpack Processes clad-ui

```
┌─────────────────────────────────────┐
│ clad-ui source (node_modules)       │
│ const x = css`color: red;`          │
└──────────────┬──────────────────────┘
               │
               ▼ Webpack Module Pipeline
┌─────────────────────────────────────┐
│ 1. transpilePackages: ['clad-ui']  │
│    → Runs SWC/Babel on clad-ui     │
│                                      │
│ 2. @wyw-in-js/webpack-loader        │
│    → Transforms css` to class names │
│    → Extracts CSS to files          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Transformed Output                  │
│ const x = "baseline-abc123";        │
│ + baseline.linaria.module.css       │
└──────────────┬──────────────────────┘
               │
               ▼
          Browser ✅
```

**Key mechanisms:**
1. **transpilePackages** - Forces Next.js to process specific node_modules packages
2. **Webpack rule modification** - `exclude: /node_modules(?!.*clad-ui)/` allows Linaria loader to process clad-ui
3. **Babel integration** - Full Babel pipeline runs on clad-ui files
4. **Loader pipeline control** - Can apply any transformation to any file

---

## Why Vite Cannot Replicate This

### Vite's Architecture

Vite has a fundamentally different architecture optimized for speed:

```
┌─────────────────────────────────────┐
│ clad-ui source (node_modules)       │
│ const x = css`color: red;`          │
└──────────────┬──────────────────────┘
               │
               ▼ esbuild Pre-bundling (Go, no plugins)
┌─────────────────────────────────────┐
│ Pre-bundled (UNTRANSFORMED)         │
│ const x = css`color: red;` ← SAME!  │
│ Cached in node_modules/.vite/       │
└──────────────┬──────────────────────┘
               │
               ▼
          Browser ❌
          Runtime Error: "css tag not supported"
```

### Architectural Differences

| Feature | Webpack (Next.js) | Vite |
|---------|------------------|------|
| **Dependency Processing** | ✅ Can transform node_modules via loaders | ❌ Pre-bundled by esbuild (no Babel) |
| **Loader System** | ✅ Fully customizable per file pattern | ❌ Fixed: esbuild → Vite plugins |
| **Babel on Dependencies** | ✅ Via transpilePackages or loader rules | ❌ Only for source code, not deps |
| **Selective Includes** | ✅ `exclude: /node_modules(?!.*pkg)/` | ❌ All or nothing |
| **Plugin Execution** | ✅ Runs on everything | ⚠️ Skips pre-bundled deps |

### The esbuild Limitation

Vite uses **esbuild** (written in Go) for pre-bundling dependencies:

```javascript
// vite.config.ts
optimizeDeps: {
  include: ['react', 'react-dom'],
  exclude: ['clad-ui'],  // Don't pre-bundle
  esbuildOptions: {
    loader: { '.js': 'jsx' }  // Basic JSX support only
  }
}
```

**Problems:**
1. esbuild has **no Babel plugin system** - cannot run Linaria transformations
2. esbuild processes deps BEFORE Vite plugins run - `@wyw-in-js/vite` never sees clad-ui
3. If we exclude clad-ui from pre-bundling, Vite serves raw files - still untransformed

### The "exclude" Paradox

```
OPTION 1: Include clad-ui in optimizeDeps
  → esbuild pre-bundles it (fast)
  → No Linaria transformation (esbuild doesn't support it)
  → css` tags remain in code
  → Runtime error ❌

OPTION 2: Exclude clad-ui from optimizeDeps
  → Vite serves raw files from node_modules
  → @wyw-in-js/vite plugin doesn't process node_modules by default
  → css` tags remain in code
  → Runtime error ❌

OPTION 3: Configure wyw plugin to include node_modules
  → Plugin runs but files already pre-bundled/cached
  → Transformation doesn't apply to served files
  → Runtime error ❌
```

---

## Attempted Solutions

### 1. ✅ Fixed JSX Parsing Errors

**Problem:** clad-ui ships JSX syntax in `.js` files

**Solution:** Custom Vite plugin to transform JSX before import-analysis

```javascript
// vite.config.ts
import { transform } from 'esbuild';

function cladUiJsxPlugin() {
  return {
    name: 'clad-ui-jsx',
    enforce: 'pre',
    async transform(code, id) {
      const cleanId = id.split('?')[0];
      if (cleanId.includes('node_modules') &&
          cleanId.includes('clad-ui') &&
          cleanId.endsWith('.js')) {
        const result = await transform(code, {
          loader: 'jsx',
          jsx: 'automatic',
          jsxImportSource: 'react',
        });
        return { code: result.code, map: null };
      }
    },
  };
}
```

**Status:** ✅ Resolved JSX parsing errors

### 2. ✅ Fixed Lodash Import Errors

**Problem:** clad-ui imports lodash as ES modules, but lodash exports CommonJS

**Solution:** Alias lodash to lodash-es and install it

```javascript
// vite.config.ts
resolve: {
  alias: {
    '@clad-ui/theme': 'clad-ui/theme',
    'lodash': 'lodash-es',  // ES module version
  },
}
```

```bash
pnpm add -D lodash-es
```

**Status:** ✅ Resolved lodash import errors

### 3. ❌ Failed: Linaria Runtime Transformation

**Attempts:**
- Configure `@wyw-in-js/vite` plugin to include node_modules
- Exclude clad-ui from optimizeDeps
- Add clad-ui to wyw plugin include pattern
- Remove clad-ui from exclude list

**All attempts failed** because:
- Vite's architecture doesn't allow transformation of pre-bundled dependencies
- esbuild cannot run Babel transformations
- Vite plugins execute after dependencies are pre-bundled

**Status:** ❌ **CANNOT BE RESOLVED** with current Vite architecture

---

## Current Configuration

### Final vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wyw from '@wyw-in-js/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom plugin to transform clad-ui JSX files before import-analysis
function cladUiJsxPlugin() {
  return {
    name: 'clad-ui-jsx',
    enforce: 'pre',
    async transform(code, id) {
      const cleanId = id.split('?')[0];
      if (cleanId.includes('node_modules') &&
          cleanId.includes('clad-ui') &&
          cleanId.endsWith('.js')) {
        try {
          const result = await transform(code, {
            loader: 'jsx',
            jsx: 'automatic',
            jsxImportSource: 'react',
          });
          return { code: result.code, map: null };
        } catch (e) {
          console.error(`Failed to transform ${id}:`, e);
          return null;
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    cladUiJsxPlugin(),
    react({
      include: [/\.[jt]sx?$/, /node_modules.*clad-ui.*\.js$/],
    }),
    wyw({
      include: ['**/*.{ts,tsx,js,jsx}', '**/node_modules/clad-ui/**/*.js'],
      babelOptions: {
        presets: [
          '@babel/preset-typescript',
          '@babel/preset-react',
          ['@wyw-in-js/babel-preset', {
            evaluate: true,
            displayName: false,
          }],
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@clad-ui/theme': 'clad-ui/theme',
      'lodash': 'lodash-es',
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@clad-ui/theme'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
```

### Dependencies

```json
{
  "dependencies": {
    "@linaria/core": "6.2.0",
    "@linaria/react": "6.2.0",
    "clad-ui": "2.0.1",
    "lodash": "^4.17.21",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.3"
  },
  "devDependencies": {
    "@babel/core": "^7.28.4",
    "@babel/preset-react": "^7.27.1",
    "@babel/preset-typescript": "^7.27.1",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "@wyw-in-js/babel-preset": "^0.4.0",
    "@wyw-in-js/vite": "^0.4.0",
    "esbuild": "0.24.2",
    "lodash-es": "4.17.21",
    "typescript": "^5.5.4",
    "vite": "^6.0.11"
  }
}
```

### Issues Resolved

- ✅ JSX parsing errors (components and icons)
- ✅ Lodash CommonJS/ESM compatibility
- ✅ Build completes successfully
- ✅ Dev server starts without errors

### Issues Remaining

- ❌ **Runtime error:** `Using the "css" tag in runtime is not supported`
- ❌ Linaria CSS-in-JS code not transformed in browser
- ❌ Fundamentally incompatible architecture

---

## Technical Deep Dive

### Why Webpack Can Process node_modules

Webpack's module resolution system allows complete control:

```javascript
// webpack.config.js (conceptual)
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        // ✅ Can use negative lookahead to include specific packages
        exclude: /node_modules(?!.*clad-ui)/,
        use: ['babel-loader']  // Applies Babel to clad-ui
      }
    ]
  }
}
```

**How it works:**
1. Every file import goes through Webpack's resolver
2. Webpack applies rules to ALL files (including node_modules)
3. Regex `(?!.*clad-ui)` = negative lookahead = "exclude all node_modules except clad-ui"
4. babel-loader processes clad-ui files with Linaria preset
5. CSS is extracted, class names generated

### Why Vite Cannot Do the Same

Vite's optimization strategy:

```javascript
// vite internal flow (conceptual)
async function viteDevServer() {
  // 1. Pre-bundle all dependencies with esbuild
  const prebundled = await esbuild.build({
    entryPoints: ['react', 'react-dom', 'clad-ui'],
    bundle: true,
    format: 'esm'
    // ❌ NO Babel, NO plugin system, NO Linaria support
  });

  // 2. Cache pre-bundled deps
  fs.writeFileSync('node_modules/.vite/deps/clad-ui.js', prebundled);

  // 3. Serve cached files directly
  return (req, res) => {
    if (req.url.includes('clad-ui')) {
      // ❌ Serves pre-bundled file, plugins never run
      res.send(fs.readFileSync('node_modules/.vite/deps/clad-ui.js'));
    } else {
      // ✅ Plugins run on source files
      const transformed = await runPlugins(sourceFile);
      res.send(transformed);
    }
  };
}
```

**Key insight:** Vite's speed comes from **NOT** transforming dependencies. This is incompatible with packages that ship untransformed code.

---

## Verification

### Build Success

```bash
$ pnpm build

> tsc && vite build

vite v6.0.11 building for production...
transforming...
✓ 407 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.76 kB │ gzip:   0.41 kB
dist/assets/index-BFKOZEoU.css    1.08 kB │ gzip:   0.45 kB
dist/assets/index-DSvRJr5I.js   385.14 kB │ gzip: 118.72 kB
✓ built in 1.29s
```

### Runtime Error (Browser Console)

```
chunk-JWP7H5MC.js:5 Uncaught Error: Using the "css" tag in runtime is not supported.
Make sure you have set up the Babel plugin correctly.
    at css (chunk-JWP7H5MC.js:5:9)
    at baseline.js:4:27
```

### Dev Server Output

```bash
$ pnpm dev

> vite

  VITE v6.0.11  ready in 993 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
2:35:36 PM [vite] ✨ new dependencies optimized: lodash/escapeRegExp
2:35:36 PM [vite] ✨ optimized dependencies changed. reloading
```

No build-time errors, but **runtime error occurs in browser**.

---

## Comparison: Webpack vs Vite

### Processing Pipeline

**Webpack (Next.js):**
```
Source Code      → babel-loader → webpack plugins → Bundle
node_modules     → babel-loader → webpack plugins → Bundle
  ↓ (selective via exclude pattern)
clad-ui          → babel-loader → Linaria transform → Extracted CSS
```

**Vite:**
```
Source Code      → Vite plugins → ESM served to browser
node_modules     → esbuild → Pre-bundled → ESM served to browser
  ↓ (no selective processing)
clad-ui          → esbuild → ❌ NO TRANSFORMATION → Runtime error
```

### Feature Comparison

| Feature | Webpack | Vite | Impact on clad-ui |
|---------|---------|------|-------------------|
| Selective node_modules processing | ✅ Yes | ❌ No | Critical |
| Babel on dependencies | ✅ Yes | ❌ No | Critical |
| Linaria transformation | ✅ Yes | ⚠️ Source only | Critical |
| Pre-bundling | ❌ No | ✅ Yes (esbuild) | Blocks transformation |
| Dev server speed | ⚠️ Slow | ✅ Fast | n/a |
| Plugin flexibility | ✅ High | ⚠️ Limited | Critical |

---

## Possible Solutions

### 1. ⭐ Use Next.js (Recommended)

**Pros:**
- ✅ Officially supported by clad-ui
- ✅ Works out of the box
- ✅ Maintained configuration (withCladUi.mjs)

**Cons:**
- ❌ Slower dev server than Vite
- ❌ Webpack complexity

**Action:** Keep using Next.js with the existing starterkit

### 2. Fork and Rebuild clad-ui

**Approach:**
```bash
# Fork clad-ui repository
git clone https://github.com/carousell/clad-ui.git
cd clad-ui

# Modify build process to extract CSS at build time
# Publish transformed version to private npm registry
```

**Pros:**
- ✅ Full control over build output
- ✅ Can create Vite-compatible version

**Cons:**
- ❌ Maintenance burden
- ❌ Need to keep in sync with upstream
- ❌ Requires team resources

### 3. Pre-transform clad-ui Before Using

**Approach:**
```bash
# Create a post-install script that transforms clad-ui
{
  "scripts": {
    "postinstall": "node scripts/transform-clad-ui.js"
  }
}
```

**Cons:**
- ❌ Complex script to write
- ❌ Fragile (breaks on clad-ui updates)
- ❌ Requires Babel setup outside of Vite

### 4. Wait for Vite-Compatible Version

Contact clad-ui maintainers and request:
- Pre-extracted CSS in distribution
- Separate builds for Vite and Webpack
- Or full CSS extraction at package build time

**Status:** Requires clad-ui team action

### 5. Use Different UI Library

Switch to a UI library that's Vite-compatible:
- Material UI (MUI)
- Chakra UI
- Tailwind CSS + Headless UI
- Ant Design

**Cons:**
- ❌ Large migration effort
- ❌ Design system change

---

## Conclusion

**clad-ui@2.0.1 is architecturally incompatible with Vite** because:

1. ❌ It ships untransformed Linaria CSS-in-JS code
2. ❌ Vite cannot transform node_modules dependencies with Babel
3. ❌ esbuild (Vite's pre-bundler) has no Linaria support
4. ❌ No way to replicate Webpack's selective node_modules processing

### Recommendation

**Continue using Next.js** with the existing `withCladUi.mjs` configuration. The architecture is designed for this setup and works reliably.

If Vite is required, the only viable path is:
- **Fork clad-ui** and rebuild it with pre-extracted CSS
- Or **use a different UI library** that's Vite-compatible

---

## Additional Resources

### Files Referenced

- **Vite Config:** `/Users/anh.duong/Documents/ChoTot/clad-ui-vite-test/vite.config.ts`
- **Next.js Config:** `/Users/anh.duong/Documents/ChoTot/ct-next-starterkit/withCladUi.mjs`
- **Package:** `clad-ui@2.0.1` from npm
- **Problematic File:** `node_modules/clad-ui/dist/css/baseline.js`

### Key Dependencies

- `@wyw-in-js/vite` 0.4.0 - Linaria plugin for Vite
- `@wyw-in-js/webpack-loader` - Linaria loader for Webpack
- `next-with-linaria` - Next.js Linaria integration
- `esbuild` 0.24.2 - Vite's pre-bundler

### Related Issues

- [Linaria GitHub](https://github.com/callstack/linaria)
- [wyw-in-js Documentation](https://github.com/Andarist/wyw-in-js)
- [Vite Issue Tracker](https://github.com/vitejs/vite/issues)

---

## Q&A for Other LLMs

### Q: Can we configure Vite plugins to process node_modules?

**A:** Vite plugins CAN be configured to match node_modules files, but they won't actually process them because:
1. Dependencies are pre-bundled by esbuild before plugins run
2. Vite serves the pre-bundled cached version directly
3. Plugins only process source files that aren't pre-bundled

### Q: What if we exclude clad-ui from optimizeDeps?

**A:** Excluding from `optimizeDeps` means:
1. Files are served directly from node_modules (not pre-bundled)
2. But Vite plugins still skip node_modules by default
3. Even if we configure plugins to include them, the Linaria transformation happens too late
4. The browser receives untransformed `css` template literals

### Q: Can we use Vite's build mode instead of dev mode?

**A:** Build mode uses Rollup instead of esbuild, which has more flexibility. However:
1. Rollup also doesn't run Babel on node_modules by default
2. Would require complex Rollup plugin configuration
3. Still wouldn't solve dev mode experience
4. Not practical for daily development

### Q: Why does the build succeed but runtime fails?

**A:** The build succeeds because:
1. TypeScript compilation succeeds (no type errors)
2. Vite bundles everything without errors
3. The `css` function from `@linaria/core` is imported successfully

But at runtime:
1. The `css` function checks if it's being called with template literal
2. In production/runtime, this should never happen (CSS should be extracted)
3. Throws error to indicate misconfiguration

### Q: What makes Webpack different from other bundlers?

**A:** Webpack's key advantage:
1. **Unified loader pipeline** - Every file goes through the same system
2. **Regex-based includes/excludes** - Can selectively process node_modules
3. **Deep Babel integration** - Can run full Babel on any file
4. **Flexible architecture** - Complete control over transformation

Most modern bundlers (Vite, esbuild, Turbopack) optimize by **NOT** transforming dependencies, which is faster but less flexible.

---

**End of Report**
