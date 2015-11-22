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

    function renderMyMessage(talk) {
        $('#messages').append($('<li class="text-right">').text(talk.msg));
    }

    function renderPeerMessage(talk) {
        $('#messages').append($('<li class="text-left">').text(talk.msg));
    }

    socket.on('auth', function(p_user) {
        user = p_user;
        console.log('auth', user);
        user.friends.forEach(function(friend) {
            $('#friends').append('<li class="list-group-item">' + friend + '</li>');
        });
        user.rooms.forEach(function(room) {
            renderRoom(room);
            // $('#rooms').append('<li id="' + room.name + '" class="list-group-item">' + room.name + ' <span class="badge">'+room.talks.length+'</span></li>');
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
            renderPeerMessage(talk);
        //TODO 리스너로 등록
        var room_badge = $('#' + room_name + ' > span');
        room_badge.text(Number(room_badge.text()) + 1);
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

        var room = findRoom(room_name);
        room.talks.forEach(function(talk) {
            console.log(talk);
            if(talk.from === user.name){
                renderMyMessage(talk);
            }else{
                renderPeerMessage(talk);
            }
        });
    });

    $('#msgbtn').click(function() {
        var msg = $('#m').val();
        if(!msg) return;
        
        var talk = {
            msg: msg
        };

        var room = findRoom(cur_room_name);
        room.talks.push(talk);

        renderMyMessage(talk);
        socket.emit('talk', cur_room_name, talk);
        $('#m').val('');
    });

    $('#closebtn').click(function() {
        $('#messages').empty();
    });
});
