# CFly Space 新功能扩展 — 综合技术设计文档

## 一、文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | CFly Space V2.0 新功能技术设计文档 |
| 关联文档 | `prd.md`（V1.0 产品需求）、`AGENTS.md`（开发规范）、`docs/*.md`（各功能需求文档） |
| 编写日期 | 2026 年 03 月 20 日 |
| 状态 | 初稿 |

---

## 二、现有架构概览

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| WXT | ^0.20.18 | 浏览器扩展构建框架 |
| Vue 3 | ^3.5.29 | UI 框架（Composition API + `<script lang="ts" setup>`） |
| TypeScript | ^5.9.3 | 全量类型约束 |
| Pinia | ^3.0.2 | 状态管理（Setup Store） |
| UnoCSS | ^66.1.1 | 原子化 CSS（preset-uno） |
| Prism.js / refractor | ^1.30.0 / ^5.0.0 | 语法高亮 |
| Milkdown | ^7.19.0 | Markdown WYSIWYG 编辑器 |

### 当前目录结构

```
entrypoints/
  background.ts           # Service Worker
  popup/                  # 弹出面板
  options/                # 选项页面（主工作区）
components/
  common/                 # 通用组件
  json/                   # JSON 格式化
  water-reminder/         # 喝水提醒
  quick-sites/            # 快捷书签
  markdown/               # Markdown 编辑器
composables/              # 可复用逻辑
stores/                   # Pinia Store
types/                    # TypeScript 类型定义
assets/                   # 静态资源
public/                   # 扩展静态文件
docs/                     # 功能需求文档
feature/                  # 功能规格文档
```

### 当前已有功能模块

| 模块 | 组件 | Store | 类型文件 | 状态 |
|------|------|-------|----------|------|
| JSON 格式化 | `components/json/` | `stores/json.ts` | `types/index.ts` | 已完成 |
| 喝水提醒 | `components/water-reminder/` | `stores/water.ts` | `types/water.ts` | 已完成 |
| 快捷书签 | `components/quick-sites/` | `stores/quickSite.ts` | `types/quickSite.ts` | 已完成 |
| Markdown 编辑器 | `components/markdown/` | `stores/markdown.ts` | `types/markdown.ts` | 已完成 |
| 时间戳转换 | — | — | — | 计划中 |

### 当前权限

```json
{
  "permissions": ["storage", "alarms", "notifications", "contextMenus", "tabs", "scripting"]
}
```

### 架构约束（必须遵守）

1. **MV3 Service Worker**：`background.ts` 空闲约 30s 后被回收，禁止 `setInterval` / `setTimeout`
2. **最小权限**：新增功能不得随意扩展权限
3. **本地存储**：所有数据只能存储在 `chrome.storage.local`，不得发起网络请求
4. **Chrome 环境检查**：访问 `chrome.*` API 前必须检查 `typeof chrome !== 'undefined'`

---

## 三、新增功能模块技术方案

### 功能与文件规划总览

| 功能模块 | 组件目录 | Store | 类型文件 | Composable | 优先级 |
|----------|----------|-------|----------|------------|--------|
| 时间戳转换 | `components/timestamp/` | `stores/timestamp.ts` | `types/timestamp.ts` | — | P0 |
| 编码/解码 | `components/encode-decode/` | — | `types/encodeDecode.ts` | `useEncodeDecode.ts` | P0 |
| 正则测试器 | `components/regex/` | `stores/regex.ts` | `types/regex.ts` | `useRegexTester.ts` | P1 |
| UUID/随机生成 | `components/generator/` | — | `types/generator.ts` | `useGenerator.ts` | P1 |
| 代码片段管理 | `components/snippet/` | `stores/snippet.ts` | `types/snippet.ts` | — | P2 |
| Diff 对比 | `components/diff/` | — | `types/diff.ts` | `useDiff.ts` | P2 |
| 颜色工具 | `components/color/` | `stores/color.ts` | `types/color.ts` | `useColorConverter.ts` | P2 |
| HTTP 状态码 | `components/http-status/` | — | `types/httpStatus.ts` | — | P3 |
| 剪贴板历史 | `components/clipboard/` | `stores/clipboard.ts` | `types/clipboard.ts` | — | P3 |
| 页面标尺 | `components/page-ruler/` | — | `types/pageRuler.ts` | — | P3 |

---

### （一）时间戳转换器

#### 文件结构

```
components/timestamp/
  TimestampConverter.vue    # 主组件
stores/
  timestamp.ts              # 转换历史持久化
types/
  timestamp.ts              # 类型定义
```

#### 类型定义

```typescript
// types/timestamp.ts

export interface TimestampRecord {
  id: string
  input: string
  inputType: 'timestamp' | 'datetime'
  results: TimestampResult
  createdAt: number
}

export interface TimestampResult {
  timestampSec: number
  timestampMs: number
  iso8601: string
  local: string         // YYYY-MM-DD HH:mm:ss
  utc: string           // YYYY-MM-DD HH:mm:ss UTC
  relative: string      // 相对时间描述
}

export const MAX_HISTORY_COUNT = 10
```

#### 核心逻辑

- **输入识别**：通过正则判断输入类型
  - 纯数字 8~10 位 → 秒级时间戳
  - 纯数字 13 位 → 毫秒级时间戳
  - 匹配日期格式 → 日期时间字符串
- **转换计算**：使用原生 `Date` API，不引入 dayjs 等额外依赖
- **相对时间**：自行实现简单的相对时间计算函数
- **实时时间戳**：使用 `setInterval(1000)` 在组件内刷新当前时间戳显示

#### Store 设计

```typescript
// stores/timestamp.ts
export const useTimestampStore = defineStore('timestamp', () => {
  const history = ref<TimestampRecord[]>([])

  // 从 chrome.storage.local 初始化
  // watch history 变化自动同步存储
  // addRecord / clearHistory 方法
})
```

#### 导航注册

在 `entrypoints/options/App.vue` 中：
- 将 `navItems` 中的时间戳条目从 `disabled: true` 改为 `disabled: false`
- 移除 `"即将上线"` 的 badge

在 `entrypoints/popup/App.vue` 中：
- 将时间戳工具从 `ready: false` 改为 `ready: true`

#### 新增依赖

无。使用原生 `Date` API 和 `Intl.DateTimeFormat`。

---

### （二）编码/解码工具

#### 文件结构

```
components/encode-decode/
  EncodeDecode.vue          # 主组件（Tab 切换不同编码类型）
  EncodePanel.vue           # 单个编码/解码面板（复用组件）
composables/
  useEncodeDecode.ts        # 编码/解码核心逻辑
types/
  encodeDecode.ts           # 类型定义
```

#### 类型定义

```typescript
// types/encodeDecode.ts

export type EncodeType = 'url' | 'base64' | 'html' | 'unicode'

export interface EncodeDecodeState {
  activeType: EncodeType
  input: string
  output: string
  error: string | null
}
```

#### 核心逻辑

全部使用浏览器原生 API，不引入第三方库：

| 类型 | Encode | Decode |
|------|--------|--------|
| URL (Component) | `encodeURIComponent()` | `decodeURIComponent()` |
| URL (Full) | `encodeURI()` | `decodeURI()` |
| Base64 (文本) | `btoa(unescape(encodeURIComponent(text)))` | `decodeURIComponent(escape(atob(base64)))` |
| Base64 (文件) | `FileReader.readAsDataURL()` | — |
| HTML 实体 | 自行实现字符替换映射 | 创建临时 DOM 元素，读取 `textContent` |
| Unicode | `str.replace(/[^\x00-\x7F]/g, c => '\\u' + ...)` | `str.replace(/\\u[\dA-Fa-f]{4}/g, ...)` |

#### 组件设计

`EncodePanel.vue` 作为通用面板复用：
- Props：`encodeType`、`encodeFn`、`decodeFn`
- 内部维护输入/输出状态
- 提供 Encode / Decode / 交换 / 复制 按钮

`EncodeDecode.vue` 作为容器，Tab 切换不同的 `EncodePanel` 实例。

#### Store 设计

无需 Store。纯工具型组件，状态在组件内管理。

#### 新增依赖

无。

---

### （三）正则表达式测试器

#### 文件结构

```
components/regex/
  RegexTester.vue           # 主组件
  RegexFlags.vue            # 标志位切换组件
  MatchResult.vue           # 匹配结果展示组件
  RegexTemplates.vue        # 常用模板面板
composables/
  useRegexTester.ts         # 正则匹配核心逻辑
stores/
  regex.ts                  # 自定义模板持久化
types/
  regex.ts                  # 类型定义
```

#### 类型定义

```typescript
// types/regex.ts

export interface RegexFlags {
  global: boolean       // g
  caseInsensitive: boolean  // i
  multiline: boolean    // m
  dotAll: boolean       // s
  unicode: boolean      // u
}

export interface MatchItem {
  index: number         // 匹配起始位置
  text: string          // 匹配文本
  groups: CaptureGroup[]
}

export interface CaptureGroup {
  name?: string         // 命名捕获组名
  index: number         // 组序号
  text: string          // 捕获内容
}

export interface RegexTemplate {
  id: string
  name: string
  pattern: string
  flags: string
  category: 'validation' | 'extraction' | 'format' | 'custom'
  isBuiltin: boolean
}
```

#### 核心逻辑

```typescript
// composables/useRegexTester.ts
export function useRegexTester() {
  // 防抖匹配：输入变化后 200ms 执行
  // 超时保护：使用 setTimeout 限制匹配时间（如 3 秒），超时终止
  // 匹配上限：最多返回前 500 个匹配项
  // 高亮数据：返回原文中每个匹配的起止位置，用于渲染高亮层
}
```

**高亮实现方案**：
- 输入区使用 `<textarea>` 覆盖在 `<div>` 上
- `<div>` 渲染带高亮标记的文本（`<mark>` 标签包裹匹配项）
- `<textarea>` 透明背景，与 `<div>` 同步滚动
- 参考 JSON 格式化中语法高亮的实现思路

#### Store 设计

```typescript
// stores/regex.ts
export const useRegexStore = defineStore('regex', () => {
  const customTemplates = ref<RegexTemplate[]>([])
  // 持久化自定义正则模板
})
```

#### 新增依赖

无。使用原生 `RegExp` API。

---

### （四）UUID / 随机数据生成器

#### 文件结构

```
components/generator/
  DataGenerator.vue         # 主组件（Tab 切换）
  UuidPanel.vue             # UUID 生成面板
  RandomStringPanel.vue     # 随机字符串面板
  MockDataPanel.vue         # Mock 数据面板
composables/
  useGenerator.ts           # 生成逻辑
types/
  generator.ts              # 类型定义
```

#### 核心逻辑

```typescript
// composables/useGenerator.ts

// UUID v4：使用 crypto.randomUUID()（现代浏览器原生支持）
// 兼容方案：crypto.getRandomValues() 手动拼接

// 随机字符串：crypto.getRandomValues() + 字符集映射

// Mock 数据：
// - 姓名：内置常见姓氏 100+ 名字库，随机组合
// - 手机号：1 + [3-9] + 9位随机数字
// - 邮箱：随机字符串 + @常见域名
// - 身份证：地区码 + 生日 + 顺序码 + 校验位算法
// - IP：4 段 0-255 随机数
```

#### Store 设计

无需 Store。纯工具型，所有状态在组件内管理。

#### 新增依赖

无。使用 `crypto.randomUUID()` 和 `crypto.getRandomValues()`。

---

### （五）代码片段管理

#### 文件结构

```
components/snippet/
  SnippetManager.vue        # 主组件
  SnippetList.vue           # 片段列表
  SnippetEditor.vue         # 片段编辑面板
  SnippetCard.vue           # 片段卡片
stores/
  snippet.ts                # 片段数据持久化
types/
  snippet.ts                # 类型定义
```

#### 类型定义

```typescript
// types/snippet.ts

export interface Snippet {
  id: string
  title: string
  code: string
  language: string
  description: string
  tags: string[]
  folderId: string
  isFavorite: boolean
  createdAt: number
  updatedAt: number
}

export interface SnippetFolder {
  id: string
  name: string
  order: number
}

export const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'go', 'rust', 'java',
  'sql', 'shell', 'html', 'css', 'json', 'yaml', 'xml',
  'markdown', 'dockerfile', 'plaintext'
] as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]
```

#### 语法高亮

复用已有的 `prismjs` 依赖：

```typescript
import Prism from 'prismjs'
// 按需加载语言包
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
// ...

const highlightedCode = Prism.highlight(code, Prism.languages[language], language)
```

#### Store 设计

```typescript
// stores/snippet.ts
export const useSnippetStore = defineStore('snippet', () => {
  const snippets = ref<Snippet[]>([])
  const folders = ref<SnippetFolder[]>([])

  // CRUD 操作
  // 搜索过滤（标题、代码、描述、标签全文搜索）
  // 导入/导出 JSON
  // 持久化到 chrome.storage.local
})
```

#### 存储空间注意

代码片段可能占用较大存储空间。`chrome.storage.local` 默认限制为 10MB（可通过 `unlimitedStorage` 权限取消限制，但需评估必要性）。建议：
- 单个片段代码限制在 50KB 以内
- 总片段数限制在 500 条以内
- 导出功能作为备份手段

#### 新增依赖

无。复用已有 `prismjs`。可能需要额外加载几个 Prism 语言包（已内置在 prismjs 中）。

---

### （六）Diff 对比工具

#### 文件结构

```
components/diff/
  DiffTool.vue              # 主组件
  DiffInput.vue             # 输入面板
  DiffView.vue              # 差异展示面板
  DiffLine.vue              # 单行差异渲染
composables/
  useDiff.ts                # Diff 算法核心
types/
  diff.ts                   # 类型定义
```

#### Diff 算法

**方案选择**：自行实现简化版 Myers diff 算法或引入轻量库。

推荐方案：引入 `diff` 库（~15KB gzip），它是 npm 上最成熟的 JS diff 实现：

```bash
pnpm add diff
pnpm add -D @types/diff
```

```typescript
import { diffLines, diffWords } from 'diff'

// 行级 diff
const changes = diffLines(oldText, newText)

// 行内字符级 diff（用于高亮修改行内的具体变化）
const wordChanges = diffWords(oldLine, newLine)
```

如果不想引入第三方库，可自行实现 LCS（最长公共子序列）算法的简化版本，但质量和边界情况处理不如成熟库。

#### 同步滚动

并排视图下两栏同步滚动：

```typescript
const handleScroll = (source: 'left' | 'right', event: Event) => {
  const target = event.target as HTMLElement
  const other = source === 'left' ? rightPane : leftPane
  // 按比例同步滚动位置
  other.scrollTop = target.scrollTop
}
```

#### JSON 对比模式

```typescript
// 先格式化再对比
const formattedOld = JSON.stringify(JSON.parse(oldJson), null, 2)
const formattedNew = JSON.stringify(JSON.parse(newJson), null, 2)
const changes = diffLines(formattedOld, formattedNew)

// 语义对比（忽略 key 顺序）
function sortObjectKeys(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) return obj.map(sortObjectKeys)
  return Object.keys(obj).sort().reduce((sorted, key) => {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
    return sorted
  }, {} as Record<string, unknown>)
}
```

#### 新增依赖

| 依赖 | 版本 | 大小 | 用途 |
|------|------|------|------|
| `diff` | ^7.x | ~15KB gzip | 文本 diff 算法 |
| `@types/diff` | — | — | TypeScript 类型 |

---

### （七）颜色工具

#### 文件结构

```
components/color/
  ColorTool.vue             # 主组件
  ColorPicker.vue           # 色板选色组件
  ColorConverter.vue        # 格式转换展示
  ContrastChecker.vue       # 对比度检查
  ColorPalette.vue          # 调色板收藏
composables/
  useColorConverter.ts      # 颜色格式转换逻辑
stores/
  color.ts                  # 调色板持久化
types/
  color.ts                  # 类型定义
```

#### 类型定义

```typescript
// types/color.ts

export interface RgbColor {
  r: number  // 0-255
  g: number  // 0-255
  b: number  // 0-255
  a: number  // 0-1
}

export interface HslColor {
  h: number  // 0-360
  s: number  // 0-100
  l: number  // 0-100
  a: number  // 0-1
}

export interface ColorValue {
  hex: string
  rgb: RgbColor
  hsl: HslColor
}

export interface ColorPalette {
  id: string
  name: string
  colors: SavedColor[]
}

export interface SavedColor {
  id: string
  hex: string
  name?: string
}

export interface ContrastResult {
  ratio: number
  aaLargePass: boolean   // >= 3:1
  aaNormalPass: boolean  // >= 4.5:1
  aaaLargePass: boolean  // >= 4.5:1
  aaaNormalPass: boolean // >= 7:1
}
```

#### 颜色转换算法

```typescript
// composables/useColorConverter.ts

// HEX → RGB：parseInt 解析
// RGB → HSL：标准算法（max/min/delta 计算）
// HSL → RGB：标准算法
// 对比度计算：WCAG 2.1 相对亮度公式
//   L = 0.2126 * R + 0.7152 * G + 0.0722 * B
//   ratio = (L1 + 0.05) / (L2 + 0.05)
```

#### 取色器

使用浏览器原生 `EyeDropper` API（Chrome 95+）：

```typescript
const eyeDropper = new EyeDropper()
const result = await eyeDropper.open()
// result.sRGBHex → "#rrggbb"
```

需要 TypeScript 类型声明（`EyeDropper` 尚未在标准 lib 中）：

```typescript
// types/color.ts 中追加
declare global {
  interface EyeDropper {
    open(): Promise<{ sRGBHex: string }>
  }
  const EyeDropper: {
    new(): EyeDropper
  }
}
```

#### 色板组件

使用 Canvas 2D 渲染 HSV 色板：
- `<canvas>` 绘制色相-饱和度-亮度渐变
- 鼠标/触摸事件计算坐标对应的颜色值
- 色相条用 CSS `linear-gradient` 渲染

#### 新增依赖

无。所有颜色计算使用纯数学实现。

---

### （八）HTTP 状态码速查

#### 文件结构

```
components/http-status/
  HttpStatus.vue            # 主组件
  StatusCard.vue            # 状态码卡片组件
types/
  httpStatus.ts             # 状态码数据定义
```

#### 数据结构

```typescript
// types/httpStatus.ts

export interface HttpStatusCode {
  code: number
  name: string
  category: StatusCategory
  description: string
  useCase: string
  commonCause?: string
  troubleshoot?: string
}

export type StatusCategory = '1xx' | '2xx' | '3xx' | '4xx' | '5xx'

export const STATUS_CATEGORY_COLORS: Record<StatusCategory, string> = {
  '1xx': '#3b82f6',  // 蓝色
  '2xx': '#22c55e',  // 绿色
  '3xx': '#f97316',  // 橙色
  '4xx': '#ef4444',  // 红色
  '5xx': '#a855f7',  // 紫色
}

// 全量状态码数据作为 const 数组内置
export const HTTP_STATUS_CODES: HttpStatusCode[] = [
  { code: 200, name: 'OK', category: '2xx', ... },
  // ... 完整列表约 40+ 条
]
```

#### 实现说明

- 纯前端静态数据，无需 Store、无需网络请求
- 搜索使用简单的 `filter` + 字符串匹配
- 是所有功能中实现成本最低的模块

#### 新增依赖

无。

---

### （九）剪贴板历史

#### 文件结构

```
components/clipboard/
  ClipboardHistory.vue      # Options 页完整管理
  ClipboardPopup.vue        # Popup 面板快捷展示
entrypoints/
  content.ts                # Content Script（新增入口）
stores/
  clipboard.ts              # 剪贴板数据持久化
types/
  clipboard.ts              # 类型定义
```

#### 类型定义

```typescript
// types/clipboard.ts

export interface ClipboardRecord {
  id: string
  content: string
  contentType: 'code' | 'url' | 'text' | 'number'
  sourceTitle: string
  sourceUrl: string
  isFavorite: boolean
  createdAt: number
}

export interface ClipboardMessage {
  type: 'clipboard'
  action: 'copy'
  payload: {
    content: string
    sourceTitle: string
    sourceUrl: string
  }
}

export const MAX_CLIPBOARD_RECORDS = 100
```

#### Content Script

```typescript
// entrypoints/content.ts
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    document.addEventListener('copy', () => {
      const selection = window.getSelection()?.toString()
      if (selection) {
        chrome.runtime.sendMessage({
          type: 'clipboard',
          action: 'copy',
          payload: {
            content: selection,
            sourceTitle: document.title,
            sourceUrl: location.href,
          },
        })
      }
    })
  },
})
```

#### 权限影响

需要在 `wxt.config.ts` 的 manifest 中添加 content script 的匹配规则。WXT 会根据 `entrypoints/content.ts` 的 `matches` 配置自动生成 manifest 中的 `content_scripts` 条目。

由于使用 `<all_urls>` 匹配，这是一个 **权限扩展**，需要谨慎评估：
- 方案 A：使用 `<all_urls>`，自动在所有页面注入（用户感知小，但权限大）
- 方案 B：使用 `activeTab` + 手动注入，用户点击 Popup 后才激活（权限小，但需用户操作）

**建议方案 B**，符合最小权限原则。

#### Background 消息处理

在 `entrypoints/background.ts` 中新增消息分发：

```typescript
// 在 onMessage listener 的 switch 中增加
case 'clipboard':
  handleClipboardMessage(message, sendResponse)
  break
```

#### 新增依赖

无。

---

### （十）页面标尺/测量工具

#### 文件结构

```
components/page-ruler/
  PageRulerControl.vue      # Popup/Options 中的控制按钮
entrypoints/
  page-ruler.content.ts     # Content Script（测量工具注入）
  page-ruler.content/
    ruler.ts                # 标尺逻辑
    overlay.ts              # 覆盖层渲染
    measure.ts              # 测量计算
    styles.css              # 注入样式
types/
  pageRuler.ts              # 类型定义
```

#### 实现方案

1. **动态注入**：通过 `chrome.scripting.executeScript()` 在用户主动点击后注入
2. **Shadow DOM 隔离**：所有注入的 UI 元素放在 Shadow DOM 内，避免样式冲突
3. **事件监听**：
   - `mousemove`：元素高亮 + 尺寸标注
   - `click`：选中元素 / 开始测量
   - `keydown (ESC)`：退出测量模式
4. **DOM 查询**：`getBoundingClientRect()` + `getComputedStyle()`
5. **覆盖层**：使用绝对定位的 `<div>` 渲染高亮框、标注线、尺寸文字

#### 性能优化

```typescript
// 使用 requestAnimationFrame 节流 mousemove
let rafId: number | null = null
document.addEventListener('mousemove', (e) => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    updateHighlight(e.target as HTMLElement)
    rafId = null
  })
})
```

#### 复杂度说明

这是所有功能中实现复杂度最高的模块，建议放在最后阶段开发。核心难点：
- Shadow DOM 内的 UI 渲染和事件处理
- 复杂的坐标计算（滚动偏移、iframe、transform 等）
- 与页面原有事件的冲突处理

#### 新增依赖

无。

---

## 四、Options 页面导航扩展

### 当前导航结构

```
工具箱（Toolbox）
  ├── JSON 格式化
  ├── 时间戳转换（disabled）
  ├── 喝水提醒
  └── Markdown 编辑器
快捷入口（Quick Entry）
  └── 快捷书签
```

### 扩展后导航结构

```
开发工具（Dev Tools）
  ├── JSON 格式化
  ├── 时间戳转换
  ├── 编码/解码
  ├── 正则测试器
  ├── Diff 对比
  └── HTTP 状态码速查
生成工具（Generators）
  ├── UUID / 随机数据
  └── 颜色工具
效率工具（Productivity）
  ├── Markdown 编辑器
  ├── 代码片段管理
  └── 剪贴板历史
辅助功能（Utilities）
  ├── 喝水提醒
  ├── 快捷书签
  └── 页面标尺
```

### 导航注册方式

在 `entrypoints/options/App.vue` 的 `navItems` 数组中按上述结构添加新条目，每个条目需包含：

```typescript
interface NavItem {
  id: string
  label: string
  icon: string
  section: string
  disabled?: boolean
  badge?: string
}
```

---

## 五、Popup 面板扩展

### 当前 Popup 内容

- 工具列表（点击跳转 Options 页对应 Tab）
- 喝水提醒状态

### 扩展内容

- 新增工具入口（时间戳、编码解码、UUID 生成等高频工具）
- 剪贴板历史最近 5 条
- 页面标尺开关按钮
- 考虑 Popup 面板高度限制（最大 600px），工具过多时使用滚动

---

## 六、Background Service Worker 扩展

### 当前消息类型

```typescript
type MessageType = 'water'
```

### 扩展后消息类型

```typescript
type MessageType = 'water' | 'clipboard' | 'page-ruler'
```

### 新增消息处理

| 消息类型 | 功能 | 说明 |
|----------|------|------|
| `clipboard.copy` | 存储复制内容 | Content Script → Background → Storage |
| `page-ruler.toggle` | 开关测量模式 | Popup → Background → 注入/移除 Content Script |

### 右键菜单扩展

在 `background.ts` 的 `chrome.contextMenus.create` 中新增：

```typescript
// 现有
{ id: 'json-formatter', title: 'JSON 格式化' }
// 新增
{ id: 'timestamp-converter', title: '时间戳转换' }
{ id: 'encode-decode', title: '编码/解码' }
```

---

## 七、存储空间规划

### 各模块存储 Key

| 模块 | Storage Key | 预估大小 |
|------|-------------|----------|
| JSON 格式化 | `jsonConfig` | < 1KB |
| 喝水提醒 | `waterConfig`, `waterState` | < 1KB |
| 快捷书签 | `quickSites` | < 10KB |
| Markdown 笔记 | `markdownNotes` | < 2MB |
| 时间戳历史 | `timestampHistory` | < 5KB |
| 正则模板 | `regexTemplates` | < 10KB |
| 代码片段 | `snippets`, `snippetFolders` | < 2MB |
| 颜色收藏 | `colorPalettes` | < 10KB |
| 剪贴板历史 | `clipboardHistory` | < 500KB |

**总计**：预估 < 5MB，在 `chrome.storage.local` 的 10MB 默认限制内。

---

## 八、开发顺序建议

### 第一阶段：P0（基础工具补齐）

1. **时间戳转换器** — 已有需求文档和 UI 占位，最快可交付
2. **编码/解码工具** — 纯函数逻辑，无状态，实现快

### 第二阶段：P1（高价值工具）

3. **UUID / 随机数据生成器** — 无依赖，实现简单
4. **正则表达式测试器** — 逻辑稍复杂（高亮层），但价值高

### 第三阶段：P2（进阶功能）

5. **HTTP 状态码速查** — 纯静态数据，可穿插在任何阶段完成
6. **代码片段管理** — 复用 Prism.js，中等复杂度
7. **颜色工具** — Canvas 色板有一定复杂度
8. **Diff 对比工具** — 需引入 `diff` 库，中等复杂度

### 第四阶段：P3（高级功能）

9. **剪贴板历史** — 需要 Content Script，架构影响大
10. **页面标尺** — 最高复杂度，最后实现

---

## 九、注意事项

1. **无新框架引入**：除 Diff 工具可能引入 `diff` 库外，其他模块均使用浏览器原生 API
2. **遵循现有规范**：所有新模块必须遵循 `AGENTS.md` 中的代码风格、命名规范和架构约束
3. **类型检查**：每个模块完成后执行 `pnpm compile` 确保类型正确
4. **权限审慎**：剪贴板历史和页面标尺涉及权限扩展，需在开发前确认方案
5. **存储监控**：代码片段和剪贴板历史占用存储较大，需设置上限和清理机制
6. **组件隔离**：每个功能模块的组件、Store、类型文件独立维护，不交叉引用
