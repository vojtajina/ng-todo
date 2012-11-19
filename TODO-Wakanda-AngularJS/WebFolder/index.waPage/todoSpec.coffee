###############################################################################
# App controller UNIT TESTS
###############################################################################
describe 'App', ->
  scope = null

  # load our app
  beforeEach module 'todo'

  # before each spec, instantiate the controller
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope
    $controller 'App', $scope: scope


  #############################################################################
  # scope.add()
  #############################################################################
  describe 'add', ->

    it 'should add new task', ->
      scope.items = []
      scope.newText = 'FAKE TASK'
      scope.add()

      expect(scope.items.length).toBe 1
      expect(scope.items[0].text).toBe 'FAKE TASK'


    it 'should reset newText', ->
      scope.newText = 'SOME TEXT'
      scope.add()

      expect(scope.newText).toBe ''


  #############################################################################
  # scope.remaining()
  #############################################################################
  describe 'remaining', ->

    it 'should return number of remaining tasks that are not done', ->
      scope.items = [new MockItem, new MockItem, new MockItem, new MockItem]
      expect(scope.remaining()).toBe 4

      scope.items[0].done = true
      expect(scope.remaining()).toBe 3


  #############################################################################
  # scope.archive()
  #############################################################################
  describe 'archive', ->

    it 'should remove tasks that are done', ->
      scope.items = [new MockItem, new MockItem(done: true), new MockItem]
      scope.archive()

      expect(scope.items.length).toBe 2
      expect(item.done).toBeFalsy for item in scope.items
