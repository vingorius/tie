var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/:room', function(req, res, next) {
    console.log('room', req.params.room);
    var room = req.params.room || '';
    // res.render('hush', {
    res.render('instatalk', {
        'room': room
    });
});

module.exports = router;
