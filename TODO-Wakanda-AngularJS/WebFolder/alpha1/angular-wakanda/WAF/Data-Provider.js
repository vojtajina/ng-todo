/*
* This file is part of Wakanda software, licensed by 4D under
*  (i) the GNU General Public License version 3 (GNU GPL v3), or
*  (ii) the Affero General Public License version 3 (AGPL v3) or
*  (iii) a commercial license.
* This file remains the exclusive property of 4D and/or its licensors
* and is protected by national and international legislations.
* In any event, Licensee's compliance with the terms and conditions
* of the applicable license constitutes a prerequisite to any use of this file.
* Except as otherwise expressly stated in the applicable license,
* such license does not include any other license or rights on this file,
* 4D's and/or its licensors' trademarks and/or other proprietary rights.
* Consequently, no title, copyright or other proprietary rights
* other than those specified in the applicable license is granted.
*/
/*
WAF.dataProvider = {
	
};
*/

WAF.callHandler = function(withError, errorInfo, event, options, userData)
{
	var result = null;
	event.userData = userData;
  	if (withError)
	{
		var onError = options.onError;
		event.error = errorInfo;
		if (onError != null)
			result = onError(event);
	}
	else
	{
		var onsuccess = options.onSuccess;
		if (onsuccess != null)
			result = onsuccess(event);
	}
	return result;
}

WAF.getRequestResult = function(request)
{
	var response = request.http_request.responseText;
	var result;
	if (response == null)
		result = {  __ERROR:[{errCode:-1}]};
	else
	{
		try
		{
			result = JSON.parse(response);
		}
		catch (e)
		{
			result = {  __ERROR:[e]};
		}
		
	}
	return result;
}


WAF.tools = {};

WAF.tools.optionMatchers = [
		"onSuccess", 
		"onError",
		"atTheEnd",
		"sync", 
		"autoExpand",
		"autoSubExpand",
		"catalog",
		"queryString",
		"skip",
		"top",
		"position",
		"orderby",
		"orderBy",
		"params",
		"queryPlan",
		"queryPath",
		"pageSize",
		"filterSet",
		"progressInfo",
		"progressBar",
		"delay",
		"delayInfo",
		"method",
		"first",
		"limit",
		"userData",
		"addToSet",
		"atOnce",
		"refreshOnly",
		"keepOldCollectionOnError",
		"isMethodResult",
		"prefetchedData",
		"callWithGet",
		"generateRESTRequestOnly",
		"forceReload",
		"doNotAlterElemPos",
		"overrideStamp",
		"queryParams",
		"createEmptyCollection",
		"forceCollectionRefresh",
		"refreshCollectionFrom",
		"removeReferenceOnly",
		"timeout",
		"doNotDispatch",
		"destinationDataSource",
		"filterAttributes",
		"subOrderby",
		"filterQuery",
		"withinCollection",
		"keepOrderBy",
		"retainPositions",
		"fromInitialQuery"
	];

WAF.tools.isOptionParam = function(param)
{
	var result = false;
	if (param != null)
	{
		if (typeof param === 'object')
		{
			var op = WAF.tools.optionMatchers;
			var len = op.length;
			for (var i = 0; i < len && !result; ++i)
			{
				var s = op[i];
				if (s in param)
				{
					result = true;
					break;
				}
			}
		}
	}
	return result;
}

WAF.tools.handleArgs = function(args, startingFrom, handleOptions)
{
	var alreadyOptions = false;
	handleOptions = handleOptions || {};
	startingFrom = startingFrom || 0;
	var noUserData = handleOptions.noUserData || false;
	var with3funcs = handleOptions.with3funcs || false;
	var queryParams = handleOptions.queryParams || false;
	
	var res = { options: {}, userData: null};
	var p;
	var nbparam = args.length;
	var nextparam = startingFrom;
	if (nextparam < nbparam)
	{
		p = args[nextparam];
		if (typeof p === 'function')
		{
			res.options.onSuccess = p;
			++nextparam;
			if (nextparam < nbparam)
			{
				p = args[nextparam];
				if (typeof p === 'function')
				{
					res.options.onError = p;
					++nextparam;
					if (nextparam < nbparam)
					{
						p = args[nextparam];
						if (with3funcs && typeof p === 'function')
						{
							res.options.atTheEnd = p;
							++nextparam;
						}						
					}
				}
			}
			if (res.options.onError == null)
				res.options.onError = res.options.onSuccess;
		}
	}
	
	var params = null;
	if (queryParams) {
		params = [];
	}
		
	do
	{
		if (nextparam < nbparam)
		{
			p = args[nextparam];
			if (!alreadyOptions && WAF.tools.isOptionParam(p))
			{
				alreadyOptions = true;
				++nextparam;
				var oldoptions = res.options
				res.options = p;
				if (oldoptions.onSuccess != null)
					res.options.onSuccess = oldoptions.onSuccess;
				if (oldoptions.onError != null)
					res.options.onError = oldoptions.onError;
				if (oldoptions.atTheEnd != null)
					res.options.atTheEnd = oldoptions.atTheEnd;
				
				if (!queryParams)
				{
					if (nextparam < nbparam && !noUserData)
					{
						res.userData = args[nextparam];
						++nextparam;
					}
				}
			}
			else
			{
				if (queryParams)
				{
					if (typeof p === "object" && !(p instanceof Date) && !(p instanceof Array))
					{
						//cont = false;
						res.userData = p;
						++nextparam;
					}
					else
					{
						params.push(p);
						++nextparam;
					}
				}			
			}
	
		}
	} while (queryParams && (nextparam < nbparam));

	if (res.options.userData != null && res.userData == null)
		res.userData = res.options.userData;
		
	if (queryParams) {
		res.options.params = res.options.params || params;
	}
	
	res.nextParam = nextparam;
		
	return res;
}


// ----------------------------------------- Cache Manager -------------------------------------------------------

WAF.EntityCache = function(options)
{
	// options.timeOut   in milliseconds
	// options.maxEntities
	
	options = options || {};
	
	var cache = this;
	
	this.maxEntities = options.maxEntities || 300;
	this.timeOut = options.timeOut || 5 * 60 * 1000; // 5 min
	this.entitiesByKey = {};
	this.nbEntries = 0;
	this.curStamp = 0;
	
	/*
	this.clear = WAF.EntityCache.clear;
	this.setEntry = WAF.EntityCache.setEntry;
	this.makeRoomFor = WAF.EntityCache.makeRoomFor;
	this.getCacheInfo = WAF.EntityCache.getCacheInfo;
	this.getNextStamp = WAF.EntityCache.getNextStamp;
	this.replaceCachedEntity = WAF.EntityCache.replaceCachedEntity;
	this.removeCachedEntity = WAF.EntityCache.removeCachedEntity;
	this.setSize = WAF.EntityCache.setSize;
	*/
}


WAF.EntityCache.prototype.getNextStamp = function()
{
	var cache = this;
	cache.curStamp++;
	return cache.curStamp;
}


WAF.EntityCache.prototype.clear = function(nbToClear)
{
	var cache = this;
	if (nbToClear == null || nbToClear >= cache.nbEntries)
	{
		cache.entitiesByKey = {};
		cache.nbEntries = 0;
	}
	else
	{
		var all = [];
		var map = cache.entitiesByKey;
		for (var e in map)
		{
			all.push(map[e]);
		}
		all.sort(function(e1,e2)
		{
			return e1.timeStamp > e2.timeStamp ? 1 : -1;  // reverse order , older first
		});
		var nbelem = nbToClear;
		if (nbelem > all.length)
			nbelem = all.length;
		var nbEntries = cache.nbEntries;
		for (var i = 0; i < nbelem; i++)
		{
			var entry = all[i];
			delete map[entry.key];
			--nbEntries;
		}
		cache.nbEntries = nbEntries;
		
		delete all; // just to speed up garbage collector on some implementations
	}
}


WAF.EntityCache.prototype.makeRoomFor = function(nbEntities)
{
	var cache = this;
	if (cache.maxEntities < (nbEntities * 2))
		cache.maxEntities = nbEntities * 2;
	var remain = cache.maxEntities - cache.nbEntries;
	if (remain < nbEntities)
	{
		cache.clear(nbEntities-remain);
	}
}


WAF.EntityCache.prototype.setEntry = function(key, rawEntity, timeStamp, options)
{
	var cache = this;
	var map = cache.entitiesByKey;
	var elem = map[key];
	if (elem == null)
	{
		if (cache.nbEntries >= cache.maxEntities)
		{
			cache.clear(Math.round(cache.nbEntries / 3));
		}
		cache.nbEntries++;
	}
	
	var newStamp = cache.getNextStamp();
	map[key] = { key:key, timeStamp:timeStamp, rawEntity:rawEntity, stamp:newStamp };
	return newStamp;
}


WAF.EntityCache.prototype.getCacheInfo = function(key)
{
	var cache = this;
	var elem = cache.entitiesByKey[key];
	return elem; // may be null
}


WAF.EntityCache.prototype.replaceCachedEntity = function(key, rawEntity)
{
	var cache = this;
	var elem = cache.entitiesByKey[key];
	if (elem != null)
	{
		elem.timeStamp = new Date();
		elem.rawEntity = rawEntity;
		elem.stamp = cache.getNextStamp();
	}
}

WAF.EntityCache.prototype.removeCachedEntity = function(key)
{
	var cache = this;
	var elem = cache.entitiesByKey[key];
	if (elem != null)
	{
		delete cache.entitiesByKey[key];
	}
}

WAF.EntityCache.prototype.setSize = function(nbEntries)
{
	if (nbEntries == null || nbEntries < 300)
		nbEntries = 300;
	this.maxEntities = nbEntries;
}


// ----------------------------------------- DataStore -----------------------------------------------------------



WAF.DataStore = function(options, userData)
{
	// options.catalog Array of datastore class names or string like "class1,class2,..." or null for all
	// options.onSuccess when catalog is loaded
	// options.onError if errors
	// options.userData
	
	options = options || {};
	userData = userData;
	
	var dataStore = this;
	
	this._private =
	{
		owner: this,
		dataClasses: {},
		//dataClassesBySingleName: {},
		dataClassesByCollectionName: {},
		ready: false,
		
		getCatalog: WAF.DataStore.getCatalog
	};
	
	/*
	this.getDataClass = WAF.DataStore.getDataClass;
	this.getDataClasses = WAF.DataStore.getDataClasses;
	*/
	
	dataStore._private.getCatalog(options, userData);
}


WAF.DataStore.prototype.getDataClass = function(name)
{               
	var priv = this._private;
	var dataClass = priv.dataClasses[name];
	if (dataClass == null)
		dataClass = priv.dataClassesByCollectionName[name];
		/*
	if (dataClass == null)
		dataClass = priv.dataClassesBySingleName[name];
		*/
	return dataClass;
}


WAF.DataStore.prototype.getDataClasses = function()
{
	var priv = this._private;
	return priv.dataClasses;
}


WAF.DataStore.prototype.addToCatalog = function(dataClassesList, options, userData){
	userData = userData || null;
	options = options || {};
	var priv = this._private;
	options.catalog = dataClassesList;
	options.mergeCatalog = true;
	priv.getCatalog(options, userData);
}



WAF.DataStore.resolveRelatedAttribute = function()
{
	// this est un attribut de datastore class
	if (!this.resolved)
	{
		var dataStore = this.owner.getDataStore();
		this.relatedClass = dataStore.getDataClass(this.type);
		if (this.relatedClass != null)
			this.resolved = true;
	}
}

WAF.DataStore.getRelatedClassAttribute = function()
{
	this.resolve();
	return this.relatedClass;
}


WAF.DataStore.handleFuncResult = function(request, methodref, dataClass)
{
	var fullResult = WAF.getRequestResult(request);
	if (fullResult.__ERROR == null)
	{	
		if (fullResult.__entityModel != null)
		{
			dataClass = dataClass.getDataStore().getDataClass(fullResult.__entityModel);
		}	
		if (fullResult.__KEY != null || fullResult.__STAMP != null)
		{
			var entity = new WAF.Entity(dataClass, fullResult);
			fullResult = { result: entity};
		}
		else if (fullResult.__ENTITIES != null)
		{
			var entityCollection = new WAF.EntityCollection(dataClass, null,
			{
				prefetchedData: fullResult,
				isMethodResult: true
			});
			fullResult = { result: entityCollection};
		}			
	}
	return fullResult;
}


WAF.DataStore.funcCaller = function(methodref, from, params, options)
{
	var result = null;
	
	options = options || {};
	var oktogo = true;
	var sync = options.sync || false;
	var callWithGet = methodref.callWithGet || options.callWithGet || false;
	var generateRESTRequestOnly = options.generateRESTRequestOnly || false;
    var request = new WAF.core.restConnect.restRequest(!sync);
    //request.app = "";
	if (callWithGet)
		request.httpMethod = WAF.core.restConnect.httpMethods._get;
	else
    	request.httpMethod = WAF.core.restConnect.httpMethods._post;
	
	var entity = null;
	var dataClass = null;
	var entityCollection = null;
	
	var jsonargs = JSON.stringify(params);
	if (callWithGet)
		request.params = params;
	else
    	request.postdata = jsonargs;
	
	if (methodref.applyTo == "entity")
	{
		entity = from;
		dataClass = entity.getDataClass();
		request.attributesRequested = [ methodref.name ];
		request.resource = dataClass.getName() + '(';
		var key = entity.getKey();
		if (key != null)
			request.resource += key;
		request.resource += ')';
	}
	else if (methodref.applyTo == "entityCollection")
	{
		entityCollection = from;
		dataClass = entityCollection.getDataClass();
		if (entityCollection._private.dataURI != null)
			request.dataURI = entityCollection._private.dataURI + "/" + methodref.name;
		else
		{
			request.attributesRequested = [ methodref.name ];
			request.resource = dataClass.getName();
            request.filter = options.queryString;
		}
		entityCollection._private.updateOptions(options);
	}
	else if (methodref.applyTo == "general")
	{
		request.resource = methodref.nameSpace;
		request.attributesRequested = [ methodref.name ];
	}
	else
	{
		dataClass = from;
        request.attributesRequested = [ methodref.name ];
        request.resource = dataClass.getName();
	}
	
	var pageSize = options.pageSize || 40;
	request.top = pageSize;
	request.method = "entityset";
	request.timeout = 300;
	request.addToSet = options.addToSet;
	
	if (options.autoExpand != null)
	{
		request.autoExpand = options.autoExpand;
	}
	if (options.filterAttributes != null)
	{
		request.filterAttributes = options.filterAttributes;
	}
	//var autoExpand = ???
	//request.autoExpand = priv.autoExpand;
	
	if (!sync)
	{
		request.handler = function()
		{
			if (request.http_request.readyState != 4) 
			{
	        	return;
	    	}
			var fullResult = WAF.DataStore.handleFuncResult(request, methodref, dataClass);
			
			var event = {result: fullResult.result};
			var err = fullResult.__ERROR;
			var userData = options.userData || null;
			event.XHR = request.http_request;
			WAF.callHandler(err != null, err, event, options, userData);
		}
	}
	
	if (generateRESTRequestOnly)
		result = request.go({generateRESTRequestOnly:true});
	else
	{
		request.go();
		
		if (sync)
		{
                    var successCallback, failCallback;
                    successCallback = function() {};
                    failCallback = function() {};
                    
                    if (params.length > 0) {
                        if (params[0] && typeof params[0] == 'function') {
                            successCallback = params[0];
                        }
                        
                        if (params[1] && typeof params[1] == 'function') {
                            failCallback = params[1];
                        }
                    }
			if (request.http_request.readyState != 4)
			{
				throw {
	                    error : 401
	            };
			}
			else
			{
				var fullResult = WAF.DataStore.handleFuncResult(request, methodref, dataClass);
				if (fullResult.__ERROR != null)
	            {
                        failCallback(fullResult);
	                throw (fullResult.__ERROR);
	            }
	            else
	            {   
	                result = fullResult.result;
                        successCallback(result);
	            }
			}
		}
	}
	
	return result;
}


WAF.DataStore.callMethod = function(options)
{
	var result = null;
	var em = this;
	var methodRef = em._private.dataClassMethodRefs[options.method];
	if (methodRef != null)
	{
		var myargs = [];
		if (options.arguments != null)
		{
			myargs = options.arguments;
		}
		else
		{
	        for (var i = 1,nb = arguments.length; i < nb; i++) // The first one is skipped.
	        {
	            myargs.push(arguments[i]);
	        }
		}
		result = WAF.DataStore.funcCaller(methodRef, em, myargs, options);		
	}
	return result;
}



WAF.DataStore.makeFuncCaller = function(methodRef)
{
	var methodref = methodRef;
	var func = function()
	{
		var options;
		var alreadyParsedOptions = false;
		var myargs = [];
        for (var i = 0 ,nb = arguments.length; i < nb; i++)
        {
			var p = arguments[i];
			if (!alreadyParsedOptions && WAF.tools.isOptionParam(p)) {
				options = p;
				alreadyParsedOptions = true;
			}
			else 
				myargs.push(p);
        }
		var xoptions = options || {};
		if (xoptions.onSuccess === undefined && xoptions.onError === undefined && xoptions.generateRESTRequestOnly === undefined)
		{
			xoptions.sync = true;
		}
		return WAF.DataStore.funcCaller(methodref, this, myargs, xoptions);	
	}
	
	return func;
}


WAF.DataStore.getCatalog = function(options, userData)
{
	// this est un DataStore.private
	 
	// options.catalog Array of datastore class names or string like "class1,class2,..." or null for all
	// options.onSuccess when catalog is loaded
	// options.onError if errors
	
	var priv = this;
	var dataStore = this.owner;
	var resOp = WAF.tools.handleArgs(arguments, 0);
	userData = resOp.userData;
	options = resOp.options;
	var merge = options.mergeCatalog || false;
	var alreadyDone = false;
	var catResource = "$all";
	
	if (options.catalog != null)
	{
		if (typeof(options.catalog) == 'string')
			catResource = options.catalog;
		else
			catResource = options.catalog.join(",");
		if (merge) {
			classList = catResource.split(",");
			newlist = [];
			classList.forEach(function(classname) {
				if (classname != "" && dataStore[classname] == null)
					newlist.push(classname);
			});
			if (newlist.length == 0)
				alreadyDone = true;
		}
	};
	
	
	if (alreadyDone) {
		var event = {
				dataStore: dataStore,
				result: dataStore
			};
			WAF.callHandler(false, null, event, options, userData);
	}
	else {
		catResource = "$catalog/" + catResource;
		
		var request = new WAF.core.restConnect.restRequest(true);
		
		//request.app = "";
		//request.resource = "$catalog/$all";
		request.resource = catResource;
		
		request.handler = function(){
			if (request.http_request.readyState != 4) {
				return;
			}
			var error = false;
			
			var entitiesList = null;
			var err = null;
			
			try {
                var result = WAF.getRequestResult(request);
                if (result && result.dataClasses) {
                    entitiesList = result.dataClasses; 
                } else {
                    if (result && result.className) {
                        entitiesList = [result];
                    }
                } 
				if (entitiesList == null) 
					entitiesList = [];
				if (result.__ERROR != null) {
					error = true;
					err = result.__ERROR;
				}
			} 
			catch (e) {
				entitiesList = [];
				error = true;
				err = e;
			}
			
			for (var i = 0, nb = entitiesList.length; i < nb; i++) {
			
				var dataClassInfo = entitiesList[i];
				
				var emName = dataClassInfo.name;
				if (dataStore[emName] == null) {
					var collectionName = dataClassInfo.collectionName;
					
					var dataClass = new WAF.DataClass(dataClassInfo, dataStore);
					priv.dataClasses[emName] = dataClass;
					
					if (collectionName != null) 
						priv.dataClassesByCollectionName[collectionName] = dataClass;
					
					dataStore[emName] = dataClass;
				}
			}
			
			priv.ready = true;
			
			var event = {
				dataStore: dataStore,
				result: dataStore
			};
			event.XHR = request.http_request;
			WAF.callHandler(error, err, event, options, userData);
			
		};
		
		var errorFlag = request.go();
	}
}



WAF.DataClass = function(dataClassInfo, dataStore)
{
	var dataClass = this,
        primaryKey = '';
        
        if (dataClassInfo.key) {
            primaryKey = dataClassInfo.key[0].name;
        }
	
	dataClass._private = {
        primaryKey : primaryKey,
		className: dataClassInfo.name,
		collectionName: dataClassInfo.collectionName,
		attributesByName: {},
		entityMethods: {},
		entityCollectionMethods: {},
		//dataClassMethods: {},
		entityMethodRefs: {},
		entityCollectionMethodRefs: {},
		dataClassMethodRefs: {},
		owner: dataClass,
		dataStore: dataStore,
		cache: new WAF.EntityCache(),
		defaultTopSize : dataClassInfo.defaultTopSize,
		getEntityByURIOrKey: WAF.DataClass.getEntityByURIOrKey
	};
	
	var priv = dataClass._private;
	var attsByName = priv.attributesByName;
	var dataClassMethodRefs = priv.dataClassMethodRefs;
	var entityCollectionMethodRefs = priv.entityCollectionMethodRefs;
	var entityMethodRefs = priv.entityMethodRefs;
	var entityCollectionMethods = priv.entityCollectionMethods;
	var entityMethods = priv.entityMethods;
	
	var attributes = dataClassInfo.attributes;
	var methods = dataClassInfo.methods;
	priv.methods = methods;
	
	if (attributes != null)
	{
		for (var j = 0, nbatt = attributes.length; j < nbatt; j++)
		{
			var att = attributes[j];
			att.owner = dataClass;
			attsByName[att.name] = att;
			
			if (att.kind == "storage" || att.kind == "calculated" || att.kind == "alias" || att.kind == "composition")
			{
				att.simple = true;
				att.related = false;
				if (att.type == "image" || att.type == "blob")
					att.simple = false;
			}
			else
			{
				att.simple = false;
				att.related = true;
				att.resolved = false;
				att.relatedOne = (att.kind == "relatedEntity");
				att.resolve = WAF.DataStore.resolveRelatedAttribute;
				att.getRelatedClass = WAF.DataStore.getRelatedClassAttribute;
				att.relatedClass = null;
			}
			dataClass[att.name] = att;
		}
	}
	
	priv.attributes = attributes;
	
	var methlist = methods;
	if (methlist != null)
	{
		for (var j = 0, nbmethod = methlist.length; j < nbmethod; j++) 
		{
			var methodRef = methlist[j];
			if (methodRef.applyTo == "entity")
			{
				entityMethodRefs[methodRef.name] = methodRef;
				entityMethods[methodRef.name] = WAF.DataStore.makeFuncCaller(methodRef);
			}
			else if (methodRef.applyTo == "entityCollection")
			{
				entityCollectionMethodRefs[methodRef.name] = methodRef;
				entityCollectionMethods[methodRef.name] = WAF.DataStore.makeFuncCaller(methodRef);
			}
			else
			{
				dataClassMethodRefs[methodRef.name] = methodRef;
				dataClass[methodRef.name] = WAF.DataStore.makeFuncCaller(methodRef);
			}
			
		}
	}
					
			
	return this;
}

// private function
WAF.DataClass.getEntityByURIOrKey = function(key, dataURI, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 2);
	userData = resOp.userData;
	options = resOp.options;
	
	var priv = this; // dataClass._private;
	var dataClass = priv.owner;
	var request = new WAF.core.restConnect.restRequest(true);
	
	if (dataURI != null)
	{
		request.fullURL = dataURI;
	}
	else
	{
		request.resource = dataClass.getName()+ "("+key+")";
	}
	request.autoExpand = options.autoExpand;
	request.autoSubExpand = options.autoSubExpand;
	request.filterAttributes = options.filterAttributes;
	
	request.handler = function()
	{
		if (request.http_request.readyState != 4) {
            return;
        }
		
		var error = false;
		var err = null;
		var result = WAF.getRequestResult(request);
		if (result.__ERROR != null)
		{
			error = true;
			err = result.__ERROR;
		}
		
		var entity = null;
		if (!error)
		{
			entity = new WAF.Entity(dataClass, result);
			var key = entity.getKey();
			var cache = dataClass.getCache();
			var cacheInfo = cache.getCacheInfo(key);
			if (cacheInfo == null)
			{
				var timeStamp = new Date();
				cache.setEntry(key, result, timeStamp);
			}
			else
			{
				cache.replaceCachedEntity(key, result);
			}
		}
		var event = {entity:entity, result: entity};
		event.XHR = request.http_request;
		WAF.callHandler(error, err, event, options, userData);
	}
	 var errorFlag = request.go();
}


// public functions

WAF.DataClass.getName = function()
{
	return this._private.className;	
}


WAF.DataClass.getCollectionName = function()
{
	return this._private.collectionName;	
}

WAF.DataClass.getDefaultTopSize = function()
{
	return this._private.defaultTopSize;	
}


WAF.DataClass.getDataStore = function()
{
	return this._private.dataStore;
}


WAF.DataClass.getCache = function()
{
	return this._private.cache;
}


WAF.DataClass.setCacheSize = function(nbEntries)
{
	var cache = this._private.cache;
	cache.setSize(nbEntries);
}

WAF.DataClass.getCacheSize = function()
{
	var cache = this._private.cache;
	return cache.maxEntities;
}

WAF.DataClass.clearCache = function()
{
	var cache = this._private.cache;
	cache.clear();
}

WAF.DataClass.getAttributeByName = function(attName)
{
	var dataClass = this;
	return dataClass._private.attributesByName[attName];
}

WAF.DataClass.getAttributes = function()
{
	var dataClass = this;
	return dataClass._private.attributes;
}

WAF.DataClass.getMethodList = function()
{
	var dataClass = this;
	return dataClass._private.methods;
}


WAF.DataClass.newEntity = function()
{
	var entity = new WAF.Entity(this);
	return entity;
}

WAF.DataClass.getEntity = function(key, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;
	var dataClass = this;
	var cache = dataClass.getCache();
	var cacheInfo;
	if (options.forceReload)
		cacheInfo = null;
	else
		cacheInfo = cache.getCacheInfo(key);
	if (cacheInfo == null || cacheInfo.rawEntity == null)
	{
		dataClass._private.getEntityByURIOrKey(key, null, options, userData);
	}
	else
	{
		var entity = new WAF.Entity(dataClass, cacheInfo.rawEntity);
		var event = { entity: entity, result: entity};
		var result = WAF.callHandler(false, null, event, options, userData);
		if (typeof result == "boolean")
		{
			if (!result)
			{
				if (options != null)
					options.mustStopLoop = true;
			}
		}
	}
	
}


WAF.DataClass.newCollection = function(collectionReference, options, userData)
{
	if (collectionReference == null)
	{
		var collection = new WAF.EntityCollection(this, null, {createEmptyCollection: true});
		return collection;
	}
	else
	{
		var resOp = WAF.tools.handleArgs(arguments, 1);
		userData = resOp.userData;
		options = resOp.options;
		
		options.dataURI = collectionReference.dataURI;
		options.pageSize = options.pageSize || collectionReference.pageSize;
		options.autoExpand = options.autoExpand || collectionReference.autoExpand;
		options.filterAttributes = options.filterAttributes || collectionReference.filterAttributes;
		options.savedQuery = collectionReference.savedQuery || null;
		options.savedOrderby = collectionReference.savedOrderby || null;
		
		var collection = new WAF.EntityCollection(this, null, options, userData);
		return collection;		
	}
}



WAF.DataClass.getEntityByURI = function(dataURI, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;
	var dataClass = this;
	dataClass._private.getEntityByURIOrKey(null, dataURI, options, userData);
}


WAF.DataClass.distinctValues = function(attributeName, options, userData)
{
	// attributeName : attribute to get values from
	// options.queryString : query to filter values
	// options.onSuccess : handler, array is received in event.result
	// options.skip : start result array from 'skip'
	// options.top : max length of result array
	// options.onError : handler when error occured
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;

	//var attributeName = options.attributeName;
	var queryString = options.queryString;
	var skip = options.skip;
	var top = options.top;
	
	var dataClass = this;
	
	var request = new WAF.core.restConnect.restRequest(true);
            
	//request.app = "";
	request.resource = dataClass.getName();
	//request.filter = '"'+queryString+'"';
	request.filter = queryString;
	request.skip = skip;
	request.top = top;
    
	request.options = {
		objectRef: this,
		first: skip,
		top: top
	};

	if (attributeName != null)
	{
		request.attributesRequested = [attributeName];
	}
	request.distinct = true;	request.addToSet = options.addToSet;

	request.handler = function(){
    
		if (request.http_request.readyState != 4) {
			return;
		}
        
		var rawResult = WAF.getRequestResult(request);
			
		var withError = false;
		var err = null;
		if (rawResult.__ERROR != null)
		{
			err = rawResult.__ERROR;
			withError = true;
			for (var ierr = 0; ierr < rawResult.__ERROR.length; ierr++)
			{
				var rawerr = rawResult.__ERROR[ierr];
				if (rawerr.options == null)
				{
					rawerr.options = { };
				}
				rawerr.options.position = first;
			}
		}
        
		var event = { result: rawResult, distinctValues: rawResult, XHR: request.http_request};
		WAF.callHandler(withError, err, event, options, userData);
		
	}
	
	request.go();

}


WAF.DataClass.query = function(queryString, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 1, {queryParams:true});
	userData = resOp.userData;
	options = resOp.options;
	
	var dataClass = this;
	/*
	if (options.asArray)
	{
	    var request = new WAF.core.restConnect.restRequest(true);
	    
	    request.resource = dataClass.getName();
		
	   	request.filter = priv.queryString;
	    
	    request.top = top;
		request.skip = skip;
		request.attributesRequested = null;
		request.attributesExpanded = null;
		request.autoExpand = priv.autoExpand;
		request.autoSubExpand = priv.autoSubExpand;
		request.filterAttributes = priv.filterAttributes;
		request.params = priv.params;
		
		request.orderby = options.orderby;
		
		request.retainPositions = options.retainPositions || null;
		
		request.progressInfo = options.progressInfo;
			
		request.orderby = options.orderby;
		request.autoExpand = attributeList;
		request.asArray = true;
		
		if (options.filterQuery)
		{
			request.filter = options.filterQuery;
			request.params = options.params;
		}
	
		request.handler = function(){
		        
		    if (request.http_request.readyState != 4) {
		        return;
		    }
		    
		    var rawResult = WAF.getRequestResult(request);
		    
		    var event = { dataClass: dataClass, result:rawResult, XHR: request.http_request };
			
			var withError = rawResult.__ERROR != null;
			
			WAF.callHandler(withError, rawResult.__ERROR, event, options, userData);	
		          
		};
	
		var errorFlag = request.go();
		

		return null;
	}
	else
	{
	*/
		var entityCollection = new WAF.EntityCollection(dataClass, queryString, options, userData);
		return entityCollection;
	//}
}



WAF.DataClass.allEntities = function(options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 0);
	userData = resOp.userData;
	options = resOp.options;
	return this.query("", options, userData);
}


WAF.DataClass.find = function(queryString, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 1, {queryParams:true});
	userData = resOp.userData;
	options = resOp.options;
	
	var dataClass = this;
	var priv = this._private;

	var request = new WAF.core.restConnect.restRequest(true);
	
	request.resource = dataClass.getName();
	
	request.autoExpand = options.autoExpand;
	request.filterAttributes = options.filterAttributes;
	
	request.filter = queryString;
	request.top = 1;
	request.orderby = options.orderby;
	request.params = options.params;
	
	request.handler = function()
	{
		if (request.http_request.readyState != 4) {
            return;
        }
		
		var error = false;
		var err = null;
		var result = WAF.getRequestResult(request);
		if (result.__ERROR != null)
		{
			error = true;
			err = result.__ERROR;
		}
		
		var entity = null;
		if (!error && result.__ENTITIES != null && result.__ENTITIES.length > 0)
		{
			entity = new WAF.Entity(dataClass, result.__ENTITIES[0]);
		}
		var event = {entity:entity, result: entity, XHR: request.http_request};
		WAF.callHandler(error, err, event, options, userData);
	}
	 var errorFlag = request.go();
}


WAF.DataClass.toArray = function(attributeList, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;

	var dataClass = this;
	var request = new WAF.core.restConnect.restRequest(true);
    request.resource = this.getName();
	    
    request.top = options.top || null;
	request.skip = options.skip || null;
	request.addToSet = options.addToSet;
	request.retainPositions = options.retainPositions || null;
	
	request.progressInfo = options.progressInfo;
		
	request.orderby = options.orderby;
	request.autoExpand = attributeList;
	request.asArray = true;
	
	if (options.filterQuery)
	{
		request.filter = options.filterQuery;
		request.params = options.params;
	}

	request.handler = function(){
	        
	    if (request.http_request.readyState != 4) {
	        return;
	    }
	    
	    var rawResult = WAF.getRequestResult(request);
	    
	    var event = { dataClass: dataClass, result:rawResult, XHR: request.http_request };
		
		var withError = rawResult.__ERROR != null;
		
		WAF.callHandler(withError, rawResult.__ERROR, event, options, userData);	
	          
	};

	var errorFlag = request.go();
}

// --------------------------------- Selections ---------------------------------------------------


WAF.EntityCollectionPage = function(start, length)
{
	var page = this;
	
	this.start = start;
	this.length = length;
	this.entityKeys = [];  // each elem is { key, stamp }
	
}


WAF.EntityCollection = function(dataClass, queryString, options, userData)
{
	// queryString : a query in Wakanda Query Language
	
	// options.orderby : string   contains attribute name separated by a comma 
	// options.filterSet : query will be filtered inside that entity set 
	// options.queryPlan : boolean
	// options.queryPath : boolean 
	// options.pageSize : number  default page size (how many rows) to fetch data from server
	// options.progressInfo : string  identifier of a progress indicator to create on the server
	// options.autoExpand: string  contain the list of attributes to expand (separated by a comma)
	
	// options.dataURI : may contain a predefined URI to a resource like http://server.com/rest/dataClass(key)
	//					 or like http://server.com/rest/dataClass(key)/relatedManyAttribute?$expand=relatedManyAttribute
	
	// options.isMethodResult : boolean true if the entity set is the result of a method call
	// in that case!
			// options.savedPostdata : parameters to function call
			// options.savedResource : rest path to method call
	
	// options.prefetchedData : may contain the first part of the set
	
	if (queryString == "''" || queryString == "")
		queryString = null;
	var resOp = WAF.tools.handleArgs(arguments, 2);
	userData = resOp.userData;
	options = resOp.options;
	
	var dejaSet = options.filterSet;
		
	var savedQuery;
	
	if (dejaSet != null)
	{
		savedQuery = dejaSet._private.savedQuery;
		if (savedQuery != null)
		{
			if (queryString != null)
				savedQuery = "(" + savedQuery+") and "+queryString;
		}
		else
			saveQuery = queryString;
	}
	else savedQuery = queryString;
	
	if (savedQuery == null)
		savedQuery = options.savedQuery || null;
		
	if (options.orderby == null && options.orderBy != null)
		options.orderby = options.orderBy;
		
	var savedOrderby = options.orderby || null;
	if (savedOrderby == null)
		savedOrderby = options.savedOrderby || null;
		
	var pageSize = options.pageSize || 40;
	
	var entityCollection = this;
	
	this._private =
	{
		ready: false,
		owner: this,
		queryString: queryString,
		savedQuery: savedQuery,
		orderby: savedOrderby,
		savedOrderby: savedOrderby,
		dataURI: options.dataURI,
		pageSize: pageSize,
		withQueryPlan: options.queryPlan,
		withQueryPath: options.queryPath,
		progressInfo: options.progressInfo,
		params: options.params,
		dataClass: dataClass,
		methodRefs: dataClass._private.entityCollectionMethodRefs,
		methods: dataClass._private.entityCollectionMethods,
		autoExpand: options.autoExpand,
		autoSubExpand: options.autoSubExpand,
		filterAttributes: options.filterAttributes,
		isMethodResult: options.isMethodResult,
		isARelatedEntityCollection: options.isARelatedEntityCollection,
		loadedElemsLength: 0,
		addedElems: [],
		//savedPostdata: options.savedPostdata,
		//savedResource: options.savedResource,
		curPendingStamp: 0,
		pendingRequests: {}, // map of { start, length }  key is pendingStamp
		pages: [], // an array of EntityCollectionPage
		
		
		clearCache: WAF.EntityCollection.clearCache,
		insertPage: WAF.EntityCollection.insertPage,
		findPage: WAF.EntityCollection.findPage,
		invalidPage: WAF.EntityCollection.invalidPage,
		getKeyByPos: WAF.EntityCollection.getKeyByPos,
		manageData: WAF.EntityCollection.manageData,
		fetchData: WAF.EntityCollection.fetchData,
		addPendingRequest: WAF.EntityCollection.addPendingRequest,
		clearPendingRequest: WAF.EntityCollection.clearPendingRequest,
		clearAllPendingRequest: WAF.EntityCollection.clearAllPendingRequest,
		isPagePending: WAF.EntityCollection.isPagePending,
		gotEntity: WAF.EntityCollection.gotEntity,
		updateOptions: WAF.EntityCollection.updateOptions
	};
	
	var priv = this._private;
	var methods = priv.methods;
	for (var e in methods)
	{
		entityCollection[e] = methods[e];
	}
	
	this.length = 0;
	
	options.init = true;
	
	if (options.createEmptyCollection)
	{
		priv.ready = true;
		queryString = "*";
	}
	else
	{
		if (options.dataURI != null && options.dataURI == "*")
		{
			priv.ready = true;
		}
		else if (options.prefetchedData != null)
		{
			entityCollection._private.manageData(options.prefetchedData, true);
		}
		else
		{
			if (queryString == null && priv.savedQuery == null)
				priv.savedQuery = '$all';
			entityCollection._private.fetchData(0, pageSize, options, userData);
		}
	}
	return entityCollection;
}

					// EntityCollection Pages

WAF.EntityCollection.clearCache = function()
{
	var priv = this;
	priv.pages = [];
}


WAF.EntityCollection.insertPage = function(page)
{
	var priv = this;
	var pages = priv.pages;
	var nbpages = pages.length;
	if (nbpages == 0)
		pages.push(page);
	else
	{
		var posToInsert = -1;
		for (var i = 0; i < nbpages; i++)
		{
			var xpage = pages[i];
			if (xpage.start > page.start)
			{
				posToInsert = i;
				break;
			}
		}
		if (posToInsert == -1)
			pages.push(page);
		else
			pages.splice(posToInsert,0, page);
	}
}


WAF.EntityCollection.findPage = function(pos)
{
	var priv = this;
	var pages = priv.pages;
	var nbpages = pages.length;
	
	var low = 0;
	var high = nbpages;
	while (high>low)
	{
		var middle = Math.floor((high-low)/2) + low;
		var page = pages[middle];
		if (page.start <= pos && (page.start+page.length>pos))
			return middle;
		else
		{
			if (pos < page.start)
			{
				high = middle;
			}
			else
			{
				low = middle+1;
			}
		}
	}
	return -1;
}


WAF.EntityCollection.invalidPage = function(pos)
{
	var priv = this;
	var pagePos = priv.findPage(pos);
	if (pagePos != -1)
		priv.pages.splice(pagePos, 1);
}

WAF.EntityCollection.getKeyByPos = function(pos)
{
	var result = null;
	var priv = this;
	var pagePos = priv.findPage(pos);
	if (pagePos != -1)
	{
		var page = priv.pages[pagePos];
		var keyElem = page.entityKeys[pos-page.start];
		result = keyElem.key; 
	}
	return result;
}

				// EntityCollection Pending Requests

WAF.EntityCollection.addPendingRequest = function(start, length)
{
	var priv = this;
	priv.curPendingStamp++;
	priv.pendingRequests[priv.curPendingStamp] = { start:start, length:length };
	return priv.curPendingStamp;
}

WAF.EntityCollection.clearPendingRequest = function(pendingStamp)
{
	var priv = this;
	delete priv.pendingRequests[pendingStamp];
}


WAF.EntityCollection.clearAllPendingRequest = function()
{
	var priv = this;
	for (var e in priv.pendingRequests)
	{
		priv.pendingRequests[e];
	}
}

WAF.EntityCollection.isPagePending = function(pos)
{
	var priv = this;
	for (var e in priv.pendingRequests)
	{
		var pendingRequest = priv.pendingRequests[e];
		if ( (pendingRequest.start <= pos) && (pendingRequest.start+pendingRequest.length > pos))
			return true;
	}
	return false;
}

				// fetching Data

WAF.EntityCollection.manageData = function(rawResult, init) {
    var priv = this;
    var entityCollection = this.owner;
    var dataClass = entityCollection.getDataClass();
    var cache = dataClass.getCache();
    init = init || false;

    if (init) {
        entityCollection.length = rawResult.__COUNT;
        priv.ready = true;
        priv.loadedElemsLength = entityCollection.length;
        priv.dataURI = rawResult.__ENTITYSET;
        if (priv.autoSubExpand != null) {
            priv.autoExpand = priv.autoSubExpand;
            priv.autoSubExpand = null;
        }

    }

    var nbEnts = rawResult.__SENT;
    var first = rawResult.__FIRST;
    cache.makeRoomFor(nbEnts);
    var arr = rawResult.__ENTITIES;
    var timeStamp = new Date();
    var page = new WAF.EntityCollectionPage(first, nbEnts);
    for (var i = 0; i < nbEnts; i++) {
        var rawEntity = arr[i];
        var xkey;
        if (rawEntity == null) {
            cache.setEntry("", { __STAMP: 0 }, timeStamp);
            xkey = "";
        }
        else {
            xkey = rawEntity.__KEY;
            if (xkey == null)
                xkey = "";
            var stamp = cache.setEntry(xkey, rawEntity, timeStamp);
        }
        page.entityKeys.push({ key: rawEntity.__KEY, stamp: stamp });
    }
    priv.insertPage(page);
}

				
WAF.EntityCollection.fetchData = function(skip, top, options, userData)
{
	// private function
	var resOp = WAF.tools.handleArgs(arguments, 2);
	userData = resOp.userData;
	options = resOp.options;
	var dejaSet = options.filterSet;
	var init = options.init || false;
	
	var priv = this;
	
	var entityCollection = this.owner;
	var dataClass = entityCollection.getDataClass();
	
	var cache = dataClass.getCache();
	var pendingStamp = priv.addPendingRequest(skip, top);
	
    var request = new WAF.core.restConnect.restRequest(true);
    request.entityCollection = entityCollection;
    
    //request.app = "";
    request.resource = priv.dataClass.getName();
	
	if (dejaSet != null)
	{
		if (dejaSet._private.dataURI != null)
		{
			request.dataURI = dejaSet._private.dataURI;
			request.filter = priv.queryString;
		}
		else
			request.filter = priv.savedQuery;				
	}
	else
    	request.filter = priv.queryString;
    
    request.top = top;
	request.skip = skip;
	request.attributesRequested = null;
	request.attributesExpanded = null;
	request.autoExpand = priv.autoExpand;
	request.autoSubExpand = priv.autoSubExpand;
	request.filterAttributes = priv.filterAttributes;
	request.params = priv.params;
	if (priv.mustRefreshCollectionOnNextFetch)
	{
		request.refreshOnly = true;
		priv.mustRefreshCollectionOnNextFetch = false;
	}
	
	if (options.fromSelection)
	{
		request.fromSelection = options.fromSelection;
	}
	
	if (init)
	{
		request.removeAtPos = options.removeAtPos;
		request.removeReferenceOnly = options.removeReferenceOnly;
		request.addToSet = options.addToSet;
		var sel = request.fromSelection;
		if (sel != null)
		{
			request.fromSelection = sel.prepareToSend();
		}
	}
	
	
	request.queryPlan = priv.withQueryPlan;
	request.progressInfo = priv.progressInfo;
	
	if (priv.isARelatedEntityCollection)
		request.method = "subentityset";
	else
		request.method = "entityset";
	request.timeout = options.timeout || 300;
	
	request.savedOrderby = priv.savedOrderby;
	request.savedQueryString = priv.savedQuery;
	request.dataURI = request.dataURI || priv.dataURI;
	if (request.dataURI && (dejaSet == null))
		request.filter = null;
	request.orderby = options.orderby;
	request.subOrderby = options.subOrderby;
	request.keepSelection = options.keepSelection;

	request.handler = function(){
	        
	    if (request.http_request.readyState != 4) {
	        return;
	    }
	    
		priv.clearPendingRequest(pendingStamp);
		
	    var rawResult = WAF.getRequestResult(request);
	    
	    var event = { entityCollection: entityCollection, result:entityCollection, XHR: request.http_request };
		
		var withError = rawResult.__ERROR != null;
		
		if (!withError)
		{
			if (rawResult.__transformedSelection != null)
				event.transformedSelection = rawResult.__transformedSelection;
			priv.manageData(rawResult, init)
		}
		/*
		if (!withError && init)
		{
			entityCollection.length = rawResult.__COUNT;
			priv.ready = true;
			priv.dataURI = rawResult.__ENTITYSET;
			
		}
		
		if (!withError)
		{
			var nbEnts = rawResult.__SENT;
			var first = rawResult.__FIRST;
			cache.makeRoomFor(nbEnts);
			var arr = rawResult.__ENTITIES;
			var timeStamp = new Date();
			var page = new WAF.EntityCollectionPage(first, nbEnts);
			for (var i = 0; i < nbEnts; i++)
			{
				var rawEntity = arr[i];
				var stamp = cache.setEntry(rawEntity.__KEY, rawEntity, timeStamp);
				page.entityKeys.push({key:rawEntity.__KEY, stamp:stamp});
			}
			priv.insertPage(page);
		}
		*/
		WAF.callHandler(withError, rawResult.__ERROR, event, options, userData);	
	          
	};

	var errorFlag = request.go();

}


WAF.EntityCollection.updateOptions = function(options)
{
	var priv = this;
	if (priv.addedElems.length > 0)
	{
		var addedKeys = [];
		for (var i = 0, nbelem = priv.addedElems.length; i< nbelem; i++)
		{
			var e = priv.addedElems[i];
			var key = null;
			if (e != null && e.getKey)
				key = e.getKey();
			if (key != null)
				addedKeys.push(key);
		}
		if (addedKeys.length > 0)
		{
			options.addToSet = addedKeys;
		}
	}
}

// end of private functions





WAF.EntityCollection.getDataClass = function() // returns the datastore class of the set
{
	var entityCollection = this;
	return entityCollection._private.dataClass;
}


WAF.EntityCollection.getReference = function() // returns an object to rebuild the selection later, even in another page
{
	var result = null;
	var entityCollection = this;
	var priv = entityCollection._private;
	
	if (priv.dataURI != null)
	{
		result = { dataURI: priv.dataURI};
		if (priv.savedQuery != null)
			result.savedQuery = priv.savedQuery;
		if (priv.savedOrderby != null)
			result.savedOrderby = priv.savedOrderby;
		if (priv.pageSize != null)
			result.pageSize = priv.pageSize;
		if (priv.autoExpand != null)
			result.autoExpand = priv.autoExpand;
			/*
		if (priv.filterAttributes != null)
			result.filterAttributes = priv.filterAttributes;
			*/
	}
	return result;
}


WAF.EntityCollection.query = function(queryString, options, userData)
{
	// does a query within an existing set, same options as an datastore class query
	
	var resOp = WAF.tools.handleArgs(arguments, 1, {queryParams:true});
	userData = resOp.userData;
	options = resOp.options;
	var entityCollection = this;
	options.filterSet = entityCollection;
	var dataClass = entityCollection.getDataClass();
	options.pageSize = options.pageSize || entityCollection._private.pageSize;
	options.autoExpand = options.autoExpand || entityCollection._private.autoExpand;
	options.filterAttributes = options.filterAttributes || entityCollection._private.filterAttributes;
	
	entityCollection._private.updateOptions(options);
	
	var subEntityCollection = new WAF.EntityCollection(dataClass, queryString, options, userData)
	return subEntityCollection;
}


WAF.EntityCollection.orderBy = function(orderByString, options, userData)
{
	// sorts an existing set, same options as an datastore class query
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;
	
	var entityCollection = this;
	if (this.length == 0) {
		var event = {
			entityCollection: entityCollection,
			result: entityCollection
		};
		WAF.callHandler(false, null, event, options, userData);	
		return entityCollection;
	}
	else {
		options.orderby = orderByString;
		var priv = entityCollection._private;
		options.dataURI = priv.dataURI;
		var dataClass = entityCollection.getDataClass();
		options.pageSize = options.pageSize || priv.pageSize;
		options.autoExpand = options.autoExpand || priv.autoExpand;
		options.filterAttributes = options.filterAttributes || priv.filterAttributes;
		priv.updateOptions(options);
		options.savedQuery = priv.savedQuery || null;
		
		var subEntityCollection = new WAF.EntityCollection(dataClass, null, options, userData)
		return subEntityCollection;
	}
}


WAF.EntityCollection.getEntities = function(pos, howMany, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 2);
	userData = resOp.userData;
	options = resOp.options;
		
	var entityCollection = this;
	var priv = entityCollection._private;
	var lenFromServer = priv.loadedElemsLength;
	var lenLocal = priv.addedElems.length
	var dataClass = entityCollection.getDataClass();
	
	priv.updateOptions(options);

	var result = [];
	var newevent = {entityCollection: entityCollection, result: entityCollection, position:pos, howMany: howMany, entities:result };
	
	if (pos >= lenFromServer)
	{
		var subpos = pos - lenFromServer;
		var realHowMany = howMany;
		if (realHowMany > (lenLocal-subpos))
			realHowMany = lenLocal-subpos;
		if (subpos < lenLocal)
		{
			for (var i = subpos; i < (subpos + realHowMany); ++i)
			{
				result.push(priv.addedElems[i]);
			}
		}
		WAF.callHandler(false, null, newevent, options, userData);
	}
	else
	{
		var realHowMany = howMany;
		if ((pos+realHowMany) > (lenFromServer + lenLocal))
		{
			realHowMany = (lenFromServer + lenLocal) - pos;
		}
		var howManyFromServer = realHowMany;
		if ((pos+howManyFromServer) > lenFromServer)
		{
			howManyFromServer = lenFromServer - pos;
		}
		priv.fetchData(pos, howManyFromServer, {
			onSuccess : function(event) {
				cache = dataClass.getCache();
				for (var i = pos; i < (pos + howManyFromServer); ++i)
				{
					var key = priv.getKeyByPos(i);
					var cacheInfo = cache.getCacheInfo(key);
					if (cacheInfo != null)
					{
						var entity = new WAF.Entity(dataClass, cacheInfo.rawEntity);
						result.push(entity);
					}
					else
					{
						result.push(null);
					}
				}
				if (howManyFromServer < realHowMany)
				{
					var remainHowMany = realHowMany - howManyFromServer;
					for (var i = 0; i < remainHowMany; ++i)
					{
						result.push(priv.addedElems[i]);
					}
				}
				WAF.callHandler(false, null, newevent, options, userData);
			},
			onError : function(event) {
				WAF.callHandler(true, event.error, newevent, options, userData);
			},
			addToSet: options.addToSet || null
		});
	}
	
}

WAF.EntityCollection.getEntity = function(pos, options, userData, doNotFetch)
{
	var executed = false;
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;
	var forceCollectionRefresh = (options != null) && (options.forceCollectionRefresh || false);
	if (resOp.nextParam < arguments.length)
	{
		doNotFetch = arguments[resOp.nextParam] || false;
	}
	else
		doNotFetch = false;
	var entityCollection = this;
	var priv = entityCollection._private;

	var lenToCheck = priv.loadedElemsLength;
	
	if (forceCollectionRefresh)
	{
		priv.clearAllPendingRequest();
		priv.clearCache();
		priv.mustRefreshCollectionOnNextFetch = true;
		lenToCheck = entityCollection.length;
	}
	var dataClass = entityCollection.getDataClass();
		
	if (pos >= lenToCheck )
	{
		var newevent = {entityCollection: entityCollection, result: entityCollection, position:pos};
		var subpos = pos - priv.loadedElemsLength;
		if (subpos < priv.addedElems.length)
		{
			newevent.entity = priv.addedElems[subpos];
			WAF.callHandler(false, null, newevent, options, userData);
		}
		else
		{
			if (forceCollectionRefresh)
				WAF.callHandler(false, null, newevent, options, userData);
			else
				WAF.callHandler(true, [{error : 501, message:"wrong position in entityCollection"}], newevent, options, userData);
		}
	}
	else
	{
		var okfetch = false;
		var key = priv.getKeyByPos(pos);
		if (key == null && !doNotFetch)
		{
			if (priv.isPagePending(pos))
			{
				setTimeout(function()
				{
					entityCollection.getEntity(pos, options, userData)
				}, 100);
			}
			else
				okfetch = true;
		}
		
		if (key != null)
		{
			var cache = dataClass.getCache();
			var cacheInfo = cache.getCacheInfo(key);
			if (cacheInfo != null)
			{
				executed = true;
				priv.gotEntity(cacheInfo, options, userData, pos);
			}
			else
			{
				okfetch = true;
				key = null;
				priv.invalidPage(pos);
			}
		}
		
		if (doNotFetch)
			okfetch = false;
		if (key == null && okfetch)
		{
			var delay, delayInfo;
			if (options != null)
			{
				delay = options.delay;
				delayInfo = options.delayInfo;
			}
			else
			{
				delay = null;
				delayInfo = null;
			}
			if (delay != null && delay != 0 && delayInfo != null)
			{
				//console.log("delayed getEntity at pos: "+pos);
				var delayReq = delayInfo.findMatchingPendingRequest(pos);
				if (delayReq == null)
				{
					var posbefore = pos-20;
					if (posbefore < 0)
						posbefore = 0;
					delayReq = delayInfo.addPendingRequest(0, posbefore, pos+priv.pageSize-1);
					//console.log("new delayReq from "+posbefore+" to "+(pos+priv.pageSize-1));
					delayReq.addFetchRequest(pos, options, userData);
					//console.log("addFetchRequest at pos: "+pos);
					var requestid = setTimeout(function() {
						//console.log("end timeout for request from "+delayReq.top+" to "+delayReq.bottom+ " current visible is "+delayInfo.top+" to "+delayInfo.bottom);
						if (delayReq.matchRange(delayInfo.top,delayInfo.bottom))
						{
							//console.log("matched range: fetching data ");
							var newOptions = {};
							if (forceCollectionRefresh) {
								priv.updateOptions(newOptions);
							}
							priv.fetchData(delayReq.top, (delayReq.bottom-delayReq.top)+1, {
								onSuccess: function(event)
								{
									if (forceCollectionRefresh)
										priv.addedElems = [];
									delayReq.pendingFetch.forEach(function(fetchItem)
									{
										if (fetchItem.pos >= delayInfo.top && fetchItem.pos <= delayInfo.bottom)
										{
											key = priv.getKeyByPos(fetchItem.pos);
											cache = dataClass.getCache();
											var cacheInfo = cache.getCacheInfo(key);
											if (cacheInfo != null)
											{
												priv.gotEntity(cacheInfo, fetchItem.options, fetchItem.userData, fetchItem.pos);
											}
											else
											{
												priv.gotEntity(null, fetchItem.options, fetchItem.userData);
											}
										}
									});
									delayInfo.removePendingRequest(delayReq);
								},
								onError: function(event)
								{
									delayReq.pendingFetch.forEach(function(fetchItem)
									{
										if (fetchItem.pos >= delayInfo.top && fetchItem.pos <= delayInfo.bottom)
										{
											var newevent = {entityCollection: entityCollection, result: entityCollection, position:fetchItem.pos, entity:null};
											WAF.callHandler(true, event.error, newevent, fetchItem.options, fetchItem.userData);
										}
									});
									delayInfo.removePendingRequest(delayReq);
								},
								init: forceCollectionRefresh,
								addToSet: newOptions.addToSet || null
							});		
						}
						else
							delayInfo.removePendingRequest(delayReq);
						
						
					}, delay);
					delayReq.setRequestID(requestid);
				}
				else
				{
					delayReq.addFetchRequest(pos, options, userData);
					//console.log("addFetchRequest at pos: "+pos);
				}
			}
			else
			{
				var newOptions = {};
				if (forceCollectionRefresh) {
					priv.updateOptions(newOptions);
				}
				priv.fetchData(pos, priv.pageSize, {
					onSuccess: function(event)
					{
						if (forceCollectionRefresh)
							priv.addedElems = [];
						key = priv.getKeyByPos(pos);
						cache = dataClass.getCache();
						var cacheInfo = cache.getCacheInfo(key);
						if (cacheInfo != null)
						{
							priv.gotEntity(cacheInfo, options, userData, pos);
						}
						else
						{
							priv.gotEntity(null, options, userData);
						}
					},
					onError: function(event)
					{
						var newevent = {entityCollection: entityCollection, result: entityCollection, position:pos, entity:null};
						WAF.callHandler(true, event.error, newevent, options, userData);
					},
					init: forceCollectionRefresh,
					addToSet: newOptions.addToSet || null
				});
			}
		}
	}
	
	return executed;
}


WAF.EntityCollection.gotEntity = function(cacheInfo, options, userData, position)
{
	var priv = this;
	var entityCollection = priv.owner;
	var entity;
	if (cacheInfo != null)
		entity = new WAF.Entity(entityCollection.getDataClass(), cacheInfo.rawEntity);
	else
		entity = null;
	var event = { entityCollection: entityCollection, result: entity, entity: entity, position: position };
	WAF.callHandler(false, null, event, options, userData);
}



WAF.EntityCollection.callMethod = function(options)
{
	var entityCollection = this;
	var methodRef = entityCollection._private.methodRefs[options.method];
	if (methodRef != null)
	{
		var myargs = [];
		if (options.arguments != null)
		{
			myargs = options.arguments;
		}
		else
		{
	        for (var i = 1,nb = arguments.length; i < nb; i++) // The first one is skipped.
	        {
	            myargs.push(arguments[i]);
	        }
		}
		
		return WAF.DataStore.funcCaller(methodRef, entityCollection, myargs, options);		
	}
}


WAF.EntityCollection.parseForEach = function(options, parseData)
{
	var executed = true;
	var entityCollection = parseData.entityCollection;
	var priv = entityCollection._private;
	var stop = false;
	
	while (executed && parseData.curelem < parseData.limit && !stop)
	{
		executed = entityCollection.getEntity(parseData.curelem, options, parseData.userData, true);
		if (options != null && options.mustStopLoop)
			stop = true;
		else
		{
			if (executed)
				parseData.curelem++;
			else
			{
				entityCollection.getEntity(parseData.curelem, 
				{
					onSuccess: function(event)
					{
						WAF.EntityCollection.parseForEach(options, parseData)
					},
					onError: function(event)
					{
						WAF.callHandler(true, event.error, event, options, parseData.userData);
					}
				}, parseData);
			}
		}
	}
	if (executed)
	{
		if (options.atTheEnd != null)
		{
			var event = { entityCollection: entityCollection, userData: parseData.userData};
			options.atTheEnd(event);
		}
	}
	return executed;
}


WAF.EntityCollection.forEach = function(options, userData)
{
	// options.onSuccess : function called for each entity
	// options.onError : 
	// options.atTheEnd : function called at the end of the forEach
	
	var entityCollection = this;
	var priv = entityCollection._private;
	var resOp = WAF.tools.handleArgs(arguments, 0, { with3funcs: true });
	userData = resOp.userData;
	options = resOp.options;
	
	var parseInfo = { 
						curelem : options.first || 0, 
						limit : options.limit || entityCollection.length,
						userData: userData,
						entityCollection: entityCollection
					};
	
	
	WAF.EntityCollection.parseForEach(options, parseInfo);
	
	
}


WAF.EntityCollection.add = function(entity)
{
	if (entity != null)
	{
		this._private.addedElems.push(entity);
		this.length++;
	}
}


WAF.EntityCollection.refresh = function(options, userData)
{
	options = options || {};
	options.forceCollectionRefresh = true;
	var from = 0;
	if (options.refreshCollectionFrom != null)
		from = options.refreshCollectionFrom;
	userData = userData;
	this.getEntity(from, options, userData);
}


WAF.EntityCollection.toArray = function(attributeList, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;

	var entityCollection = this;
	var priv = entityCollection._private;
	priv.updateOptions(options);

	var request = new WAF.core.restConnect.restRequest(true);
    request.entityCollection = entityCollection; 
    request.resource = priv.dataClass.getName();
	    
    request.top = options.top || priv.pageSize || 40;
	request.skip = options.skip || null;
	request.params = priv.params;
	request.addToSet = options.addToSet;
	request.retainPositions = options.retainPositions || null;
	
	request.progressInfo = options.progressInfo || priv.progressInfo;
		
	request.savedOrderby = priv.savedOrderby;
	request.savedQueryString = priv.savedQuery;
	request.dataURI = priv.dataURI;
	request.orderby = options.orderby;
	request.autoExpand = attributeList;
	request.asArray = true;
	
	if (options.filterQuery)
	{
		request.filter = options.filterQuery;
		request.params = options.params;
	}

	request.handler = function(){
	        
	    if (request.http_request.readyState != 4) {
	        return;
	    }
	    
	    var rawResult = WAF.getRequestResult(request);
	    
	    var event = { entityCollection: entityCollection, result:rawResult, XHR: request.http_request };
		
		var withError = rawResult.__ERROR != null;
		
		WAF.callHandler(withError, rawResult.__ERROR, event, options, userData);	
	          
	};

	var errorFlag = request.go();
	
	
}


WAF.EntityCollection.distinctValues = function(attributeName, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;
	
	var entityCollection = this;
	var priv = entityCollection._private;
	priv.updateOptions(options);
	
	var request = new WAF.core.restConnect.restRequest(true);
    request.entityCollection = entityCollection; 
    request.resource = priv.dataClass.getName();
	    
 	request.addToSet = options.addToSet;
	request.top = options.top || null;
	request.skip = options.skip || null;
	request.params = priv.params;
	
	request.progressInfo = options.progressInfo || priv.progressInfo;
		
	request.savedOrderby = priv.savedOrderby;
	request.savedQueryString = priv.savedQuery;
	request.dataURI = priv.dataURI;

	request.distinct = true;
	if (attributeName != null)
	{
		request.attributesRequested = [attributeName];
	}

	request.handler = function(){
    
		if (request.http_request.readyState != 4) {
			return;
		}
        
	    var rawResult = WAF.getRequestResult(request);
	    
	    var event = { entityCollection: entityCollection, distinctValues:rawResult, result:rawResult, XHR: request.http_request };
		
		var withError = rawResult.__ERROR != null;
		
		WAF.callHandler(withError, rawResult.__ERROR, event, options, userData);	
		
	}

	var errorFlag = request.go();
}



WAF.EntityCollection.findKey = function(key, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;
	
	var entityCollection = this;
	var priv = entityCollection._private;
	priv.updateOptions(options);
	
	var request = new WAF.core.restConnect.restRequest(true);
    request.entityCollection = entityCollection; 
    request.resource = priv.dataClass.getName();
	    
 	request.addToSet = options.addToSet;
	request.top = options.top || null;
	request.skip = options.skip || null;
	request.params = priv.params;
	
	request.progressInfo = options.progressInfo || priv.progressInfo;
		
	request.savedOrderby = priv.savedOrderby;
	request.savedQueryString = priv.savedQuery;
	request.dataURI = priv.dataURI;

	if (key instanceof Date)
		key = key.toISO();
	request.findKey = key;
	

	request.handler = function(){
    
		if (request.http_request.readyState != 4) {
			return;
		}
        
	    var rawResult = WAF.getRequestResult(request);
	    
	    var event = { entityCollection: entityCollection, result:rawResult.result, XHR: request.http_request };
		
		var withError = rawResult.__ERROR != null;
		
		WAF.callHandler(withError, rawResult.__ERROR, event, options, userData);	
		
	}

	var errorFlag = request.go();
}


WAF.EntityCollection.removeEntityReference = function(posInSet, options, userData){
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;
	options.removeReferenceOnly = true;
	this.removeEntity(posInSet, options, userData);
}


WAF.EntityCollection.removeEntity = function(posInSet, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;
	
	var entityCollection = this;
	var priv = entityCollection._private;
	options.dataURI = priv.dataURI;
	var dataClass = entityCollection.getDataClass();
	
	if (posInSet >= priv.loadedElemsLength && posInSet < entityCollection.length) {
		var subpos = posInSet - priv.loadedElemsLength;
		var entity = priv.addedElems[subpos];
		var resev = { entityCollection: entityCollection, result:entityCollection};
		if (entity == null || entity.getKey() == null || options.removeReferenceOnly) {
			priv.addedElems.splice(subpos, 1);
			entityCollection.length--;
			WAF.callHandler(false, null, resev, options, userData);			
		}
		else {
			entity.remove({
				onSuccess: function(ev){
					priv.addedElems.splice(subpos, 1);
					entityCollection.length--;
					WAF.callHandler(false, null, resev, options, userData);
				},
				onError: function(ev){
					WAF.callHandler(true, ev.error, resev, options, userData);
				}
				
			});
		}
	}
	else {
		options.pageSize = options.pageSize || priv.pageSize;
		options.autoExpand = options.autoExpand || priv.autoExpand;
		options.filterAttributes = options.filterAttributes || priv.filterAttributes;
		priv.updateOptions(options);
		options.removeAtPos = posInSet;
		
		options.savedQuery = priv.savedQuery || null;
		options.savedOrderby = priv.savedOrderby || null;
		
		var newEntityCollection = new WAF.EntityCollection(dataClass, null, options, userData)
		return newEntityCollection;
	}

}


WAF.EntityCollection.removeAllEntities = function(options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 0);
	userData = resOp.userData;
	options = resOp.options;
	
	var entityCollection = this;
	var priv = entityCollection._private;
	priv.updateOptions(options);

	var request = new WAF.core.restConnect.restRequest(true);
    request.entityCollection = entityCollection; 
    request.resource = priv.dataClass.getName();
	    
 	request.addToSet = options.addToSet;
	request.params = priv.params;
	
	request.progressInfo = options.progressInfo || priv.progressInfo;
		
	request.savedOrderby = priv.savedOrderby;
	request.savedQueryString = priv.savedQuery;
	request.dataURI = priv.dataURI;

	request.method = "delete";
	
	request.atOnce = options.atOnce;

	request.handler = function(){
    
		if (request.http_request.readyState != 4) {
			return;
		}
        
	    var rawResult = WAF.getRequestResult(request);
	    
	    var event = { entityCollection: entityCollection, XHR: request.http_request };
		
		var withError = rawResult.__ERROR != null;
		
		WAF.callHandler(withError, rawResult.__ERROR, event, options, userData);	
		
	}

	var errorFlag = request.go();

}


WAF.EntityCollection.buildFromSelection = function(selection, options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 1);
	userData = resOp.userData;
	options = resOp.options;
	
	var entityCollection = this;
	var priv = entityCollection._private;
	
	var dataClass = entityCollection.getDataClass();
	options.pageSize = options.pageSize || priv.pageSize;
	options.autoExpand = options.autoExpand || priv.autoExpand;	
	options.filterAttributes = options.filterAttributes || priv.filterAttributes;	
	priv.updateOptions(options);
	
	options.filterSet = entityCollection;
	//options.fromCollection = entityCollection;
	options.fromSelection = selection;

	options.savedQuery = priv.savedQuery || null;
	options.savedOrderby = priv.savedOrderby || null;

	var subEntityCollection = new WAF.EntityCollection(dataClass, null, options, userData);
	return subEntityCollection;

}



// ------------------------------------ Entity -------------------------------------------------------------------


				// Entity Attribute Simple
				
WAF.EntityAttributeSimple = function(entity, rawVal, att)
{
	this.owner = entity;
	if (att.type == "date" && typeof(rawVal) == "string")
	{
		if (att.simpleDate)
			this.value = stringToSimpleDate(rawVal);
		else
			this.value = ISOToDate(rawVal);
	}
	else
		this.value = rawVal;
	this.touched = false;
	this.att = att;
	
	this.getValue = WAF.EntityAttributeSimple.getValue;
	this.setValue =  WAF.EntityAttributeSimple.setValue;
	this.touch = WAF.EntityAttributeSimple.touch;
	this.isTouched = WAF.EntityAttributeSimple.isTouched;
	this.clearTouched = WAF.EntityAttributeSimple.clearTouched;
	this.getOldValue = WAF.EntityAttributeSimple.getOldValue;
	this.setRawValue = WAF.EntityAttributeSimple.setRawValue;
	this.getRawValue = WAF.EntityAttributeSimple.getRawValue;
}


WAF.EntityAttributeSimple.getValue = function()
{
	return this.value;
}

WAF.EntityAttributeSimple.setValue = function(val)
{
	if (this.oldValue === undefined)
		this.oldValue = this.value;
	this.value = val;
	this.touch();
}

WAF.EntityAttributeSimple.touch = function()
{
	this.touched = true;
	this.owner.touch();
}

WAF.EntityAttributeSimple.clearTouched = function()
{
	this.touched = false;
}

WAF.EntityAttributeSimple.isTouched = function()
{
	return this.touched;
}

WAF.EntityAttributeSimple.getOldValue = function()
{
	if (this.oldValue === undefined)
		return this.getValue();
	else
		return this.oldValue;
}

WAF.EntityAttributeSimple.setRawValue = function(rawVal)
{
	if (this.att.type === "date" && typeof(rawVal) === "string")
	{
		if (this.att.simpleDate)
			this.value = stringToSimpleDate(rawVal);
		else
			this.value = ISOToDate(rawVal);
	}
	else
		this.value = rawVal;
	delete this.oldValue;
}

WAF.EntityAttributeSimple.getRawValue = function()
{
	var result = this.value;
	if (result != null && this.att.type == "date")
	{
		if (this.att.simpleDate)
			result = result.toSimpleDateString();
		else
			result = result.toISO();
	}
	return result;
}



				// Entity Attribute Related Entity


WAF.EntityAttributeRelated = function(entity, rawVal, att)
{
	WAF.EntityAttributeSimple.call(this, entity, rawVal, att);
	
	if (rawVal != null)
	{
		if (rawVal.__deferred != null)
		{
			this.relEntity = null;
			this.dataURI = rawVal.__deferred.uri;
			this.relKey = rawVal.__deferred.__KEY;
		}
		else
		{
			var relClass = att.getRelatedClass();
			if (relClass == null)
			{
				this.relEntity = null;
				this.dataURI = null;
				this.relKey = null;
			}
			else
			{
				this.relEntity = new WAF.Entity(relClass, rawVal);
				this.dataURI = null;
				this.relKey = null;
			}
		}
	}
	else
	{
		this.relEntity = null;
		this.dataURI = null;
		this.relKey = null;
	}
	
	this.setValue = WAF.EntityAttributeRelated.setValue;
	this.getValue = WAF.EntityAttributeRelated.getValue;
	this.load = this.getValue; // an alias
	this.setRawValue = WAF.EntityAttributeRelated.setRawValue;
	this.getRawValue = WAF.EntityAttributeRelated.getRawValue;
	this.getOldValue = WAF.EntityAttributeRelated.getOldValue;
}


WAF.EntityAttributeRelated.getOldValue = function()
{
	if (this.oldValue === undefined)
		return this.getValue();
	else
		return this.oldValue;
}


WAF.EntityAttributeRelated.getValue = function(options, userData)
{
	if (options == null) // in that case we just want the related entity if it was already loaded
		return this.relEntity;
	else
	{
		var resOp = WAF.tools.handleArgs(arguments, 0);
		userData = resOp.userData;
		options = resOp.options;
		
		var val = this;
		var event = { entity: null };
		if (val.relEntity == null)
		{
			if (val.dataURI == null && val.relKey == null)
			{
				WAF.callHandler(false, null, event, options, userData)
			}
			else
			{
				var relClass = val.att.getRelatedClass();
				if (relClass == null)
				{
					WAF.callHandler(false, null, event, options, userData)
				}
				else
				{
					if (val.relKey != null)
					{
						relClass.getEntity(val.relKey, 
						{
							onSuccess:function(event)
							{
								val.relEntity = event.entity;
								WAF.callHandler(false, null, event, options, userData);
							},
							onError:function(event)
							{
								WAF.callHandler(true, event.error, event, options, userData);
							},
							autoExpand: options.autoExpand
						});
					}
					else
					{
						relClass.getEntityByURI(val.dataURI, 
						{
							onSuccess:function(event)
							{
								val.relEntity = event.entity;
								WAF.callHandler(false, null, event, options, userData);
							},
							onError:function(event)
							{
								WAF.callHandler(true, event.error, event, options, userData);
							},
							autoExpand: options.autoExpand
						});
					}
				}
			}
		}
		else
		{
			event.entity = val.relEntity;
			WAF.callHandler(false, null, event, options, userData)
		}
	}
}


WAF.EntityAttributeRelated.setValue = function(relatedEntity)
{
	if (this.oldValue === undefined)
		this.oldValue = this.relEntity;
	this.relEntity = relatedEntity;
	this.touched = true;
	this.owner.touch();
	this.dataURI = null;
	if (relatedEntity == null)
		this.relKey = null;
	else
		this.relKey = relatedEntity.getKey();
}


WAF.EntityAttributeRelated.setRawValue = function(rawVal)
{
	if (rawVal != null)
	{
		if (rawVal.__deferred != null)
		{
			this.relEntity = null;
			this.dataURI = rawVal.__deferred.uri;
			this.relKey = rawVal.__deferred.__KEY;
		}
		else
		{
			var relClass = this.att.getRelatedClass();
			if (relClass == null)
			{
				this.relEntity = null;
				this.dataURI = null;
				this.relKey = null;
			}
			else
			{
				this.relEntity = new WAF.Entity(relClass, rawVal);
				this.dataURI = null;
				this.relKey = null;
			}
		}
	}
	else
	{
		this.relEntity = null;
		this.dataURI = null;
		this.relKey = null;
	}
	delete this.oldValue;
}

WAF.EntityAttributeRelated.getRawValue = function()
{
	var result = this.relEntity;
	if (result != null)
	{
		var key = result.getKey();
		if (key != null)
		{
			result = { __KEY: key };
		}
		else
			result = result._private.getRESTFormat();
	}
	return result;
}





				// Entity Attribute Related Entities (selection)

WAF.EntityAttributeRelatedSet = function(entity, rawVal, att)
{
	WAF.EntityAttributeSimple.call(this, entity, rawVal, att);
	
	if (rawVal != null)
	{
		if (rawVal.__deferred != null)
		{
			this.relEntityCollection = null;
			this.dataURI = rawVal.__deferred.uri;
		}
		else
		{
			var relClass = att.getRelatedClass();
			if (relClass == null)
			{
				this.relEntityCollection = null;
				this.dataURI = null;
			}
			else
			{
				this.relEntityCollection = new WAF.EntityCollection(relClass, null, { prefetchedData: rawVal });
				this.dataURI = this.relEntityCollection._private.dataURI;
			}
		}
	}
	else
	{
		this.relEntityCollection = null;
		this.dataURI = null;
	}
	
	this.setValue = WAF.EntityAttributeRelatedSet.setValue;
	this.getValue = WAF.EntityAttributeRelatedSet.getValue;
	this.setRawValue = WAF.EntityAttributeRelatedSet.setRawValue;
}


WAF.EntityAttributeRelatedSet.setRawValue = function(rawVal)
{
	if (rawVal != null)
	{
		if (this.dataURI != null && rawVal.__deferred == this.dataURI)
		{
			// nothing to do in that case
		}
		else
		{
			if (rawVal.__deferred != null)
			{
				this.relEntityCollection = null;
				this.dataURI = rawVal.__deferred.uri;
			}
			else
			{
				var relClass = this.att.getRelatedClass();
				if (relClass == null)
				{
					this.relEntityCollection = null;
					this.dataURI = null;
				}
				else
				{
					this.relEntityCollection = new WAF.EntityCollection(relClass, null, { prefetchedData: rawVal });
					this.dataURI = this.relEntityCollection._private.dataURI;
				}
			}
		}
	}
	else
	{
		this.relEntityCollection = null;
		this.dataURI = null;
	}
}

WAF.EntityAttributeRelatedSet.getValue = function(options, userData)
{
	if (options == null) // in that case we just want the related entity set if it was already computed
		return this.relEntityCollection;
	else
	{
		var resOp = WAF.tools.handleArgs(arguments, 0);
		userData = resOp.userData;
		options = resOp.options;

		var relSet = null;
		var val = this;
		var event = { entityCollection : null };
		if (this.relEntityCollection != null)
		{
			relSet = this.relEntityCollection;
			if (relSet._private.ready)
			{
				event.entityCollection = relSet;
				WAF.callHandler(false, null, event, options, userData);
			}
			else
			{
				var funcToCall = function()
				{
					if (relSet._private.ready)
					{
						event.entityCollection = relSet;
						WAF.callHandler(false, null, event, options, userData);
					}
					else setTimeout(funcToCall, 100);
				}
				setTimeout(funcToCall, 100);
			}
		}
		else
		{
			var relClass = this.att.getRelatedClass();
			if (relClass == null)
			{
				WAF.callHandler(true, { error: 601, errorMessage:"wrong entityCollection reference"}, event, options, userData);
			}
			else
			{
				if (this.dataURI == null)
					this.dataURI = "*";
				options.isARelatedEntityCollection = true;
				options.dataURI = this.dataURI;
				this.relEntityCollection = new WAF.EntityCollection(relClass, null, options, userData);
				relSet = this.relEntityCollection;
			}
		}
		return relSet;
	}
}
	



// ----------------------------------------------------------------

				// Entity 

WAF.Entity = function(dataClass, rawData, options)
{
	var entity = this;
	
	this._private = {
		touched: false,
		isNew: true,
		dataClass: dataClass,
		owner: this,
		values: {},		
		methodRefs: dataClass._private.entityMethodRefs,
		methods: dataClass._private.entityMethods,
		
		getRESTFormat: WAF.Entity.getRESTFormat
	}
	
	var priv = this._private;
	var methods = priv.methods;
	for (var e in methods)
	{
		entity[e] = methods[e];
	}
	
	this.touch = WAF.Entity.touch;
	this.getDataClass = WAF.Entity.getDataClass;
	this.getKey = WAF.Entity.getKey;
	this.setStamp = WAF.Entity.setStamp;
	this.setKey = WAF.Entity.setKey;
	this.getStamp = WAF.Entity.getStamp;
	this.callMethod = WAF.Entity.callMethod;
	this.isNew = WAF.Entity.isNew;
	this.isTouched = WAF.Entity.isTouched;
	this.save = WAF.Entity.save;
	this.remove = WAF.Entity.remove;
	this.serverRefresh = WAF.Entity.serverRefresh;
	
	var isnew = false;
	if (rawData == null || rawData.__KEY == null)
	{
		this._private.key = null;
		this._private.stamp = 0;
		this._private.isNew = true;
		isnew = true;
		if (rawData != null)
			this._private.touched = true;
	}
	else
	{
		this._private.key = rawData.__KEY;
		this._private.stamp = rawData.__STAMP;
		this._private.isNew = false;
		
	}
	var values = entity._private.values;
	
	options = options || {};
	var attsByName = dataClass._private.attributesByName;
	for (var e in attsByName)
	{
		var att = attsByName[e];
	//	var val = (rawData == null) ? null :  rawData[e] || null;
		var val = (rawData == null) ? null : (rawData[e] == null ? null : rawData[e]); 
		var valAtt;
		if (!att.related)
		{
			valAtt = new WAF.EntityAttributeSimple(entity, val, att);
		}
		else
		{
			if (att.relatedOne)
				valAtt = new WAF.EntityAttributeRelated(entity, val, att);
			else
				valAtt = new WAF.EntityAttributeRelatedSet(entity, val, att);
		}
		if (isnew && val != null) {
			valAtt.touched = true;
		}
		values[e] = valAtt;
		entity[e] = valAtt;
	}
	
	
}


WAF.Entity.getRESTFormat = function(overrideStamp) // private function
{
	var priv = this;
	var entity = this.owner;
	var result = {};
	var key = entity.getKey();
	if (key != null)
	{
		result.__KEY = key;
		result.__STAMP = entity.getStamp();
		if (overrideStamp)
			result.__STAMP = -result.__STAMP;
	}
	else
		result.__ISNEW = true;
	
	for (var e in priv.values)
	{
		var valAtt = priv.values[e];
		if (valAtt.isTouched())
		{
			result[e] = valAtt.getRawValue();
		}
	}
	
	return result;
}


WAF.Entity.touch = function()
{
	this._private.touched = true;
}

WAF.Entity.getDataClass = function()
{
	return this._private.dataClass;
}


WAF.Entity.getKey = function()
{
	return this._private.key;
}

WAF.Entity.getStamp = function()
{
	return this._private.stamp;
}

WAF.Entity.setKey = function(key)
{
	this._private.key = key;
}

WAF.Entity.setStamp = function(stamp)
{
	this._private.stamp = stamp;
}


WAF.Entity.callMethod = function(options)
{
	var entity = this;
	var methodRef = entity._private.methodRefs[options.method];
	if (methodRef != null)
	{
		var myargs = [];
		if (options.arguments != null)
		{
			myargs = options.arguments;
		}
		else
		{
	        for (var i = 1,nb = arguments.length; i < nb; i++) // The first one is skipped.
	        {
	            myargs.push(arguments[i]);
	        }
		}
		return WAF.DataStore.funcCaller(methodRef, entity, myargs, options);		
	}
}


WAF.Entity.isNew = function()
{
	return this._private.isNew;
}

WAF.Entity.isTouched = function()
{
	return this._private.touched;
}


WAF.Entity.serverRefresh = function(options, userData)
{
	var resOp = WAF.tools.handleArgs(arguments, 0);
	userData = resOp.userData;
	options = resOp.options;
	options.refreshOnly = true;
	this.save(options, userData);
	
}


WAF.Entity.remove = function(options, userData)
{
	var entity = this;
	var resOp = WAF.tools.handleArgs(arguments, 0);
	userData = resOp.userData;
	options = resOp.options;
	var dataClass = entity.getDataClass();
	var dataClassName = dataClass.getName();
	var key = entity.getKey();
	
	var request = new WAF.core.restConnect.restRequest(true);
	
	request.resource = dataClassName+"("+key+")";
	request.method = "delete";
	
	request.handler = function()
	{
		if (request.http_request.readyState != 4) {
            return;
        }
		
		var error = false;
		var err = null;
		var result = WAF.getRequestResult(request);
		if (result.__ERROR != null)
		{
			error = true;
			err = result.__ERROR;
		}
		else
		{
			dataClass.getCache().removeCachedEntity(key);			
		}
		
		var event = {entity:entity};
		WAF.callHandler(error, err, event, options, userData);
	}
	 var errorFlag = request.go();
}


WAF.Entity.save = function(options, userData)
{
	var entity = this;
	var resOp = WAF.tools.handleArgs(arguments, 0);
	userData = resOp.userData;
	options = resOp.options;
	var dataClass = entity.getDataClass();
	var dataClassName = dataClass.getName();
	
	var refreshOnly = options.refreshOnly;
	if (refreshOnly == null) 
	{
		refreshOnly = false;
	}
	
	
	var request = new WAF.core.restConnect.restRequest(true);
	
	//request.app = "";
	request.resource = dataClassName;
	
	var key = entity.getKey();
	
	if (key == null) 
	{
		// request.method = "create";
		// request.httpMethod = WAF.core.restConnect.httpMethods._put;
		request.method = "update";
		request.httpMethod = WAF.core.restConnect.httpMethods._post;
	} else 
	{
		request.method = "update";
		request.httpMethod = WAF.core.restConnect.httpMethods._post;
	}
	
	request.postdata = '{ "__ENTITIES": [' + JSON.stringify(entity._private.getRESTFormat(options.overrideStamp)) + ']}';
	
	request.refreshOnly = refreshOnly;
	
	if (options.autoExpand != null)
		request.autoExpand = options.autoExpand;
	if (options.filterAttributes != null)
		request.filterAttributes = options.filterAttributes;
	/*
	var attList = this.getAttributes(undefined, ['image']);
	if (!refreshOnly) 
	{
		for (var i = 0, nb = attList.length; i < nb; i++) 
		{
			var att = attList[i];
			if (att.kind == "storage" || att.kind == "alias" || att.kind == "calculated") 
			{
				var attName = att.name;
				var entAtt = this.getAttribute(attName);
				if (entAtt != null) 
				{
					entAtt.oldValue = entAtt.value;
				}
			}
		}
	}
	*/
	
	request.handler = function(){
	
		if (request.http_request.readyState != 4) 
		{
			return;
		}
		
		var rawResult = WAF.getRequestResult(request);
		
		var event = { entity: entity, rawResult: rawResult, XHR: request.http_request};
		
		var rawResult = JSON.parse(request.http_request.responseText);
		
		var withError = false;
		var err = null;
		
		if (rawResult) 
		{
			if (rawResult.__ENTITIES) 
			{
				if (rawResult.__ENTITIES[0]) 
				{
					var rawResultRec = rawResult.__ENTITIES[0];
					if (rawResultRec.__ERROR) 
					{
						err = rawResultRec.__ERROR;
						withError = true;						
					} else 
					{
						var oldKEY = key;
						var newKEY = rawResultRec.__KEY;
						if (!refreshOnly) 
						{
							if (newKEY != null) 
							{
								entity._private.key = newKEY;
							}
							entity._private.stamp = rawResultRec.__STAMP;
						}
						
						var attsByName = dataClass._private.attributesByName;
						for (var e in attsByName)
						{
							var att = attsByName[e];
							var val =  rawResultRec[e];
							if (val === undefined)
								val = null;
							var valAtt = entity[e];
							if (valAtt == null)
							{
								if (!att.related) 
								{
									valAtt = new WAF.EntityAttributeSimple(entity, val, att);
								} else 
								{
									if (att.relatedOne) 
										valAtt = new WAF.EntityAttributeRelated(entity, val, att);
									else 
										valAtt = new WAF.EntityAttributeRelatedSet(entity, val, att);
								}
								//values[e] = valAtt;
								entity[e] = valAtt;
							}
							else
							{
								valAtt.setRawValue(val);
								if (!refreshOnly)
									valAtt.clearTouched();
							}
						}
						
						dataClass.getCache().replaceCachedEntity(newKEY, rawResultRec);
						
						if (!refreshOnly) 
						{
							entity._private.touched = false;
							entity._private.isNew = false;
						}
						
					}
				}
			}
		}
		
		WAF.callHandler(withError, err, event, options, userData);
	};
	
	var errorFlag = request.go();

}



// initialize class prototypes;


// EntityCollection
WAF.EntityCollection.prototype.getDataClass = WAF.EntityCollection.getDataClass;
WAF.EntityCollection.prototype.query = WAF.EntityCollection.query;
WAF.EntityCollection.prototype.getEntity = WAF.EntityCollection.getEntity;
WAF.EntityCollection.prototype.getEntities = WAF.EntityCollection.getEntities;
WAF.EntityCollection.prototype.callMethod = WAF.EntityCollection.callMethod;
WAF.EntityCollection.prototype.each = WAF.EntityCollection.forEach;
WAF.EntityCollection.prototype.forEach = WAF.EntityCollection.forEach;
WAF.EntityCollection.prototype.add = WAF.EntityCollection.add;
WAF.EntityCollection.prototype.orderBy = WAF.EntityCollection.orderBy;
WAF.EntityCollection.prototype.toArray = WAF.EntityCollection.toArray;
WAF.EntityCollection.prototype.distinctValues = WAF.EntityCollection.distinctValues;
WAF.EntityCollection.prototype.findKey = WAF.EntityCollection.findKey;
WAF.EntityCollection.prototype.removeEntity = WAF.EntityCollection.removeEntity;
WAF.EntityCollection.prototype.removeEntityReference = WAF.EntityCollection.removeEntityReference;
WAF.EntityCollection.prototype.removeAllEntities = WAF.EntityCollection.removeAllEntities;
WAF.EntityCollection.prototype.buildFromSelection = WAF.EntityCollection.buildFromSelection;
WAF.EntityCollection.prototype.getReference = WAF.EntityCollection.getReference;
WAF.EntityCollection.prototype.refresh = WAF.EntityCollection.refresh;

// DataClass
WAF.DataClass.prototype.distinctValues = WAF.DataClass.distinctValues;
WAF.DataClass.prototype.all = WAF.DataClass.allEntities;
WAF.DataClass.prototype.allEntities = WAF.DataClass.allEntities;
WAF.DataClass.prototype.query = WAF.DataClass.query;
WAF.DataClass.prototype.find = WAF.DataClass.find;
WAF.DataClass.prototype.getAttributeByName = WAF.DataClass.getAttributeByName;
WAF.DataClass.prototype.getAttributes = WAF.DataClass.getAttributes;
WAF.DataClass.prototype.getMethodList = WAF.DataClass.getMethodList;
WAF.DataClass.prototype.getCache = WAF.DataClass.getCache;
WAF.DataClass.prototype.getCacheSize = WAF.DataClass.getCacheSize;
WAF.DataClass.prototype.setCacheSize = WAF.DataClass.setCacheSize;
WAF.DataClass.prototype.clearCache = WAF.DataClass.clearCache;
WAF.DataClass.prototype.newEntity = WAF.DataClass.newEntity;
WAF.DataClass.prototype.getEntity = WAF.DataClass.getEntity;
WAF.DataClass.prototype.getEntityByURI = WAF.DataClass.getEntityByURI;
WAF.DataClass.prototype.getDataStore = WAF.DataClass.getDataStore;
WAF.DataClass.prototype.getCollectionName = WAF.DataClass.getCollectionName;
WAF.DataClass.prototype.getDefaultTopSize = WAF.DataClass.getDefaultTopSize;
WAF.DataClass.prototype.getName = WAF.DataClass.getName;
WAF.DataClass.prototype.newCollection = WAF.DataClass.newCollection;
WAF.DataClass.prototype.toArray = WAF.DataClass.toArray;


WAF.DataClass.prototype.callMethod = WAF.DataStore.callMethod;

WAF.directory = WAF.directory || {};

WAF.directory.login = WAF.DataStore.makeFuncCaller({ name: "login", applyTo: "general", nameSpace: "$directory"});
WAF.directory.loginByPassword = WAF.directory.login;
WAF.directory.logout = WAF.DataStore.makeFuncCaller({ name: "logout", applyTo: "general", nameSpace: "$directory"});
WAF.directory.loginByKey = WAF.DataStore.makeFuncCaller({ name: "loginByKey", applyTo: "general", nameSpace: "$directory"});
WAF.directory.currentUser = WAF.DataStore.makeFuncCaller({ name: "currentUser", applyTo: "general", nameSpace: "$directory"});
WAF.directory.currentUserBelongsTo = WAF.DataStore.makeFuncCaller({ name: "currentUserBelongsTo", applyTo: "general", nameSpace: "$directory"});

WAF.dsExport = WAF.dsExport || {};
WAF.dsExport.exportData = WAF.DataStore.makeFuncCaller({ name: "exportData", applyTo: "general", nameSpace: "$impexp"});











