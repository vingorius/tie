var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        'roomname': ''
    });
});

router.get('/:roomname', function(req, res, next) {
    console.log('roomname', req.params.roomname);
    var roomname = req.params.roomname || '';
    res.render('index', {
        'roomname': roomname
    });
});

module.exports = router;
