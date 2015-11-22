function getId(friends) {
    return (friends[0] > friends[1]) ? 'room_' + friends[0] + friends[1] : 'room_' + friends[1] + friends[0];
}

function room(users, talk) {
    this.name = getId(users);
    this.users = users;
    this.talks = [];
}

room.prototype.addTalk = function(talk) {
    this.talks.push(talk);
};

module.exports = room;
