# 昭文馆 V2｜B2-3 本地公开构建产物检查

结论：`PASS_WITH_HISTORICAL_HOLDS`

## 构建结果

| 检查 | 结果 |
|---|---|
| 构建前授权投影 | `PASS`；源记录 26，公开记录 13，省略 13 |
| 公开 JSON 内部字段检查 | `PASS`；无 `deliveryId`、evidence、授权范围或私有审核字段 |
| 未授权 Resource ID 泄露检查 | `PASS`；13 条历史 hold 记录未进入构建产物 |
| 未授权分享入口泄露检查 | `PASS`；被省略记录的链接未出现在 `dist/` |
| metadata-only 结构 | `PASS`；无链接时不带 `passcode`；合成路径由单元测试覆盖 |
| Pages artifact gate | `PASS` |
| `npm run lint` | `PASS`；仅既有 3 条 warning |
| `git diff --check` | `PASS` |

## 本地产物统计

- `dist/data/manifest.v1.json`：13 条公开记录。
- 暴露分享入口：13 条。
- metadata-only 历史记录：0 条。
- 被 fail-closed 省略的历史记录：13 条。
- manifest SHA-256：`01092bd0ae8ffd44bc03ccc7a3ac6f1e58eb41687a61dd9cc56f2655875a33ef`。
- artifact content SHA-256：`5141cb8a973277530b44804c13bd13a88b83480b473972a10390595b20110c4a`。

本报告只记录数量、状态和摘要哈希，不记录分享 URL、提取码、FID 或私有授权内容。
