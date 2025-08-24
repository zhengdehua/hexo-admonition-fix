'use strict';

var marked = require('marked');

var css = `
.admonition {
  padding-left: 0.5em !important;
  margin: 1.5625em 0;
  padding: 0rem;
  overflow: hidden;
  page-break-inside: avoid;
  border-left: .3rem solid #42b983;
  border-radius: .3rem;
  box-shadow: 0 0.1rem 0.4rem rgba(0, 0, 0, .05), 0 0 0.05rem rgba(0, 0, 0, .1);
  background-color: #fafafa;
}

p.admonition-title {
  position: relative;
  margin: -.6rem -.6rem .8em -.6rem !important;
  padding: .4rem .6rem .4rem 1rem;
  font-weight: 700;
  background-color: rgba(66, 185, 131, .1);
}

.info>.admonition-title {
  background-color: rgba(0, 184, 212, .1);
}

.warning>.admonition-title {
  background-color: rgba(255, 145, 0, .1);
}

.error>.admonition-title {
  background-color: rgba(255, 82, 82, .1);
}

.admonition.info {
  border-color: #00b8d4;
}

.admonition.warning {
  border-color: #ff9100;
}

.admonition.error {
  border-color: #ff5252;
}

.info>.admonition-title::before {
  background-color: #00b8d4;
  border-radius: 50%;
}

.warning>.admonition-title::before {
  background-color: #ff9100;
  border-radius: 50%;
}

.error>.admonition-title::before {
  background-color: #ff5252;
  border-radius: 50%;
}

.admonition>p:not(.admonition-title) {
  margin-bottom: 2px !important;
}
`;

// 直接注入CSS内容到网站的head中
hexo.extend.filter.register('after_generate', function() {
  // 直接注入CSS内容到文章页面的head中
  this.extend.injector.register('head_end', `<style>${css}</style>`, 'post');
});

var removeLastBr = function(line) {
  return line.replace(/<br\/?>$/i, '');
};

const mathList = []; // 存储提取的公式

// 替换数学公式
var replaceMath = function(content) {
  const mathPattern = /(\$\$.*?\$\$|\$.*?\$)/gs; // 匹配块级和行内公式
  mathList.length = 0; // 清空之前的公式列表

  content = content.replace(mathPattern, (match) => {
    mathList.push(match);
    return '{{MATH_' + (mathList.length - 1) + '}}'; // 生成占位符
  });

  return content;
};

// 恢复数学公式
var recoverMath = function(content) {
  mathList.forEach((math, index) => {
    content = content.replace('{{MATH_' + index + '}}', math);
  });

  return content;
};

hexo.extend.filter.register('before_post_render', function (data) {
  let admonitionRegExp = new RegExp('(^!!! *)(note|info|warning|error)(.*\\n)((^ {2}.*\\n|^\\n)+)', 'gmi');
  let lastBrRegExp = new RegExp('(<br\/?>)+', 'i');
  let tableLineRegExp = new RegExp('^\\s*\\|(.*\\|)+');
  let tableSuffixRegExp = new RegExp('\\s*\\|(.*\\|)+$');
  let listLineRegExp = new RegExp('^\\s*-.*');
  let quoteLineRegExp = new RegExp('^\\s*>.*');
  let canReplace = data.mathjax || hexo.theme.config.math.per_page;

  if (canReplace) {
    data.content = replaceMath(data.content);
  }

  if (admonitionRegExp.test(data.content)) {
    data.content = data.content.replace(admonitionRegExp, function (matchedContent, p1, p2, p3, p4) {
      p4 = p4.split(/\n|\r|\r\n/);
      let block = '';
      let line = '';

      for (const v of p4) {
        line = v.replace(/^ {2}/, '');

        if (block == '' || block.endsWith('\n\n')
          || block.endsWith('{% raw %}') || line == '{% endraw %}') {
          block += line;
          continue;
        }

        if (block.endsWith('</hexoPostRenderCodeBlock>')) {
          block += '\n\n' + line;
          continue;
        }

        if (line == '') {
          block = removeLastBr(block) + '\n\n';
          continue;
        }

        if (lastBrRegExp.test(line)) {
          block = removeLastBr(block) + '<br>' + line;
          continue;
        }

        if (tableLineRegExp.test(line)) {
          block = removeLastBr(block) + '\n' + line;
          continue;
        }

        if (listLineRegExp.test(line)) {
          block += '\n' + line + '<br>';
          continue;
        }

        if (quoteLineRegExp.test(line)) {
          block = removeLastBr(block) + '\n' + line + '<br>';
          continue;
        }

        // 处理表格的结尾
        if (tableSuffixRegExp.test(block)) {
          block += '\n\n' + line;
          continue;
        }

        block = removeLastBr(block) + '<br>' + line;
      }

      block = removeLastBr(block);
      block = marked.parse(block);

      if (p3.replace(/\s+/g, '') === '""') {
        return '<div class="admonition ' + p2.toLowerCase() + '">' + block + '</div>\n\n';
      } else {
        p3 = p3.trim() === '' ? p2 : p3.replace(/(^ |")|("| $)/g, '');
        return '<div class="admonition ' + p2.toLowerCase() + '"><p class="admonition-title">' + p3 + '</p>' + block + '</div>\n\n';
      }

    });
  }

  if (canReplace) {
    data.content = recoverMath(data.content);
  }

  return data;
});
