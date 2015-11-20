var rooms = [];

function getId(friends) {
    return (friends[0] > friends[1]) ? 'room_' + friends[0] + friends[1] : 'room_' + friends[1] + friends[0];
}

function Room(users){
    this.name = getId(users);
    this.users = users;
    this.talks = [];
}

exports.findRoom = function(friends) {
    var room_name = getId(friends);
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].name === room_name) {
            return rooms[i];
        }
    }
};

exports.findRoomByName = function(room_name) {
    // var room_name = getId(friends);
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].name === room_name) {
            return rooms[i];
        }
    }
};

exports.addRoom = function(friends) {
    var room = new Room(friends);
    console.log('new room', room.name);
    rooms.push(room);
    return room;
};

exports.getUserRooms = function(user_name){
    return rooms.filter(function(room){
        return room.users.indexOf(user_name);
    });
};

exports.createRoom = Room;
