# 昭文馆 V2｜UNIVERSITY-FIRST-BATCH 大学资料首批准备清单

状态：`OWNER_AUTHORIZED_RELEASE_CANDIDATE`
范围：只复用既有大学系列清洗产物和当前已验证的 Delivery 证据；不扫描全网盘、不创建分享、不改生产 manifest、不启动 manifest v2。

## 1. 证据边界

- 主要输入：既有 `UNIVERSITY-BULK-PUBLISH-1-20261029` 清洗/候选产物中的 16 个 UFB 条目（UFB-001 至 UFB-016）。
- 只读兼容输入：本 worktree 基线 `a5ba28ce` 中的 26 条 v1 公开记录。它们不是完整网盘文件清单，只用于核对稳定 Resource ID、现有分类根和当前 Delivery 访问状态。
- 16 个条目的来源范围：13 个既有清洗候选、1 个后续盘点补充项、2 个明确排除项。
- 负责人已确认操作授权以及版权/公开分发授权；本文不重复写入分享 URL、FID、提取码或私有证据定位。

## 2. TREE-B1-FINAL 已批准的大学九域

| 稳定 Category ID | 展示名 | 说明 |
|---|---|---|
| `domain-university-major` | 专业课 | 专业课、数学与教材语义 |
| `domain-university-politics` | 思政 | 思政课程资料 |
| `domain-university-english-exam` | 英语考试 | 四六级、雅思及相关考试 |
| `domain-university-computer-exam` | 计算机考试 | 计算机考试资料 |
| `domain-university-competition` | 竞赛 | 大学竞赛资料 |
| `domain-university-postgraduate` | 升学 | 考研及相关升学资料 |
| `domain-university-planning` | 规划 | 职业生涯规划资料 |
| `domain-university-proof` | 模板与证明 | 证明/模板，须单独审核 |
| `domain-university-review` | 复习资料 | 独立于专业课的复习资料域 |

本清单没有新增“拓展”或其他第十域。现有 v1 `stage-university` 和 26 条记录的 `categoryId` 不在本轮被重写。

## 3. 16 条清洗产物的分类映射

“访问证据”只表示当前入口曾经核验通过；“授权状态”单独判断，不能从 `verified` 推导为 `approved`。

| UFB | 稳定 Resource ID | 资料 | 来源范围 | primary 域 | 目标叶子 ID | 当前入口/处理结论 |
|---|---|---|---|---|---|---|
| UFB-001 | `university-quark-math-advanced-001` | 同济高等数学（第七版） | 既有清洗候选 | `domain-university-major` | `subject-university-calculus-advanced` | 复用现有 verified 永久 Delivery；授权待确认 |
| UFB-002 | `university-quark-linear-algebra-001` | 线性代数教材 | 既有清洗候选 | `domain-university-major` | `subject-university-linear-algebra` | 复用现有 verified 永久 Delivery；授权待确认；同名来源不合并 |
| UFB-003 | `university-quark-probability-textbook-001` | 概率论与数理统计教材（浙大第4版） | 既有清洗候选 | `domain-university-major` | `subject-university-probability` | 复用现有 verified 永久 Delivery；授权待确认 |
| UFB-004 | `university-quark-probability-review-001` | 概率论与数理统计复习试卷 | 既有清洗候选 | `domain-university-major` | `subject-university-probability` | 保持来源主归属；不因“复习”字样自动复制到复习域 |
| UFB-005 | `university-quark-mathematical-analysis-001` | 华东师大数学分析 | 既有清洗候选 | `domain-university-major` | `subject-university-mathematical-analysis` | 复用现有 verified 永久 Delivery；授权待确认 |
| UFB-006 | `university-quark-calculus-001` | 普林斯顿微积分 | 既有清洗候选 | `domain-university-major` | `subject-university-calculus` | 与高等数学保持不同稳定叶子；复用现有 Delivery |
| UFB-007 | `university-quark-ideology-marxism-001` | 马克思主义基本原理 | 既有清洗候选 | `domain-university-politics` | `subject-university-marxism` | 复用现有 verified 永久 Delivery；授权待确认 |
| UFB-008 | `university-quark-cet4-001` | 大学英语四级资料 | 既有清洗候选 | `domain-university-english-exam` | `exam-university-cet4` | 只映射四级，不扩展为六级；授权待确认 |
| UFB-009 | `university-quark-ielts-001` | 雅思真题 4–20（含音频与解析） | 既有清洗候选 | `domain-university-english-exam` | `exam-university-ielts` | 复用现有 verified 永久 Delivery；授权待确认 |
| UFB-010 | 无独立 Resource；仅由 `university-topic-computer-001` 覆盖 | 计算机二级 MS 资料（含真题讲解视频） | 既有清洗候选 | `domain-university-computer-exam` | `exam-university-computer-ms` | 混合软件资料；无独立 Delivery，不进入首批单项 |
| UFB-011 | `university-quark-postgrad-001` | 27考研教辅 | 既有清洗候选 | `domain-university-postgraduate` | `exam-university-postgraduate` | 不把“27”擅自解释为年份；复用现有 Delivery |
| UFB-012 | `university-quark-career-ppt-001` | 职业规划大赛 PPT | 既有清洗候选 | `domain-university-planning` | `topic-university-career` | 复用现有 verified 永久 Delivery；授权待确认 |
| UFB-013 | `university-quark-resume-templates-001` | 简历模板 | 既有清洗候选 | `domain-university-planning` | `topic-university-career` | 保持规划主归属；不自动复制到模板与证明域 |
| UFB-014 | 无独立 Resource；仅在总入口范围内 | 医学诊断证明书模板 | 既有清洗候选 | `domain-university-proof` | `type-university-medical-proof` | 敏感/误用风险；不进入学生公开单项清单 |
| UFB-015 | `university-quark-biochemistry-001` | 生物化学（第九版） | 既有清洗候选 | `domain-university-major` | 待确认：TREE-B1-FINAL 未给出稳定生物化学叶子 ID | 复用现有 verified 永久 Delivery；不擅自发明叶子 ID |
| UFB-016 | `university-quark-english-contest-001` | 大英赛冲奖核心必备 2000 词 | 后续盘点补充项 | `domain-university-competition` | `competition-university-english` | 当前有 verified 永久 Delivery；先确认是否纳入 strict-v2 正式清洗范围 |

## 4. 首批可上架候选

以下 13 条具备“身份已整理 + 当前已有可达 Delivery + 可映射到已批准九域 + 负责人授权已确认”的条件，可进入首批发布候选；它们仍不是已经部署的生产结果：

`UFB-001`、`UFB-002`、`UFB-003`、`UFB-004`、`UFB-005`、`UFB-006`、`UFB-007`、`UFB-008`、`UFB-009`、`UFB-011`、`UFB-012`、`UFB-013`、`UFB-015`。

当前判定：

- 13 条：`RELEASE_READY_CANDIDATE`，Resource 级和具体 Delivery 级公开/分发授权已由负责人确认。
- UFB-016：`HOLD_OWNER_SCOPE`，权利授权已确认，但不是旧 15 条清洗候选中的既有项；保持单独标记，不阻塞前述 13 条。
- UFB-010、UFB-014：`EXCLUDED`，不创建单项入口。

## 5. 已有分享复用情况

| 范围 | 数量 | 处理 |
|---|---:|---|
| 当前 v1 大学记录 | 26 | 只读兼容输入，不视为完整网盘库存 |
| 首批技术候选中的现有独立 Delivery | 13 | 复用当前基线中已验证的永久分享；本轮不重复创建 |
| UFB-016 的现有独立 Delivery | 1 | 仅作为条件性补充项复用；不等于纳入授权清单 |
| UFB-010、UFB-014 | 0 | 只有总入口/主题容器覆盖，没有独立单项 Delivery |
| 本轮新建分享 | 0 | 明确禁止，未执行 |

历史候选证据中曾有分享创建动作；本轮只把当前基线已有的 Delivery 当作复用对象，不重新创建、不续期、不撤销、不替换。

## 6. 保留的异常与不合并规则

- UFB-002 对应来源中有两个同名同大小线性代数文件；未做内容哈希或人工打开核验，不合并、不删除、不猜测唯一对象。
- UFB-010 的计算机目录混有软件/激活类内容，保持主题入口范围，不公开单项。
- UFB-014 的证明模板需要敏感信息、误用和合规审核，保持排除。
- UFB-016 仍标记为清洗范围补充项，不用当前 manifest 的存在反推它已通过 strict-v2 清单治理。
- 资料标题中的别名只作为待验证搜索词，不改变 canonical 分类，不生成第二个 Resource。

## 7. 发布前最后确认

负责人已经确认前两项授权；进入实际生产发布前还需确认：

1. 若动作包含复制或其他更强再分发，是否单独放行 `redistribute`。
2. UFB-015 是否接受“专业课域级映射，叶子待定”，或提供已批准的稳定生物化学叶子 ID。
3. UFB-016 是否纳入正式 strict-v2 清洗清单。
4. 是否保持当前 26 条历史记录和 `stage-university` 不变；本轮默认不重分类、不改写、不合并。

确认完成后，下一轮才可在独立候选中生成最小 v1 增量并执行发布前门禁；本轮不提交、不推送、不部署，等待负责人确认实际发布动作。
