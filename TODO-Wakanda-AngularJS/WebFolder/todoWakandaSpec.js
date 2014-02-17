var API_URL = '/rest/Item';

var RESPONSE = {
  "__entityModel": "Item",
  "__COUNT": 3,
  "__SENT": 3,
  "__FIRST": 0,
  "__ENTITIES": [
    {"__KEY": "35", "__STAMP": 1, "ID": 35, "text": "Try AngularJS", "done": false},
    {"__KEY": "43", "__STAMP": 7, "ID": 43, "text": "Another Task",  "done": false},
    {"__KEY": "42", "__STAMP": 5, "ID": 42, "text": "One more task", "done": false}
  ]
};

var apiUrlForId = function(id) {
  return API_URL + '(' + id + ')';
};

describe('Todo with Wakanda', function() {
  var scope, httpBackend;

  beforeEach(module('todo'));

  beforeEach(inject(function($controller, $rootScope, $httpBackend) {
    // expect the request to mongo lab
    $httpBackend.expectGET(API_URL + '?$orderby=ID').respond(RESPONSE);

    // instantiate the controller
    $controller('Todo', {$scope: $rootScope});

    // flush pending requests
    $httpBackend.flush();

    // store references to access them in specs
    scope = $rootScope;
    httpBackend = $httpBackend;
  }));

  afterEach(function() {
    httpBackend.verifyNoOutstandingExpectation();
  });

  it('should load items from wakanda', function() {
    expect(scope.items.length).toBe(3);
    expect(scope.items[0].text).toBe('Try AngularJS');
  });


  describe('add', function() {
    it('should store item in wakanda', function() {
      httpBackend.expectPOST(API_URL, {text: 'FAKE TASK', done: false}).respond();

      scope.newText = 'FAKE TASK';
      scope.add();
    });
  });


  describe('archive', function() {

    it('should remove tasks that are done', function() {
      expect(scope.items.length).toBe(3);

      // mark first item as done (task with ID 35)
      scope.items[0].done = true;

      // expect delete request for first item
      httpBackend.expectPOST(apiUrlForId('35') + '?$method=delete').respond();

      scope.archive();
      expect(scope.items.length).toBe(2);
    });
  });
});
