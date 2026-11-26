# 学习资料目录与本地学习工具箱

> 整理知识，让学习更简单。

本项目是一个面向学生与自学者的静态学习资料目录与浏览器本地学习工具箱。无需注册登录，打开即用。

- **在线访问**：[https://mlmsj.github.io/](https://mlmsj.github.io/)

---

## 核心功能

### 1. 学习资料目录
- **多阶段分类浏览**：覆盖初中、高中、大学、考研、考证及技能成长专区，支持按阶段、学科与专题目录逐级查找。
- **课程专题索引**：提供初中网课、高中网课（2027 课程索引）与考研网课专题页，支持按年级、学科、老师或机构快速检索。
- **公开清单驱动**：展示经过人工整理与核验的网盘分享入口（夸克 / 百度网盘），清晰标注访问状态与渠道信息。

### 2. 15 项本地学习工具
所有工具均在**浏览器本地处理**，所选图片与 PDF 文件不会上传至服务器：

| 类别 | 工具 |
| --- | --- |
| **打印排版** | PDF 拼版打印、打印页面调整、图片批量排版、PDF 页面整理 |
| **PDF 处理** | PDF 合并、PDF 拆分、PDF 压缩、图片转 PDF、PDF 转图片、PDF 添加页码、PDF 添加文字水印 |
| **图片与识别** | 图片压缩、图片格式转换、图片尺寸调整、OCR 文字识别 |

### 3. 本地个人学习空间（「我的」）
- 无需账号，自动在当前浏览器保存**我的收藏**、**最近浏览**与**常用工具**。
- 支持一键导出 / 导入 JSON 备份文件，以及按类别清理本地数据。

---

## 技术栈

- **前端框架**：React 19 + TypeScript + Vite 8 + Tailwind CSS 4
- **本地处理引擎**：`pdf-lib`、`pdfjs-dist`、`jszip`、`tesseract.js`
- **测试与校验**：Vitest + Testing Library + Oxlint
- **部署方式**：纯静态站点，通过 GitHub Pages 根路径 `/` 发布

---

## 本地开发与验证

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行全量单元测试
npm test

# 构建生产包（生成公开 manifest、类型检查、Vite 打包与 provenance 校验）
npm run build

# 本地预览生产包
npm run preview

# 运行 GitHub Pages 产物与路由回退门禁校验
npm run verify:pages
npm run verify:pages:fallback
```

---

## 使用边界与联系渠道

- **外链边界**：本站仅提供学习资料目录索引与第三方网盘公开分享入口，不托管资料文件本身，也不保证第三方链接持续有效。打开外部链接不代表本站授予下载、转存或再分发许可。
- **隐私与本地数据**：学习工具处理的文件和「我的」个人记录均仅保留在当前浏览器本地，不会自动跨设备同步；清理浏览器站点数据可能会导致本地记录丢失。在线反馈提交接口目前未配置。
- **联系与纠错**：如遇链接失效、资料纠错、版权反馈或功能建议，请通过 [`src/publicContact.ts`](src/publicContact.ts) 中公布的公开联系邮箱与我们联系（请勿在邮件中附带密码、身份证号等敏感信息）。

---

## 版权与第三方许可

- 除另有说明外，本项目原创源码、界面设计与原创图片资产保留全部权利，未采用项目级开源许可证，不授予一般性的复制、修改或再分发许可。
- **第三方 OCR 运行时**（Apache-2.0）：见 [`public/ocr/tesseract/LICENSE`](public/ocr/tesseract/LICENSE)、[`public/ocr/tesseract/NOTICE`](public/ocr/tesseract/NOTICE) 与 [`public/ocr/tesseract/README.md`](public/ocr/tesseract/README.md)。
- **第三方字体**（SIL Open Font License 1.1）：见 [`public/fonts/README.md`](public/fonts/README.md) 与 [`public/fonts/NotoSansSC-OFL-1.1.txt`](public/fonts/NotoSansSC-OFL-1.1.txt)。
