/**
 * A Eagle SocketClient Handler Class
 * Licensed by: MIT
 * @author Tang Bo Hao
 */

/**
 * Module
 */
var md5 = require('./utils').md5;

/**
 * Export Base Class of SocketClient Handler
 * @param {Object} the client to initialize
 * @param {String} which namespace the client is running
 * @api public
 */
var SocketClient = module.exports = function SocketClientHandler(client) {
	// set socket client and session
	this.client = client;
	this.sessionID = client.handshake.sessionID;
	this.session = client.handshake.session;
	
	// Set Accept Event types
	this.acceptEvents = ['message', 'roomjoin', 'roomleave'];
};

/**
 * Server Messaging Function
 * @api public
 */
SocketClient.prototype.emit = function(channel, data) {
	if(typeof data === 'undefined'){
		data = channel;
		channel = 'message';
	}
   this.client.emit(channel, data);
};

/**
 * this is an example event handler function
 * each event in acceptEvents Array should have a handler function
 * named "on_[event]" to handle the msg from client
 * all these events will be registered in on_connected()
 * @api private
 */
SocketClient.prototype.on_message = function(msg) {
	if(this._roomid){
		this.client.broadcast.to(this._roomid).send(msg);
	}else{
		this.client.broadcast.send(msg);
	}
	util.debug(msg);
};

/**
 * Eagle Room Handler
 * @api private
 */
SocketClient.prototype.on_roomjoin = function(roomid, fn) {
	if(this._roomid) return; // one client in one room
	
	if(typeof roomid === 'function'){
		fn = roomid;
		roomid = null;
	}
	
	if(!roomid)	roomid = md5(this.sessionID);
	
	this.client.join(roomid);

	this._roomid = roomid;

	if(fn) fn(roomid);
};
SocketClient.prototype.on_roomleave = function(fn) {
	if(!this._roomid) return;
	
	this.client.leave(this._roomid);
	this._roomid = null;
	
	if(fn) fn();
};

/**
 * It will be called when client connected
 * Main usage is to register accept events
 * @api private
 */
SocketClient.prototype.on_connected = function() {
	var i, func, events = this.acceptEvents,
			len = events.length;
	
	// To register accept events
	for (i=0 ; i < len; i++) {
		func = this.__proto__['on_'+events[i]];
		if(typeof func === 'function'){
			this.client.on(events[i], func.bind(this));
		}
	};
};

/**
 * It will be called when client disconnected
 * override it to do more thing 
 */
SocketClient.prototype.on_disconnected = function() {
	var i, events = this.acceptEvents,
		len = events.length;
	
	// To remove all events
	for (i=0 ; i < len; i++) {
		this.client.removeAllListeners(events[i]);
	};
};

/**
 * To do something when session refresh interval
 */
SocketClient.prototype.on_refresh = function() {
	
};
