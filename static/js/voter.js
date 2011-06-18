/**
 * @file
 * Vote handler
 */

var voter = {};

// Scope jquery
(function($) {
    voter = {
        'canVote': true,
    
        // Submit vote to system
        'submitVote': function(socket, vote) {
            var thisVoter = this;
            if (this.canVote == true) {
                thisVoter.stopVotes();
                var message = {
                    'action': 'save-vote',
                    'vote': vote,
                    'ip': thisVoter.getIP(),
                    'when': new Date()
                }
                socket.send(message);
                thisVoter.updateCounts(socket);
            }
            return false;
        },
        
        // Get IP and store locally if found
        'getIP': function() {
            if (typeof this.ip == 'undefined') {
                this.ip = $('#ip').html();
            }
            return this.ip
        },
        
        // Get count
        'updateCounts': function(socket) {
            socket.send({ 'action': 'get-counts' });
        },
        
        // Handle incoming messages
        'handleMessage': function(message) {
            if (typeof message.badgers != 'undefined') {
                this.badgerCount = message.badgers;
                this.pandaCount = message.pandas;
                $('.badger-count').html(message.badgers).parent().effect('highlight');
                $('.panda-count').html(message.pandas).parent().effect('highlight');
            }
        },
        
        // Stop votes
        'stopVotes': function() {
            var thisVoter = this;
            thisVoter.canVote = false;
            $('.can-vote').html('Can\'t vote');
    
            $('.can-vote-left').html('5 secs');
            $(document).everyTime(1000, function(i) {
                $('.can-vote-left').html((5 - i) + ' secs');
                if (i == 5) {
                    $('.can-vote-left').html('');
                }
            }, 5);
            
            $(document).oneTime(5000, function() {
                $('.can-vote').html('Can vote!').parent().effect('highlight');
                $('.can-vote-left').html('');
                thisVoter.canVote = true;
            });
        },
        
        // Handle clicks
        'handleClicks': function(socket) {
            var thisVoter = this;
        
            // Handle badger vote
            $('a.vote-badger').click(function() {
                thisVoter.submitVote(socket, 'badger');
                return false;
            }); 
            
            // Handle panda vote
            $('a.vote-panda').click(function() {
                thisVoter.submitVote(socket, 'panda');
                return false;
            }); 
        }
    };
})(jQuery);