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
// 3 votes per session
var throttleVotes = 3;
var throttle = {};
var maintenance = false;

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

// Check for maintenance mode
if (!maintenance) {
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
        // This is not accurate.  We need the X-Forwarded IP,
        // but this is not necessarily set up depending
        // on server config.
        var ip = '';
console.log(client.request);
        if (client.request && client.request.headers) {
            ip = (client.request.headers['x-real-ip']) ? client.request.headers['x-real-ip'] : '';
            ip = (client.request.headers['x-forwarded-for']) ? client.request.headers['x-forwarded-for'] : '';
        }
        else {
            ip = client.connection.remoteAddress;
        }
        
        // Handle error
        client.on('error', function(err) {
            console.log(err);
        });

        // Handle messages.  TODO: Not using
        // the socket events correctly
        client.on('message', function(message) {
            // Check action
            if (message.action) {
            
                // Count vote here
                if (message.action == 'save-vote') {
                    message.when = new Date();
                    message.ip = ip;
                    delete message.action;
                    
                    // Throttle
                    var throttled = true;
                    throttled = exports.doThrottle(message, client);
    
                    // If not throttle
                    if (!throttled && client.handshaked) {
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
                                      // Send out to all clients.  TODO: Socket.io
                                      // has a volatile option, but cannot seem
                                      // to get it to work for broadcasting.
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
    
    // Throttle logic.  Socket sessions are per 
    exports.doThrottle = function(message, client) {
        var throttled = true;
        
        // Create new entry if needed
        throttle[client.sessionId] = throttle[client.sessionId] || 0;
        throttle[client.sessionId]++;
        
        // Check for limit
        if (throttle[client.sessionId] <= throttleVotes) {
            throttled = false;
        }
        
        // Clean up the throttle variable a bit, so memory
        // usage is not super high.
        if (Object.keys(throttle).length > 10000) {
            var first;
            for (first in throttle) break;
            delete throttle[first];
        }
        
        return throttled;
    }
}

// This is a one-ish page site.
app.get('/about', function(req, res) {
    var context = {
        'about': true,
        'maintenance': maintenance
    };
    res.render('index.ejs', context);
});
app.get('*', function(req, res) {
    var context = {
        'about': false,
        'maintenance': maintenance
    };
    res.render('index.ejs', context);
});

// Start server
app.listen(port);
console.log('Server started on port: ' + port);
exports.app = app;