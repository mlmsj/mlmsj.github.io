# 昭文馆 V2｜UNIVERSITY-FIRST-BATCH 授权清单

状态：`OWNER_AUTHORIZED_RELEASE_CANDIDATE`
这份清单区分“入口访问核验”和“公开/再分发授权”。现有 `accessStatus=verified`、分享页显示永久有效、或已存在于 v1 manifest，都不能单独证明授权批准。

负责人已在任务对话中明确授权使用已有资料、复用已有分享并推进上架，同时确认拥有资料版权或取得权利人的公开分享许可。该确认已记录为本 worktree 的负责人授权依据；UFB-016 的来源范围仍单独审核。

## 1. 必须分别确认的两层授权

### Resource 级

每个首批 Resource 需要明确：

- `display_metadata`：允许网站公开标题、描述、分类和必要的文件元数据。
- `expose_share_link`：允许网站公开具体分享入口。
- `redistribute`：若后续动作不止展示链接而涉及再发布/复制，必须显式包含，不能由前两项推导。
- `audienceScope`：至少明确是否覆盖 `public`。
- `platformScope`：至少明确是否覆盖 `website`。
- 有效期、批准人和可回溯的私有证据引用。

### Delivery 级

每个具体 `deliveryId` 需要单独确认：

- 与 Resource 的稳定 ID 精确匹配。
- 该入口自身覆盖 `expose_share_link`；如需再分发，覆盖 `redistribute`。
- 入口在当前核验时点的 `accessStatus` 仍为 `verified`。
- 授权受众、平台和有效期覆盖实际发布动作。

Delivery A 的授权不能放行 Delivery B；资源级批准也不能替代具体入口授权。

## 2. 当前候选状态

| 范围 | 数量 | 访问状态 | Resource 授权 | Delivery 授权 | 结论 |
|---|---:|---|---|---|---|
| 首批技术候选 UFB-001～009、011～013、015 | 13 | 现有独立 Delivery 已核验 | 负责人已确认 | 负责人已确认 | 可进入发布候选 |
| UFB-016 | 1 | 现有独立 Delivery 已核验 | 负责人已确认 | 负责人已确认 | 仍待确认是否纳入 strict-v2 来源范围 |
| UFB-010 | 1 | 仅主题/总入口覆盖 | 不适用单项 | 无独立 Delivery | 排除，不新建入口 |
| UFB-014 | 1 | 仅总入口覆盖 | 敏感/误用审核未通过 | 无独立 Delivery | 排除，不新建入口 |

当前可以安全报告的是：13 条已获负责人公开/分发授权的发布候选、1 条权利授权已确认但来源范围待定的补充项、2 条排除项。

## 3. 负责人确认模板

以下模板保留给后续审计留档；本轮负责人授权已确认，不再把它作为继续推进的前置阻断：

```text
Resource ID：
允许公开资料信息：是 / 否
允许公开具体分享入口：是 / 否
允许再分发/复制：是 / 否 / 不适用
受众：public / restricted / 其他
平台：website / 其他
有效期：
批准依据（私有引用）：
备注：
```

UFB-016 还需增加：

```text
是否确认纳入 strict-v2 正式清洗范围：是 / 否
```

## 4. 门禁含义

- 只有 Resource 级 `approved` evidence 不能直接显示具体分享链接。
- 只有 Delivery 级 `approved` evidence 也不能绕过 Resource 级授权。
- `verified` 只表示入口访问检查通过；`published` 只表示历史发布状态；二者都不会自动生成授权证据。
- 任一授权层级缺失、过期、受众/平台不匹配，公开链接门禁必须 fail-closed。

本轮未向 manifest 写入授权字段，没有生成 manifest v2，也没有把历史 26 条记录反向重分类；负责人授权记录见 [OWNER-AUTHORIZATION-20261101.md](./OWNER-AUTHORIZATION-20261101.md)。
