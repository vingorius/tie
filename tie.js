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
    var usr2 = userdb.createUser('fish', ['vingorius', 'ms'], [room1]);
    var usr3 = userdb.createUser('ms', ['vingorius', 'fish'], [room2]);
    var usr4 = userdb.createUser('mk', ['vingorius']);
    var usr5 = userdb.createUser('mh', ['vingorius']);
}

function sendErr(socket, msg) {
    //TODO err 보내는 것. 나한테만 보내야한다.
    console.log('send %s to %s ', msg, socket.id);
    socket.emit('err', msg);
}

function showSocketInfo(socket) {
    console.log('------------Socket Info:%s--------------', socket.id);
    console.log('rooms:%s', socket.rooms);
    if (socket.user) {
        console.log('user:', socket.user.name);
    }
    console.log('-----------------------------------------');
}

exports.createServer = function(http) {
    var io = new Server(http);
    var nsp = io.of('/tie');
    init();

    console.log('path', io.path());
    console.log('origins', io.origins());

    //새로운 Client 소켓이 만들어질 때마다 호출된다.
    nsp.use(function(socket, next) {
        console.log('New Socket %s is created.', socket.id);
        next();
    });

    nsp.on('connection', function(socket) {
        socket.auth = false;
        socket.user = null;
        console.log('New Socket %s is connected.', socket.id);

        socket.on('auth', function(p_user) {
            console.log('%s is auth by user[%s]', socket.id, p_user.name);
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

        /**
         * create new room.
         * 혹 room 이 이미 있는 경우를 위해 체크하는 로직 포함.
         * if not login, just add the room on user.
         * if login, after add, emit 'room' event.
         */
        socket.on('room', function(friend_name, cb) {
            if (!socket.auth) return sendErr(socket, 'not auth');

            var friend = userdb.findUser(friend_name);
            if (!friend) return sendErr(socket, 'no friend');
            var room = socket.user.findRoom(friend_name);
            if (!room) {
                console.log('room: create new room with %s', friend_name);
                room = roomdb.createRoom([socket.user.name, friend_name], new Talk(socket.user.name, 'new room'));
                socket.user.addRoom(room);
                socket.join(room.name);
                friend.addRoom(room);
                if (friend.isLogin()) {
                    nsp.to(friend.getSocketId()).emit('room', room);
                }
            }
            cb(room);
        });


        /**
         * room 콜을 받은 client가 room에 join하기 위해 날린다.
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
            // showSocketInfo(socket);

            console.log('%s send "%s" on %s', socket.user.name, talk.msg, room_name);
            //TODO user에서 찾는것이 맞지 않을까?
            var room = roomdb.findRoom(room_name);
            room.addTalk(talk);
            socket.broadcast.to(room_name).emit('talk', room_name, talk);
        });

        socket.on('exit', function(cb) {
            if (!socket.auth) return sendErr(socket, 'not auth');
            console.log('%s[%s] exit', socket.user.name, socket.id);

            socket.user.leaveAll(socket);
            socket.user.setSocketId(null);
            socket.user = null;
            socket.auth = false;
            cb();
        });

        socket.on('disconnect', function() {
            console.log('%s disconnected', socket.id);
        });
    });
};
