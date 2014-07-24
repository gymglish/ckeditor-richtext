(function(CKEDITOR) {

    var utils = CKEDITOR.ggRichtext.utils;

    module('ckeditor_richtext.utils');

    test('richtext.utils.richtextAttrsToHtml', function() {
        var s, expected, res;
        s = 'class=hello id=myid class=world';
        expected = ' class="hello world" id="myid"';
        res = utils.richtextAttrsToHtml(s);
        equal(res, expected);

        s = 'class="hello" id="myid"   alt=plop ';
        expected = ' class="hello" id="myid" alt="plop"';
        res = utils.richtextAttrsToHtml(s);
        equal(res, expected);

        s = 'class="hel=lo"';
        throws(function(){
            utils.richtextAttrsToHtml(s);
        }, function(e){
            return e.toString() === 'Bad attribute ' + s;
        });
    });

    test('richtext.utils.richtextToPseudoHtml', function() {
        var s, expected, res;
        s = '{{div}}Hello world{{/div}}';
        expected = '<div>Hello world</div>';
        res = utils.richtextToPseudoHtml(s);
        equal(res, expected);

        s = '{{div class=myclass}}Hello world{{/div}}';
        expected = '<div class="myclass">Hello world</div>';
        res = utils.richtextToPseudoHtml(s);
        equal(res, expected);

        s = '{{tag=myclass}}Hello world{{/tag}}';
        expected = '<tag tagattr="myclass">Hello world</tag>';
        res = utils.richtextToPseudoHtml(s);
        equal(res, expected);
    });
}(CKEDITOR));
