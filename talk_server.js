var Server = require('socket.io');

var MSG_OK = {
    OK: true
};
var MSG_NOLOGIN = {
    OK: false,
    message: 'not login, please refresh your browser.'
};

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
        socket.on('new message', function(data, cb) {
            if (socket.auth && socket.roomname) {
                socket.to(socket.roomname).broadcast.emit('new message', {
                    'userid': socket.id,
                    'username': socket.username,
                    'message': data
                });
                cb(MSG_OK);
            } else {
                cb(MSG_NOLOGIN);
            }
        });

        // when the client emits 'add user', this listens and executes
        socket.on('add user', function(roomname, username) {
            socket.auth = true;

            socket.roomname = roomname;
            // room 에 있는 사람.
            numUsers[socket.roomname] = ++numUsers[socket.roomname] || 1;
            // 지금까지 룸에 들어온 사람.
            nameUsers[socket.roomname] = ++nameUsers[socket.roomname] || 1;

            var no = numUsers[socket.roomname];
            if (!username) {
                username = '아무개' + nameUsers[socket.roomname];
            }
            console.log('add user:%s roomname:%s, %d users', username, roomname, no);
            // we store the username in the socket session for this client
            // var username = 'Guest' + numUsers[socket.roomname];
            socket.username = username;
            socket.join(socket.roomname);
            // add the client's username to the global list
            // usernames[username] = username;

            socket.emit('login', {
                'userid': socket.id,
                'username': socket.username,
                'numUsers': no,
            });
            // echo globally (all clients) that a person has connected
            socket.to(socket.roomname).broadcast.emit('user joined', {
                'userid': socket.id,
                'username': socket.username,
                'numUsers': no,
            });
        });

        // when the client emits 'new name', change it's name
        socket.on('new name', function(newname) {
            // socket.chkAuth();
            data = {
                'userid': socket.id,
                'username': socket.username,
                'message': socket.username + '님 이름이 ' + newname + '(으)로 바뀌었습니다.'
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
                'userid': socket.id,
                'username': socket.username
            });
        });

        // when the client emits 'stop typing', we broadcast it to others
        socket.on('stop typing', function() {
            // socket.chkAuth();
            socket.to(socket.roomname).broadcast.emit('stop typing', {
                'userid': socket.id,
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
                    'userid': socket.id,
                    'username': socket.username,
                    'numUsers': no
                });
            }
        });
    });
};
