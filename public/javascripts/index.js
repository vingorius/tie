$(document).ready(function() {
    // Initialize variables
    var $window = $(window);
    var $roomname = $('#roomname');
    var $startForm = $('#startForm');
    var $startBtn = $('#startBtn');


    // Start Form submit
    $startForm.submit(function(event) {
        var roomname = cleanInput($roomname.val().trim());
        // alert($server.text() + roomname);

        event.preventDefault();
        if (roomname.length > 0) {
            $startForm.removeClass('has-error');
            this.action = roomname;
            this.submit();
        } else {
            $startForm.addClass('has-error');
        }
        // event.preventDefault();
    });

    // Prevents input from having injected markup
    function cleanInput(input) {
        return $('<div/>').text(input).text();
    }
});
