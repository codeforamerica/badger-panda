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
var db = conn.database(settings.db.name);

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
    'ips': {
        map: function(doc) {
            emit(doc.ip, doc);
        }
    }
});