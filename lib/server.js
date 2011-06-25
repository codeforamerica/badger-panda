/**
 * @fileoverview Main server for Badger v Panda
 */

// Don't crash on errors
process.on('uncaughtException', function (err) {
  console.log('Caught uncaughtException: ' + err.stack);
});

// Set paths for easier requires
require.paths.unshift(
    __dirname + '/lib',
    __dirname
);

// Get local settings.
var settings = require('settings');
// 100 in an hour
var throttleVotes = 100;
var throttleTime = 1000 * 60;
var throttle = {};

// Check for environment variables
if (process.env.DB_HOST) {
  settings.db.host = process.env.DB_HOST;
  settings.db.user = process.env.DB_USER;
  settings.db.pass = process.env.DB_PASS;
  settings.db.port = process.env.DB_PORT;
  settings.db.name = process.env.DB_NAME;
};


// Requires libraries
var io = require('socket.io');
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
if (settings.db.user) {
    var conn = new (cradle.Connection)(settings.db.host, settings.db.port, {
        auth: { username: settings.db.user, password: settings.db.pass }
    });
}
else {
    var conn = new (cradle.Connection)(settings.db.host, settings.db.port);
}
var db = conn.database(settings.db.name);

// Socket starting
var socket = io.listen(app);
socket.on('connection', function(client) {
    var ip = client.connection.remoteAddress;

    // Handle messages
    client.on('message', function(message) {
        // Check action
        if (message.action) {
        
            // Count vote here
            if (message.action == 'save-vote') {
                message.when = new Date();
                message.ip = ip;
                
                // Throttle
                var throttled = true;
                throttled = exports.doThrottle(message);

                // If not throttle
                if (!throttled) {
                    db.save(message, function (err, res) {
                        if (err) {
                            console.error(err);
                            client.send({'error': err});
                        } 
                        else {
                            client.emit(res);
                            // Send new vote count
                            exports.getVotes(function(message, err, res) {
                                if (err) {
                                    console.error(err);
                                    client.send(err);
                                }
                                else {
                                  // Send out to all clients
                                  socket.broadcast(message);
                                }
                            });
                        }
                    });
                }
                else {
                    client.send({
                        'throttled': true
                    });
                }
            }
            
            // Get count
            if (message.action == 'get-counts') {
                exports.getVotes(function(message, err) {
                    if (err) {
                        console.error(err);
                        client.send(err);
                    }
                    else {
                        // Send out to all clients
                        socket.broadcast(message);
                    }
                });
            }
        }
    }); 
    client.on('disconnect', function() { });
});
console.log('Server side socket started.');

// Get votes.
exports.getVotes = function(callback) {
    db.view('bp/bp-counts', {group: true}, function (err, res) {
        var message = {
            'badgers': 0,
            'pandas': 0
        };
        for (var i in res) {
            message.badgers = (res[i].key == 'badger') ? res[i].value : message.badgers;
            message.pandas = (res[i].key == 'panda') ? res[i].value : message.pandas;
        }
        callback(message, err);
    });
}

exports.doThrottle = function(message) {
    var now = new Date();
    var throttled = true;
    
    // Reset throttle if we are over the time amount.
    if (throttle[message.ip] && (now.getTime() - throttle[message.ip].when.getTime() > throttleTime)) {
        throttle[message.ip] = null;
    }
    
    // Set initial throttle entry
    throttle[message.ip] = throttle[message.ip] || {
        count: 0,
        when: new Date()
    };
    throttle[message.ip].count++;
    
    // Check the throttle
    if (throttle[message.ip].count < throttleVotes && 
        (now.getTime() - throttle[message.ip].when.getTime()) < throttleTime) {
        throttled = false;
    }
    
    return throttled;
}

// This is a one page site.
app.get('/', function(req, res) {
    var context = {};
    if (req.connection.remoteAddress) {
        context.ip = req.connection.remoteAddress;
    }
    res.render('index.ejs', context);
});

// Start server
app.listen(port);
console.log('Server started on port: ' + port);
exports.app = app;