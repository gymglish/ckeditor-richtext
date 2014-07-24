/*
 * ckeditor-richtext
 * https://github.com/gymglish/ckeditor-richtext
 *
 * Copyright (c) 2014 Aurélien Matouillot
 * Licensed under the MIT license.
 */

(function(CKEDITOR) {

    var richtextOpentagRe = new RegExp('({{([^/][^}]*)}})', 'g');
    var richtextClosetagRe = new RegExp('{{(/[^}]*)}}', 'g');

    // Rewrite tags like {{tag=something}} in {{tab TAG_ATTR_VALUE_NAME=something}}
    var TAG_ATTR_VALUE_NAME = 'tagattr';

    var richtext = {};
    richtext.utils = {
        richtextAttrsToHtml: function(s) {
            var pairs = s.split(' ');

            var attrs = {};
            var key, value;

            for (var i in pairs) {
                if (! pairs[i]) {
                    continue;
                }
                var tmp = pairs[i].split('=');
                var len = tmp.length;
                if (len > 2) {
                    throw "Bad attribute " + pairs[i];
                }
                if (len === 2) {
                    key = tmp[0];
                    value = tmp[1].replace(/"/g, "");
                    if (attrs[key]) {
                        attrs[key] += ' ' + value;
                    }
                    else {
                        attrs[key] = value;
                    }
                }
                else {
                    attrs[key] += ' ' + tmp;
                }
            }

            if (! attrs) {
                return '';
            }

            var outputStr = '';
            for (key in attrs) {
                outputStr += ' ' + key + '="' + attrs[key] + '"';
            }
            return outputStr;
        },
        richtextToPseudoHtml: function(richtext) {
            var ns = this;
            richtext = richtext.replace(richtextClosetagRe, '<$1>');
            return richtext.replace(richtextOpentagRe, function(match, p1, p2) {
                var lis = p2.split(' '),
                    tag = lis.shift(),
                    attrs = lis.join(' ');

                if (tag.indexOf('=') !== -1) {
                    var tmp = tag.split('=');
                    tag = tmp[0];
                    attrs = TAG_ATTR_VALUE_NAME + '=' + tmp[1] + ' ';
                }
                return '<' + tag + ns.richtextAttrsToHtml(attrs) + '>';
            });
        }
    };

    // Be able to access to the namespace to easily test functions
    CKEDITOR.ggRichtext = richtext;
}(CKEDITOR));
