import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wyw from '@wyw-in-js/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { transform } from 'esbuild';
import { transform as babelTransform } from '@babel/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Custom plugin to transform @chotot/clad-ui files with Babel + Linaria
function cladUiLinariaPlugin() {
  return {
    name: '@chotot/clad-ui-linaria',
    enforce: 'pre' as const,
    async load(id) {
      // Try to load and transform @chotot/clad-ui files containing Linaria code
      const cleanId = id.split('?')[0];
      if (cleanId.includes('node_modules')) {
        // This is a dependency - let transform handle it
        return null;
      }
      return null;
    },
    async transform(code, id) {
      // Strip query string from ID
      const cleanId = id.split('?')[0];

      // Process @chotot/clad-ui files that might contain Linaria code
      // Also check for absolute paths to @chotot/clad-ui
      const isCladUi =
        cleanId.includes('@chotot/clad-ui') &&
        (cleanId.includes('node_modules') || cleanId.includes('/@chotot/clad-ui/'));

      if (isCladUi) {
        // Process .styles.js files - they contain styled() calls that MUST be transformed
        const isStylesFile = cleanId.endsWith('.styles.js');
        if (isStylesFile) {
          console.log(
            `[@chotot/clad-ui-linaria] 🔧 Processing .styles.js file: ${cleanId.substring(cleanId.lastIndexOf('/') + 1)}`
          );
          // Transform .styles.js files with Babel + wyw-in-js preset
          try {
            const themePath = require.resolve('@chotot/clad-ui/theme', {
              paths: [path.dirname(cleanId)],
            });
            let modifiedCode = code.replace(/from ['"]@clad-ui\/theme['"]/g, `from '${themePath}'`);

            const result = await babelTransform(modifiedCode, {
              filename: cleanId,
              presets: [
                '@babel/preset-react',
                [
                  '@wyw-in-js/babel-preset',
                  {
                    evaluate: true,
                    displayName: false,
                    extensions: ['.js', '.jsx', '.ts', '.tsx'],
                  },
                ],
              ],
              plugins: [
                [
                  'babel-plugin-module-resolver',
                  {
                    root: [path.dirname(cleanId)],
                    alias: {
                      '@clad-ui/theme': themePath,
                    },
                  },
                ],
              ],
            });

            if (result && result.code) {
              console.log(`[@chotot/clad-ui-linaria] ✅ Successfully transformed .styles.js file`);
              return {
                code: result.code,
                map: result.map || null,
              };
            }
          } catch (e: any) {
            console.error(
              `[@chotot/clad-ui-linaria] ❌ Failed to transform .styles.js file:`,
              e?.message || e
            );
            // If transformation fails, return null to let wyw-in-js try
            return null;
          }
        }

        // Check if file contains Linaria css or styled template literals
        // Match: css`...` or styled.xxx`...` or styled(...)`...` or styled.xxx(...)`...`
        // Also check for imports from @linaria packages
        const hasLinariaCode =
          /css\s*`/.test(code) ||
          /styled\s*\./.test(code) ||
          /styled\s*\(/.test(code) ||
          code.includes("from '@linaria/react'") ||
          code.includes('from "@linaria/react"') ||
          code.includes("from '@linaria/core'") ||
          code.includes('from "@linaria/core"') ||
          // Match template literals that might be css/styled even if not obvious
          (code.includes('@linaria') && /`/.test(code));

        if (hasLinariaCode) {
          console.log(
            `[@chotot/clad-ui-linaria] Transforming file: ${cleanId.substring(cleanId.lastIndexOf('/') + 1)}`
          );
          // Replace @clad-ui/theme imports with actual path before transformation
          // This helps Babel resolve the module during evaluation
          let modifiedCode = code;
          const themePath = require.resolve('@chotot/clad-ui/theme', {
            paths: [path.dirname(cleanId)],
          });
          modifiedCode = modifiedCode.replace(
            /from ['"]@clad-ui\/theme['"]/g,
            `from '${themePath}'`
          );
          modifiedCode = modifiedCode.replace(
            /import\s+.*\s+from\s+['"]@clad-ui\/theme['"]/g,
            (match) => match.replace('@clad-ui/theme', themePath)
          );

          try {
            // Use Babel with wyw-in-js preset to transform Linaria code
            // Make sure we process styled components too
            const result = await babelTransform(modifiedCode, {
              filename: cleanId,
              presets: [
                '@babel/preset-react',
                [
                  '@wyw-in-js/babel-preset',
                  {
                    evaluate: true,
                    displayName: false,
                    // Ensure styled components are transformed
                    extensions: ['.js', '.jsx', '.ts', '.tsx'],
                  },
                ],
              ],
              plugins: [
                [
                  'babel-plugin-module-resolver',
                  {
                    root: [path.dirname(cleanId)],
                    alias: {
                      '@clad-ui/theme': themePath,
                      '@chotot/clad-ui': path.dirname,
                    },
                  },
                ],
              ],
            });

            if (result && result.code) {
              console.log(`[@chotot/clad-ui-linaria] ✅ Successfully transformed`);
              return {
                code: result.code,
                map: result.map || null,
              };
            } else {
              console.log(`[@chotot/clad-ui-linaria] ⚠️ No code returned from transform`);
            }
          } catch (e: any) {
            const errorMsg = e?.message || String(e);
            console.error(
              `[@chotot/clad-ui-linaria] ❌ Failed to transform ${cleanId.substring(cleanId.lastIndexOf('/') + 1)}:`,
              errorMsg
            );
            // If it's a module resolution error, try without evaluation
            if (errorMsg.includes('Cannot find module') || errorMsg.includes('@clad-ui/theme')) {
              console.log(`[@chotot/clad-ui-linaria] Retrying without evaluation...`);
              try {
                const resultNoEval = await babelTransform(modifiedCode, {
                  filename: cleanId,
                  presets: [
                    '@babel/preset-react',
                    [
                      '@wyw-in-js/babel-preset',
                      {
                        evaluate: false, // Disable evaluation to avoid module resolution issues
                        displayName: false,
                      },
                    ],
                  ],
                  plugins: [
                    [
                      'babel-plugin-module-resolver',
                      {
                        root: [path.dirname(cleanId)],
                        alias: {
                          '@clad-ui/theme': themePath,
                        },
                      },
                    ],
                  ],
                });
                if (resultNoEval && resultNoEval.code) {
                  console.log(`[@chotot/clad-ui-linaria] ✅ Transformed without evaluation`);
                  return {
                    code: resultNoEval.code,
                    map: resultNoEval.map || null,
                  };
                }
              } catch (e2: any) {
                console.error(`[@chotot/clad-ui-linaria] ❌ Retry also failed:`, e2?.message || e2);
              }
            }
            // Don't throw - return null to let wyw-in-js handle it
            // This is important for .styles.js files - if our plugin fails, wyw-in-js should process them
            return null;
          }
        } else {
          // Debug: log if file was checked but didn't match
          if (cleanId.includes('baseline') || cleanId.includes('css/')) {
            console.log(
              `[@chotot/clad-ui-linaria] 📝 Checked ${cleanId.substring(cleanId.lastIndexOf('/') + 1)} - no css template found`
            );
          }
        }
      }
      // Return null to let other plugins (like wyw-in-js) handle the file
      return null;
    },
  };
}

// Custom plugin to transform @chotot/clad-ui JSX files before import-analysis
function cladUiJsxPlugin() {
  return {
    name: '@chotot/clad-ui-jsx',
    enforce: 'pre' as const,
    async transform(code, id) {
      // Strip query string from ID
      const cleanId = id.split('?')[0];

      // Process ALL @chotot/clad-ui .js files with JSX loader
      // This must run before import-analysis to handle JSX syntax in .js files
      if (
        cleanId.includes('node_modules') &&
        cleanId.includes('@chotot/clad-ui') &&
        cleanId.endsWith('.js') &&
        !cleanId.includes('.styles.js') && // Skip style files
        !cleanId.includes('/css/')
      ) {
        // Skip CSS files
        // Check if file contains JSX syntax or React imports
        const hasJsx = /<[A-Z]/.test(code) || /<\/[A-Z]/.test(code) || /<[a-z]+[^>]*>/.test(code);
        const hasReact = code.includes('react') || code.includes('React');

        // Transform if it has JSX or React imports (likely a component file)
        if (hasJsx || (hasReact && !code.includes('css`'))) {
          // Use esbuild to transform with JSX support
          try {
            const result = await transform(code, {
              loader: 'jsx',
              jsx: 'automatic',
              jsxImportSource: 'react',
            });
            return {
              code: result.code,
              map: null,
            };
          } catch (e) {
            // If transform fails, return original code
            console.error(
              `[@chotot/clad-ui-jsx] Failed to transform ${cleanId.substring(cleanId.lastIndexOf('/') + 1)}:`,
              e
            );
            return null;
          }
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    cladUiJsxPlugin(), // Must run first to transform JSX in .js files before import-analysis
    cladUiLinariaPlugin(), // Transform Linaria code (skips .styles.js files - lets wyw-in-js handle them)
    react({
      include: [/\.[jt]sx?$/, /node_modules.*@chotot\/clad-ui.*\.js$/],
    }),
    wyw({
      include: [
        '**/*.{ts,tsx,js,jsx}',
        '**/node_modules/@chotot/clad-ui/**/*.js',
        '**/node_modules/@chotot/clad-ui/**/*.styles.js', // Explicitly include .styles.js files
      ],
      babelOptions: {
        presets: [
          '@babel/preset-typescript',
          '@babel/preset-react',
          [
            '@wyw-in-js/babel-preset',
            {
              evaluate: true,
              displayName: false,
            },
          ],
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@clad-ui/theme': '@chotot/clad-ui/theme',
      lodash: 'lodash-es',
    },
  },
  ssr: {
    noExternal: ['@chotot/clad-ui', '@clad-ui/theme'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lodash-es'],
    exclude: ['@chotot/clad-ui', '@clad-ui/theme', '@linaria/react', '@linaria/core'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
