'use strict';

var marked = require('marked');

var removeLastBr = function(line) {
  return line.replace(/<br\/?>$/i, '');
};

var parseWithoutMath = function(content) {
  // 步骤1：提取公式并替换为占位符
  const mathPattern = /(\$\$.*?\$\$|\$.*?\$)/gs; // 匹配块级和行内公式
  const mathList = []; // 存储提取的公式
  content = content.replace(mathPattern, (match) => {
    mathList.push(match);
    return '{{MATH_' + (mathList.length - 1) + '}}'; // 生成占位符
  });

  // 步骤2：解析处理后的 Markdown
  let html = marked.parse(content);

  // 步骤3：还原公式
  mathList.forEach((math, index) => {
    html = html.replace('{{MATH_' + index + '}}', math);
  });

  return html;
};

hexo.extend.filter.register('before_post_render', function (data) {
  let admonitionRegExp = new RegExp('(^!!! *)(note|info|warning|error)(.*\n)((^ {2}.*\n|^\n)+)', 'gmi');
  let newLineRegExp = new RegExp(/(<br\/?>)+/i);
  let tableLineRegExp = new RegExp('^\\|(.*\\|)+$');
  let listLineRegExp = new RegExp('^-.*');
  let quoteLineRegExp = new RegExp('^>.*');

  if (admonitionRegExp.test(data.content)) {
    data.content = data.content.replace(admonitionRegExp, function (matchedContent, p1, p2, p3, p4) {
      p4 = p4.split(/\n|\r|\r\n/);
      let content = '';
      let renderedContent = '';

      for (const v of p4) {
        if (content == '' || content.endsWith('\n\n')
          || content.endsWith('{% raw %}') || v.trim() == '{% endraw %}') {
          content += v;
          continue;
        }

        if (v.trim() == '') {
          content = removeLastBr(content) + '\n\n';
          continue;
        }

        if (newLineRegExp.test(v.trim())) {
          content = removeLastBr(content) + v + '\n';
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
          content = removeLastBr(content) + '\n' + v + '<br>';
          continue;
        }

        content = removeLastBr(content) + '<br>' + v;
      }

      content = removeLastBr(content);
      renderedContent = parseWithoutMath(content);

      if (p3.replace(/\s+/g, '') === '""') {
        return '<div class="admonition ' + p2.toLowerCase() + '">' + renderedContent + '</div>\n\n';
      } else {
        p3 = p3.trim() === '' ? p2 : p3.replace(/(^ |")|("| $)/g, '');
        return '<div class="admonition ' + p2.toLowerCase() + '"><p class="admonition-title">' + p3 + '</p>' + renderedContent + '</div>\n\n';
      }

    });
  }

  return data;
});
