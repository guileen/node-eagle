/**
 * A OpenSource Realtime Connection Lib between mobile device and web browser
 * Licensed by: MIT
 * @author Tang Bo Hao
 */

/**
 * Module Dependence
 */
var ioEngine = require('socket.io'),
	util = require('util'), // nodejs util
	parseCookie = require('./utils').parseCookie;

/**
 * Eagle SocketClient Class
 */
var SocketClient = exports.SocketClient = require('./socketClient');

/**
 * Eagle Routes Class
 */
var Routes = exports.Routes = require('./routes');

/**
 * Eagle Class Exports
 * @param {Object} app express app instance
 * @param {Object} store session store instance
 * @param {Object} options some options like sesskeyName, handlerClass
 * @api public
 */
var Eagle = exports.Eagle = function Eagle(app, store, options) {
	// set default setting
	var settings = {
		sesskeyName: 'connect.sid',
		clientHanlder: SocketClient,
	};
	for( var key in options){
		if(typeof settings[key] !== 'undefined')
			settings[key] = options[key];
	}
	
	// create Socket.IO instance
	var io = this._io = ioEngine.listen(app);
	
	// set global authorization and create a Connect session in Socket.IO
	io.set('authorization', function (hsData, callback) {
		 // check if there's a cookie header
	  if (hsData.headers.cookie) {
	    // if there is, parse the cookie and save to hsData
	    hsData.cookie = parseCookie(hsData.headers.cookie);
	    hsData.sessionID = hsData.cookie[settings.sesskeyName]; // Save sessionID to hsData
	    // get the session from session store
		store.load(hsData.sessionID, function (err, session) {
	    	// if we cannot grab a session, turn down the connection
			if (err || !session ) return callback((err && err.message) || 'Session Missing', false);

			// create a session object, passing data as request and our just acquired session data
			hsData.session = session;
			callback(null, true);
	    });
	  } else {
	     return callback('No cookie transmitted.', false);
	  }
	});
	
	// apply eagle routes for express
	 // TODO to support customized routes
	this._routes = new Routes(app, this);
	this._settings = settings;
};

/**
 * Socket.IO instance getter
 */
Eagle.prototype.__defineGetter__("io", function(){
	return this._io;
});

/**
 * Eagle API Path
 */
Eagle.prototype.__defineGetter__("apipath", function(){
	return this._routes.apipath;
});

/**
 * Eagle start a new nsInit
 * @param {String} namespace listen to the namespace, default is '/'
 * @param {Function} handlerClass the client handler class, should be extend from SocketClient(default)
 * @param {Function} authFunc specific authorization function for the namespace
 * @api public
 */
Eagle.prototype.nsInit = function(namespace, handlerClass, authFunc) {
	var target;
	var defaultClient = this._settings.clientHanlder;
	// Parameter Analyzing
	if(typeof namespace === 'string'){
		if(typeof handlerClass === 'function'){ 
			if(!(handlerClass.prototype instanceof SocketClient)){
				authFunc = handlerClass;
				handlerClass = defaultClient;
			}
		}else{
			authFunc = null;
			handlerClass = defaultClient; 
		}
		target = this._io.of(namespace);
	}else{
		if(typeof namespace === 'function'){
			if(namespace.prototype instanceof SocketClient){
				authFunc = handlerClass;
				handlerClass = namespace;
			}else{
				authFunc = namespace;
				handlerClass = defaultClient;
			}
		}else{
			authFunc = null;
			handlerClass = defaultClient;
		}
		namespace = 'default';
		target = this._io.sockets;
	}

	// Check if need customized authorization
	if( authFunc && typeof authFunc === 'function') {
		target.authorization(authFunc).on('connection', connectHandler.bind(this));
	}else{
		target.on('connection', connectHandler.bind(this));
	}

	// Client Connection Handlers
	function connectHandler(client){
	    var hs = client.handshake;
	    util.debug('[Socket.IO - Channel > '+ namespace +' < ] Connected! A client with sessionID: ' 
					+ hs.sessionID );

		try{
			// Create a client handler for this socket connection
			var clientHandler = new handlerClass(client);
			clientHandler.on_connected();	
		}catch(e){
			util.debug('A Error occurs - ' + new Date());
			util.debug(e);
		}

		// setup an inteval that will keep our session fresh
	    var intervalID = setInterval(function () {
			hs.session.reload( function () { // To reload the session keep the copy up2date
				clientHandler.on_refresh();

				// "touch" it (resetting maxAge and lastAccess) and save it back again.
				hs.session.touch().save();
			});
	    }, 60 * 1000);

			// Handle client disconnect
		client.on('disconnect', function(){
			// Remove the Handler
			clientHandler.on_disconnected();
			delete clientHandler;

			// clear the socket interval to stop refreshing the session
			clearInterval(intervalID);

			util.debug('[Socket.IO - Channel > '+ namespace +' < ] Disconnected! A client with sessionID:' 
				+ hs.sessionID );
		});
	}
};

/**
 * Notify to everyone at same namespace
 */
Eagle.prototype.roomNotify = function roomNotify (namespace, roomID, evtName, data) {
	// set default namespace
	namespace = namespace || "";
	
	// check namespace exists
	if(!this.roomExists(roomID)) return;
	
	var target = this._io.of(namespace);
	evtName = evtName || "message";
	console.log(roomID, evtName, data);
	target.in(roomID).emit(evtName, data);
}

/**
 * Check if the room exists
 * @param {String} roomID Eagle Lobby Room ID
 */
Eagle.prototype.roomExists = function roomExists (roomID) {
	return typeof (this._io.rooms["/"+roomID]) !== 'undefined';
}

/**
 * Rooms Getter
 */
Eagle.prototype.__defineGetter__("rooms", function(){
	var ret = [],
		rooms = this._io.rooms;
	for( var id in rooms){
		if(id!=='') ret.push(id.substr(1));
	}
	
	return ret;
});