# 昭文馆 V2｜HS-FIRST-BATCH-5-RELEASE-INTEGRATION

任务 ID：`HS-FIRST-BATCH-5-RELEASE-INTEGRATION`
执行日期：2026-11-03（Asia/Shanghai）
结论：`READY_TO_DEPLOY`（仅候选就绪，等待负责人最终批准；未 commit、push、merge 或部署）

## 1. 基线与输入核对

| 项目 | 结果 |
|---|---|
| 最新 B2-3 发布候选基线 | 隔离候选工作区，HEAD `64bac49`；生产公开 manifest 13 条 |
| 隔离高中预览 | 隔离预览工作区；预览 manifest 5 条 |
| 本次候选 | 隔离整合工作区 |
| 网盘扫描 | 未执行；只读取既有 Registry/manifest，并对 5 个已给 Delivery 入口做逐条可达性检查 |
| 生产 manifest | 未覆盖；基线工作树和主工作区均未被本任务写入 |

基线 13 条记录逐条与候选比较，字段内容保持不变；预览 5 条逐条与候选比较，ID、标题、分类、状态、文件元数据和入口字段保持一致。

## 2. 候选变更清单

- `scripts/input/manifest.v1.source.fixture.json`：在原 26 条受控源记录上增加 5 条已批准高中记录；源记录共 31 条，公开投影保留 18 条，13 条历史 hold 继续省略。根级 `generatedAt` 更新为本批次验收时间，原 13 条记录字段未改。
- `scripts/b2-3-authorization-policy.ts`：为 5 条高中资源绑定私有 Registry 已登记的精确 Delivery ID 和公开 Resource/Delivery 授权策略；未写入 FID、来源路径或授权正文。
- `scripts/verify-b2-3-public-output.mjs`：公开批准 ID 白名单从原 13 条扩为 18 条，继续检查隐藏历史记录和内部字段不泄露。
- `scripts/verify-hs-first-batch-integration.mjs`：新增基线/隔离预览/整合候选三方核对，强制检查 13 条不变、5 条新增、ID 唯一、分类和公开入口格式。
- `scripts/b2-3-build-input.test.ts`、`src/publicManifest.test.ts`、`package.json`：同步 31/18 条候选输入、整合 manifest 分支和验证命令。
- 正式分类与必要 UI 修复随 B2-2 候选同步：`stage-senior → domain-senior-exams → exam-senior-gaokao`；分类测试已覆盖，分享按钮保留 44px 触控高度。未接入其他高中系列。
- 构建产物：`public/data/manifest.v1.json` 与 `dist/data/manifest.v1.json` 均为 18 条；`dist/b2-3-provenance.json` 已重新生成。

## 3. 候选公开清单结果

| 检查 | 结果 |
|---|---|
| 源记录数 | 31 |
| 公开记录数 | 18（原 13 + 新增 5） |
| 公开分享入口 | 18/18 |
| metadata-only | 0 |
| 隐藏历史记录 | 13，未进入 dist |
| 高中分类 | 5/5 为 `exam-senior-gaokao`，完整路径可解析 |
| 新增 ID 唯一性 | PASS |
| 原 13 条内容不变 | PASS |
| 隔离预览 5 条一致性 | PASS |

5 个入口逐条只读检查均返回 HTTP 200；这不是重新扫描网盘，且未输出入口地址到报告。

## 4. 验证结果

- 私有 Registry schema：4 个 Registry 文件全部 `ok=true`。
- 私有 Registry 交叉核对：5 Source、5 Resource、5 Delivery、10 Authorization；来源审核、分类、Resource/Delivery 授权、verified 和 `publicEligible` 均 PASS。
- 受影响测试：4 个测试文件、55/55 PASS。
- 全量测试：42 个测试文件、818/818 PASS。
- `npm run build`：PASS；`sourceRecords=31`、`publicRecords=18`、`omitted=13`。
- `npm run verify:b2-3:public -- dist`：PASS；18 条公开、13 条历史记录隐藏。
- `npm run verify:pages -- dist`：PASS；最终 manifest SHA-256 为 `5e38d7913500423b59627a140fc94d5949589e70cfa7a3705cc05b5daa186885`。
- `npm run verify:pages:fallback -- dist`：PASS，120/120。
- `npm run verify`：PASS；PDF 文本与 skip-cover 矩阵通过。
- `npm run verify:a33a`：PASS，5/5。
- `npm run lint`：退出码 0；仅保留基线已有 3 条 warning，无本次新增 warning。

## 5. 发布风险与停止边界

1. 分享入口可达性是验收时点事实；若负责人延迟发布，建议在最终发布前按同一 5 条入口再核验一次。
2. 私有 Registry 中资源仍保持候选阶段的 `publicationStatus=draft`；本任务只生成发布候选，不执行最终发布状态迁移。
3. Vite 仍提示既有大 chunk warning；不影响本次门禁，但可作为后续性能优化项。
4. 未执行 commit、push、merge、部署，也未覆盖任何生产 manifest；候选目录已完成后停止，等待负责人最终批准。
