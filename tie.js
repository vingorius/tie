var Server = require('socket.io');
var userdb = require('./lib/userdb');
var roomdb = require('./lib/roomdb');
var Talk = require('./lib/talk');

exports.createServer = function(http) {
    var io = new Server(http);

    // io.use(function(socket, next) {
    //     console.log('io.use');
    //     next();
    // });

    io.on('connection', function(socket) {
        // console.log('a user connected');
        socket.auth = false;
        socket.user = null;
        // socket.room = null;

        socket.on('auth', function(p_user) {
            var user = userdb.auth(p_user, socket.id);
            console.log('auth', user);
            if (user) {
                socket.auth = true;
                socket.user = user;
                socket.emit('auth', user);
            } else {
                socket.emit('err', 'auth err');
            }
        });

        /*
        socket.on('list', function() {
            if (!socket.auth) return socket.emit('err', 'not auth');

            var friends = userdb.list(socket.user);
            friends.forEach(function(friend) {
                var room = roomdb.findRoom([socket.user.name, friend]);
                if (room){
                    console.log('list', room.name,' join');
                    socket.join(room.name);
                }
            });

            socket.emit('list', userdb.list(socket.user));
        });
        */

        socket.on('room', function(friend, cb) {
            if (!socket.auth) return socket.emit('err', 'not auth');

            var users = [socket.user.name, friend];
            var room = roomdb.findRoom(users) || roomdb.addRoom(users);
            socket.join(room.name);

            //if friend login, send 'room' messages
            var friend_sid = userdb.getSid(friend);
            if (friend_sid) {
                var friend_socket = io.sockets.connected[friend_sid];
                friend_socket.join(room.name);

                socket.broadcast.to(friend_sid).emit('room', room);
            }
            cb(null, room);
        });

        socket.on('talk', function(talk) {
            if (!socket.auth) return socket.emit('err', 'not auth');

            console.log('talk', talk);
            var room = roomdb.findRoomByName(talk.room_name);
            console.log('room', room);
            room.talks.push(talk);
            socket.broadcast.to(talk.room_name).emit('talk', talk);
        });

        socket.on('disconnect', function() {
            if (socket.user) {
                socket.user.sid = null;
                console.log(socket.user, ' disconnected');
            } else {
                console.log('user disconnected');
            }
        });
    });
};
