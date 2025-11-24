import path from 'path';
import { defineConfig } from 'vite';
import wyw from '@wyw-in-js/vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    root: './',
    base: '',
    plugins: [
      wyw({
        include: ['**/*.{js,jsx,ts,tsx}'],
        babelOptions: {
          presets: ['@babel/preset-typescript', '@babel/preset-react'],
        },
      }),
      react(),
    ],
    build: {
      assetsInlineLimit: 0,
    },
    esbuild: {
      loader: 'tsx',
      exclude: [],
      include: [/\.tsx?$/, /\.jsx?$/],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    resolve: {
      alias: {
        '@chotot/clad-ui': path.resolve('src/clad-ui/dist'),
        '@': path.resolve('src'),
        '@clad-ui/theme': path.resolve('src/theme/index.ts'),
      },
    },
  });
};
