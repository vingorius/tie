var should = require('should');
var io = require('socket.io-client');

var socketURL = 'http://localhost:4000/chat';
var options = {
    forceNew: true,
};

describe("One User", function() {
    var room = 'room1';
    var user = 'usr1';
    var message = 'hello';
    var client;
    before('login first', function() {
        client = io.connect(socketURL, options);
        client.on('connect', function(res) {
            client.emit('login', room, user);
        });
    });

    after('close all connection', function() {
        client.emit('disconnect');
    });

    it('It Should login.', function(done) {
        client.on('login success', function(data) {
            should.exist(data.userid);
            should.equal(user, data.username);
            should.exist(data.numUsers);
            done();
        });
    });

    it('It Should send a message.', function(done) {
        client.emit('new message', message, function(status) {
            should.ok(status.OK);
            done();
        });
    });

    it('It Should change his name.', function(done) {
        client.emit('new name', 'new name', function(status) {
            should.ok(status.OK);
            done();
        });
    });
});
