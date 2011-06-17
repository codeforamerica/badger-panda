/**
 * @fileoverview Main server for Badger v Panda
 */
 
// Set paths for easier requires
require.paths.unshift(
    __dirname + '/lib',
    __dirname
);

// Requires libraries
var connect = require('connect');
var express = require('express');
var cradle = require('cradle');
var port = 8080;

// Create express-based server and configure
var app = express.createServer();
app.configure(function() {
    app.set('view engine', 'ejs');
    app.set('view options', { layout: false });
    app.use(express.static('static'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({'secret': 'this-is-a-non-secure-secret'}));
    app.use(app.router);
});

// Set up the database connection
var conn = new (cradle.Connection)('badger-panda.iriscouch.com', 5986);

// This is a one page site.
app.get('/', function(req, res) {
    res.render('index.ejs', {});
});

// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(port);
    console.log('Server started on port: ' + port);
}
exports.app = app;