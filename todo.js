function ToDo($scope) {
  $scope.items = [
    {text: 'Try AngularJS', done: false},
    {text: 'Visit Brighton', done: false}
  ];

  $scope.add = function() {
    $scope.items.push({text: $scope.newText, done: false});
    $scope.newText = '';
  };

  $scope.remaining = function() {
    return $scope.items.reduce(function(count, item) {
      return item.done ? count : count + 1;
    }, 0);
  };

  $scope.archive = function() {
    $scope.items = $scope.items.filter(function(item) {
      return !item.done;
    });
  };
}
