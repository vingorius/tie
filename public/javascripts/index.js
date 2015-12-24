$(document).ready(function() {
    // Initialize variables
    var $window = $(window);
    // var $frontMessage = $('#frontMessage');
    var $roomname = $('#roomname');
    var $startForm = $('#startForm');
    var $startBtn = $('#startBtn');

    //Front Animated Message
    // $frontMessage.typed({
    //     strings: ["대화 내용을 <strong>녹음</strong>하나요?","회원 가입을 해야합니까?", "로그인 안하면 대화가 안되나요?","그냥 ^1000 \"어디서 만나자\"라면 되지."],
    //     contentType: 'html',
    //     typeSpeed: 100,
    //     // time before typing starts
    //     startDelay: 2000,
    //     // backspacing speed
    //     backSpeed: 0,
    //     // time before backspacing
    //     backDelay: 500,
    //     // loop
    //     loop: true,
    //     // false = infinite
    //     loopCount: false,
    //     // show cursor
    //     showCursor: true,
    //     // character for cursor
    //     // cursorChar: "|",
    //     // attribute to type (null == text)
    //     attr: null,
    //     // call when done callback function
    //     callback: function() {},
    //     // starting callback function before each string
    //     preStringTyped: function() {},
    //     //callback for every typed string
    //     onStringTyped: function() {},
    //     // callback for reset
    //     resetCallback: function() {}
    // });

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
