/**
 * Server of Eagle Example
 * This file is the core application launcher. 
 */

/**
 * Module dependencies.
 */
var express = require('express'),
	MemoryStore = express.session.MemoryStore;

//Local App Variables
var port = process.env.PORT || 3000;
	
var app = module.exports = express.createServer();
app.path = __dirname;

// Configuration
app.set('server-url', 'http://localhost');

app.configure('development', function(){
	app.use(express.logger({ format: ':method :url :status' }));
});

//Global Settings
app.configure(function(){
	// View Setting
	app.set('views', app.path + '/views');
	app.register('.html', require('ejs'));
	app.set('view engine', 'html');
	
	// Start config app
	app.use(express.favicon());
    app.use(express.methodOverride());
    app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.store = new MemoryStore();
	app.use(express.session({
		secret: 'eagleExample_fj082hA$1sd*FD11sa',
		store: app.store
	}));
	
	// Enable express router
	app.use(app.router);
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
});

// server start listening
app.listen(port);

// ======= Now Server Started ========
var Eagle = require('../').Eagle;
var eagle = new Eagle(app, app.store);
eagle.io.set('transports', ['websocket']);

// Init the default namespace
eagle.nsInit();

app.locals({ 
	serverURL : app.set('server-url'),
	apiURL : eagle.apipath,
});

// Setup the errors
app.error(function(err, req, res, next){
		if (err instanceof NotFound) {
        res.render('404', { locals: { 
                 title : '404 - Not Found'
                },layout:false,status: 404 });
    } else {
        res.render('500', {locals: { 
                 title : 'The Server Encountered an Error'
                 ,error: err 
                },layout:false,status: 500 });
    }
});

app.get('/*', function commonCheck (req, res, next) {
	res.render("index");
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
