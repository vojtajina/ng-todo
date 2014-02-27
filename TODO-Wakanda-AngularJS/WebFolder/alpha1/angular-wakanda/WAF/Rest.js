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
/**
 * @module			Native
 */


/* JSLint Declarations */
/*global WAF*/



/** 
 * The Rest module is part of the Core and Native composite modules 
 * and implements the classes for connecting to the Wakanda through Rest.
 *
 * @class WAF.core.restConnect
 */
WAF.core.restConnect = {};

/**
 * httpMethods
 *
 * @static
 * @property httpMethods
 * @type Object
 **/
WAF.core.restConnect.httpMethods = {
	_post		: 'POST',
	_get		: 'GET',
	_put		: 'PUT',
	_delete		: 'DELETE'
};

/**
 * restActions
 *
 * @static
 * @property restActions
 * @type Object
 **/
WAF.core.restConnect.restActions = {
	_retrieve	: 'retrieve',
	_create		: 'create',
	_update		: 'update',
	_delete		: 'delete'
};

/**
 * queryOptions
 *
 * @static
 * @property queryOptions
 * @type Object
 **/
WAF.core.restConnect.queryOptions = {
	_expand		: '$expand',
	_orderby	: '$orderby',
	_skip		: '$skip',
	_top		: '$top',
	_filter		: '$filter'
};

/**
 * filterOperators
 *
 * @static
 * @property filterOperators
 * @type Object
 **/
WAF.core.restConnect.filterOperators = {
	_equal					: 'eq',
	_notequal				: 'neq',
	_greaterthan			: 'gt',
	_greaterthanorequal		: 'gteq',
	_lessthan				: 'lt',
	_lessthanorequal		: 'lteq',
	_logicaland				: 'and',
	_logicalor				: 'or',
	_logicalnot				: 'not'
};

/**
 * filterArithmeticOperators
 *
 * @static
 * @property filterArithmeticOperators
 * @type Object
 **/
WAF.core.restConnect.filterArithmeticOperators = {
	_add		: 'add',
	_sub		: 'sub',
	_mul		: 'mul',
	_div		: 'div',
	_mod		: 'mod'
};


/**
 * defaultService
 *
 * @static
 * @property defaultService
 * @type String
 * @default "rest"
 **/
WAF.core.restConnect.defaultService = "rest";

/**
 * standardErrors
 *
 * @static
 * @property standardErrors
 * @type Object
 **/
WAF.core.restConnect.standardErrors = {
	_hostnamemissing		: {key:"1",string:"The hostname is missing."},
	_servicemissing			: {key:"2",string:"The service is missing."},
	_httpmethodundefined	: {key:"3",string:"The HTTP method is undefined."},
	_wronghttpmethod		: {key:"4",string:"The HTTP method get doesn't support POST data."}
};

/**
 * getXMLHttpRequest
 *
 * @static
 * @method getXMLHttpRequest
 * @return XMLHttpRequest
 **/
WAF.core.restConnect.getXMLHttpRequest = function ()
{
    var http_request = false;

    if (window.XMLHttpRequest) { // Mozilla, Safari,...
        http_request = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // IE
    /*@cc_on
    	@if (@_jscript_version >= 5)
	        try {
	            http_request = new ActiveXObject("Msxml2.XMLHTTP");
	        } catch (e) {
	            try {
	                http_request = new ActiveXObject("Microsoft.XMLHTTP");
	            } catch (e) {}
	        }
        @end
   	@*/
    }

	return http_request;
};

 /**
  * This class creates a new instance of restRequest
  *
  * @class WAF.core.restConnect.restRequest
  *
  * @constructor
  * @param {Object} connectionMode
  */
WAF.core.restConnect.restRequest = function(connectionMode)
{
    
    /**
     * connectionMode
     *
     * @property connectionMode
     * @type Object
     **/
	this.connectionMode = connectionMode;

    /**
     * fullURL
     *
     * @property fullURL
     * @type String|null
     * @default null
     **/
	this.fullURL = null;

    /**
     * httpMethod
     *
     * @property httpMethod
     * @type String
     * @default "GET"
     **/
	this.httpMethod = WAF.core.restConnect.httpMethods._get;

    /**
     * hostname
     *
     * @property hostname
     * @type String
     * @default ""
     **/
	this.hostname = "";
    
    /**
     * app
     *
     * @property app
     * @type String
     * @default ""
     **/
	this.app = WAF.config.pattern;
    
    /**
     * service
     *
     * @property service
     * @type String
     * @default "rest"
     **/
	this.service = WAF.core.restConnect.defaultService;
    
    /**
     * resource
     *
     * @property resource
     * @type String
     * @default ""
     **/
	this.resource = "";
    
    /**
     * attributesRequested
     *
     * @property attributesRequested
     * @type String|undefined
     * @default undefined
     **/
	this.attributesRequested = undefined;
    
    /**
     * keys
     *
     * @property keys
     * @type Array
     * @default []
     **/
	this.keys = [];

	// Query String
    
    /**
     * expand
     *
     * @property expand
     * @type Array
     * @default []
     **/
	this.expand = [];
    
    /**
     * orderby
     *
     * @property orderby
     * @type Array
     * @default []
     **/
	this.orderby = [];
    
    /**
     * skip
     *
     * @property skip
     * @type Number|null
     * @default null
     **/
	this.skip = null;
    
    /**
     * top
     *
     * @property top
     * @type Number|null
     * @default null
     **/
	this.top = null;
    
    /**
     * filter
     *
     * @property filter
     * @type String|null
     * @default null
     **/
	this.filter = null;
    
    /**
     * method
     *
     * @property method
     * @type String|null
     * @default null
     **/
	this.method = null;
    
    /**
     * metadata
     *
     * @property metadata
     * @type Object|null
     * @default null
     **/
	this.metadata = null;

    
    /**
     * handler
     *
     * @property handler
     * @type Function|null
     * @default null
     **/
	this.handler = null;
    
    /**
     * postdata
     *
     * @property postdata
     * @type String|null
     * @default null
     **/
	this.postdata = null;
    
    /**
     * queryPlan
     *
     * @property queryPlan
     * @type Object|null
     * @default null
     **/
	this.queryPlan = null;
	
	this.progressInfo = null;
    
    /**
     * distinct
     *
     * @property distinct
     * @type Boolean
     * @default false
     **/
	this.distinct = false;
    
    /**
     * refreshOnly
     *
     * @property refreshOnly
     * @type Boolean
     * @default false
     **/
	this.refreshOnly = false;

    /**
     * error
     *
     * @property error
     * @type Object
     * @default {key:0, string:""}
     **/
	this.error = {
		key: 0,
		string: ""
	};


    /**
     * orderByArgsToString
     *
     * @method orderByArgsToString
     * @return String
     **/
	this.orderByArgsToString = function()
	{
		var retString = "";
		if (typeof this.orderby === 'string')
		{
			return this.orderby;
		}
		if (this.orderby.length > 0)
		{
			retString = this.orderby[0];
		}
		for (var i = 1; i < this.orderby.length; i++)
		{
			retString += "," + this.orderby[i];
		}

		return retString;
	};

    /**
     * send the request
     *
     * @method go
     * @return Boolean
     **/
	this.go = function(options)
	{
		var handler = this.handler;

		// Build the url:
		var url = "/";

		// app (optional):
		if (this.app != null)
		{
			url += this.app + "/";
		}

		// service:
		if (this.service !== "")
		{
			url += this.service + "/";
		}
		else
		{
			this.error = WAF.core.restConnect.standardErrors._servicemissing;
			return false;
		}

		// resource (optional):
		if (this.resource !== "")
		{
			url += this.resource + "/";
			// resource key (optional):
			if (this.keys.length > 0)
			{
				url += "(";
				for (var i = 0; i < this.keys.length; i++)
				{
					url += this.keys[i];
					if (i < this.keys.length - 1)
					{
						url += ",";
					}
				}
				url += ")";
			}
		}

		var deja$ = false;
		if (this.dataURI)
		{
			url = this.dataURI;
			deja$ = (url.indexOf("?") !== -1);
			if (!deja$)
				url += "/";
		}

		var needToAddQuaestionMark = !deja$;

		if (this.attributesRequested != undefined)
		{
			if (this.attributesRequested.length > 0)
			{
				url += this.attributesRequested[0];
				for (var i = 1; i < this.attributesRequested.length; i++)
				{
					url += "," + this.attributesRequested[i];
				}
			}
			url += "/";
		}

		// Build the queryString:
		// --
		var queryString = "";
		// $skip and $top
		if (this.skip)
		{
			queryString += (!deja$ ? "$skip=" : "&$skip=") + this.skip;
			deja$ = true;
		}
		if (this.top)
		{
			queryString += (!deja$ ? "$top=" : "&$top=") + this.top;
			deja$ = true;
		}
		// $filter
		if (this.filter)
		{
			queryString += (!deja$ ? "$filter=" : "&$filter=") + encodeURIComponent("'"+this.filter+"'");
			deja$ = true;
		}
		// $params
		if (this.params)
		{
			queryString += (!deja$ ? "$params=" : "&$params=") + encodeURIComponent("'"+JSON.stringify(this.params)+"'");
			deja$ = true;
		}
		// $method
		if (this.method)
		{
			queryString += (!deja$ ? "$method=" : "&$method=") + this.method;
			deja$ = true;
		}
		// $asArray
		if (this.asArray)
		{
			queryString += (!deja$ ? "$asArray=" : "&$asArray=") + "true";
			deja$ = true;
		}
		// $metadata
		if (this.metadata)
		{
			queryString += (!deja$ ? "$metadata=" : "&$metadata=") + this.metadata;
			deja$ = true;
		}
		// $distinct
		if (this.distinct)
		{
			queryString += (!deja$ ? "$distinct=" : "&$distinct=") + this.distinct;
			deja$ = true;
		}
		// $findKey
		if (this.findKey != null)
		{
			queryString += (!deja$ ? "$findKey=" : "&$findKey=")+encodeURIComponent(""+this.findKey);
			deja$ = true;
		}
		if (this.queryPlan)
		{
			queryString += (!deja$ ? "$queryplan=true&querypath=true" : "&$queryplan=true&querypath=true")
			deja$ = true;
		}
		if (this.progressInfo)
		{
			queryString += (!deja$ ? "$progressinfo=" : "&$progressinfo=") + encodeURIComponent(this.progressInfo);
			deja$ = true;
		}
		if (this.timeout)
		{
			queryString += (!deja$ ? "$timeout=" : "&$timeout=") + this.timeout;
			deja$ = true;
		}
		if (this.savedQueryString) {
			//queryString += (!deja$ ? "$savedfilter=" : "&$savedfilter=") + this.savedQueryString;
			queryString += (!deja$ ? "$savedfilter=" : "&$savedfilter=") + encodeURIComponent("'"+this.savedQueryString+"'");
			deja$ = true;
		}
		if (this.savedOrderby) {
			queryString += (!deja$ ? "$savedorderby=" : "&$savedorderby=") + this.savedOrderby;
			deja$ = true;
		}
		// $refresh
		if (this.refreshOnly)
		{
			queryString+=(!deja$?"$refresh=":"&$refresh=")+this.refreshOnly;
			deja$=true;		
		}
		// $atOnce
		if (this.atOnce)
		{
			queryString+=(!deja$?"$atOnce=":"&$atOnce=")+this.atOnce;
			deja$=true;		
		}
		// $retainPositions
		if (this.retainPositions)
		{
			queryString+=(!deja$?"$retainPositions=":"&$retainPositions=")+this.retainPositions;
			deja$=true;		
		}
		// $removeFromSet
		if (this.removeAtPos != null)
		{
			queryString+=(!deja$?"$removeFromSet=":"&$removeFromSet=")+this.removeAtPos;
			deja$=true;		
		}
		if (this.removeReferenceOnly != null)
		{
			queryString+=(!deja$?"$removeRefOnly=":"&$removeRefOnly=")+this.removeReferenceOnly;
			deja$=true;		
		}
		// $attributes
		if (this.filterAttributes != null)
		{
			queryString+=(!deja$?"$attributes=":"&$attributes=")+encodeURIComponent(this.filterAttributes);
			deja$=true;	
		}		
		// $addToSet
		if (this.addToSet != null)
		{
			queryString+=(!deja$?"$addToSet=":"&$addToSet=")+encodeURIComponent("'"+JSON.stringify(this.addToSet)+"'");
			deja$=true;	
		}
		// $fromSel
		if (this.fromSelection != null)
		{
			queryString+=(!deja$?"$fromSel=":"&$fromSel=")+encodeURIComponent("'"+JSON.stringify(this.fromSelection)+"'");
			deja$=true;	
		}
		// $keepSel
		if (this.keepSelection != null)
		{
			queryString+=(!deja$?"$keepSel=":"&$keepSel=")+encodeURIComponent("'"+JSON.stringify(this.keepSelection)+"'");
			deja$=true;	
		}
		// $orderby
		if (this.orderby)
		{
			if (this.orderby.length)
			{
				if (!deja$)
				{
					queryString += "$orderby=" + this.orderByArgsToString();
				}
				else
				{
					queryString += "&$orderby=" + this.orderByArgsToString();
				}
				deja$ = true;
			}
		}
		// $subOrderby
		if (this.subOrderby != null)
		{
			queryString+=(!deja$?"$subOrderby=":"&$subOrderby=")+encodeURIComponent(this.subOrderby);
			deja$=true;	
		}				
		// $expand
		if (this.attributesExpanded != undefined)
		{
			if (this.attributesExpanded.length > 0)
			{
				var expandString = "";
				if (!deja$)
				{
					queryString += "$expand=";
				}
				else
				{
					queryString += "&$expand=";
				}
				deja$ = true;
				for (var i = 0; i < this.attributesExpanded.length; i++)
				{
					if (expandString === "")
					{
						expandString += this.attributesExpanded[i];
					}
					else
					{
						expandString += "," + this.attributesExpanded[i];
					}
				}
				queryString += expandString;
			}
		}
		
		if (this.autoExpand != null && this.autoExpand != "")
		{
			if (!deja$)
				{
					queryString += "$expand=";
				}
				else
				{
					queryString += "&$expand=";
				}
				deja$ = true;
				queryString += this.autoExpand;
		}
		
		if (this.autoSubExpand != null && this.autoSubExpand != "")
		{
			if (!deja$)
				{
					queryString += "$subExpand=";
				}
				else
				{
					queryString += "&$subExpand=";
				}
				deja$ = true;
				queryString += this.autoSubExpand;
		}


		// Adds queryString to url
		if (queryString !== "")
		{
			if (needToAddQuaestionMark)
				url += "?";
			url += queryString;
		}

		var command = "";

		// hostname
		if (this.httpMethod !== "")
		{
			command = this.httpMethod;
		}
		else
		{
			this.error = WAF.core.restConnect.httpMethods._get;
		}


		if ((this.postdata) && (command == WAF.core.restConnect.httpMethods._get))
		{
			this.error = WAF.core.restConnect.standardErrors._wronghttpmethod;
			return false;
		}

		this.http_request = WAF.core.restConnect.getXMLHttpRequest();

		if (!this.http_request)
		{
			return;
		}

		this.http_request.parent = this;
		
		if (options && options.generateRESTRequestOnly)
		{
			return url;
		}
		else
		{
			if (handler != null)
			{
				this.http_request.onreadystatechange = function()
				{
					handler(this.parent);
				};
			}
	
			try
			{
				if (this.fullURL)
				{
					url = this.fullURL;
				}
				this.http_request.open(command, url, this.connectionMode);
	
				if (this.postdata)
				{
					this.http_request.setRequestHeader('Content-Type', 'application/json');
				}
	
				this.http_request.setRequestHeader('If-Modified-Since', 'Thu, 1 Jan 1970 00:00:00 GMT'); // due to IE9 caching XHR
				this.http_request.setRequestHeader('Cache-Control', 'no-cache'); // due to IE9 caching XHR
	
				this.http_request.send(this.postdata);
	
				if (!this.connectionMode)
				{
					handler(this.http_request);
				}
	
				return true;
	
			} catch (e)
			{
	            // TODO log the error
	            return true;
				//alert(e);
			}
		}

		return false;
	};


};
