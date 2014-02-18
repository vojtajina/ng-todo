'use strict';

var Item;

angular.module('todo', ['wakConnectorModule'])

function Todo($scope, wakConnectorService) {
  var ready = TodoReady.bind(this, $scope, wakConnectorService);
  wakConnectorService.init('Item').then(ready);
}

function TodoReady($scope, $wakanda) {
	
  Item = $wakanda.getDatastore().Item;

  $scope.items = [];
    
  $scope.add = function() {
    var item = Item.$create({text: $scope.newText, done: false});
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
  
  Item.$find({}).then(function(event) {
    $scope.items = event.result;
  });

}