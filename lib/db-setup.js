/**
 * This file is to describe the design documents needed for this
 * application to use.  This is for a CouchDB.
 */

// Set paths for easier requires
require.paths.unshift(
    __dirname + '/lib',
    __dirname
);

// Get local settings.
var settings = require('settings');
var args = process.argv;

// Check for environment variables
if (process.env.DB_HOST) {
  settings.db.host = process.env.DB_HOST;
  settings.db.user = process.env.DB_USER;
  settings.db.pass = process.env.DB_PASS;
  settings.db.port = process.env.DB_PORT;
  settings.db.name = process.env.DB_NAME;
};

// Requires libraries
var cradle = require('cradle');
var port = 8080;

// Set up the database connection
if (settings.db.user) {
    var conn = new (cradle.Connection)(settings.db.host, settings.db.port, {
        auth: { username: settings.db.user, password: settings.db.pass }
    });
}
else {
    var conn = new (cradle.Connection)(settings.db.host, settings.db.port);
}

// Create database for votes
var db = conn.database('votes');
db.create();

// Check if deleting all votes
if (args.indexOf('--delete-votes') != -1) {
    console.log('Deleting votes ....');
    db.all(function(err, docs) {
        if (!err) {
            for (var i in docs) {
                db.remove(docs[i].id, docs[i].value.rev, function (err, res) {
                });
            }
        }
    });
}

// Badger Panda views
db.save('_design/bp', {
    'bp-counts': {
        map: function(doc) {
            emit(doc.vote, 1);
        },
        reduce: function(keys, values, rereduce) {
            return sum(values);
        }
    },
    'bp-votes': {
        map: function(doc) {
            emit(doc.vote, doc);
        }
    }
});

// Badger views
db.save('_design/badgers', {
    'badger-counts': {
        map: function(doc) {
            if (doc.vote == 'badger') {
                emit(doc.id, 1);
            }
        },
        reduce: function(keys, values, rereduce) {
            return sum(values);
        }
    },
    'badger-votes': {
        map: function(doc) {
            if (doc.vote == 'badger') {
                emit('badger', doc);
            }
        }
    }
});

// Panda views
db.save('_design/pandas', {
    'panda-counts': {
        map: function(doc) {
            if (doc.vote == 'panda') {
                emit(doc.id, 1);
            }
        },
        reduce: function(keys, values, rereduce) {
            return sum(values);
        }
    },
    'panda-votes': {
        map: function(doc) {
            if (doc.vote == 'panda') {
                emit('panda', doc);
            }
        }
    }
});

// IP views
db.save('_design/ip', {
    'ip-counts': {
        map: function(doc) {
            emit(doc.ip, 1);
        },
        reduce: function(keys, values, rereduce) {
            return sum(values);
        }
    },
    'ips': {
        map: function(doc) {
            emit(doc.ip, doc);
        }
    }
});