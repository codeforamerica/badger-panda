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
        'colors': {
            'badger': ['#FCE138', '#FBDB34', '#FAD531', '#F9CF2E', '#F9C92B', '#F8C328', 
                '#F7BD25', '#F6B722', '#F6B11F', '#F5AB1B', '#F4A518', '#F39F15', '#F39912', 
                '#F2930F', '#F18D0C']
            },
    
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
            
            // Vote circles
            this.badgerVote = this.drawExplosion('badger', this.badgerX, this.badgerY, 1)
                .toBack();
            
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
                
                // Sending in a vote will send back the new count.
                socket.send(message);
                thisVoter.isLoading();
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
console.log(message);
            // Update vote counts
            if (typeof message.badgers != 'undefined') {
                // Check if different
                var badger = ((this.badgerCount != 0) && (this.badgerCount < message.badgers));
                var panda = ((this.pandaCount != 0) && (this.pandaCount < message.pandas));
                var change = (this.badgerCount != message.badgers || this.pandaCount != message.pandas);
                
                if (badger || panda || change) {
                    this.badgerCount = message.badgers;
                    this.pandaCount = message.pandas;
                    this.updateCounts(badger, panda);
                }
            }
        },
        
        // Update counts visually
        'updateCounts': function(votedBadger, votedPanda) {
            var thisVoter = this;
            var total = this.badgerCount + this.pandaCount;
            
            // Scale images for both
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
            
            // If badger pressed, explode!
            if (votedBadger) {
                var scaler = 2000;
                this.badgerVote.toFront();
                this.badger.toFront();
                this.badgerVote.animate({
                    'scale': [scaler, scaler, thisVoter.badgerX, thisVoter.badgerY]
                    }, 2000, 
                    function() {
                        thisVoter.badgerVote.animate({
                        'scale': [1, 1, thisVoter.badgerX, thisVoter.badgerY]
                        }, 2000);
                    });
            }

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
            var text = this.r.text(this.canvasX - 20, 30, 
                'You can vote again in ' + this.voteTimer + ' seconds.')
                .attr({
                    'fill': '#EEEEEE',
                    'font-size': 20,
                    'text-anchor': 'end'
                });
    
            // Countdown
            $(document).everyTime(1000, function(i) {
                text.attr('text', 'You can vote again in ' + (thisVoter.voteTimer - i) + ' seconds.');
            }, this.voteTimer);
            
            // Remove notices
            $(document).oneTime(this.voteTimer * 1000 + 100, function() {
                text.remove();
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
        },
        
        // Draw fun circle
        'drawExplosion': function(colorSet, centerX, centerY, r) {
            var chunks = [];
            var colors = this.colors[colorSet] || ['#1d8dc3','#3193c3', '#449ac3', '#58a0c3','#6ba6c3', '#1d8dc3','#3193c3', '#449ac3', '#58a0c3','#6ba6c3', '#1d8dc3','#3193c3', '#449ac3', '#58a0c3','#6ba6c3', '#1d8dc3','#3193c3', '#449ac3', '#58a0c3','#6ba6c3'];
            var total = 0;
            var pieces = [];
            var angle = 0;
            var deltaAngles = [];
            var circleSet = this.r.set();
            
            // Rnadomize colors
            colors.sort(function() {return 0.5 - Math.random()});
            // Create random chunks
            for (var i = 0; i < colors.length; i++) {
                chunks[i] = Math.random();
            }
            
            // Figure out proportions
            for (var i in chunks) {
                total += chunks[i];
            }
            for (var i in chunks) {
                pieces[i] = (chunks[i] / total);
            }
            
            // Compute the delta angles; the angles for each sector.
            for (var i = 0; i < pieces.length; i++) {
                deltaAngles[i] = pieces[i] * 2 * Math.PI;;
            }
            // Draw each piece
            for (var i = 0; i < pieces.length; i += 1) {
                var sector = this.drawSector(angle, r, centerX, centerY, deltaAngles[i], {
                    'fill': colors[i], 
                    'stroke-width': 0,
                    'opacity': 0.7
                    }, this.r);
                circleSet.push(sector);
                angle += deltaAngles[i];
            }
            return circleSet;
        },
        
        'drawSector': function(angle, r, x, y, deltaAngle, displayParameters, canvas) {
            // Drawing a path; return it so we can do things to it later on.
            var secondX = x + r * Math.cos(-angle);
            var secondY = y + r * Math.sin(-angle);
            var finalAngle = angle + deltaAngle;
            var thirdX = x + r * Math.cos(-finalAngle);
            var thirdY = y + r * Math.sin(-finalAngle);

            return canvas.path(["M", x, y, "L", secondX, secondY, "A", 
                r, r, 0, +(finalAngle - angle > Math.PI), 0, 
                thirdX, thirdY, "z"])
                .attr(displayParameters);
        }
    };
})(jQuery);