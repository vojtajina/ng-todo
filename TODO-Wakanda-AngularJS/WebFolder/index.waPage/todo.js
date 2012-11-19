var todo = angular.module('todo', ['wakandaResource']);

todo.controller('Todo', function($scope, Item) {
  $scope.items = Item.query();

  $scope.add = function() {
    var item = new Item({text: $scope.newText, done: false});
    $scope.items.push(item);
    $scope.newText = '';

    item.$save();
  };

  $scope.remaining = function() {
    return $scope.items.reduce(function(count, item) {
      return item.done ? count : count + 1;
    }, 0);
  };

  $scope.archive = function() {
    $scope.items = $scope.items.filter(function(item) {
      if (item.done) {
        item.$remove();
        return false;
      }
      return true;
    });
  };
});

todo.factory('Item', function(wakandaResource) {
  return wakandaResource('/rest/Item:id');
});
