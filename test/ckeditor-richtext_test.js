(function($, CKEDITOR) {

    var utils = CKEDITOR.ggRichtext.utils;

    var assertToHtml = function(ed, richtext, html ) {
        var processor = ed.dataProcessor;
        // Fire "setData" event manually to not bother editable.
        var evtData = {dataValue: richtext};
        ed.fire('setData', evtData);
        equal(CKEDITOR.tools.convertRgbToHex(processor.toHtml(evtData.dataValue )), html.toLowerCase(), 'richtext->html' );
    };

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

    test('richtext.utils.ckeditorAllowedContent', function() {
        var conf, expected, res;
        conf = {
            em: {
                allowedAttrs: ['class']
            }
        };
        expected = 'em[class](*)';
        res = utils.ckeditorAllowedContent(conf);
        equal(res, expected);

        conf = {
            em: {
                allowedAttrs: ['alt']
            }
        };
        expected = 'em[alt]';
        res = utils.ckeditorAllowedContent(conf);
        equal(res, expected);

        conf = {
            link: {
                htmlTag: 'a',
                tagAttr: 'href',
                allowedAttrs: ['target', 'href', 'style', 'class']
            }
        };
        expected = 'link[target,!tagattr,style,class](*)';
        res = utils.ckeditorAllowedContent(conf);
        equal(res, expected);

        conf = {
            em: {
                allowedAttrs: ['alt']
            },
            strong: {
                allowedAttrs: ['class']
            },
            center: {},
        };
        expected = 'em[alt];strong[class](*);center';
        res = utils.ckeditorAllowedContent(conf);
        equal(res, expected);
    });


    test('richtext to html', function() {
        var ed = $('<div contenteditable="true" />').ckeditor().ckeditorGet();
        stop();
        CKEDITOR.on('instanceReady', function(){
            assertToHtml(ed, '{{strong}}strong{{/strong}}', '<strong>strong</strong>');
            // Allowed attribute
            assertToHtml(ed, '{{strong class=test}}strong{{/strong}}', '<strong class="test">strong</strong>');
            // Not allowed attribute
            assertToHtml(ed, '{{strong alt=plop}}strong{{/strong}}', '<strong>strong</strong>');
            // Not allowed tag
            assertToHtml(ed, '{{font}}strong{{/font}}', 'strong');

            // Missing required attributes
            assertToHtml(ed, '{{link}}strong{{/link}}', 'strong');
            assertToHtml(ed, '{{link=plop}}strong{{/link}}', '<link tagattr="plop">strong</link>');
            start();
        });
    });

}(jQuery, CKEDITOR));
