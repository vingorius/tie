$(document).ready(function() {
    // Initialize variables
    var $window = $(window);
    var $server = $('#server');
    var $roomname = $('#roomname');
    var $startForm = $('#startForm');


    // Start Form submit
    $startForm.submit(function(event) {
        var roomname = cleanInput($roomname.val().trim());
        // alert($server.text() + roomname);

        event.preventDefault();
        if (roomname.length > 0) {
            // CopyToClipboard($server.text() + roomname, true);
            this.action = roomname;
            this.submit();
        } else {
            alert('insert');
        }
        event.preventDefault();
    });

    // Prevents input from having injected markup
    function cleanInput(input) {
        return $('<div/>').text(input).text();
    }
});
