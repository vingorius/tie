var Server = require('socket.io');

exports.createServer = function(http) {
    var io = new Server(http);
    var nsp = io.of('/chat');

    // Chatroom

    // usernames which are currently connected to the chat
    var usernames = {};
    var numUsers = {};

    nsp.on('connection', function(socket) {
        var addedUser = false;

        // when the client emits 'new message', this listens and executes
        socket.on('new message', function(data) {
            // we tell the client to execute 'new message'
            socket.to(socket.roomname).broadcast.emit('new message', {
                username: socket.username,
                message: data
            });
        });

        // when the client emits 'add user', this listens and executes
        socket.on('add user', function(roomname, username) {
            console.log('add user: roomname:%s, username:%s',roomname, username);
            // we store the username in the socket session for this client
            socket.username = username;
            socket.roomname = roomname;
            socket.join(socket.roomname);
            // add the client's username to the global list
            usernames[username] = username;
            numUsers[socket.roomname] = ++numUsers[socket.roomname]||1;
            addedUser = true;
            socket.emit('login', {
                numUsers: numUsers[socket.roomname]
            });
            // echo globally (all clients) that a person has connected
            socket.to(socket.roomname).broadcast.emit('user joined', {
                username: socket.username,
                numUsers: numUsers[socket.roomname]
            });
        });

        // when the client emits 'typing', we broadcast it to others
        socket.on('typing', function() {
            socket.to(socket.roomname).broadcast.emit('typing', {
                username: socket.username
            });
        });

        // when the client emits 'stop typing', we broadcast it to others
        socket.on('stop typing', function() {
            socket.to(socket.roomname).broadcast.emit('stop typing', {
                username: socket.username
            });
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', function() {
            // remove the username from global usernames list
            if (addedUser) {
                delete usernames[socket.username];
                --numUsers[socket.roomname];

                // echo globally that this client has left
                socket.to(socket.roomname).broadcast.emit('user left', {
                    username: socket.username,
                    numUsers: numUsers[socket.roomname]
                });
            }
        });
    });
};
