// Configuration file for Testacular
// https://github.com/vojtajina/testacular

files = [
  JASMINE,
  JASMINE_ADAPTER,
  // angular stuff
  'angular.js',
  'angular-resource.js',
  'angular-mocks.js',

  'wakanda-resource.js',

  // our app
  'todo.js',

  // unit tests, mocks
  'todoSpec.js',
  'todoWakandaSpec.js',
  'ItemMock.js'
];

autoWatch = true;

browsers = ['ChromeCanary'];
