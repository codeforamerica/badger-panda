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
        'badgerColor': '#AAAAAA',
        'badgerColorHover': '#FFFFFF',
        'pandaColor': '#AAAAAA',
        'pandaColorHover': '#FFFFFF',
        'voteTimer': 20,
    
        'start': function(socket) {
            // Initial badger and panda
            this.r = Raphael('main', 800, 480);
            this.badger = this.r.circle(200, 240, 0);
            this.badger.attr('fill', this.badgerColor);
            this.panda = this.r.circle(600, 240, 0);
            this.panda.attr('fill', this.pandaColor);
            // Add text
            var textAttr = {
                'font-size': 1,
                'text-anchor': 'middle'
            };
            this.badgerText = this.r.text(200, 240, 'BADGERS').attr(textAttr);
            this.pandaText = this.r.text(600, 240, 'PANDAS').attr(textAttr);
            // Votes
            this.badgerVotes = this.r.text(200, 250, '0').attr({ 'font-size': 1 });
            this.pandaVotes = this.r.text(600, 250, '0').attr({ 'font-size': 1 });
            
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
                thisVoter.isLoading();
                thisVoter.getCounts(socket);
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
            this.pandaVotes.attr({
                'font-size': ((this.pandaCount / total) * 30) + 10,
                'text': this.pandaCount.toString(),
                'y': y
            });
            y = ((((this.badgerCount / total) * 150) + 50) / 4) + 240;
            this.badgerVotes.attr({
                'font-size': ((this.badgerCount / total) * 30) + 10,
                'text': this.badgerCount.toString(),
                'y': y
            });
            
            // Mark as done loading
            this.doneLoading();
        },
        
        // Stop votes
        'stopVotes': function() {
            var thisVoter = this;
            thisVoter.canVote = false;
            var overlay = this.r.rect(0, 0, 800, 640)
                .attr({
                    'fill': '#222222',
                    'opacity': 0.95,
                    'stroke-width': 0
                });;
            var text = this.r.text(400, 240, 'You can vote again in \n' + this.voteTimer + ' seconds.')
                .attr({
                    'fill': '#EEEEEE',
                    'font-size': 50
                });
    
            $('.can-vote-left').html('5 secs');
            $(document).everyTime(1000, function(i) {
                text.attr('text', 'You can vote again in \n' + (thisVoter.voteTimer - i) + ' seconds.');
            }, this.voteTimer);
            
            $(document).oneTime(this.voteTimer * 1000 + 100, function() {
                text.remove();
                overlay.remove();
                thisVoter.canVote = true;
            });
        },
        
        // Handle clicks
        'handleClicks': function(socket) {
            var thisVoter = this;
            
            // Handle hovers
            $(this.badger.node).hover(function() {
                $(this).css('cursor', 'pointer');
                thisVoter.badger.attr('fill', thisVoter.badgerColorHover);
            },
            function() {
                thisVoter.badger.attr('fill', thisVoter.badgerColor);
            });
            $(this.panda.node).hover(function() {
                $(this).css('cursor', 'pointer');
                thisVoter.panda.attr('fill', thisVoter.pandaColorHover);
            },
            function() {
                thisVoter.panda.attr('fill', thisVoter.pandaColor);
            });
        
        
            // Handle badger vote
            $(this.badger.node).click(function() {
                thisVoter.submitVote(socket, 'badger');
            }); 
            
            // Handle panda vote
            $(this.panda.node).click(function() {
                thisVoter.submitVote(socket, 'panda');
            }); 
        }
    };
})(jQuery);