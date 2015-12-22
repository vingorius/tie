var should = require('should');
var io = require('socket.io-client');

var socketURL = 'http://localhost:4000/chat';
var options = {
    forceNew: true,
    autoConnect: true,
};

describe("Two User.", function() {
    var room = 'room2';
    var user1 = 'user1';
    var user2 = 'user2';
    var user1_newname = 'user1_newname';
    var message = 'hello';
    var client1,client2;

    before('connect first', function() {
        client1 = io.connect(socketURL, options);
        client2 = io.connect(socketURL, options);

        client1.on('connect', function(res) {
            client1.emit('login', room, user1);
        });

        client2.on('connect', function(res) {
            client2.emit('login', room, user2);
        });
    });

    after('close all connection',function(){
        client1.emit('disconnect');
        client2.emit('disconnect');
    });


    it('It Should send/receive a message', function(done) {
        client1.emit('new message', message, function(status) {
            should.ok(status.OK);
        });

        client2.on('new message',function(data){
            should.exist(data.userid);
            should.equal(user1, data.username);
            should.equal(message, data.message);
            done();
        });
    });

    it('Whan user1 change his name, User2 Should receive it.', function(done) {
        client1.emit('new name', user1_newname, function(status) {
            should.ok(status.OK);
        });

        client2.on('new name',function(data){
            should.exist(data.userid);
            should.equal(user1, data.username);
            should.equal(user1_newname, data.newname);
            done();
        });
    });
});
