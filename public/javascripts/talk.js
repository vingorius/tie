$(function() {
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [
        '#e21400', '#91580f', '#ba7f04', '#cd7300',
        '#43a700', '#287b00', '#59e500', '#00c498',
        '#277dec', '#3824aa', '#68019e', '#880494'
    ];
    var COOKIE_USERNAME_KEY = 'username';
    var LOG_URGENT = {
        'color': '#A94442'
    };

    // Initialize variables
    var $window = $(window);
    var $ciperModal = $('#ciperModal'); // Ciper Input Modal Dialog
    var $ciperInput = $('#ciperInput'); // Input for ciper
    var $ciperModalOKButton = $('#ciperModalOKButton'); // Ciper Modal OK Button
    var $userModal = $('#userModal'); // User Name Input Modal Dialog
    var $userInput = $('#userInput'); // Input for user name
    var $userModalOKButton = $('#userModalOKButton'); // User Modal OK Button
    var $roomurl = $('#roomurl'); // URL + roomname
    var $messages = $('#messages'); // Messages area
    var $startMessage = $('#startMessage'); // show when connect to server succesfully.
    var $startWarning = $('#startWarning'); // show when no ciper.
    var $inputMessage = $('#inputMessage'); // Input message input box
    var $username = $('#username'); // User Name
    var $copyButton = $('#copyButton');
    var $sendButton = $('#sendButton'); // Input Message Send Button

    // Prompt for setting a ciper
    var userid, username, ciper;
    var connected = false;
    var typing = false;
    var lastTypingTime;

    var server = getServer();
    var option = {
        forceNew: true
    };

    var socket = io(server + '/chat', option);

    // Init 'Copy to Clipboard' Button
    var clipboard = new Clipboard('#copyButton');

    // Show modal to ask 'ciper'.
    $ciperModal.modal('show');

    // clear input
    $inputMessage.val('');

    // Padding Left with '0', ex) 1 -> 01, to render message time.
    function padleft(no) {
        var str = "" + no;
        var pad = "00";
        return pad.substring(0, pad.length - str.length) + str;
    }

    // For IE
    function getServer() {
        var sever = window.location.origin;
        if (!server) {
            server = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        }
        return server;
    }

    // log how many participants are.
    function addParticipantsMessage(data) {
        var message = (data.numUsers === 1) ? '현재 혼자 방에 있습니다.' : '현재 ' + data.numUsers + '명이 방에 있습니다.';
        log(message);
    }

    // run Command, change username
    function changeName(newname) {
        setUsername(newname);
        socket.emit('new name', newname, function(ack) {
            var message = (ack.OK) ? newname + ' (으)로 이름을 바꾸었습니다.' : '전송 오류 : ' + ack.message;
            log(message);
        });
    }

    // Set User name, 한번 이름을 바꾸면 다음에도 계속 그 이름을 쓸 수 있도록 쿠키로 저장.
    function setUsername(data) {
        $username.text(data);
        username = data;
        Cookies.set(COOKIE_USERNAME_KEY, data);
    }

    // Get User name from cookie.
    function getUsername() {
        return Cookies.get(COOKIE_USERNAME_KEY);
    }

    // Sends a chat message
    function sendMessage(message) {
        // if there is a non-empty message and a socket connection
        if (message) {
            if (connected) {
                $inputMessage.val('');
                addChatMessage({
                    'userid': userid,
                    'username': username,
                    'message': message
                });
                // ciper
                if (ciper) {
                    var encrypted = CryptoJS.AES.encrypt(message, ciper);
                    message = encrypted.toString();
                }
                // tell server to execute 'new message' and send along one parameter
                socket.emit('new message', message, function(ack) {
                    if (!ack.OK) {
                        log('전송 오류 : ' + ack.message);
                    }
                });
            } else {
                log('서버와 연결이 끊어진 상태입니다. 새로고침해보십시요.', LOG_URGENT);
            }
        }
    }

    // Log a message
    function log(message, options) {
        var $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    // Adds the visual chat message to the message list
    function addChatMessage(data, options) {
        // console.log('addChatMessage', data, options);
        // Don't fade the message in if there is an 'X was typing'
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        // var $usernameDiv = $('<span class="username"/>')
        //     .text(data.username)
        //     .css('color', getusernameColor(data.username));
        var $tailSpan = $('<span class=\'tail\'>&nbsp;</span>');
        var $dateSpan = $('<span class=\'time\'/>');
        // $dateSpan.text(new Date().toLocaleTimeString());
        $dateSpan.text(getMessageTime());
        var $usernameDiv = $('<span/>');
        if (data.userid !== userid)
            $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css('color', getUseridColor(data.userid));

        var $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);
        // url to link (http, mailto)
        $messageBodyDiv.linkify({
            handleLinks: function(links) {
                links.attr('target', '_blank');
            }
        });

        var typingClass = data.typing ? 'typing' : '';
        // var typingClass = data.typing ? 'typing' :
        var msgClass = (data.userid === userid) ? 'text-right' : 'text-left';
        var sideClass = (data.userid === userid) ? 'right' : 'left';
        // var dateClass = (data.username === username) ? 'leftdate' : 'rightdate';
        // $dateSpan.addClass(dateClass);

        var $messageDiv = $('<li class="message"/>')
            .data('userid', data.userid)
            .addClass(msgClass)
            .addClass(typingClass);

        var $bubbleDiv = $('<div class="bubble"/>')
            .addClass(sideClass)
            .append($usernameDiv, $messageBodyDiv, $dateSpan);
        // .append($tailSpan, $usernameDiv, $messageBodyDiv, $dateSpan);

        $messageDiv.append($bubbleDiv);
        // var $messageDiv = $('<li class="message bubble"/>')
        //     .data('username', data.username)
        //     .addClass(typingClass)
        //     .addClass(sideClass)
        //     .append($tailSpan, $usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }

    // Adds the visual chat typing message
    function addChatTyping(data) {
        data.typing = true;
        data.message = '님 입력중.';
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
        if (options.color) {
            $el.css('color', options.color);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
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
            return $(this).data('userid') === data.userid;
        });
    }

    // Gets the color of a username through our hash function
    // function getUsernameColor(username) {
    //     // Compute hash code
    //     var hash = 7;
    //     for (var i = 0; i < username.length; i++) {
    //         hash = username.charCodeAt(i) + (hash << 5) - hash;
    //     }
    //     // Calculate color
    //     var index = Math.abs(hash % COLORS.length);
    //     return COLORS[index];
    // }

    // Gets the color of a username through our hash function
    function getUseridColor(userid) {
        // Compute hash code
        var hash = 7;
        for (var i = 0; i < userid.length; i++) {
            hash = userid.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    // Get Message Time (hh:mm:ss)
    function getMessageTime() {
        var d = new Date();
        var t = padleft(d.getHours());
        var m = padleft(d.getMinutes());
        var s = padleft(d.getSeconds());
        return t + ':' + m + ':' + s;
    }

    // show username popover for user friendlly.
    function showUsernamePopover() {
        $username.popover('show');
        setTimeout(function() {
            $('.popover').fadeOut('slow', function() {});
        }, 2000);
    }

    // clipboard event listener
    clipboard.on('success', function(e) {
        $copyButton.tooltip('show');
        e.clearSelection();
    });

    //data-target="#userModal"로 Modal을 띄우면, userInput.focus()가 안먹더라..이유는 아몰랑.
    $username.click(function() {
        $userModal.modal('show');
    });

    // When UserModal show, set userInput default as current username.
    $userModal.on('shown.bs.modal', function(event) {
        $userInput.text(username);
        $userInput.focus();
    });

    // When hidden, change focus to inputmessage
    $userModal.on('hidden.bs.modal', function(event) {
        $inputMessage.focus();
    });

    $userModalOKButton.click(function() {
        if (connected) {
            var newname = $userInput.val();
            newname = cleanInput(newname);
            if (newname && newname.length > 1) {
                changeName(newname);
            }
        } else {
            log('서버와 연결이 끊어진 상태입니다. 새로고침해보십시요.', LOG_URGENT);
        }
    });

    $userInput.keydown(function(key) {
        if (key.keyCode === 13) {
            $userModalOKButton.trigger('click');
        }
    });

    // Focus on ciperInput
    $ciperModal.on('shown.bs.modal', function() {
        $ciperInput.focus();
    });

    // When hidden, change focus to inputmessage
    $ciperModal.on('hidden.bs.modal', function() {
        showUsernamePopover();
        $inputMessage.focus();
    });


    $ciperModalOKButton.click(function() {
        start();
    });

    $ciperInput.keydown(function(key) {
        if (key.keyCode === 13) {
            $ciperModalOKButton.trigger('click');
        }
    });

    // after enter ciper, program start.
    function start() {
        ciper = cleanInput($ciperInput.val().trim());
        var room = window.location.pathname.substring(1);
        $roomurl.val(server + '/' + room);
        socket.emit('login', room, getUsername());
    }

    // Keyboard events
    $inputMessage.keydown(function(key) {
        if (key.keyCode === 13) {
            $sendButton.trigger('click');
        }
    });

    $inputMessage.on('input', function() {
        updateTyping();
    });

    // Click events
    $sendButton.click(function() {
        var message = $inputMessage.val();
        message = cleanInput(message);
        sendMessage(message);
        socket.emit('stop typing');
        typing = false;
        $inputMessage.focus();

    });

    // Focus input when clicking on the message input's border
    $inputMessage.click(function() {
        $inputMessage.focus();
    });

    // Socket events

    // Whenever the server emits 'login success', log the login message
    // 1. set userid
    // 2. set username
    socket.on('login success', function(data) {
        connected = true;
        userid = data.userid;
        setUsername(data.username);
        // Display the welcome message
        $startMessage.show();
        if (!ciper)
            $startWarning.show();

        addParticipantsMessage(data);
    });

    // Whenever the server emits 'new message', update the chat body
    socket.on('new message', function(data) {
        // ciper
        if (ciper) {
            var message;
            try {
                var decrypted = CryptoJS.AES.decrypt(data.message, ciper);
                message = decrypted.toString(CryptoJS.enc.Utf8);
                if (!message) {
                    log(data.username + '(으)로부터 암호가 맞지 않은 톡을 받았습니다.', LOG_URGENT);
                } else {
                    data.message = message;
                    addChatMessage(data);
                }
            } catch (e) {
                log(data.username + '(으)로부터 받은 메세지 복호화 오류.', LOG_URGENT);
            }
        } else {
            addChatMessage(data);
        }
    });

    // Whenever the server emits 'new name', update user name
    socket.on('new name', function(data) {
        // setUsername(data.username);
        data.message = data.username + '님 이름이 ' + data.newname + '(으)로 바뀌었습니다.';
        removeChatTyping(data);
        log(data.message);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function(data) {
        log(data.username + ' 님 입장.');
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function(data) {
        log(data.username + ' 님 퇴장.');
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

    // Debugging Listener
    socket.on('error', function(err) {
        connected = false;
        log(err, LOG_URGENT);
        log('서버로부터 오류 접수. 새로고침해보십시요.', LOG_URGENT);
    });
    /*
        socket.on('connect', function() {
            console.log('Socket is connected.');
        });

        socket.on('connect_error', function(err) {
            console.log('Socket is connect_error, i\'ll connect again.');
            //start();
        });

        socket.on('reconnect', function(no) {
            console.log('Socket reconnected after trying ' + no + 'times');
        });

        socket.on('reconnect_attempt', function() {
            console.log('Socket is reconnect_attempt.');
        });

        socket.on('reconnecting', function(no) {
            console.log('Socket  is reconnecting ' + no + 'times');
        });

        socket.on('reconnect_error', function(err) {
            console.log('Socket is reconnect_error');
        });

        socket.on('reconnect_failed', function() {
            log('Socket is reconnect_failed.');
        });
    */
});
