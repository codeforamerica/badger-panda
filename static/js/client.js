/**
 * @file
 * Client side JS
 */
(function($) {
    $(document).ready(function() {
        // Handle sprockets
        var socket = new io.Socket(); 
        socket.on('connect', function() {
            $('.socket-status').html('connected');
        }); 
        socket.on('message', function(message) {
            $('.socket-status').html('message');
            voter.handleMessage(message);
        });
        socket.on('disconnect', function() {
            $('.socket-status').html('disconnected');
        });
        socket.connect();
        
        // Get counts
        voter.updateCounts(socket);
        
        // Handle badger vote
        $('a.vote-badger').click(function() {
            voter.submitVote(socket, 'badger');
            return false;
        }); 
        
        // Handle panda vote
        $('a.vote-panda').click(function() {
            voter.submitVote(socket, 'panda');
            return false;
        }); 
    });
})(jQuery);