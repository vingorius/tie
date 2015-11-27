var should = require('should');
var io = require('socket.io-client');

var socketURL = 'http://localhost:3000/tie';
var options = {
    forceNew: true,
    autoConnect: true,
};

describe("One User", function() {
    var user = {
        name: 'vingorius',
        password: '1234'
    };
    var client = io.connect(socketURL, options);

    it('It Should auth', function(done) {
        client.on('connect', function(res) {
            client.emit('auth', user);
        });

        client.on('auth', function(user) {
            should.exist(user);
            should.exist(user.rooms);
            done();
        });
    });
});
