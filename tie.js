var Server = require('socket.io');
var userdb = require('./lib/userdb');
var User = require('./lib/user');
var roomdb = require('./lib/roomdb');
var Room = require('./lib/room');
var Talk = require('./lib/talk');

function init() {
    console.log('init');
    var room1 = roomdb.createRoom(['vingorius', 'fish']);
    var room2 = roomdb.createRoom(['vingorius', 'ms']);

    var usr1 = userdb.createUser('vingorius', ['fish', 'ms', 'mk', 'mh'], [room1, room2]);
    var usr2 = userdb.createUser('fish', ['vingorius', 'ms', 'mk', 'mh'], [room1]);
    var usr3 = userdb.createUser('ms', ['vingorius', 'fish', 'mk', 'mh']);
    var usr4 = userdb.createUser('mk', ['vingorius']);
}

function sendErr(socket, msg) {
    //TODO err 보내는 것. 나한테만 보내야한다.
    socket.to(socket.id).emit('err', msg);
}

exports.createServer = function(http) {
    var io = new Server(http);
    init();

    // io.use(function(socket, next) {
    //     console.log('io.use',socket);
    //     next();
    // });

    io.on('connection', function(socket) {
        socket.auth = false;
        socket.user = null;

        socket.on('auth', function(p_user) {
            console.log('auth', p_user);
            userdb.auth(p_user, function(user) {
                if (user) {
                    user.setSocketId(socket.id);
                    user.joinAll(socket);
                    socket.auth = true;
                    socket.user = user;
                    socket.emit('auth', user);
                } else {
                    sendErr(socket, 'auth err');
                }
            });
        });

        socket.on('room', function(friend_name, cb) {
            if (!socket.auth) return sendErr(socket, 'not auth');

            var room = roomdb.createRoom([socket.user.name, friend_name],new Talk(socket.user.name, 'new room'));
            socket.user.addRoom(room);

            socket.join(room.name);

            var friend = userdb.findUser(friend_name);
            console.log('room,friend', friend);
            if (friend) {
                friend.addRoom(room);
                if (friend.isLogin()) {
                    socket.broadcast.to(friend.getSocketId()).emit('room', room);
                }
                cb(room);
            } else {
                sendErr(socket, 'no friend');
            }
        });

        /**
         * room 콜을 받은 client가 join하기 위해 날린다.
         */
        socket.on('join', function(room_name) {
            if (!socket.auth) return sendErr(socket, 'not auth');

            console.log('join', room_name, socket.user.name);

            var room = roomdb.findRoom(room_name);
            if (room) {
                socket.join(room.name);
            } else {
                sendErr(socket, 'no room for ' + room_name);
            }
        });

        socket.on('talk', function(room_name, talk) {
            if (!socket.auth) return sendErr(socket, 'not auth');

            var room = roomdb.findRoom(room_name);
            talk.from = socket.user.name;

            console.log('talk', room_name, talk);
            room.addTalk(talk);

            socket.broadcast.to(room_name).emit('talk',room_name, talk);
        });

        socket.on('disconnect', function() {
            if (socket.user) {
                socket.user.setSocketId(null);
                socket.user.leaveAll(socket);
                console.log(socket.user, ' disconnected');
            } else {
                console.log('user disconnected');
            }
        });
    });
};
