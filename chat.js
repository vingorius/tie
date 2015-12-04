var Server = require('socket.io');

exports.createServer = function(http) {
    var io = new Server(http);
    var nsp = io.of('/chat');

    // Chatroom

    // usernames which are currently connected to the chat
    // var usernames = {};
    var numUsers = {};
    var nameUsers = {};

    nsp.on('connection', function(socket) {
        // var addedUser = false;
        socket.auth = false;

        // socket.err = function(msg) {
        //     socket.emit('err', msg);
        // };
        // socket.chkAuth = function() {
        //     if (!socket.auth) socket.emit('err', 'not auth');
        // };
        // when the client emits 'new message', this listens and executes
        socket.on('new message', function(data) {
            // socket.chkAuth();
            // we tell the client to execute 'new message'
            socket.to(socket.roomname).broadcast.emit('new message', {
                'username': socket.username,
                'message': data
            });
        });

        // when the client emits 'add user', this listens and executes
        socket.on('add user', function(roomname) {
            socket.auth = true;

            socket.roomname = roomname;
            // room 에 있는 사람.
            numUsers[socket.roomname] = ++numUsers[socket.roomname] || 1;
            // 지금까지 룸에 들어온 사람.
            nameUsers[socket.roomname] = ++nameUsers[socket.roomname] || 1;

            var no = numUsers[socket.roomname];
            var username = 'Usr' + nameUsers[socket.roomname];
            console.log('add user:%s roomname:%s, %d users', username, roomname, no);
            // we store the username in the socket session for this client
            // var username = 'Guest' + numUsers[socket.roomname];
            socket.username = username;
            socket.join(socket.roomname);
            // add the client's username to the global list
            // usernames[username] = username;

            socket.emit('login', {
                'username': socket.username,
                'numUsers': no,
            });
            // echo globally (all clients) that a person has connected
            socket.to(socket.roomname).broadcast.emit('user joined', {
                'username': socket.username,
                'numUsers': no,
            });
        });

        // when the client emits 'new name', change it's name
        socket.on('new name', function(newname) {
            // socket.chkAuth();
            data = {
                username: socket.username,
                message: socket.username + ' changed his name to ' + newname
            };
            //delete old user
            // delete usernames[socket.username];
            //set changed one
            // usernames[newname] = newname;
            socket.username = newname;
            socket.to(socket.roomname).broadcast.emit('new name', data);
        });


        // when the client emits 'typing', we broadcast it to others
        socket.on('typing', function() {
            // socket.chkAuth();
            socket.to(socket.roomname).broadcast.emit('typing', {
                'username': socket.username
            });
        });

        // when the client emits 'stop typing', we broadcast it to others
        socket.on('stop typing', function() {
            // socket.chkAuth();
            socket.to(socket.roomname).broadcast.emit('stop typing', {
                'username': socket.username
            });
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', function() {
            // remove the username from global usernames list
            if (socket.auth) {
                // delete usernames[socket.username];
                --numUsers[socket.roomname];
                var no = numUsers[socket.roomname];
                // echo globally that this client has left
                socket.to(socket.roomname).broadcast.emit('user left', {
                    'username': socket.username,
                    'numUsers': no
                });
            }
        });
    });
};
