$(document).ready(function() {

    var socket = io();
    var user = {};
    var cur_room_name;

    function findRoom(room_name) {
        var rooms = user.rooms;
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].name === room_name) {
                return rooms[i];
            }
        }
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

    socket.on('auth', function(p_user) {
        user = p_user;
        console.log('auth', user);
        user.friends.forEach(function(friend) {
            $('#friends').append('<li class="list-group-item">' + friend + '</li>');
        });
        user.rooms.forEach(function(room) {
            renderRoom(room);
            setMessageBedge(room.name, room.talks.length);
        });
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
        $('#friends').empty();
        $('#rooms').empty();

        user.name = $('#id').val();
        socket.emit('auth', user);
    });

    $('#friends').on('click', 'li', function() {
        var friend = $(this).text();
        $('#friend').addClass('label-primary').text(friend);
        socket.emit('room', friend, function(room) {
            renderRoom(room);
        });
    });

    $('#rooms').on('click', 'li', function() {
        var room_name = $(this)[0].id;
        cur_room_name = room_name;
        $('#roomModal').modal('show');

    });

    $('#roomModal').on('show.bs.modal', function(event) {
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
});
