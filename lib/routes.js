/**
 * A Eagle Routes Class
 * Licensed by: MIT
 * @author Tang Bo Hao
 */

/**
 * Module dependence
 */
var parse = require('url').parse;

/**
 * Routes Class Exports
 * @api public
 */
var Routes = module.exports = function Routes(app, eagle, options) {
	this._app = app;
	this._eagle = eagle;
	this._settings = {
		apipath: "/eagleapi",
	};
	if(options){
		for( var key in options){
			if(this._settings[key]) this._settings[key] = options[key];
		}
	}
	
	this.initAPI();
};

/**
 *  App getter
 */
Routes.prototype.__defineGetter__("app", function(){
	return this._app;
});

/**
 * Api Path Getter
 */
Routes.prototype.__defineGetter__('apipath', function() {
	return this._settings.apipath;
});

/**
 * Init Routes of Eagle API for Mobile Devices
 */
Routes.prototype.initAPI = function() {
	var app = this._app,
		eagle = this._eagle,
		apipath = this._settings.apipath;

	// first to authorize
	app.all(apipath+'/*', this._authFunc);
	
	// ========= GET ===========
	// Room API
	app.get(apipath+'/rooms', function (req, res) {
		res.json(eagle.rooms);
	});
	
	// ========= POST ==========
	// Data API
	app.post(apipath+'/room/rand', function (req, res) {
		var rooms = eagle.rooms,
			rand = Math.floor(Math.random() * rooms.length);
		var roomid = rooms[rand];
		
		var type = req.body.type || "message";
		var data = req.body.gamedata || "";
		
		eagle.roomNotify(req.namespace, roomid, type, data);		
		res.json(200);
	});
	app.post(apipath+'/room/:id', function (req, res) {
		var roomid = req.params.id;
		if(eagle.roomExists(roomid)){
			var type = req.body.type || "message";
			var data = req.body.gamedata || "";
			
			eagle.roomNotify(req.namespace, roomid, type, data);
			res.json(200);			
		}else{
			res.json("Room Not Exists", 403);
		}
	});
	
	// ===== Handle 404 ======
	app.all(apipath+'/*', function (req, res){
		res.json("API no found", 404);
	});
};

/**
 * Currently using connect session key in cookie
 * as a general authorizing key
 */
Routes.prototype._authFunc = function(req, res, next) {
	var sesStore = req.sessionStore,
		sessKey = req.param("sessionKey");
	
	if(sessKey){
		var serverns = req.param("server");
		req.namespace = serverns && '/'+serverns || '';
		
		if(sessKey != req.sessionID){
			sesStore.load(sessKey, function (err, sess) {
				if(err && !sess) return res.json("Authorization Failed", 403);
				else{
					req.session.destroy();
					req.session = sess;
					next();
				}
			});	
		}else{
			next();
		}
	}else{
		res.json("Authorization Failed", 403);
	}
};
