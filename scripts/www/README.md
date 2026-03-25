# 小众测评 - 前端

## 📁 文件结构

```
frontend/
├── css/
│   ├── variables.css      # 主题色变量（亮色/暗黑模式）
│   ├── common.css         # 全局基础样式（重置、手机框架、Toast、按钮等）
│   └── review-page.css    # 测评子页面共享样式（表格、模态框、表单、评分等）
├── js/
│   ├── utils.js           # 工具库（防抖、节流、Toast、主题管理、图片懒加载、Storage）
│   ├── api.js             # API 统一封装（CONFIG 自动检测、request/get/post、API 对象）
│   ├── image-zoom.js      # 图片点击放大预览
│   └── review-common.js   # 测评页面共享逻辑模块（ReviewCommon）
├── index.html             # 首页（分类入口、社区测评预览、版本信息）
├── milk-tea.html          # 奶茶测评页（含品牌筛选）
├── convenience.html       # 美食测评页
└── travel.html            # 出行交通测评页（交通工具/酒店双类型）
```

## 🏗️ 架构设计

### CSS 分层

| 文件 | 职责 | 引用页面 |
|------|------|----------|
| `variables.css` | CSS 自定义属性，亮色/暗黑模式主题色 | 全部页面 |
| `common.css` | 全局重置、手机框架、导航栏、Toast、按钮、懒加载 | 全部页面 |
| `review-page.css` | 搜索栏、表格、模态框、表单、评分、状态徽章、排序下拉、图片相关 | milk-tea / convenience / travel |

### JS 模块

| 文件 | 职责 | 暴露接口 |
|------|------|----------|
| `utils.js` | 防抖、节流、Toast、ThemeManager、ImageLoader、Storage、UserManager | 全局函数和对象 |
| `api.js` | 自动检测后端地址、统一请求封装、API 命名空间 | `window.CONFIG`、`API`、`request/get/post/del` |
| `image-zoom.js` | 图片点击放大浮层 | `initImageZoom()` |
| `review-common.js` | 测评页面共享逻辑 | `ReviewCommon` 对象 |

### ReviewCommon 模块

`review-common.js` 导出的 `ReviewCommon` 对象包含以下方法：

```javascript
ReviewCommon = {
    // 评分
    formatRating(value)          // 格式化评分显示（null → '0'）
    getRatingClass(value)        // 获取评分 CSS 类名（rating-high/medium/low/zero）
    isValidRating(value)         // 校验评分是否在 1-10 范围

    // 图片
    normalizeImageUrl(url)       // 标准化图片 URL（相对路径 → 完整 URL）
    normalizeImageList(value)    // 解析图片列表（JSON 字符串/数组/单个 URL）
    deleteUploadedImages(urls)   // 调用后端删除已上传图片
    createImageManager(el, input)// 创建图片预览管理器（增删渲染）
    bindImageUpload(...)         // 绑定上传/清空按钮事件
    buildImageHtml(list)         // 生成详情页图片 HTML
    bindDetailImages(selector)   // 绑定详情图片加载/失败处理

    // UI 组件
    updateStatus(...)            // 更新连接状态徽章
    initRatingSelector(el, input)// 初始化 1-10 评分选择器，返回 { setRating }
    initSortDropdown(...)        // 初始化排序下拉菜单
    bindModalClose(modal, fn)    // 绑定模态框背景点击关闭（防拖拽误触）
    bindSearch(input, onSearch, onClear) // 绑定搜索输入防抖

    // 工具
    sortData(data, mode, ratingField, timeField) // 排序数据
    getNameClass(name)           // 名称长度 > 5 字返回 cell-name-long
    BASE_URL                     // API 基础地址
    UPLOAD_URL                   // 上传文件基础地址
}
```

## 📄 页面说明

### index.html（首页）
- 用户问候、登录按钮
- 三个分类入口卡片（奶茶、出行交通、美食）
- 社区最新测评预览（并行请求三个 API，取最新 3 条）
- 版本信息显示（带 sessionStorage 缓存）
- 暗黑模式切换
- 独立样式和逻辑，不依赖 `review-page.css` / `review-common.js`

### milk-tea.html（奶茶测评）
- 搜索 + 新增
- 品牌筛选下拉（页面特有功能）
- 评分排序下拉
- 表格列表 → 点击查看详情 → 编辑/删除
- 字段：店铺名、商品名、配置、上传者、评分、备注、测评图片

### convenience.html（美食测评）
- 搜索 + 新增
- 评分排序下拉
- 表格列表 → 点击查看详情 → 编辑/删除
- 字段：商品名称、商店、上传者、评分、测评内容、测评图片

### travel.html（出行交通测评）
- 搜索 + 新增
- 交通工具/酒店类型切换（页面特有功能）
- 表格列表 → 点击查看详情 → 编辑/删除
- 交通工具字段：线路、公司、配置及价格、测评人、评分、备注、测评图片
- 酒店字段：酒店名、房型及价格、测评人、评分、备注、测评图片

## 🎨 主题系统

通过 `variables.css` 定义 CSS 自定义属性，支持亮色和暗黑两种模式：

```css
:root { /* 亮色模式 */ }
html.dark-mode { /* 暗黑模式 */ }
```

`ThemeManager`（utils.js）负责切换和持久化（localStorage）。

## 📡 API 调用方式

页面中统一使用 `api.js` 封装的方法：

```javascript
// 查询
const result = await API.shop.query({ keyword: '霸王' });

// 新增/修改/删除
const result = await post('/convenience/update', { 商品名称: '饭团', ... });

// 结果处理
if (result.success) {
    Toast.success('操作成功');
} else {
    Toast.error(result.error);
}
```

`window.CONFIG` 会根据当前访问协议和域名自动检测后端地址。

## 📊 优化记录

### 2026-03-25 前端模块化重构

将三个测评子页面（milk-tea / convenience / travel）的重复代码抽取为共享模块：

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| convenience.html | 1960 行 | 350 行 |
| milk-tea.html | 2141 行 | 444 行 |
| travel.html | 1925 行 | 406 行 |
| 三页面合计 | 6026 行 | 1200 行 |
| 新增共享 CSS | - | review-page.css (705 行) |
| 新增共享 JS | - | review-common.js (291 行) |
| 总代码量 | 6026 行 | 2196 行 (减少 64%) |

主要改动：
- 重复 CSS（~800 行/页）抽取到 `review-page.css`
- 重复 JS 工具函数抽取到 `review-common.js` 的 `ReviewCommon` 模块
- `alert()` 全部替换为 `Toast` 组件
- 搜索改用 `debounce` 函数
- API 调用改用 `api.js` 封装的 `API` 对象和 `post/get`

### 2026-02-24 初始优化

- 提取主题变量到 `variables.css`
- 提取公共样式到 `common.css`
- 创建 `utils.js` 工具库
- 创建 `api.js` API 封装

**更新**：2026年3月25日
