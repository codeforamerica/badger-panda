/**
 * @file
 * Vote handler
 */

var voter = {};

// Scope jquery
(function($) {
    voter = {
        // Submit vote to system
        'submitVote': function(socket, vote) {
            var thisVoter = this;
            var message = {
                'vote': vote,
                'ip': thisVoter.getIP(),
                'when': new Date()
            }
            console.log(message);
            socket.send(message);
        },
        
        // Get IP and store locally if found
        'getIP': function() {
            if (typeof this.ip == 'undefined') {
                this.ip = $('#ip').html();
            }
            return this.ip
        }
    };
})(jQuery);