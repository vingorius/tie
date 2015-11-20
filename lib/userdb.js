var roomdb = require('./roomdb');

var users = [];
var login_users = [];

function User(name, friends, rooms, sid) {
    this.name = name;
    this.friends = friends || [];
    this.rooms = rooms || [];
    this.sid = sid;
}

var room = new roomdb.createRoom(['vingorius','fish']);

users.push(new User('vingorius', ['fish', 'ms', 'mk', 'mh'], [room]));
users.push(new User('fish', ['vingorius', 'ms', 'mk', 'mh'], [room]));
users.push(new User('ms', ['vingorius', 'fish', 'mk', 'mh']));

function findUser(p_user) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].name === p_user.name) {
            return users[i];
        }
    }
    return null;
}

exports.auth = function(p_user, sid) {
    var user = findUser(p_user);
    if (user) {
        user.sid = sid;
    }
    return user;
};

exports.getSid = function(user_name) {
    var user = findUser({
        name: user_name
    });
    if (user) return user.sid;
    return null;
};
