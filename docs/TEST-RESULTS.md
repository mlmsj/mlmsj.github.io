# 测试结果

执行目录：`D:\Zhaowenguan-Imports\ZWG-MY-PAGE-REFINEMENT-20261110`

| 检查 | 结果 |
| --- | --- |
| 高中课程、教师与关键词定向测试 | 通过：2 files / 6 tests |
| 全量 Vitest | 通过：50 files / 862 tests |
| ESLint | 通过；保留 3 条既有 warning，未新增 error |
| TypeScript `npx tsc -b` | 通过 |
| Vite `npm run build` | 通过 |
| public manifest 校验 | 通过：`sourceRecords=189 publicRecords=175 exposedLinks=175 metadataOnly=0 omitted=14` |
| provenance 校验 | 通过；manifest SHA 已输出并校验 |
| PC 浏览器预览 | 通过：首页与教师列表截图已留档 |
| 移动端浏览器预览 | 通过；设备视口 `412px`，页面 `scrollWidth=412px` |

ESLint warning 为既有脚本未使用变量和既有组件导出规则提示，不影响本轮构建和测试。

