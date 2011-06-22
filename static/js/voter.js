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
        'voteTimer': 20,
        'canvasX': 800,
        'canvasY': 480,
        'imageInitialDim': 20,
        'imageMinDim': 150,
        'imageScaleDim': 300,
        'countColor': '#CCCCCC',
    
        'start': function(socket) {
            // Calculate some things
            this.canvasX = $(window).width();
            this.canvasY = $(window).height();
            this.badgerX = this.canvasX * .25;
            this.badgerY = this.canvasY * .5;
            this.pandaX = this.canvasX * .75;
            this.pandaY = this.canvasY * .5;
            this.imageScaleDim = this.canvasY * .7;
            
            // Create the canvas
            this.r = Raphael(0, 0, this.canvasX, this.canvasY);
            
            // Initial badger and panda
            this.badger = this.r.image('/img/badger.svg', 
                this.badgerX - (this.imageInitialDim / 2), 
                this.badgerY - (this.imageInitialDim / 2), 
                this.imageInitialDim, this.imageInitialDim
            );
            this.panda = this.r.image('/img/panda.svg',
                this.pandaX - (this.imageInitialDim / 2), 
                this.pandaY - (this.imageInitialDim / 2), 
                this.imageInitialDim, this.imageInitialDim
            );
            
            // Votes
            this.badgerVotes = this.r.text(this.badgerX, 
                this.badgerY + this.imageInitialDim + 20, '0').attr({
                'font-size': 1,
                'fill': this.countColor
            });
            this.pandaVotes = this.r.text(this.pandaX, 
                this.pandaY + this.imageInitialDim + 20, '0').attr({
                'font-size': 1,
                'fill': this.countColor
            });
            
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
            
            // Scale images
            var pandaDim = ((this.pandaCount / total) * this.imageScaleDim) + this.imageMinDim;
            this.panda.animate({
                'width': pandaDim,
                'height': pandaDim,
                'x': this.pandaX - (pandaDim / 2),
                'y': this.pandaY - (pandaDim / 2),
                'rotation': '360'
            }, 1000, 'elastic');
            
            var badgerDim = ((this.badgerCount / total) * this.imageScaleDim) + this.imageMinDim;
            this.badger.animate({
                'width': badgerDim,
                'height': badgerDim,
                'x': this.badgerX - (badgerDim / 2),
                'y': this.badgerY - (badgerDim / 2),
                'rotation': '360'
            }, 1000, 'elastic');

            // Vote text
            this.pandaVotes.attr({
                'font-size': ((this.pandaCount / total) * 30) + 10,
                'text': this.pandaCount.toString(),
                'y': this.pandaY + (pandaDim / 2) + 30
            });
            this.badgerVotes.attr({
                'font-size': ((this.badgerCount / total) * 30) + 10,
                'text': this.badgerCount.toString(),
                'y': this.badgerY + (badgerDim / 2) + 30
            });
            
            // Mark as done loading
            this.doneLoading();
        },
        
        // Stop votes
        'stopVotes': function() {
            var thisVoter = this;
            thisVoter.canVote = false;
            var overlay = this.r.rect(0, 0, this.canvasX, this.canvasY)
                .attr({
                    'fill': '#222222',
                    'opacity': 0.95,
                    'stroke-width': 0
                });;
            var text = this.r.text(this.canvasX / 2, this.canvasY / 2, 
                'You can vote again in \n' + this.voteTimer + ' seconds.')
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
            },
            function() { });
            $(this.panda.node).hover(function() {
                $(this).css('cursor', 'pointer');
            },
            function() { });
        
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