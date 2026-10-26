const browserGlobals = Object.fromEntries(['window', 'document', 'localStorage', 'location', 'URL', 'URLSearchParams', 'IntersectionObserver', 'fetch', 'AbortController', 'setTimeout', 'clearTimeout', 'console'].map(name => [name, 'readonly']));
const nodeGlobals = Object.fromEntries(['process', 'console', 'URL', 'URLSearchParams', 'fetch', 'setTimeout', 'clearTimeout', 'setImmediate', 'AbortSignal', 'AbortController', 'Buffer'].map(name => [name, 'readonly']));
export default [
  { ignores: ['dist/**', 'node_modules/**', 'analytics-config.js'] },
  { files: ['*.js', 'scripts/*.mjs', 'eslint.config.mjs'], languageOptions: { ecmaVersion: 2023 }, rules: { 'no-undef': 'error', 'no-unused-vars': ['error', { caughtErrors: 'none', argsIgnorePattern: '^_' }], 'no-dupe-args': 'error', 'no-dupe-keys': 'error', 'no-unreachable': 'error', 'valid-typeof': 'error' } },
  { files: ['*.js'], languageOptions: { sourceType: 'script', globals: browserGlobals } },
  { files: ['scripts/*.mjs', 'eslint.config.mjs'], languageOptions: { sourceType: 'module', globals: nodeGlobals } }
];
