'use strict';

hexo.extend.filter.register('before_post_render', function (data) {
  let strRegExp = '(^!!! *)(note|info|warning|error)(.*\n)((^ {2}.*\n|^\n)+)';
  let admonitionRegExp = new RegExp(strRegExp, 'gmi');
  let htmlContent;

  if (admonitionRegExp.test(data.content)) {
    htmlContent = data.content.replace(admonitionRegExp, function (matchedContent, p1, p2, p3, p4) {

      let tableLineRegExp = new RegExp('^\\|(.*\\|)+$');
      let listLineRegExp = new RegExp('^-.*');
      let quoteLineRegExp = new RegExp('^>.*');
      p4 = p4.split(/\n|\r|\r\n/);
      let content = '';

      for (const v of p4) {
        if (tableLineRegExp.test(v.trim())) {
          content += v.trim() + '\n';
          continue;
        }

        if (listLineRegExp.test(v.trim())) {
          content += '\n' + v + '<br>';
          continue;
        }

        if (quoteLineRegExp.test(v.trim())) {
          content += v + '<br>';
          continue;
        }

        content += '\n' + v + '\n';
      }

      let renderedContent = hexo.render.renderSync({text: content, engine: 'markdown'});

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
