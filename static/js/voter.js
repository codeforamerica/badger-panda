/**
 * @file
 * Vote handler
 */

var voter = {};

// Scope jquery
(function($) {
    voter = {
        'canVote': true,
        'badgerCount': 0,
        'pandaCount': 0,
    
        'start': function(socket) {
            // Initial badger and panda
            this.r = Raphael('main', 800, 480);
            this.badger = this.r.circle(200, 240, 0);
            this.badger.attr('fill', '#999999');
            this.panda = this.r.circle(600, 240, 0);
            this.panda.attr('fill', '#FF0000');
            // Add text
            var textAttr = {
                'font-size': 1,
                'text-anchor': 'middle'
            };
            this.badgerText = this.r.text(200, 240, 'BADGERS').attr(textAttr);
            this.pandaText = this.r.text(600, 240, 'PANDAS').attr(textAttr);
            
            // Get started
            this.isLoading();
            this.getCounts(socket);
            this.handleClicks(socket);
        },
        
        // Represent loading
        'isLoading': function() {
            $('#loading').show();
        },
        
        // Handle not loading
        'doneLoading': function() {
            $('#loading').hide();
        },
    
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
        'getCounts': function(socket) {
            socket.send({ 'action': 'get-counts' });
        },
        
        // Handle incoming messages
        'handleMessage': function(message) {
            // Update vote counts
            if (typeof message.badgers != 'undefined') {
                // Check if different
                if (this.badgerCount != message.badgers || this.pandaCount != message.pandas) {
                    this.badgerCount = message.badgers;
                    this.pandaCount = message.pandas;
                    this.updateCounts();
                }
            }
        },
        
        // Update counts visually
        'updateCounts': function() {
            var total = this.badgerCount + this.pandaCount;
            this.panda.animate({
                'r': ((this.pandaCount / total) * 150) + 50
            }, 1000, 'elastic');
            this.badger.animate({
                'r': ((this.badgerCount / total) * 150) + 50
            }, 1000, 'elastic');
            
            // Label text
            this.pandaText.animate({
                'font-size': ((this.pandaCount / total) * 20) + 5
            }, 1000, 'elastic');
            this.badgerText.animate({
                'font-size': ((this.badgerCount / total) * 20) + 5
            }, 1000, 'elastic');

            // Vote text
            var y = ((((this.pandaCount / total) * 150) + 50) / 4) + 240;
            this.pandaVotes = this.r.text(600, y, this.pandaCount)
                .attr({
                    'font-size': ((this.pandaCount / total) * 30) + 10
                });
            y = ((((this.badgerCount / total) * 150) + 50) / 4) + 240;
            this.badgerVotes = this.r.text(200, y, this.badgerCount)
                .attr({
                    'font-size': ((this.badgerCount / total) * 30) + 10
                });
            
            this.doneLoading();
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