/**
 * Conventional Commits 1.0.0, as fixed by CONTRIBUTING.md. The two additions
 * over the shared config are the closed scope list and the ban on tool
 * attribution trailers.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'scope-empty': [2, 'never'],
    'scope-enum': [
      2,
      'always',
      [
        'data',
        'static',
        'react',
        'react-native',
        'vue',
        'svelte',
        'angular',
        'solid',
        'vanilla',
        'tools',
        'repo',
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'no-tool-attribution': [2, 'always'],
    'no-dash-punctuation': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'no-tool-attribution': ({ raw }) => {
          const banned =
            /(co-authored-by:\s*(claude|copilot|cursor|devin|gpt|codex)|generated with|assisted by an ai|🤖)/i;
          return [!banned.test(raw), 'the commit carries a tool attribution, remove it'];
        },
        'no-dash-punctuation': ({ raw }) => [
          !/[–—]/.test(raw),
          'the em dash and the en dash are not allowed, use a colon or a full stop',
        ],
      },
    },
  ],
};
