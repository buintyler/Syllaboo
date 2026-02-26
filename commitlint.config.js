module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'stt',
        'auth',
        'db',
        'reading',
        'dashboard',
        'inngest',
        'server',
        'expo',
        'claude',
        'repo',
      ],
    ],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};
