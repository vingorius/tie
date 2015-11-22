var User = require('./user');

var users = [];

function findUser(user_name) {
    // console.log('findUser',user_name,users);
    for (var i = 0; i < users.length; i++) {
        if (users[i].name === user_name) {
            return users[i];
        }
    }
    return null;
}

exports.auth = function(p_user, cb) {
    var user = findUser(p_user.name);
    cb(user);
};

exports.createUser = function(name, friends, rooms) {
    var user = new User(name, friends, rooms);
    users.push(user);
    return user;
};

exports.findUser = findUser;
