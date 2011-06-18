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
        voter.handleClicks(socket);
    });
})(jQuery);