# 昭文馆 V2｜TREE-B2-1 大学首批上架准备状态

状态：`OWNER_AUTHORIZED_RELEASE_CANDIDATE`
工作区：隔离发布工作区（不进入公开产物）
基线：detached `a5ba28ce`（已发布大学批次的只读源码基线）

## 1. 本轮已完成

1. 复用既有大学清洗产物，建立 16 条 UFB 分类映射；没有把当前 26 条 v1 manifest 当作完整网盘清单。
2. 已记录负责人对已有资料、已有分享及公开/分发权限的明确授权。
3. 固定使用 TREE-B1-FINAL 的大学九域和既有 stable Category ID；没有增加第十域或重命名 ID。
4. 识别 13 条首批技术候选、1 条来源范围补充项和 2 条排除项。
5. 记录现有 Delivery 复用策略；本轮新建分享数为 0。
6. 在 `src/catalogV2.ts` 接入内部 v2 兼容投影和授权感知公开门禁：
   - `display_metadata` 的 Resource 级门禁；
   - 具体 Delivery 的 `expose_share_link` 门禁；
   - `accessStatus`、资源发布/分类/来源浏览状态分别检查；
   - `deliveryId` 精确绑定；
   - `redistribute` 作为独立动作，不从可访问或展示授权推导。
7. 在 `src/catalogV2.test.ts` 增加九域 ID、v1 投影、来源未观察、资源/Delivery 授权分离和 v1 增量投影测试。

## 2. 明确未做

- 未修改 `public/data/manifest.v1.json`。
- 未生成 manifest v2。
- 未修改 v1 `categories.ts`、现有路由、既有 26 条 Resource ID 或 `stage-university` 记录。
- 未创建、续期、替换或撤销分享。
- 未上传、下载、转存、读取资料正文或重新扫描网盘。
- 不直接推送 `main`；实际发布采用受保护 PR 与 Pages workflow。

## 3. 数据准备结论

| 项目 | 数量 | 状态 |
|---|---:|---|
| 既有清洗候选 | 13 | 负责人授权已确认；可进入发布候选 |
| 后续盘点补充项 | 1 | UFB-016；权利授权已确认，来源范围单独确认 |
| 明确排除项 | 2 | UFB-010 混合软件；UFB-014 敏感证明模板 |
| 复用现有独立 Delivery | 14 | 13 条首批候选 + UFB-016；本轮不重复创建 |
| 本轮新建分享 | 0 | 符合任务禁止项 |
| 负责人确认公开/分发授权 | 13 + UFB-016 | 已记录；`redistribute` 仍按动作单独判断 |

详细映射：[UNIVERSITY-FIRST-BATCH-CANDIDATES.md](./UNIVERSITY-FIRST-BATCH-CANDIDATES.md)；授权清单：[UNIVERSITY-FIRST-BATCH-AUTHORIZATION.md](./UNIVERSITY-FIRST-BATCH-AUTHORIZATION.md)。

## 4. 验证结果

| 检查 | 结果 |
|---|---|
| `npm ci` | PASS；173 packages；0 vulnerabilities |
| `npm test -- --reporter=dot` | PASS；38 个测试文件、804 个测试 |
| `npm test -- --reporter=dot src/catalogV2.test.ts` | PASS；17/17 |
| `npm run build` | PASS；TypeScript + Vite，2130 modules |
| `npm run lint` | PASS；仅保留基线已有 3 条 warning |
| manifest v1 内容 | 未写入；只读核对 |

构建产物由本地验证生成在 worktree 的 `dist/`，不作为发布动作，也未进入 manifest 或部署流程。

## 5. 发布流程

负责人授权已确认，发布流程按以下边界执行：

1. 保持现有 26 条历史记录不变，不新增重复记录。
2. UFB-015 保持专业课域级映射，不发明叶子 ID。
3. UFB-016 继续作为来源范围补充项，不阻塞 13 条既有候选。
4. 通过发布分支、PR checks、合并后的 `workflow_dispatch(release_approved=true)` 完成生产发布。

发布结果以 PR、Actions 和线上冒烟证据为准。
