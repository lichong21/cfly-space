# AGENTS.md — CFly Space 开发规范

## 项目概述

CFly Space 是一款基于 **WXT + Vue 3 + TypeScript + Pinia + UnoCSS** 的浏览器扩展插件（Manifest V3），提供 JSON 格式化、时间戳转换、喝水提醒三大功能模块，支持 Chrome / Edge（Chromium 内核）。

---

## 目录结构

```
entrypoints/
  background.ts       # Service Worker（MV3），处理 alarms / notifications / messages
  popup/              # 弹出面板（App.vue + main.ts + index.html）
  options/            # 选项页面（App.vue + main.ts + index.html）
components/           # 业务组件（JsonFormatter.vue, WaterReminder.vue, TabBar.vue …）
composables/          # 可复用逻辑（useJsonFormatter.ts, useCopy.ts …）
stores/               # Pinia store（json.ts, water.ts）
types/                # 全局类型定义（index.ts, water.ts）
assets/               # 静态资源（全局 CSS 等）
public/               # 扩展静态文件（icon 等）
uno.config.ts         # UnoCSS 配置
wxt.config.ts         # WXT 构建配置
```

---

## 构建 / 开发命令

```bash
# 安装依赖（使用 pnpm）
pnpm install

# 开发模式（Chrome，支持 HMR）
pnpm dev

# 开发模式（Firefox）
pnpm dev:firefox

# 生产构建（Chrome，输出到 dist/）
pnpm build

# 生产构建（Firefox）
pnpm build:firefox

# 打包为 zip（Chrome Web Store 上传）
pnpm zip

# 打包为 zip（Firefox）
pnpm zip:firefox

# TypeScript 类型检查（不输出文件）
pnpm compile
```

> **无测试框架**：当前项目不包含单元测试或 E2E 测试。功能验证通过 `pnpm compile`（类型检查）+ 在浏览器中手动加载扩展进行。

### 类型检查（等同于 lint）

```bash
pnpm compile   # vue-tsc --noEmit，检查所有 .vue / .ts 文件的类型错误
```

---

## 技术约束（重要）

- **MV3 Service Worker**：background.ts 在空闲约 30 秒后会被浏览器回收，**禁止**使用 `setInterval` / `setTimeout` 实现持久定时任务，必须使用 `chrome.alarms` API。
- **最小权限**：`manifest.permissions` 仅含 `storage`、`alarms`、`notifications`，新增功能不得随意扩展权限。
- **本地存储**：所有数据只能存储在 `chrome.storage.local`，不得发起任何网络请求收集用户数据。
- **WXT 全局 API**：`defineBackground()`、`browser` 等由 WXT 注入，无需显式导入。`chrome` 对象同样可直接使用。

---

## 代码风格规范

### TypeScript / JavaScript

- **严格模式**：所有文件使用 TypeScript，必须为函数参数、返回值和变量提供明确类型，避免 `any`。
- **类型导入**：使用 `import type { ... }` 导入纯类型，与值导入分开：
  ```ts
  import type { WaterConfig, WaterState } from '@/types/water';
  import { DEFAULT_WATER_CONFIG } from '@/types/water';
  ```
- **路径别名**：统一使用 `@/` 代替相对路径（`@/` 映射到项目根目录），WXT 自动处理解析。
- **常量命名**：模块级别的魔法字符串提取为 `SCREAMING_SNAKE_CASE` 常量：
  ```ts
  const STORAGE_KEY_CONFIG = 'waterConfig';
  const ALARM_NAME = 'water-reminder';
  ```
- **函数命名**：普通函数使用 `camelCase`；异步函数显式标注 `async`。
- **类型断言**：优先使用 `as Type` 而非 `<Type>`，仅在确信类型时使用。
- **错误处理**：`catch` 块中如果不需要错误对象，使用空 `catch {}`；如需访问则用 `catch (e) { const err = e as SpecificError; }`。
- **可选链**：使用 `?.` 和 `??` 代替多层 `if` 判断。

### Vue 3 组件

- **组件文件**：使用 `<script lang="ts" setup>` + Composition API，禁止使用 Options API。
- **模板**：单文件组件（SFC）结构顺序：`<script>` → `<template>` → `<style>`。
- **Props 类型**：通过 `defineProps<{...}>()` 声明，不使用运行时验证语法。
- **Emits**：通过 `defineEmits<{...}>()` 声明。
- **响应式**：
  - 原始值用 `ref()`；
  - 对象/数组优先用 `ref()`（store 中）或 `reactive()`（局部状态）；
  - 派生值用 `computed()`。
- **事件处理器**：以 `handle` 前缀命名（`handleFormat`, `handleCopy`）。
- **模板中的条件**：使用 `v-if` / `v-else-if` / `v-else`，不使用 `v-show`（除非有明确性能需求）。
- **列表渲染**：`v-for` 必须配合 `:key`，key 优先使用业务 ID 或唯一字段。
- **样式**：所有组件样式使用 `<style scoped>`，避免全局污染。颜色值统一使用十六进制，主色调为 `#667eea` / `#764ba2`（渐变色）。

### 样式（CSS / UnoCSS）

- **UnoCSS**：在 `.vue` 模板中优先使用原子类（`presetUno`）；组件内部自定义样式写在 `<style scoped>` 中。
- **命名规范**：scoped CSS 类名使用 `kebab-case`，语义明确（`.toolbar-group`, `.error-bar`, `.pane-header`）。
- **布局**：以 Flexbox 为主，避免使用绝对定位，除非是 overlay/tooltip 场景。
- **过渡动画**：简单交互使用 `transition: all 0.15s`；关键状态变化可使用 `@keyframes`。

### Pinia Store

- **命名**：store 文件名为功能名（`json.ts`, `water.ts`），导出函数以 `use` + 大驼峰 + `Store` 命名（`useJsonStore`, `useWaterStore`）。
- **结构**：使用 **Setup Store** 风格（函数式，不使用 Options Store）。
- **持久化**：通过 `watch` 监听 ref 变化，手动同步到 `chrome.storage.local`；读取在 store 初始化时完成，需判断 `typeof chrome !== 'undefined'`。
- **Chrome 环境检查**：访问 `chrome.*` API 前必须检查 `typeof chrome !== 'undefined' && chrome.storage`，以兼容非扩展环境（如开发调试）。

### 类型定义

- 所有共享接口和类型放在 `types/` 目录，业务实体单独文件（`types/water.ts`），通用类型放 `types/index.ts`。
- 常量默认值（`DEFAULT_*`）与类型定义放在同一文件，便于引用。
- 优先使用 `interface` 定义对象形状，使用 `type` 定义联合类型 / 别名：
  ```ts
  export type IndentType = '2' | '4' | 'tab';
  export interface JsonValidationError { message: string; line: number; column: number; }
  ```

### Composables

- 文件名以 `use` 开头，采用 `camelCase`（`useCopy.ts`, `useJsonFormatter.ts`）。
- 无状态工具函数直接 `export function`（不包裹在 `use*` 函数内）：
  ```ts
  export function formatJson(input: string, indent: IndentType = '2'): string { ... }
  ```
- 有状态的（含 `ref`/`reactive`）包裹在 `export function useFoo()` 中返回。

### 消息通信（Background ↔ UI）

- 所有 `chrome.runtime.sendMessage` 调用必须提供强类型的消息对象（遵循 `WaterMessage` 接口模式）：
  ```ts
  interface WaterMessage { type: 'water'; action: WaterMessageAction; payload?: { ... }; }
  ```
- `chrome.runtime.onMessage.addListener` 回调中，返回 `true` 以保持异步响应通道开启。
- 消息处理使用 `switch` 分发，每个 `case` 块独立处理。

---

## 错误处理规范

- **JSON 解析**：通过 `validateJson()` 先校验，成功后再 `JSON.parse()`，不在正式流程中 try/catch JSON.parse。
- **Chrome API**：`chrome.runtime.sendMessage` 返回 Promise，使用 `.catch(() => { /* background not ready */ })` 静默处理。
- **async/await**：Store 和 background 中的异步操作使用 `try/catch` 包裹，catch 块至少写注释说明原因。
- **类型收窄**：`catch (e)` 后显式 `as SyntaxError` 或 `as Error` 再访问 `.message`。

---

## 注释规范

- 代码块功能分区使用 `// ---- Section Name ----` 注释（见 background.ts 风格）。
- 技术决策或非显而易见的逻辑写行内注释（中文），如：`// 跨天重置` / `// keep message channel open for async response`。
- 类型字段注释用行内 `// 说明（默认值）` 格式（见 `types/water.ts`）。
- 不写无意义的注释（如 `// 返回结果` 这类重复代码的注释）。

---

## 新增功能指南

1. **新增工具模块**：在 `components/` 创建 `<ToolName>.vue`，在 `stores/` 添加对应 store，在 `types/` 添加类型定义，最后在 `entrypoints/options/App.vue` 的 `navItems` 中注册导航项。
2. **新增 composable**：在 `composables/` 创建 `use<Name>.ts`，无状态工具函数直接具名导出。
3. **新增 Chrome API 权限**：需先评估必要性，在 `wxt.config.ts` 的 `manifest.permissions` 中添加，并在 `prd.md` 权限清单中说明用途。
4. **Background 新增消息类型**：在 `types/` 扩展消息联合类型，在 background.ts 的 `switch` 中添加 `case`，同时在 store 中添加对应 `sendMessage` 调用。
