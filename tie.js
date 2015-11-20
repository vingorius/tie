var Server = require('socket.io');
var userdb = require('./lib/userdb');
var roomdb = require('./lib/roomdb');
var Talk = require('./lib/talk');

function init() {
    console.log('init');
    var room = new roomdb.createRoom(['vingorius', 'fish']);
    roomdb.addRoom(room);

    var usr1 = new userdb.createUser('vingorius', ['fish', 'ms', 'mk', 'mh'], [room]);
    var usr2 = new userdb.createUser('fish', ['vingorius', 'ms', 'mk', 'mh'], [room]);
    var usr3 = new userdb.createUser('ms', ['vingorius', 'fish', 'mk', 'mh']);
    userdb.addUser(usr1);
    userdb.addUser(usr2);
    userdb.addUser(usr3);
}

exports.createServer = function(http) {
    var io = new Server(http);
    init();


    // io.use(function(socket, next) {
    //     console.log('io.use');
    //     next();
    // });

    io.on('connection', function(socket) {
        socket.auth = false;
        socket.user = null;

        socket.on('auth', function(p_user) {
            console.log('auth', p_user);
            userdb.auth(p_user, function(user) {
                if (user) {
                    user.sid = socket.id;
                    socket.auth = true;
                    socket.user = user;
                    socket.emit('auth', user);
                } else {
                    socket.emit('err', 'auth err');
                }
            });
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

        // socket.on('room', function(friend, cb) {
        //     if (!socket.auth) return socket.emit('err', 'not auth');
        //
        //     var users = [socket.user.name, friend];
        //     var room = roomdb.findRoom(users) || roomdb.addRoom(users);
        //     socket.join(room.name);
        //
        //     //if friend login, send 'room' messages
        //     var friend_sid = userdb.getSid(friend);
        //     if (friend_sid) {
        //         var friend_socket = io.sockets.connected[friend_sid];
        //         friend_socket.join(room.name);
        //
        //         socket.broadcast.to(friend_sid).emit('room', room);
        //     }
        //     cb(null, room);
        // });

        socket.on('talk', function(talk) {
            if (!socket.auth) return socket.emit('err', 'not auth');

            var room = roomdb.findRoomByName(talk.room_name);
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
