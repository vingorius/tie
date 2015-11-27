$(document).ready(function() {
    var host = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
    host += '/tie';
    var option = {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
    };

    console.log('client nsp:%s', host);
    var socket = io(host, option);
    var user = {
        name: null,
        rooms: []
    };
    var cur_room_name;

    function findRoom(room_name) {
        var rooms = user.rooms;
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].name === room_name) {
                return rooms[i];
            }
        }
    }
    findRoomByFriend = function(friend_name) {
        for (var i = 0; i < user.rooms.length; i++) {
            if (user.rooms[i].users.indexOf(friend_name) > -1) return user.rooms[i];
        }
        return null;
    };

    function renderFriend(friend) {
        $('#friends').append('<li class="list-group-item">' + friend + '</li>');
    }

    function renderRoom(room) {
        $('#rooms').append('<li id="' + room.name + '" class="list-group-item">' + room.name + ' <span class="badge">' + room.talks.length + '</span></li>');
    }

    function renderMessage(talk) {
        console.log('renderMessage', talk, user.name);
        if (talk.from === user.name) {
            $('#messages').append($('<li class="text-right">').text(talk.msg));
        } else {
            $('#messages').append($('<li class="text-left">').text(talk.msg));
        }
    }

    function setMessageBedge(room_name, no) {
        var room_badge = $('#' + room_name + ' > span');
        room_badge.text(no);
    }

    function addMessageBedge(room_name) {
        var room_badge = $('#' + room_name + ' > span');
        room_badge.text(Number(room_badge.text()) + 1);
    }

    function clear() {
        //clear before start.
        $('#friends').empty();
        $('#rooms').empty();
    }

    socket.on('auth', function(p_user) {
        //clear before start.
        clear();

        user = p_user;
        // console.log('auth', user);
        user.friends.forEach(function(friend) {
            renderFriend(friend);
            // $('#friends').append('<li class="list-group-item">' + friend + '</li>');
        });
        user.rooms.forEach(function(room) {
            renderRoom(room);
            setMessageBedge(room.name, room.talks.length);
        });
    });

    socket.on('friend', function(friend) {
        console.log('friend', friend);
        user.friends.push(friend);
        renderFriend(friend);
    });

    socket.on('room', function(room) {
        console.log('room', room);
        socket.emit('join', room.name);
        user.rooms.push(room);
        renderRoom(room);
    });

    socket.on('talk', function(room_name, talk) {
        console.log('talk', room_name, talk);
        var room = findRoom(room_name);
        room.talks.push(talk);

        if ($('#roomModal').hasClass('in'))
            renderMessage(talk);
        addMessageBedge(room.name);
    });

    socket.on('err', function(err) {
        console.log('err', err);
    });

    $('#authbtn').click(function() {
        user.name = $('#id').val();
        socket.emit('auth', user);
    });

    //TODO check disconnect
    $('#exitbtn').click(function() {
        // socket.emit('disconnect');
        socket.emit('exit', function() {
            console.log('exit success.');
            clear();
        });
    });

    $('#addfriendbtn').click(function() {
        var friend_name = $('#friend').val();

        socket.emit('friend', friend_name);
        user.friends.push(friend_name);
        renderFriend(friend_name);
    });

    $('#infobtn').click(function() {
        socket.emit('info');
    });


    $('#friends').on('click', 'li', function() {
        var friend_name = $(this).text();
        // $('#friend').addClass('label-primary').text(friend_name);

        var room = findRoomByFriend(friend_name);
        if (!room) {
            socket.emit('room', friend_name, function(room) {
                user.rooms.push(room);
                renderRoom(room);
            });
        } else {
            console.log('room %s is already exist.', room.name);
            $("#rooms li:contains('" + room.name + "')").trigger('click');
        }
    });

    $('#rooms').on('click', 'li', function() {
        var room_name = $(this)[0].id;
        cur_room_name = room_name;
        $('#roomModal').modal('show');

    });

    $('#roomModal').on('show.bs.modal', function(event) {
        $('#myModalLabel').text(cur_room_name);
        var room = findRoom(cur_room_name);
        room.talks.forEach(function(talk) {
            renderMessage(talk);
        });
    });

    //TODO 동적으로 만들어 empty하고 다시 그리지 말고, 그리지 못한 것만 그리도록 한다.
    $('#roomModal').on('hide.bs.modal', function(event) {
        $('#messages').empty();
    });

    $('#msgbtn').click(function() {
        var msg = $('#m').val();
        if (!msg) return;

        var talk = {
            from: user.name,
            msg: msg
        };

        var room = findRoom(cur_room_name);
        room.talks.push(talk);

        renderMessage(talk);
        addMessageBedge(room.name);
        socket.emit('talk', room.name, talk);
        $('#m').val('');
    });

    socket.on('time', function(time) {
        // console.log('Server Time:%s', time);
        $('#timer').text(time);
    });

    // Debugging Listener
    socket.on('connect', function() {
        console.log('Socket[%s] is connected.', socket.id);
        socket.emit('time');
    });

    socket.on('connect_error', function(err) {
        console.log('Socket[%s] is connect_error:%s', socket.id, err);
    });

    socket.on('reconnect', function(no) {
        console.log('Socket[%s] reconnected after trying %d times', socket.id, no);
        user = {};
        user.name = $('#id').val();
        console.log('i will auth automatically with %s.', user.name);
        socket.emit('auth', user);
    });

    socket.on('reconnect_attempt', function() {
        console.log('Socket[%s] is reconnect_attempt.', socket.id);
    });

    socket.on('reconnecting', function(no) {
        console.log('Socket[%s]  is reconnecting %d times.', socket.id, no);
    });

    socket.on('reconnect_error', function(err) {
        console.log('Socket[%s] is reconnect_error:%s', socket.id, err);
    });

    socket.on('reconnect_failed', function() {
        console.log('Socket[%s] is reconnect_failed.', socket.id);
    });

});
