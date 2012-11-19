todo.factory('Item', function($resource) {

  var Item = $resource('http://api.mongolab.org/api/1/databases/ng-todo/collections/items/:id', {
    apiKey: '4fc27c99e4b0401bdbfd1741'
  }, {
    update: {method: 'PUT'}
  });

  Item.prototype.$remove = function() {
    Item.remove({id: this._id.$oid});
  };

  Item.prototype.$update = function() {
    return Item.update({id: this._id.$oid}, angular.extend({}, this, {_id: undefined}));
  };

  Item.prototype.done = false;

  return Item;
});
