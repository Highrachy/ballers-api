module.exports = {
  exit: true,
  require: '@babel/register',
  reporter: 'spec',
  spec: ['./test/**/*.test.js'],
  slow: 75,
  timeout: 2000,
  watch: false,
};
