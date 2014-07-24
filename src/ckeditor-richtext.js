/*
 * ckeditor-richtext
 * https://github.com/gymglish/ckeditor-richtext
 *
 * Copyright (c) 2014 Aurélien Matouillot
 * Licensed under the MIT license.
 */

(function($) {

  // Collection method.
  $.fn.ckeditor_richtext = function() {
    return this.each(function(i) {
      // Do something awesome to each selected element.
      $(this).html('awesome' + i);
    });
  };

  // Static method.
  $.ckeditor_richtext = function(options) {
    // Override default options with passed-in options.
    options = $.extend({}, $.ckeditor_richtext.options, options);
    // Return something awesome.
    return 'awesome' + options.punctuation;
  };

  // Static method default options.
  $.ckeditor_richtext.options = {
    punctuation: '.'
  };

  // Custom selector.
  $.expr[':'].ckeditor_richtext = function(elem) {
    // Is this element awesome?
    return $(elem).text().indexOf('awesome') !== -1;
  };

}(jQuery));
