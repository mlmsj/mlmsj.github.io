# 昭文馆 V2｜B2-3-PREMERGE-RECHECK

日期：2026-11-02（Asia/Shanghai）
范围：只读核对；未访问网盘，未修改代码、manifest 或授权记录，未执行 commit、merge、rebase、push 或部署。
状态：`PARTIAL`

## 1. B2-2/B2-3 完整性结论

### Git 与正式 main 基线

- 正式仓库远端为 `mlmsj/mlmsj.github.io`。
- 当前 `HEAD`：`bf905399f51dc4e5a6a3e7b041d0d0941214e469`，与 `origin/main` 相同。
- 当前为 detached `HEAD`，没有当前分支；工作区不是干净状态。
- 核对时有 22 个 tracked 文件处于修改状态，并有 9 个 B2-3 新增文件处于 untracked 状态；这些改动均未提交。
- `HEAD` 与 `origin/main` 的基线树一致；正式 `main` 的已提交状态未因本轮核对改变。

### B2-2 原有 11 文件

现有整合准备报告记录的 B2-2 边界为 11 个文件、原始差异 `+537/-263`。当前 11 个文件全部仍存在且相对 `bf90539` 有改动，未发现分类、路由或页面源文件被删除：

1. `src/categories.ts`
2. `src/catalogV2.ts`
3. `src/categoryRouting.ts`
4. `src/CategoriesPage.tsx`
5. `src/ResourcesPage.tsx`
6. `src/categories.test.ts`
7. `src/categoryRouting.test.ts`
8. `src/catalogV2.test.ts`
9. `src/CategoriesPage.test.tsx`
10. `src/ResourcesPage.test.tsx`
11. `src/publicCatalog.test.tsx`

当前这 11 个文件合计差异为 `+555/-263`。增加的 18 行来自 B2-3 在共享文件 `src/publicCatalog.test.tsx` 中追加的 metadata-only 回归测试；因此当前工作区没有保存一份可直接作为“纯 B2-2 11 文件提交”的中间快照。

### B2-3 新增及修改边界

- B2-3 新增：`docs/B2-3-HISTORICAL-AUTHORIZATION-MAPPING.md`、`docs/B2-3-PUBLIC-OUTPUT-VERIFICATION.md`、`scripts/b2-3-authorization-policy.ts`、`scripts/build-b2-3-public-manifest.ts`、`scripts/input/manifest.v1.source.json`、`scripts/verify-b2-3-public-output.mjs`、`src/legacyPublicCatalog.test.ts`、`src/publicProjection.test.ts`、`src/publicProjection.ts`。
- B2-3 独占修改：`README.md`、`package.json`、`public/data/manifest.v1.json`、`scripts/verify-pages-artifact.mjs`、`src/PublicDetail.tsx`、`src/categoryCounts.test.ts`、`src/categoryCounts.ts`、`src/legacyPublicCatalog.ts`、`src/publicCatalog.ts`、`src/publicManifest.test.ts`、`src/publicManifest.ts`。
- 共享修改：`src/publicCatalog.test.tsx` 同时包含 B2-2 的分类计数断言和 B2-3 的分享入口/metadata-only 断言。
- B2-3 没有覆盖或删除 B2-2 的 `categories.ts`、`categoryRouting.ts`、`CategoriesPage.tsx`、`ResourcesPage.tsx` 实现；B2-3 通过 `categories`/`getEnabledCategoryPath` 和 `catalogV2` 授权门禁消费 B2-2 的分类模型。

### 可追溯提交判断

两项功能可以整理为独立提交，但当前尚未形成独立提交。最小拆分边界是：B2-2 提交包含 11 个文件中的 B2-2 hunk；B2-3 提交包含其余独占文件、新增文件，以及 `src/publicCatalog.test.tsx` 中的 18 行 B2-3 hunk。当前 detached、混合未提交状态不能直接进入 pre-merge。

只读验证结果：

- 定向测试：10 个测试文件、122 个测试，`PASS`。
- `node scripts/verify-b2-3-public-output.mjs dist`：`PASS`；公开 13 条，隐藏历史记录 13 条。
- `node scripts/verify-pages-artifact.mjs dist`：`PASS`。
- `git diff --check`：`PASS`。
- 未运行全量测试、未重新构建最终源码；以上结果不替代提交后的 CI/构建证据。

## 2. 13 条历史暂缓记录的用户可见影响

### 暂缓 Resource ID

1. `university-series-001`
2. `university-topic-math-001`
3. `university-topic-professional-courses-001`
4. `university-topic-textbooks-001`
5. `university-topic-review-001`
6. `university-topic-ideology-001`
7. `university-topic-cet-001`
8. `university-topic-ielts-001`
9. `university-topic-computer-001`
10. `university-topic-postgrad-001`
11. `university-topic-career-001`
12. `university-topic-competition-001`
13. `university-quark-english-contest-001`

前 12 条是授权无法按当前稳定 Resource/Delivery ID 精确匹配的历史聚合入口；第 9 条对应 UFB-010 的独立项排除边界；第 13 条对应 UFB-016，权利授权已记录但 strict-v2 来源范围仍为 `HOLD_OWNER_SCOPE`。

### 页面与历史数据影响

- **公开列表/分类页：** 当前源 manifest 为 26 条，候选公开 manifest 为 13 条；上述 13 条不再出现在公开资料列表，也不进入公开分类计数。当前候选中 13 条公开记录均保留原稳定 Resource ID、原分类和原字段投影。
- **搜索页：** 运行时搜索只过滤当前公开 manifest 映射出的 13 个资源；代码中没有把上述 13 条作为可搜索资源重新注入。
- **旧详情链接/深链：** `?id=<暂缓 Resource ID>` 仍可被路由接收，但详情查找只在当前公开资源数组中进行；找不到时 fail-closed，显示“资料不存在、未发布或已撤回”，不会恢复旧分享入口。B2-2 的 `categoryPath` 分类深链逻辑未被 B2-3 删除；本轮未做真实浏览器刷新验收。
- **收藏：** 收藏数据保存在本地浏览器，B2-3 不自动删除或改写历史 ID。若用户本地仍收藏上述 ID，`MyPage` 会保留该收藏并显示“已失效资料（ID）/资料已下架、删除或不可访问”，查看按钮禁用；用户仍可手动取消收藏。因此表现为“收藏记录仍在，但资料暂不可用”。
- **已授权替代入口：** 当前有 13 条已授权的独立公开记录可作为集合层面的替代入口：UFB-001～009、UFB-011～013、UFB-015。现有映射没有为每一条历史聚合 ID 建立一对一 alias/redirect；不得自动把旧 ID 改写为这些入口，也不得据此恢复 13 条暂缓记录。

### 删除/覆盖判断

- `scripts/input/manifest.v1.source.json` 的 26 条与 `HEAD` 中正式 manifest 的 26 条逐条一致。
- 当前候选公开 manifest 的 13 条与源输入及 `HEAD` 中对应的 13 条逐条一致。
- 13 条被省略记录仍存在于本地源输入和 `HEAD` 基线；未发现源数据被删除或获授权记录被错误覆盖。
- 当前工作区的 26→13 是授权投影造成的公开输出收缩，不是已提交到正式 `main` 的删除；没有恢复未授权资料的动作。

## 3. Delivery ID 兼容性结论

- **用途范围：** `v1-primary:<resourceId>` 只在 `scripts/b2-3-authorization-policy.ts` 中为 13 条获批准的历史 v1 独立记录生成，作为候选内部的本地兼容身份；v1 源 manifest 本身没有原始 `deliveryId`。
- **不是原始网盘身份：** 该值不是网盘原始文件 ID、FID、分享 ID、提取码、分享 URL，也没有被拿来访问或反推网盘对象。
- **不是正式 Delivery 身份：** 它只在构建期的 `ResourceDeliveryV2`/授权证据绑定中使用，不写入 v1 manifest 的公开记录字段，也不代表未来正式 Delivery registry 的 ID。
- **授权绑定：** 当前 `hasDeliveryAuthorization` 同时精确匹配 `resourceId` 和 `deliveryId`；现有 13 条 policy 的映射一一对应，定向投影测试也验证了“其他 Delivery 的授权不能放行当前链接”。未发现其他 Resource 复用这 13 条授权的当前路径。
- **公开输出：** `public/data/manifest.v1.json` 和 `dist/data/manifest.v1.json` 均无 `deliveryId`、`v1-primary:`、evidence 或授权范围字段；B2-3 公开产物检查为 `PASS`。
- **未来冲突边界：** 当前代码使用了清晰的兼容前缀，但没有独立的正式 Delivery registry、保留命名空间声明或通用唯一性校验来机械阻止未来正式 Delivery ID 复用 `v1-primary:` 前缀。因此“当前不被误当正式 ID”可判定 `PASS`；“未来绝不冲突”当前只能判定 `PARTIAL/未证明`。

## 4. P0/P1 阻断

- **P0：未发现。** 当前没有证据表明暂缓 ID、原始分享入口、授权证据或 `v1-primary:` 已泄露到公开产物；fail-closed 投影和 Pages artifact gate 均通过。
- **P1：存在 pre-merge 阻断。** 工作区仍是 detached、混合未提交状态，B2-2/B2-3 尚无独立可审查 commit；共享测试文件需要选择性拆分后才能形成清晰历史。
- **P1 跟进项：** 未来正式 Delivery ID 的命名空间冲突没有自动化保护。它不是当前公开输出泄露，但在接入正式 Delivery registry 前必须补上保留前缀/唯一性规则。
- 旧详情链接失效、旧收藏保留为不可用记录属于当前 fail-closed 的预期用户影响，不构成 P0；若产品要求旧入口连续性，需负责人另行批准 alias/redirect 映射。

## 5. 最小后续修复建议

1. 在 `bf90539` 基线上，以选择性 staging 将 B2-2 与 B2-3 拆成两个可追溯 commit；不要把当前混合工作区直接作为单一 pre-merge 依据。
2. 为 `v1-primary:` 增加显式保留命名空间和跨 Resource/Delivery 唯一性测试，并让未来正式 Delivery ID 校验拒绝复用该前缀。
3. 若负责人要求旧详情/收藏可跳转，先建立逐条、已授权的 alias/redirect 映射；未建立映射前保持当前 fail-closed，不自动恢复 13 条暂缓记录。
