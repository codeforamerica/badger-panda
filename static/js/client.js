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
        
        var r = Raphael('main', 640, 480);
        var circle = r.circle(50, 40, 10);
        circle.attr("fill", "#f00");
        
        // Get counts
        voter.updateCounts(socket);
        voter.handleClicks(socket);
    });
})(jQuery);