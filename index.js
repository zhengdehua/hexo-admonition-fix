'use strict';

var marked = require('marked');

var css = `
.admonition {
  padding-left: 1em !important;
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
  margin: -.6rem -.6rem .8em -.8rem !important;
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

var removeLastBrs = function(line) {
  return line.replace(/(<br\/?>)+$/i, '');
};

var removeLastBreaks = function (str) {
  return str.replace(/(?:<br\/?>|\n)+$/gi, '');
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
  let admonitionRegExp = new RegExp('(^!!!\\s*)(note|info|warning|error)(.*\\n)((^\\s{2}.*\\n)+)', 'gmi');
  let tableLineRegExp = new RegExp('^\\s*\\|(.+\\|)+$');
  let tableSuffixRegExp = new RegExp('\\s*\\|(.+\\|)+$');
  let listLineRegExp = new RegExp('^\\s*-.+$');
  let quoteLine1RegExp = new RegExp('^\\s*>\\s*.+$');
  let quoteLine2RegExp = new RegExp('^\\s*>\\s*$');
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
        line = v.replace(/^ {2}/, ''); // 去除插件本身的缩进空格

        if (block == '' || block.endsWith('\n\n')
          || block.endsWith('{% raw %}') || line == '{% endraw %}') {
          block += line;
          continue;
        }

        // 处理表格的每一行
        if (tableLineRegExp.test(line)) {
          block = removeLastBrs(block) + '\n' + line;
          continue;
        }

        // 处理表格的结尾，只要上面的表格还没结束，就不会到达这里
        // 也处理代码块的结尾
        if (tableSuffixRegExp.test(block)
          || block.endsWith('</hexoPostRenderCodeBlock>')) {
          block = (line == '') ? (block + '\n\n<br>\n\n') : (block + '\n\n' + line);
          continue;
        }

        // 处理空行，表示一个空白的段落
        if (line == '') {
          block = removeLastBr(block) + '\n\n<br>\n\n';
          continue;
        }

        // 处理列表行
        if (listLineRegExp.test(line)) {
          block += '\n' + line;
          continue;
        }

        // 处理引用行，针对 > 后面有内容的情况
        if (quoteLine1RegExp.test(line)) {
          block = removeLastBr(block) + '\n' + line;
          continue;
        }

        // 处理引用行，针对 > 后面没有内容的情况
        if (quoteLine2RegExp.test(line)) {
          block = removeLastBr(block) + line;
          continue;
        }

        // 其他情况，表示是同一段落的内容
        block = removeLastBr(block) + '<br>' + line;
      }

      block = removeLastBreaks(block);
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
