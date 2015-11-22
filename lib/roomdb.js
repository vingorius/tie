var Room = require('./room');

var rooms = [];

exports.findRoom = function(room_name) {
    // var room_name = getId(friends);
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].name === room_name) {
            return rooms[i];
        }
    }
};

exports.createRoom = function(users){
    var room = new Room(users);
    rooms.push(room);
    return room;
};
