/**
 * Copies the current selected text to the SO clipboard
 * This method must be called from an event to work with `execCommand`
 * @param {String} text Text to copy
 * @param {Boolean} [fallback] Set to true shows a prompt
 * @return Boolean Returns `true` if the text was copied or the user clicked on accept (in prompt), `false` otherwise
*/
var CopyToClipboard = function(text, fallback){
    var fb = function () {
        $t.remove();
        if (fallback !== undefined && fallback) {
            var fs = 'Please, copy the following text:';
            if (window.prompt(fs, text) !== null) return true;
        }
        return false;
    };
    var $t = $('<textarea />');
    $t.val(text).css({
        width: '100px',
        height: '40px',
        border: 'none'
    }).appendTo('body');
    $t.select();
    try {
        if (document.execCommand('copy')) {
            $t.remove();
            return true;
        }
        fb();
    }
    catch (e) {
        fb();
    }
};
