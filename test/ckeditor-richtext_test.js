(function($, CKEDITOR) {

    var utils = CKEDITOR.ggRichtext.utils;

    var assertToHtml = function(ed, richtext, html ) {
        var edobj = ed.ckeditorGet();
        var processor = edobj.dataProcessor;
        // Fire "setData" event manually to not bother editable.
        var evtData = {dataValue: richtext};
        edobj.fire('setData', evtData);
        equal(CKEDITOR.tools.convertRgbToHex(processor.toHtml(evtData.dataValue )), html.toLowerCase(), 'richtext->html' );
    };

    var assertToRichtext = function(ed, html, richtext) {
        var edobj = ed.ckeditorGet();
        edobj.setData(html);
        // ed.html(html);
        var evtData = {dataValue: edobj.dataProcessor.toDataFormat(html)};
        edobj.fire('getData', evtData);
        equal(evtData.dataValue, richtext, 'html->richtext failed at:' + richtext);
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
        expected = '<tag aaaatagattr="myclass">Hello world</tag>';
        res = utils.richtextToPseudoHtml(s);
        equal(res, expected);

        s = '{{tag=myclass alt=alt}}Hello world{{/tag}}';
        expected = '<tag aaaatagattr="myclass" alt="alt">Hello world</tag>';
        res = utils.richtextToPseudoHtml(s);
        equal(res, expected);
    });

    test('richtext.utils.htmlToPseudoRichtext', function() {
        var s, expected, res;
        s = '<strong>Hello world</strong>';
        expected = '{{strong}}Hello world{{/strong}}';
        res = utils.htmlToPseudoRichtext(s);
        equal(res, expected);

        s = '<strong class="myclass">Hello world</strong>';
        expected = '{{strong class="myclass"}}Hello world{{/strong}}';
        res = utils.htmlToPseudoRichtext(s);
        equal(res, expected);

        // br should not be changed
        s = '<br />';
        res = utils.richtextToPseudoHtml(s);
        equal(res, s);
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
        expected = ['link[target,!aaaatagattr,style,class](*)',
                    'a[target,!href,style,class](*)'].join(';');
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
        stop();
        var ed = $('<div contenteditable="true" />').ckeditor(function(){
            assertToHtml(ed, '{{strong}}strong{{/strong}}', '<strong>strong</strong>');
            // Allowed attribute
            assertToHtml(ed, '{{strong class=test}}strong{{/strong}}', '<strong class="test">strong</strong>');
            // Not allowed attribute
            assertToHtml(ed, '{{strong alt=plop}}strong{{/strong}}', '<strong>strong</strong>');
            // Not allowed tag
            assertToHtml(ed, '{{font}}strong{{/font}}', 'strong');

            // Missing required attributes
            assertToHtml(ed, '{{link}}strong{{/link}}', 'strong');
            assertToHtml(ed, '{{link=plop}}strong{{/link}}', '<a href="plop">strong</a>');
            start();
        });
    });

    test('html to richtext', function() {
        stop();
        var ed = $('<div contenteditable="true" />').ckeditor(function() {
            assertToRichtext(ed, '<strong>strong</strong>', '{{strong}}strong{{/strong}}');
            // Allowed attribute
            assertToRichtext(ed, '<strong class="test">strong</strong>', '{{strong class=test}}strong{{/strong}}');
            // Not allowed attribute
            assertToRichtext(ed, '<strong inexisting=plop>strong</strong>', '{{strong}}strong{{/strong}}');
            // Not allowed tag
            assertToRichtext(ed, '<font>strong</font>', '{{font}}strong{{/font}}');

            // Missing required attributes
            assertToRichtext(ed, '<a>strong</a>', '{{link}}strong\n{{/link}}\n');
            assertToRichtext(ed, '<a href="plop">anchor</a>', '{{link=plop}}anchor\n{{/link}}\n');

            // We expected quotes on attribute
            assertToRichtext(ed, '<table class="richtext"></table>', '{{tab class="richtext"}}{{/tab}}');
            start();
        });
    });

}(jQuery, CKEDITOR));
