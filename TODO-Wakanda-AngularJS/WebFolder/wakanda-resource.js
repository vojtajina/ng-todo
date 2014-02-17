var wakanda = angular.module('wakandaResource', ['ngResource']);


wakanda.factory('wakandaResource', function($resource) {
  return function(url, paramDefaults, actions) {
    var Resource = $resource(url, paramDefaults, angular.extend({
      get:    {method: 'GET',  params: {}, isArray: false},
      query:  {method: 'GET',  params: {$orderby: 'ID'}, isArray: true},
      create: {method: 'POST', params: {$method: 'create'}},
      update: {method: 'POST', params: {$method: 'update'}},
      remove: {method: 'POST', params: {$method: 'delete'}}
    }, actions || {}));

    Resource.prototype.$create = function() {
      Resource.create.call(this, {id: '(' + this.ID + ')'}, this);
    };

    Resource.prototype.$remove = function() {
      Resource.remove.call(this, {id: '(' + this.ID + ')'}, {ID: this.ID});
    };

    Resource.prototype.$update = function() {
      Resource.update.call(this, {id: '(' + this.ID + ')'}, this);
    };

    return Resource;
  };
});




wakanda.config(function($httpProvider) {
  $httpProvider.defaults.transformResponse.unshift(function(data) {
    return typeof data === 'string' ? data.replace(/,\}/g, '}') : data;
  });

  $httpProvider.responseInterceptors.push(function() {
    return function(promise) {
      return promise.then(function(response) {
        response.data = response.data.__ENTITIES || response.data;
        response.data.uri = undefined;
        return response;
      });
    };
  });
});
