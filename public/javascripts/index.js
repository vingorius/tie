$(document).ready(function() {
    // Initialize variables
    var $window = $(window);
    var $basicUrl = $('#basic-url');
    var $startForm = $('#startForm');


    // Start Form submit
    $startForm.submit(function(event) {
        var url = cleanInput($basicUrl.val().trim());

        event.preventDefault();
        if (url.length > 0) {
            this.action = url;
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
