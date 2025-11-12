# Clad UI + Vite + React Test Project

✅ **Successfully demonstrates that `clad-ui` components work with React (without Next.js) and Vite!**

This project was created to test the compatibility of `clad-ui` components with React and Vite, solving the Linaria v6 integration issues.

## Tech Stack

- **React 18.3.1** - UI library
- **Vite 6** - Build tool
- **React Router 7** - Routing
- **Linaria 6.2.0** - Zero-runtime CSS-in-JS (via @linaria/core and @linaria/react)
- **WyW-in-JS** - Build-time CSS extraction (@wyw-in-js/vite, @wyw-in-js/babel-preset)
- **Clad UI 1.4.2** - Component library
- **TypeScript 5.5.4** - Type safety

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173)

## Build

```bash
pnpm build
```

## Key Configuration

### Linaria v6 with Vite

The project uses `@wyw-in-js/vite` plugin (not `@linaria/vite`) because Linaria v6 is built on top of WyW-in-JS:

```typescript
// vite.config.ts
import wyw from '@wyw-in-js/vite';

export default defineConfig({
  plugins: [
    wyw({
      include: ['**/*.{ts,tsx}', '**/node_modules/clad-ui/**/*.{js,jsx,ts,tsx}'],
      babelOptions: {
        presets: ['@wyw-in-js/babel-preset'],
      },
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@clad-ui/theme': path.resolve(__dirname, './src/theme/index.ts'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx', // Critical: Treat .js files from clad-ui as JSX
      },
    },
  },
});
```

### Critical Configuration Points

1. **WyW-in-JS Plugin**: Linaria v6 requires `@wyw-in-js/vite`, not `@linaria/vite`
2. **Include Pattern**: Must cover both app code and clad-ui node_modules
3. **JSX Loader**: clad-ui's `.js` files contain JSX, so we need `loader: { '.js': 'jsx' }`
4. **Theme Aliasing**: `@clad-ui/theme` → `./src/theme/index.ts`
5. **Dependencies**: Add `lodash` as clad-ui uses it

### Theme Configuration

The theme is imported from `clad-ui/theme/chotot` and can be customized in `src/theme/index.ts`:

```typescript
import theme from 'clad-ui/theme/chotot';

const appTheme = {
  ...theme,
  // Override theme tokens here
};

export default appTheme;
```

## Project Structure

```
clad-ui-vite-test/
├── src/
│   ├── theme/
│   │   └── index.ts          # Clad UI theme configuration
│   ├── App.tsx                # Main app with routing & clad-ui components
│   └── main.tsx               # Entry point
├── index.html
├── vite.config.ts             # Vite + WyW-in-JS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json
```

## Issues Solved

1. **Linaria v6 compatibility**: Used `@wyw-in-js/vite` instead of deprecated `@linaria/vite`
2. **JSX in .js files**: Configured esbuild loader to treat `.js` as JSX
3. **Missing dependencies**: Added `lodash` which clad-ui depends on
4. **Theme resolution**: Properly aliased `@clad-ui/theme` path

## Peer Dependency Warnings

The warnings about Linaria peer dependencies can be ignored:
```
clad-ui 1.4.2
├── ✕ unmet peer @linaria/core@^4.2.10: found 6.2.0
└── ✕ unmet peer @linaria/react@^4.3.8: found 6.2.0
```

clad-ui works fine with Linaria v6 despite specifying v4 in peer dependencies.
