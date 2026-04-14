# markdownlint-pangu

`markdownlint-pangu` 是一个把 `markdownlint` 和 `pangu` 组合到一起的 Markdown CLI。

它的目标不是重新发明一套 Markdown lint 工具，而是在尽量保留
`markdownlint` 使用习惯的前提下，为 Markdown 文档补上“在安全文本范围内做中英文 spacing 检查与修复”的能力。

上游项目：

- `markdownlint`：[https://github.com/DavidAnson/markdownlint](https://github.com/DavidAnson/markdownlint)
- `pangu.js`：[https://github.com/vinta/pangu.js](https://github.com/vinta/pangu.js)

## 它是干什么的

这个项目面向希望在 Markdown 工作流里同时使用 `markdownlint` 规则检查和
中英文 spacing 处理的用户。

它尤其适合下面这类场景：

- 希望继续使用 `markdownlint` 现有规则体系
- 希望把中英文之间的 spacing 检查和修复纳入同一个 CLI
- 希望在 Markdown 语义安全范围内做修复，尽量避免误改代码块、URL、数学公式等区域

- 支持 `check` 和 `fix` 两个主命令
- 支持 `markdownlint` 规则透传：`--rules` / `--disable`
- 支持 `stdin`、`--format json`、`fix --stdin`
- 支持默认读取 `.markdownlint.json` 和 `.markdownlint-pangu.json`

## 安装

### 全局安装

```bash
npm install -g markdownlint-pangu
```

安装后可直接使用：

```bash
markdownlint-pangu --help
```

### 不安装，直接临时执行

```bash
npx markdownlint-pangu --help
```

### 从源码安装

如果需要本地开发、调试或验证源码版本，可以使用源码安装方式：

```bash
git clone https://github.com/Ins1nuatE/markdownlint-pangu.git
cd markdownlint-pangu
npm install
npm run build
npm link
```

## 快速开始

### 检查 Markdown 文件

```bash
markdownlint-pangu check "docs/**/*.md"
```

### 修复 Markdown 文件

```bash
markdownlint-pangu fix "docs/**/*.md"
```

### 从 stdin 检查

stdin 模式必须提供 `--stdin-filepath`，用于诊断定位和 `markdownlint` 规则匹配：

```bash
cat README.md | markdownlint-pangu check --stdin --stdin-filepath README.md
```

### 从 stdin 修复

`fix --stdin` 不会写回文件，而是把修复后的正文输出到 stdout：

```bash
cat README.md | markdownlint-pangu fix --stdin --stdin-filepath README.md > fixed.md
```

## 常见用法

### 输出 JSON 诊断

```bash
markdownlint-pangu check --format json docs/README.md
```

### 只启用指定 markdownlint 规则

`--rules` 使用单参数、逗号分隔：

```bash
markdownlint-pangu check --pangu-off --rules MD041,MD009 docs/README.md
```

### 禁用指定 markdownlint 规则

`--disable` 也使用单参数、逗号分隔：

```bash
markdownlint-pangu check --pangu-off --disable MD013,MD009 docs/README.md
```

### 只做 spacing 检查

```bash
markdownlint-pangu check --markdownlint-off docs/README.md
```

### 只做 markdownlint 检查

```bash
markdownlint-pangu check --pangu-off docs/README.md
```

## CLI 选项

`check` 与 `fix` 共享以下核心选项：

- `--config <path>`：指定 `markdownlint` 配置文件路径
- `--pangu-config <path>`：指定 `.markdownlint-pangu.json` 路径
- `--format <text|json>`：诊断输出格式，默认 `text`
- `--pangu-off`：关闭 pangu spacing 检查或修复
- `--markdownlint-off`：关闭 markdownlint 检查或修复
- `--quiet`：不输出诊断信息
- `--stdin`：从标准输入读取 Markdown
- `--stdin-filepath <path>`：stdin 模式下用于诊断定位与规则匹配的路径
- `--rules <items>`：仅启用指定 markdownlint 规则，单参数逗号分隔
- `--disable <items>`：禁用指定 markdownlint 规则，单参数逗号分隔

完整帮助可通过以下命令查看：

```bash
markdownlint-pangu --help
markdownlint-pangu check --help
markdownlint-pangu fix --help
```

## 配置

### markdownlint 配置

- 默认会在当前工作目录查找 `.markdownlint.json`
- 可通过 `--config` 显式指定路径

### pangu 配置

- 默认会在当前工作目录查找 `.markdownlint-pangu.json`
- 可通过 `--pangu-config` 显式指定路径

配置示例：

```json
{
  "pangu": {
    "enabled": true,
    "ignorePatterns": [],
    "ignoreBlocks": []
  }
}
```

## 输出与退出码

- `0`：没有剩余诊断
- `1`：存在诊断，或配置加载 / 运行过程出错
- `2`：CLI 参数使用错误

补充约束：

- `fix --stdin` 的 stdout 只输出修复后的正文
- `fix --stdin` 的诊断信息输出到 stderr，避免污染管道结果
- `--format json` 会输出统一诊断模型的 JSON 数组，适合脚本或 CI 消费

## 设计边界

这个工具当前是保守修复策略，不追求“能改的都改”。

它会优先只处理 Markdown 中高置信度的自然语言文本区域，例如：

- 段落
- 标题
- 列表项
- 引用块
- 表格单元格文本
- 链接文本
- 图片 alt 文本

它不会主动改动这些高风险区域：

- fenced code block
- inline code
- URL / link destination
- HTML
- front matter
- math block / inline math
- definition / footnote 等结构区

`fix` 当前采用单轮流程：

1. 先应用 pangu spacing patch
1. 再运行 markdownlint auto-fix
1. 最后做一次完整 recheck

如果 recheck 后仍有问题，会如实报告，而不是继续自动多轮改写。

## 开发

安装依赖并构建：

```bash
npm install
npm run build
```

运行测试：

```bash
npm run test
```
