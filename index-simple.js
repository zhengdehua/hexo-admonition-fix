'use strict';

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
  padding: .4rem .6rem .4rem 2.5rem;
  font-weight: 700;
  background-color: rgba(66, 185, 131, .1);
}

.admonition-title::before {
  position: absolute;
  top: .9rem;
  left: 1rem;
  width: 12px;
  height: 12px;
  background-color: #42b983;
  border-radius: 50%;
  content: ' ';
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

// 注册CSS辅助函数
hexo.extend.helper.register('hexo_admonition_css', function() {
  return css;
});

var marked = require('marked');

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

  if (admonitionRegExp.test(data.content)) {
    data.content = data.content.replace(admonitionRegExp, function (matchedContent, p1, p2, p3, p4) {

      let renderedContent = parseWithoutMath(p4);

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
