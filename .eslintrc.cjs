module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    '@electron-toolkit',
    // '@electron-toolkit/eslint-config-prettier'
    'plugin:jest/recommended'
  ],
  rules: {
    'quotes': ['error', 'single'],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  env: {
    jest: true
  },
  plugins: ['jest'],
}
