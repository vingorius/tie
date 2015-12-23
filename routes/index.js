var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    // console.log('locale',res.cookie('locale'));
    res.render('index');
});

/* For Search Engine. whitout this, server will create a room named 'robots.txt'.*/
router.all('/robots.txt',function(req,res,next){
    res.status(404).send('Not Found');
});

router.get('/:room', function(req, res, next) {
    console.log('room', req.params.room);
    var room = req.params.room || '';
    // res.render('hush', {
    res.render('talk', {
        'room': room
    });
});

module.exports = router;
