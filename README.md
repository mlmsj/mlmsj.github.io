# 昭文馆 V2

昭文馆 V2 是一个面向学习者的静态学习资源目录与浏览器本地工具箱。它将公开资料目录、学习工具和仅保存在当前浏览器中的个人偏好放在同一个项目中，当前发布候选面向 GitHub Pages 项目站点。

## 当前已开放内容

- 公开资料目录的浏览、搜索、分类和详情页面；当前发布 manifest 只描述公开目录，不代表本站提供资料文件获取。
- 15 个学生工具箱入口，按页面说明在浏览器本地处理所选文件；具体格式、大小和兼容性以对应工具页面为准。
- 收藏、最近浏览、下载发起记录和常用工具等“我的”数据保存在当前浏览器，不自动跨设备同步。
- React、TypeScript、Vite、Tailwind CSS、Vitest 和 Oxlint 技术栈；PDF、字体和 OCR 运行时资源按各自目录中的说明使用。

## GitHub Pages

生产构建与开发服务器均使用根路径 `/` 作为 Pages base path。静态站点依赖 `index.html`、`404.html` 和构建后的 `dist/`，不依赖公开 Pages 上的后端服务。正式部署仍需在远端仓库中完成人工审查和 Pages 配置；本地构建通过不等于远端部署或浏览器验收已经完成。

## 当前限制与维护边界

- 资料文件不由本站托管；manifest 仅在记录允许时提供外部分享入口，外部链接可用性不由本站保证。目录展示或打开第三方入口不等于本站授予文件下载、转存或再分发许可。
- 在线反馈表单、反馈接收接口和反馈存储当前未配置，不会伪装成提交成功。
- 学生工具箱当前按浏览器本地处理设计；若未来某工具增加上传、服务器处理或第三方服务，会在启用前另行说明。
- 公开站点不承诺第三方链接持续可用、特定处理结果适合所有用途或任何服务级别。资料纠错、版权投诉和功能问题需要人工查看后处理。

## 项目联系渠道

公开项目联系邮箱由 [`src/publicContact.ts`](src/publicContact.ts) 统一配置，用于问题咨询、资料纠错、版权投诉和普通建议。它是公开联系渠道，不是登录入口；项目不读取邮箱账户、不要求邮箱密码，也不通过本站自动发送邮件。请不要在联系内容中提供密码、身份证号、Cookie、令牌等敏感信息。

## 图片资产 provenance

项目方已明确授权三张项目 PNG 由 Codex 制作完成；当前生产 hero 文件 `src/assets/zhaowenguan-hero-watercolor.png` 按该授权陈述作为三张 PNG 中的实际生产文件处理。本候选的文件用途、SHA-256 和当前权利边界记录在 remediation evidence 中。该授权记录不虚构任何第三方模型服务条款，也不宣称不存在第三方权利问题。

候选中已确认没有任何 tracked 引用的 Vite/React 模板 SVG 和公共目录中的未引用 `public/icons.svg` 已移除；固定来源中的原始文件和哈希证据仍保留在外部审查记录中。`public/favicon.svg` 仍被 `index.html` 引用，按项目方“网站由我们自己搓的”这一明确陈述作为项目自制界面图形处理，不再要求额外图片证明。

## 许可证与第三方资产

除单独文件或第三方声明另有规定外，本项目及其原创源码、图片和其他原创材料保留全部权利。本仓库未授予一般复制、修改或再分发许可，也未采用项目级开源许可证。

第三方 OCR 运行时资源的 Apache 许可证、NOTICE 和来源说明见 [`public/ocr/tesseract/LICENSE`](public/ocr/tesseract/LICENSE)、[`public/ocr/tesseract/NOTICE`](public/ocr/tesseract/NOTICE) 和 [`public/ocr/tesseract/README.md`](public/ocr/tesseract/README.md)。字体及其 SIL Open Font License 1.1 全文见 [`public/fonts/README.md`](public/fonts/README.md) 和 [`public/fonts/NotoSansSC-OFL-1.1.txt`](public/fonts/NotoSansSC-OFL-1.1.txt)。这些第三方许可只适用于相应第三方资产，不扩展到项目自有源码或图片。

## 旧服务兼容边界

`src/legacyPublicCatalog.ts` 是保留的本地/服务模式兼容适配器，`vite.config.ts` 中的 `/api/public` 代理只面向本机开发服务 `127.0.0.1:3001`。它们没有被静态 Pages 生产入口导入，也不会随本候选的生产 bundle 成为资料目录数据源。公开静态站点使用本地构建的目录 manifest；旧适配器和开发代理不代表远端公开服务已经存在。
