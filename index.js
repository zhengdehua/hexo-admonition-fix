var md = require('marked');

hexo.extend.filter.register('before_post_render', function (data) {
  let strRegExp = '(^!!! *)(note|info|warning|error)(.*\n)((^ {2}.*\n|^\n)+)';
  let admonitionRegExp = new RegExp(strRegExp, 'gmi');

  let strData;
  if (admonitionRegExp.test(data.content)) {
    strData = data.content.replace(admonitionRegExp, function (matchStr, p1, p2, p3, p4) {
      let tableLineRegExp = new RegExp('^\\|(.*\\|)+$');
      let listLineRegExp = new RegExp('^-.*');
      let quoteLineRegExp = new RegExp('^>.*');
      p4 = p4.split(/\n|\r|\r\n/);
      let admonitionContent = '';

      for (const v of p4) {
        if (tableLineRegExp.test(v.trim())) {
          admonitionContent += v.trim() + '\n';
          continue;
        }

        if (listLineRegExp.test(v.trim())) {
          admonitionContent += '\n' + v + '<br>';
          continue;
        }

        if (quoteLineRegExp.test(v.trim())) {
          admonitionContent += v + '<br>';
          continue;
        }

        admonitionContent += '\n' + v + '\n';
      }

      if (p3.replace(/\s+/g, '') === '""') {
        return '<div class="admonition ' + p2.toLowerCase() + '">' + md.parse(admonitionContent) + '</div>\n\n';
      } else {
        p3 = p3.trim() === '' ? p2 : p3.replace(/(^ |")|("| $)/g, '');
        return '<div class="admonition ' + p2.toLowerCase() + '"><p class="admonition-title">' + p3 + '</p>' + md.parse(admonitionContent) + '</div>\n\n';
      }
    });

    data.content = strData;
  }

  return data;
});
