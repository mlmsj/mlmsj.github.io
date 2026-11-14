# 路由与入口验收

## Canonical route

高中网课统一使用：

```text
/high-school/courses
```

年级和学科通过查询参数保持可分享深链，例如：

```text
/high-school/courses?grade=高三&subject=数学
```

页面使用现有 `BASE_URL` 适配方式，部署到 GitHub Pages 子路径时不依赖根路径硬编码。

## 两个入口

- 分类页：`高中 → 网课` 直接进入 canonical route。
- 找资料页：选择 `高中 → 网课` 后进入同一 canonical route。

两处入口复用同一课程索引、教师分组、页面组件和查询状态。刷新、深链、浏览器前进和后退由现有路由状态机制处理。

首页搜索也复用同一高中搜索适配层：教师、学科和正式网课资源关键词进入 `/high-school/courses?grade=...&subject=...&q=...`；普通关键词继续进入通用 `/resources?q=...`。

## 验收结果

- 分类入口：通过。
- 找资料入口：通过。
- 学科切换与教师列表：通过。
- 教师分享链接 href：通过，指向真实已创建的夸克公开分享链接。
- GitHub Pages 子路径构建检查：通过。

