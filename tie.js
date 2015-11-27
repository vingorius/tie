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

exports.createServer = function(http) {
    var io = new Server(http);
    var nsp = io.of('/tie');
    init();

    console.log('path', io.path());
    console.log('origins', io.origins());

    //새로운 Client 소켓이 만들어질 때마다 호출된다.
    // socket에 필요한 함수를 여기에 등록하여 사용하면 된다.
    // 이 내용이 많으면 middleware로 빼야 한다.
    nsp.use(function(socket, next) {
        console.log('New Socket %s is created.', socket.id);
        // console.log('heartbeat timeout:',io.eio.pingTimeout);
        // console.log('heartbeat interval:',io.eio.pingInterval);
        // console.log('socket handshake:',socket.handshake);
        socket.printInfo = function() {
            console.log('------------Socket Info:%s--------------', socket.id);
            console.log('rooms:%s', socket.rooms);
            if (socket.user) {
                console.log('user:', socket.user.name);
            }
            console.log('-----------------------------------------');
        };

        socket.emitErr = function(msg) {
            console.log('send %s to %s ', msg, socket.id);
            socket.emit('err', msg);
        };

        socket.authorize = function(user) {
            user.setSocketId(socket.id);
            // join all rooms
            user.rooms.forEach(function(room) {
                socket.join(room.name);
            });

            socket.auth = true;
            socket.user = user;
            socket.emit('auth', user);
        };

        socket.unauthorize = function() {
            var user = socket.user;
            console.log('%s[%s] exit', user.name, socket.id);

            // user.rooms.forEach(function(room) {
            //     socket.leave(room.name);
            // });
            socket.leaveAll();

            socket.user.setSocketId(null);
            socket.user = null;
            socket.auth = false;
        };

        /**
         * nsp.sockets 에서 이름으로 socket을 찾는다.
         * 아직은 사용 안함.
         * TODO hash인 connected를 사용하여 수정할 수 있겠다.
        socket.findSocketByUsername = function(user_name) {
            for (var i = 0; i < nsp.sockets.length; i++) {
                var user = nsp.sockets[i].user;
                if (user && user.name === user_name)
                    return nsp.sockets[i];
            }
        };

        socket.findRoom = function(room_name) {
            for (var i = 0; i < socket.rooms.length; i++) {
                if (socket.rooms[i] == room_name)
                    return room_name;
            }
        };
        */

        next();
    });

    nsp.on('connection', function(socket) {
        socket.auth = false;
        socket.user = null;
        console.log('New Socket %s is connected.', socket.id);

        /**
         * auth
         * TODO register user when first login
         */
        socket.on('auth', function(p_user) {
            console.log('%s is auth by user[%s]', socket.id, p_user.name);

            userdb.auth(p_user, function(user) {
                if (user) {
                    socket.authorize(user);
                } else {
                    socket.emitErr('auth err');
                }
            });
        });

        /**
         * add friend
         */
        socket.on('friend', function(friend_name) {
            if (!socket.auth) return socket.emitErr('not auth');

            var friend = userdb.findUser(friend_name);
            if (!friend) return socket.emitErr('no friend');

            socket.user.addFriend(friend_name);
            friend.addFriend(socket.user.name);
            if (friend.isLogin()) {
                nsp.to(friend.getSocketId()).emit('friend', socket.user.name);
            }
        });

        /**
         * it will response when a client create a new room.
         * 혹 room 이 이미 있는 경우를 위해 체크하는 로직 포함.
         * if not login, just add the room on user.
         * if login, after add, emit 'room' event.
         * friend socket을 가져오는 좀 더 나은 방법이 필요하다.
         */
        socket.on('room', function(friend_name, cb) {
            if (!socket.auth) return socket.emitErr('not auth');

            var friend = userdb.findUser(friend_name);
            if (!friend) return socket.emitErr('no friend');

            var room = socket.user.findRoomByFriend(friend_name);
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
            if (!socket.auth) return socket.emitErr('not auth');

            console.log('join', room_name, socket.user.name);

            // var room = roomdb.findRoom(room_name);
            var room = socket.user.findRoomByName(room_name);
            if (room) {
                socket.join(room.name);
            } else {
                socket.emitErr('no room for ' + room_name);
            }
        });
        /**
         * TODO user한테 보내면 유저가 알아서 처리해도 되지 않을까? 굳이 room으로 보낼 필요 있을까?
         * 한명일 때는 관계 없지만, 여러명일 경우는 사람마다 emit 해야하기 때문에 이게 더 나음.
         */
        socket.on('talk', function(room_name, talk) {
            if (!socket.auth) return socket.emitErr('not auth');

            console.log('%s send "%s" on %s', socket.user.name, talk.msg, room_name);
            // var room = roomdb.findRoom(room_name);
            var room = socket.user.findRoomByName(room_name);
            room.addTalk(talk);
            socket.broadcast.to(room_name).emit('talk', room_name, talk);
        });

        /**
         * just print socket info
         */
        socket.on('info', function() {
            console.log('adapter', socket.nsp.adapter);
        });

        /**
         * timer
         */
        socket.on('time', function() {
            setInterval(function() {
                var now = new Date().toLocaleTimeString();
                // console.log('now',now);
                socket.emit('time', now);
            }, 1000);
        });

        /**
         * error handler
         * If there' error, throw new Error('msg');
         */
        socket.on('error', function(err) {
            console.log('error', err);
        });
        /**
         * logout
         * TODO auth된 사용자만 logout?
         */
        socket.on('exit', function(cb) {
            if (!socket.auth) return socket.emitErr('not auth');

            socket.unauthorize();
            cb();
        });

        /**
         * disconnect
         */
        socket.on('disconnect', function() {
            console.log('%s disconnected', socket.id);
        });

    });
};
