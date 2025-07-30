'use strict';

var md = require('marked');

var removeLastNewLine = function(line) {
  return line.replace(/<br\/?>$/i, '');
};

hexo.extend.filter.register('before_post_render', function (data) {
  let admonitionRegExp = new RegExp('(^!!! *)(note|info|warning|error)(.*\n)((^ {2}.*\n|^\n)+)', 'gmi');
  let htmlContent;

  if (admonitionRegExp.test(data.content)) {
    htmlContent = data.content.replace(admonitionRegExp, function (matchedContent, p1, p2, p3, p4) {

      let newLineRegExp = new RegExp(/(<br\/?>)+/i);
      let tableLineRegExp = new RegExp('^\\|(.*\\|)+$');
      let listLineRegExp = new RegExp('^-.*');
      let quoteLineRegExp = new RegExp('^>.*');
      p4 = p4.split(/\n|\r|\r\n/);
      let content = '';

      for (const v of p4) {
        if (v.trim() == '') {
          content = removeLastNewLine(content) + '\n\n';
          continue;
        }

        if (newLineRegExp.test(v.trim())) {
          content = removeLastNewLine(content) + v + '\n';
          continue;
        }

        if (tableLineRegExp.test(v.trim())) {
          content += v.trim() + '\n';
          continue;
        }

        if (listLineRegExp.test(v.trim())) {
          content += '\n' + v + '<br>';
          continue;
        }

        if (quoteLineRegExp.test(v.trim())) {
          content = removeLastNewLine(content) + '\n' + v + '<br>';
          continue;
        }

        if (content == '' || content.endsWith('\n\n')) {
          content += v;
          continue;
        }

        content = removeLastNewLine(content) + '<br>' + v;
      }

      let renderedContent = md.parse(removeLastNewLine(content));

      if (p3.replace(/\s+/g, '') === '""') {
        return '<div class="admonition ' + p2.toLowerCase() + '">' + renderedContent + '</div>\n\n';
      } else {
        p3 = p3.trim() === '' ? p2 : p3.replace(/(^ |")|("| $)/g, '');
        return '<div class="admonition ' + p2.toLowerCase() + '"><p class="admonition-title">' + p3 + '</p>' + renderedContent + '</div>\n\n';
      }
    });

    data.content = htmlContent;
  }

  return data;
});
