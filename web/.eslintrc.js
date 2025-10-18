module.exports = {
  root: true,
  extends: ['next', 'next/core-web-vitals'],
  rules: {
    'react/jsx-sort-props': ['warn', { shorthandFirst: true, multiline: 'last' }]
  }
};
