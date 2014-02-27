/**
 * This file adds methods to the exisiting WAF methods to help manipulate WAF data in angular
 * 
 * NOTE : this may not be the best way, for the moment, this is for test purpose only
 */

//transform an EntityCollection to an array so that it could be used by angular (this is just a try !!!)
WAF.EntityCollection.prototype.flatten = function(){

    var result = [];

    this.forEach(function(item){
        result.push(item);
    });

    return result;

};