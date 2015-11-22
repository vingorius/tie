function user(name, friends, rooms) {
    this.name = name;
    this.friends = friends || [];
    this.rooms = rooms || [];
    this.sid = null;
}

user.prototype.setSocketId = function(sid) {
    this.sid = sid;
};

user.prototype.getSocketId = function() {
    return this.sid;
};

user.prototype.isLogin = function() {
    return (this.sid !== null) ? true : false;
};

user.prototype.addRoom = function(room) {
    this.rooms.push(room);
};

user.prototype.addFriend = function(friend) {
    this.friends.push(friend);
};

user.prototype.joinAll = function(socket) {
    this.rooms.forEach(function(room) {
        socket.join(room.name);
    });
};

user.prototype.leaveAll = function(socket) {
    this.rooms.forEach(function(room) {
        socket.leave(room.name);
    });
};

module.exports = user;
