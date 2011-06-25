/**
 * @file
 * Client side JS
 */
 
/* 
(function($) {
    $(document).ready(function() {
        // Handle sprockets
        var socket = new io.Socket(); 
        socket.on('connect', function() {
        }); 
        socket.on('message', function(message) {
            $('.socket-status').html('message');
            voter.handleMessage(message);
        });
        socket.on('disconnect', function() {
        });
        socket.connect();
        
        // Get the voting going
        voter.start(socket);
    });
})(jQuery);
*/