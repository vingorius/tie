$(document).ready(function() {

    var socket = io();
    var user = {};
    var friend;
    var rooms = [];
    var cur_room_name;

    function findRoom(room_name) {
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].name === room_name) {
                return rooms[i];
            }
        }
    }

    socket.on('auth', function(user) {
        console.log('auth', user);
        // socket.emit('list');
        user.friends.forEach(function(friend) {
            $('#friends').append('<li class="list-group-item">' + friend + '</li>');
        });
        user.rooms.forEach(function(room) {
            console.log(room);
            $('#rooms').append('<li class="list-group-item">' + room.name + '</li>');
        });
    });

    // socket.on('list', function(friends) {
    //     console.log('list', friends);
    //     friends.forEach(function(friend) {
    //         $('#friends').append('<li class="list-group-item">' + friend + '</li>');
    //     });
    // });

    socket.on('room', function(room) {
        console.log('room', room);
        rooms.push(room);
        $('#rooms').append('<li class="list-group-item">' + room.name + '</li>');
    });

    socket.on('talk', function(talk) {
        console.log('talk', talk);
        console.dir(socket);
        $('#messages').append($('<li class="text-left">').text(talk.msg));
        //TODO
        $('#room_vingoriusfish > span').text('2');
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
        friend = $(this).text();
        $('#friend').addClass('label-primary').text(friend);
        socket.emit('room', friend, function(err, room) {
            rooms.push(room);
            $('#rooms').append('<li id="' + room.name + '" class="list-group-item">' + room.name + ' <span class="badge">0</span></li>');
            // $('#room').addClass('label-primary').text(room.name);
        });
    });

    $('#rooms').on('click', 'li', function() {
        var room_name = $(this).text();
        // console.log(room_name);
        cur_room_name = room_name;
        $('#roomModal').modal('show');
    });

    $('#msgbtn').click(function() {
        var talk = {
            room_name: cur_room_name,
            from: friend,
            msg: $('#m').val()
        };
        $('#messages').append($('<li class="text-right">').text($('#m').val()));
        socket.emit('talk', talk);
    });
});
