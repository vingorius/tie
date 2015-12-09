$(document).ready(function() {
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var CIPER_MIN_LENGTH = 4; // char
    var COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    // Initialize variables
    var $window = $(window);
    // var $usernameInput = $('#usernameInput'); // Input for username
    var $roomnameInput = $('#roomnameInput'); // Input for username
    var $ciperInput = $('#ciperInput'); // Input for username
    var $messages = $('#messages'); // Messages area
    var $inputMessage = $('#inputMessage'); // Input message input box
    var $inputURL = $('#inputURL'); // Input url box

    var $roomPage = $('#roomPage'); // The room page
    var $ciperPage = $('#ciperPage'); // The ciper page
    var $chatPage = $('#chatPage'); // The chatroom page

    var server = window.location.origin;
    // Prompt for setting a username
    var username, roomname, ciper;
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $roomnameInput.focus();

    var option = {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
    };
    var socket = io(server + '/chat', option);

    /**
     * if there's roomname on url, it was invited.
     */
    if ($roomnameInput.val()) {
        setRoomname();
    }

    function addParticipantsMessage(data) {
        console.log('addParticipantsMessage', data);

        var message = '';
        if (data.numUsers === 1) {
            message += "there's 1 participant";
        } else {
            message += "there are " + data.numUsers + " participants";
        }
        log(message);
    }
    // run Command, change username
    function runCommand(cmd) {
        var newname = cmd.substring(1);
        username = newname;
        socket.emit('new name', username);
        log('chnaged to ' + username);
        $inputMessage.val('');
    }

    // Sets the client's username
    function setCiper() {
        ciper = cleanInput($ciperInput.val().trim());

        // If the ciper is valid
        console.log(ciper, ciper.length);
        if (ciper) {
            $ciperPage.fadeOut();
            $chatPage.show();
            $ciperPage.off('click');
            $currentInput = $inputMessage.focus();

            // Tell the server your username
            socket.emit('add user', roomname);
        }
    }
    // validate ciper, i should length 4+
    function validateCiper() {
        ciper = cleanInput($ciperInput.val().trim());
        if (ciper.length < CIPER_MIN_LENGTH) return false;
        else return true;
    }
    // Sets the client's roomname
    // function setRoomname() {
    //     roomname = cleanInput($roomnameInput.val().trim());
    //     username = 'Guest'
    //     // If the username is valid
    //     if (roomname) {
    //         $roomPage.fadeOut();
    //         $chatPage.show();
    //         $roomPage.off('click');
    //         $currentInput = $inputMessage.focus();
    //
    //         // Tell the server your roomname
    //         // socket.emit('add room', roomname);
    //         socket.emit('add user', roomname, username);
    //     }
    // }
    function setRoomname() {
        roomname = cleanInput($roomnameInput.val().trim());

        // If the roomname is valid
        if (roomname) {
            $roomPage.fadeOut();
            $ciperPage.show();
            $roomPage.off('click');
            $currentInput = $ciperInput.focus();
        }
    }

    // Sends a chat message
    function sendMessage() {
        var message = $inputMessage.val();
        // Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && connected) {
            $inputMessage.val('');
            addChatMessage({
                username: username,
                message: message
            });
            // tell server to execute 'new message' and send along one parameter
            var encrypted = CryptoJS.AES.encrypt(message, ciper);

            // socket.emit('new message', message);
            socket.emit('new message', encrypted.toString());
        }
    }

    // Log a message
    function log(message, options) {
        var $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    // Adds the visual chat message to the message list
    function addChatMessage(data, options) {
        // Don't fade the message in if there is an 'X was typing'
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var $usernameDiv = $('<span/>');
        if (data.username !== username)
            $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css('color', getUsernameColor(data.username));
        var $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        // var typingClass = data.typing ? 'typing' : '';
        var typingClass = data.typing ? 'typing' :
            (data.username === username) ? 'mymessage' : 'yourmessage';

        var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }

    // Adds the visual chat typing message
    function addChatTyping(data) {
        data.typing = true;
        data.message = 'is typing';
        addChatMessage(data);
    }

    // Removes the visual chat typing message
    function removeChatTyping(data) {
        getTypingMessages(data).fadeOut(function() {
            $(this).remove();
        });
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    // options.color - text color
    function addMessageElement(el, options) {
        var $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }

        // Apply color option
        if (options.color) {
            $el.css('color', options.color);
        }

        $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    // Prevents input from having injected markup
    function cleanInput(input) {
        return $('<div/>').text(input).text();
    }

    // Updates the typing event
    function updateTyping() {
        if (connected) {
            if (!typing) {
                typing = true;
                socket.emit('typing');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(function() {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    socket.emit('stop typing');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    // Gets the 'X is typing' messages of a user
    function getTypingMessages(data) {
        return $('.typing.message').filter(function(i) {
            return $(this).data('username') === data.username;
        });
    }

    // Gets the color of a username through our hash function
    function getUsernameColor(username) {
        // Compute hash code
        var hash = 7;
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    // Keyboard events

    $window.keydown(function(event) {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            var message = $inputMessage.val() || '';
            if (!roomname) return setRoomname();
            // if (!username) return setUsername();
            if (!ciper) return setCiper();
            if (message.startsWith('/')) return runCommand(message);

            sendMessage();
            socket.emit('stop typing');
            typing = false;
        }
    });

    $inputMessage.on('input', function() {
        updateTyping();
    });

    // Click events

    // Focus input when clicking anywhere on ciper page
    $ciperPage.click(function() {
        $currentInput.focus();
    });

    // Focus input when clicking on the message input's border
    $inputMessage.click(function() {
        $inputMessage.focus();
    });



    // Socket events

    // Whenever the server emits 'login', log the login message
    socket.on('login', function(data) {
        console.log('login', data);
        connected = true;
        username = data.username;
        // Display the welcome message
        var url = server + '/' + roomname;
        $inputURL.val(url);
        // var message = "Share this: " + server + '/' + roomname;
        var message = 'Welcome \'' + username + '\' on \'' + roomname + '\'.';
        log(message, {
            prepend: true
        });
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'new message', update the chat body
    socket.on('new message', function(data) {

        var decrypted;
        try {
            decrypted = CryptoJS.AES.decrypt(data.message, ciper);
            data.message = decrypted.toString(CryptoJS.enc.Utf8);
            if (!data.message)
                log('Received a broken message. key mismatch!!!', {
                    color: 'red'
                });
            else {
                addChatMessage(data);
            }
        } catch (e) {
            console.log(e);
            // if (!data.message)
            log('Received a broken message. key mismatch!!!', {
                color: 'red'
            });
        }
    });

    // Whenever the server emits 'new name', update user name
    socket.on('new name', function(data) {
        log(data);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function(data) {
        log(data.username + ' joined');
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function(data) {
        log(data.username + ' left');
        addParticipantsMessage(data);
        removeChatTyping(data);
    });

    // Whenever the server emits 'typing', show the typing message
    socket.on('typing', function(data) {
        addChatTyping(data);
    });

    // Whenever the server emits 'stop typing', kill the typing message
    socket.on('stop typing', function(data) {
        removeChatTyping(data);
    });

    // Whenever the server emits 'error', show it as log
    socket.on('error', function(data) {
        log(data, {
            color: 'red'
        });
    });

});