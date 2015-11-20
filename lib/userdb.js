var users = [];
var login_users = [];

function User(name, friends, rooms, sid) {
    this.name = name;
    this.friends = friends || [];
    this.rooms = rooms || [];
    this.sid = sid;
}

function findUser(p_user) {
    // console.log('findUser',p_user,users);
    for (var i = 0; i < users.length; i++) {
        if (users[i].name === p_user.name) {
            return users[i];
        }
    }
    return null;
}

exports.auth = function(p_user, cb) {
    var user = findUser(p_user);
    cb(user);
};

exports.getSid = function(user_name) {
    var user = findUser({
        name: user_name
    });
    if (user) return user.sid;
    return null;
};

exports.addUser = function(user) {
    users.push(user);
};

exports.createUser = User;
