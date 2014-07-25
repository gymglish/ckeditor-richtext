/*
 * ckeditor-richtext
 * https://github.com/gymglish/ckeditor-richtext
 *
 * Copyright (c) 2014 Aurélien Matouillot
 * Licensed under the MIT license.
 */

(function(CKEDITOR) {

    var RICHTEXT_TAGS = {
        em: {
            allowedAttrs: ['class']
        },
        strong: {
            allowedAttrs: ['class']
        },
        center: {},
        link: {
            htmlTag: 'a',
            tagAttr: 'href',
            allowedAttrs: ['target', 'href', 'style', 'class']
        }
    };

    var HTML_TAGS = {};

    for (var tag in RICHTEXT_TAGS) {
        var def = RICHTEXT_TAGS[tag];
        if(def.htmlTag) {
            HTML_TAGS[def.htmlTag] = tag;
        }
    }

    var richtextOpentagRe = new RegExp('({{([^/][^}]*)}})', 'g');
    var richtextClosetagRe = new RegExp('{{(/[^}]*)}}', 'g');

    // Rewrite tags like {{tag=something}} in {{tab TAG_ATTR_VALUE_NAME=something}}
    // To rewrite the richtext from HTML correctly, we need this attribute to
    // be the first.
    var TAG_ATTR_VALUE_NAME = 'aaaatagattr';

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
                    attrs = TAG_ATTR_VALUE_NAME + '=' + tmp[1] + ' ' + attrs;
                }
                return '<' + tag + ns.richtextAttrsToHtml(attrs) + '>';
            });
        },
        htmlToPseudoRichtext: function(html) {
            return html.replace(/(<(\/?[^>]*)>)/g, function(match, p1, p2) {
                // TODO: find better way the check it's a br. ckeditor should have a tag parser
                if (p2 === 'br /') {
                    // Leave the <br /> since it's the entermode of the editor
                    return '<br />';
                }
                return '{{'+ p2 +'}}';
            });
        },
        ckeditorAllowedContent: function(conf) {
            var s, def, tags = [];
            for (var tag in conf) {
                def = conf[tag];
                s = '';
                if(def.allowedAttrs) {
                    s += '[';
                    var attrs = [], attr;
                    for (var i in def.allowedAttrs) {
                        attr = def.allowedAttrs[i];
                        if (def.tagAttr === attr) {
                            // This attribute is required
                            attr = '!' + TAG_ATTR_VALUE_NAME;
                        }
                        attrs.push(attr);
                    }
                    s += attrs.join(',');
                    s += ']';
                    if (def.allowedAttrs.indexOf('class') !== -1){
                        // We allow any class name
                        s += '(*)';
                    }
                }
                tags.push(tag+s);
                if (def.htmlTag) {
                    if (def.tagAttr) {
                        s = s.replace(TAG_ATTR_VALUE_NAME, def.tagAttr);
                    }
                    tags.push(def.htmlTag+s);
                }
            }
            return tags.join(';');
        }
    };

	var HtmlWriter = CKEDITOR.tools.createClass({
        base: CKEDITOR.htmlWriter,
        proto: {
			attribute : function(attName, attValue) {
				if (attName === TAG_ATTR_VALUE_NAME) {
                    this._.output.push('=', attValue );
				}
                else {
                    CKEDITOR.htmlWriter.prototype.attribute.call(this, attName, attValue);
                }
            }
        }
    });

    // CKEDITOR config for this plugin
    // TODO: Make sure it's the right place to put this config
    //
    // We want BR for new line, we don't want any p or div in our richtext
    CKEDITOR.config.enterMode = CKEDITOR.ENTER_BR;
    // Be strict on the addable tag and attribute.
    CKEDITOR.config.allowedContent = richtext.utils.ckeditorAllowedContent(RICHTEXT_TAGS);
    // Hack: By default link is an autoclose tag but in our richtext we want to
    // put some content. It works since we will never have autoclose link in
    // our editor.
    delete CKEDITOR.dtd.$empty.link;
    CKEDITOR.plugins.add('ggrichtext', {
        init: function(editor) {
            editor.on('setData', function(evt) {
                var v = evt.data.dataValue;
                evt.data.dataValue = richtext.utils.richtextToPseudoHtml(v);
            });

            editor.on('getData', function(evt) {
                var v = evt.data.dataValue;
                evt.data.dataValue = richtext.utils.htmlToPseudoRichtext(v);
            });

            editor.dataProcessor.writer = new HtmlWriter();

            editor.dataProcessor.dataFilter.addRules({
                elements: {
                    $: function(element) {
                        if (typeof RICHTEXT_TAGS[element.name] !== 'undefined') {
                            var def = RICHTEXT_TAGS[element.name];
                            if (def.htmlTag) {
                                element.name = def.htmlTag;
                            }
                            if (def.tagAttr) {
                                var v = element.attributes[TAG_ATTR_VALUE_NAME];
                                delete element.attributes[TAG_ATTR_VALUE_NAME];
                                element.attributes[def.tagAttr] = v;
                            }
                        }
                    }
                }
            });

            editor.dataProcessor.htmlFilter.addRules({
                elements: {
                    $: function( element ) {
                        var richtextTag = element.name, def;
                        if (typeof HTML_TAGS[element.name] !== 'undefined') {
                            richtextTag = HTML_TAGS[element.name];
                            element.name = richtextTag;

                            def = RICHTEXT_TAGS[richtextTag];
                            if (def.tagAttr) {
                                var value = element.attributes[def.tagAttr];
                                if(typeof value !== 'undefined') {
                                    delete element.attributes[def.tagAttr];
                                    element.attributes[TAG_ATTR_VALUE_NAME] = value;
                                }
                            }

                        }

                        def = RICHTEXT_TAGS[richtextTag];
                        var lis = [];
                        for(var attr in element.attributes) {
                            if (attr == TAG_ATTR_VALUE_NAME) {
                                continue;
                            }
                            if (def.allowedAttrs.indexOf(attr) === -1) {
                                lis.push(attr);
                            }
                        }
                        for (var i in lis) {
                            delete element.attributes[lis[i]];
                        }
                    },
                }
            });
        }
    });

    // Be able to access to the namespace to easily test functions
    CKEDITOR.ggRichtext = richtext;
}(CKEDITOR));
