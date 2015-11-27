var should = require('should');
var io = require('socket.io-client');

var socketURL = 'http://localhost:3000/tie';
var options = {
    forceNew: true,
    autoConnect: true,
};

describe("Two User(Room must exist)", function() {
    var user1 = {
        name: 'vingorius',
        password: '1234'
    };
    var user2 = {
        name: 'fish',
        password: '1234'
    };
    var talk = {
        from: user1.name,
        msg: 'hello'
    };

    it('It Should receive a talk when login', function(done) {
        var client1 = io.connect(socketURL, options);
        var client2 = io.connect(socketURL, options);

        client1.on('connect', function() {
            client1.emit('auth', user1);
        });

        client2.on('connect', function() {
            client2.emit('auth', user2);
        });

        client2.on('talk', function(room_name, ptalk) {
            should.exist(room_name);
            should.equal(ptalk.msg, talk.msg);
            client2.disconnect();
            done();
        });

        client1.on('auth', function(user) {
            user.rooms.forEach(function(room) {
                if (room.users.indexOf(user2.name) > -1) {
                    client1.emit('talk', room.name, talk);
                    client1.disconnect();
                }
            });
        });
    });

    it('If there is a talk before login, it Should read it', function(done) {
        var client1 = io.connect(socketURL, options);

        client1.on('connect', function() {
            client1.emit('auth', user1);
        });

        client1.on('auth', function(user) {
            user.rooms.forEach(function(room) {
                if (room.users.indexOf(user2.name) > -1) {
                    client1.emit('talk', room.name, talk);
                    client1.disconnect();
                }
            });
        });

        setTimeout(function() {
            var client2 = io.connect(socketURL, options);
            client2.on('connect', function() {
                client2.emit('auth', user2);
            });

            client2.on('auth', function(user) {
                user.rooms.forEach(function(room) {
                    if (room.users.indexOf(user1.name) > -1) {
                        var ptalk = room.talks.pop();
                        should.equal(talk.msg, ptalk.msg);
                        client2.disconnect();
                        done();
                    }
                });
            });
        }, 1000);
    });
});
