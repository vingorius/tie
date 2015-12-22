var should = require('should');
var io = require('socket.io-client');

var socketURL = 'http://localhost:4000/chat';
var options = {
    forceNew: true,
};

describe("One User -- no login", function() {
    // var room = 'room1';
    // var user = 'usr1';
    var message = 'hello';
    var client;

    before('no login', function() {
        client = io.connect(socketURL, options);
    });

    after('close all connection', function() {
        client.emit('disconnect');
    });


    it('It Should not send a message.', function(done) {
        client.emit('new message', message, function(status) {
            should.equal(false, status.OK);
            done();
        });
    });

    it('It Should not change his name.', function(done) {
        client.emit('new name', 'new name', function(status) {
            should.equal(false, status.OK);
            done();
        });
    });
});
