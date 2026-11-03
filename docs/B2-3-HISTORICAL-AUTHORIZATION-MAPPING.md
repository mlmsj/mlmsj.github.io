# 昭文馆 V2｜B2-3 历史授权映射与公开影响预览

状态：`LOCAL_FAIL_CLOSED_CANDIDATE`

## 证据边界

- 源 manifest：`scripts/input/manifest.v1.source.json`，只作为本地构建输入；不进入 `dist/`。
- 授权依据：`docs/OWNER-AUTHORIZATION-20261101.md`、`docs/UNIVERSITY-FIRST-BATCH-AUTHORIZATION.md`、`docs/UNIVERSITY-FIRST-BATCH-CANDIDATES.md`。
- 既有候选身份/访问交叉证据：`D:\Zhaowenguan-Imports\UNIVERSITY-BULK-PUBLISH-1-20261029\CANDIDATE-REPORT.md`；本轮不重新访问网盘。
- v1 manifest 没有原始 `deliveryId`。本地为 13 条获批准独立记录建立 `v1-primary:<resourceId>` 兼容身份；它不是 URL、FID、提取码或原始网盘标识。
- 访问 `verified`、历史 `published` 和分享可达性均未被当作授权依据。

## 汇总

| 项目 | 数量 | 处理 |
|---|---:|---|
| 历史源记录 | 26 | 全部逐条核对 |
| Resource/Delivery 授权证据充分 | 13 | 保留稳定 Resource ID、分类和原分享入口 |
| 证据不足、范围待确认或无法精确匹配 | 13 | 默认不进入公开输出 |
| 当前 26 条中可直接标为明确排除的独立 Resource | 0 | UFB-010/UFB-014 没有独立 Resource ID |
| 源候选层面的明确排除项 | 2 | UFB-010、UFB-014；对应聚合入口仍按未匹配处理 |
| 本地安全公开记录 | 13 | 13 条均通过链接门禁；metadata-only 当前为 0 |

## 逐条映射

“公开结果”只表示本地投影结果，不代表已经提交、推送或部署。

| # | 稳定 Resource ID | UFB | 授权结论 | Delivery ID | 公开结果 | 差异/理由 |
|---:|---|---|---|---|---|---|
| 1 | `university-series-001` | — | 证据不足 | 未激活 | 省略 | 历史聚合入口，授权文档未建立该 Resource/Delivery 的精确证据 |
| 2 | `university-topic-math-001` | — | 证据不足 | 未激活 | 省略 | 历史聚合入口，无该稳定 ID 的精确授权证据 |
| 3 | `university-topic-professional-courses-001` | — | 证据不足 | 未激活 | 省略 | 历史聚合入口，无该稳定 ID 的精确授权证据 |
| 4 | `university-topic-textbooks-001` | — | 证据不足 | 未激活 | 省略 | 历史聚合入口，无该稳定 ID 的精确授权证据 |
| 5 | `university-topic-review-001` | — | 证据不足 | 未激活 | 省略 | 历史聚合入口，无该稳定 ID 的精确授权证据 |
| 6 | `university-topic-ideology-001` | — | 证据不足 | 未激活 | 省略 | 历史聚合入口，无该稳定 ID 的精确授权证据 |
| 7 | `university-topic-cet-001` | — | 证据不足 | 未激活 | 省略 | 历史聚合入口，无该稳定 ID 的精确授权证据 |
| 8 | `university-topic-ielts-001` | — | 证据不足 | 未激活 | 省略 | 历史聚合入口，无该稳定 ID 的精确授权证据 |
| 9 | `university-topic-computer-001` | UFB-010 | 证据不足/独立项排除 | 未激活 | 省略 | UFB-010 仅明确不建立独立公开项；不能反推该聚合 Resource 获得授权 |
| 10 | `university-topic-postgrad-001` | — | 证据不足 | 未激活 | 省略 | 历史聚合入口，无该稳定 ID 的精确授权证据 |
| 11 | `university-topic-career-001` | — | 证据不足 | 未激活 | 省略 | 历史聚合入口，无该稳定 ID 的精确授权证据 |
| 12 | `university-topic-competition-001` | — | 证据不足 | 未激活 | 省略 | 历史聚合入口，无该稳定 ID 的精确授权证据 |
| 13 | `university-quark-math-advanced-001` | UFB-001 | 充分 | `v1-primary:university-quark-math-advanced-001` | 元数据+链接 | Resource/Delivery 授权依据为负责人授权记录及 UFB 映射 |
| 14 | `university-quark-linear-algebra-001` | UFB-002 | 充分 | `v1-primary:university-quark-linear-algebra-001` | 元数据+链接 | 同名来源不合并，当前稳定 Resource 单独绑定 |
| 15 | `university-quark-probability-textbook-001` | UFB-003 | 充分 | `v1-primary:university-quark-probability-textbook-001` | 元数据+链接 | Resource/Delivery 授权依据为负责人授权记录及 UFB 映射 |
| 16 | `university-quark-probability-review-001` | UFB-004 | 充分 | `v1-primary:university-quark-probability-review-001` | 元数据+链接 | 保持原来源主归属，不因标题复制分类 |
| 17 | `university-quark-mathematical-analysis-001` | UFB-005 | 充分 | `v1-primary:university-quark-mathematical-analysis-001` | 元数据+链接 | Resource/Delivery 授权依据为负责人授权记录及 UFB 映射 |
| 18 | `university-quark-calculus-001` | UFB-006 | 充分 | `v1-primary:university-quark-calculus-001` | 元数据+链接 | 与高等数学保持不同稳定 Resource ID |
| 19 | `university-quark-ideology-marxism-001` | UFB-007 | 充分 | `v1-primary:university-quark-ideology-marxism-001` | 元数据+链接 | Resource/Delivery 授权依据为负责人授权记录及 UFB 映射 |
| 20 | `university-quark-cet4-001` | UFB-008 | 充分 | `v1-primary:university-quark-cet4-001` | 元数据+链接 | 只保留四级候选的既有分类/身份 |
| 21 | `university-quark-ielts-001` | UFB-009 | 充分 | `v1-primary:university-quark-ielts-001` | 元数据+链接 | Resource/Delivery 授权依据为负责人授权记录及 UFB 映射 |
| 22 | `university-quark-postgrad-001` | UFB-011 | 充分 | `v1-primary:university-quark-postgrad-001` | 元数据+链接 | 不把标题中的“27”解释为额外年份状态 |
| 23 | `university-quark-career-ppt-001` | UFB-012 | 充分 | `v1-primary:university-quark-career-ppt-001` | 元数据+链接 | Resource/Delivery 授权依据为负责人授权记录及 UFB 映射 |
| 24 | `university-quark-resume-templates-001` | UFB-013 | 充分 | `v1-primary:university-quark-resume-templates-001` | 元数据+链接 | 保持规划主归属，不自动扩展到证明域 |
| 25 | `university-quark-biochemistry-001` | UFB-015 | 充分 | `v1-primary:university-quark-biochemistry-001` | 元数据+链接 | 保留专业课域级现有分类，不发明叶子 ID |
| 26 | `university-quark-english-contest-001` | UFB-016 | 范围待确认 | 未激活 | 省略 | 权利授权已记录，但 strict-v2 来源范围仍为 `HOLD_OWNER_SCOPE` |

## 公开影响预览

- 构建输入：26 条。
- 安全公开 manifest：13 条；13 条都保留原稳定 ID、分类和原 `shareUrl` 字段值。
- 被省略：13 条历史记录；它们仍保留在本地源输入和本报告中，未修改正式生产数据。
- 当前没有需要输出 metadata-only 的历史记录；该路径由单元测试覆盖。
- 授权证据、`deliveryId`、审核状态和私有引用不会写入公开 JSON。
- UFB-010/UFB-014 的“明确排除”仅适用于独立候选；本报告没有把它扩大解释为撤销聚合入口授权。
