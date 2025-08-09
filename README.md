# hexo-admonition-fix 使用指南

## 插件特性
本插件是对 hexo-admonition 的改写，具体如下：
- 对整体代码进行了重构；
- 取消了必须要在空行之后开始；
- 缩进改为了2个空格；
- 修复了内容不换行问题；
- 支持表格解析；
- 很好地支持了数学公式；
- 类型限制在 note|info|warning|error 四种。

## 文件说明
- `index-simple.js`：直接用 markedjs 解析块内容，有时候需要在 markdown 文件中用 `<br>` 换行；
- `index.js`：对 `index-simple.js` 进行了优化，不需要在 markdown 文件中用 `<br>` 换行。

## 参考资料
其他使用指南参考 https://github.com/lxl80/hexo-admonition

## License
MIT
