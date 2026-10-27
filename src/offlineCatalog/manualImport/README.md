# R13-D-3B-1 严格离线清单解析器

入口：`parseManualImport(bytes: Uint8Array, format: 'csv' | 'json', usableCategoryIds?: ReadonlySet<string>)`。
纯函数，不读取文件、不访问网络、不保存、不发布。结果中的合法候选是敏感用户数据，`dataClassification: sensitive-in-memory`；调用方不得自动持久化、记录或上报。无网盘身份、路径或分享链接。重复候选提示延至 3B-2，不自动合并。

## 字段契约

唯一六字段：name、fileType、sizeBytes、categoryId、sourceLabel、note。

- name 必填字符串，trim 后 1–200 Unicode 码点；sourceLabel 最多 50、note 最多 500 码点。
- 可选文本缺失、null、空字符串及纯空白统一为 null；其他类型为逐条错误。字符串 trim，不做富文本解释，不执行公式。未来 UI 必须文本转义，不能插入 HTML；未来表格导出须另行防公式注入。
- fileType 区分大小写，仅 pdf/doc/docx/ppt/pptx/xls/xlsx/txt/other。
- sizeBytes 缺失或 null 为 null；JSON 仅接受 0 至 MAX_SAFE_INTEGER 的安全整数数字，拒绝所有字符串（包括空字符串）、布尔及小数。JSON 合法数字指数语法若结果为安全整数可以接受；溢出拒绝。
- CSV sizeBytes trim 后为空为 null；否则仅十进制数字串，可带前导零；拒绝正负号、小数、指数及不安全整数。
- categoryId trim 后非空时，只检查调用方显式提供的已验证、可用 ID 集合。调用方负责分类结构、层级、启用及祖先启用校验；模块不导入内置分类、不推断归属。不提供集合为 CATEGORY_UNCONFIRMED，集合不含该 ID 为 INVALID_CATEGORY。
- 原文 C0 控制字符（允许 TAB/CR/LF）、DEL/C1 整批拒绝；JSON 转义产生的上述字符及孤立 UTF-16 代理项按记录 INVALID_TEXT。允许合法 UTF-8 编码的 U+FFFD，禁止解码器容错生成替换字符。

## 结构和预算

零字节拒绝；原始字节最多 1,048,576，超限先于解码检查。严格 UTF-8 fatal 解码，允许起始 BOM；中间 BOM 不视为文件标记。最多 100 条原始记录，无效记录也计数；解析第 101 条前整批拒绝。

CSV 表头必须精确匹配六字段子集，name 必有，不 trim 表头；重复、空、未知表头拒绝。双引号必须位于单元格起始，支持双引号转义、引号内逗号和换行；关闭引号后只允许分隔符、LF/CRLF 或 EOF。裸 CR 作为记录分隔符拒绝。一个末尾换行不增加记录；其他空行不跳过：单列空行为无效记录，多列空行为列数错误。表头无记录允许 accepted/0。

JSON 顶层数组，元素只能非 null 对象，值只允许 JSON 标量；任何嵌套对象或数组立即整批拒绝，无递归。键先严格解码，再 Set 查重，再白名单检查；JSON.parse 仅用于解析已扫描的单个字符串 token，不用于整体对象解析。对象以 null 原型创建，只有白名单键被赋值。空数组允许 accepted/0。未知键（包括 __proto__/constructor/prototype）整批拒绝。

上限约束：输入最多 1 MiB；最多 100 个对象，每对象最多六个不同白名单键；CSV 最多六列。结构扫描无递归，不构造无限记录列表。

## 结果和错误

`rejected` 仅有 status、稳定 code、固定 summary `Import rejected`，不回显键、值、输入或堆栈。整批失败不返回部分候选。
`accepted` 有 totalRecords、validCount、invalidCount、rows 及敏感数据标记；有效行只有白名单规范化候选，无效行只有匿名错误及零基记录 index（不是物理 CSV 行号，因支持多行单元格）。

整批错误：EMPTY_FILE、FILE_TOO_LARGE、INVALID_UTF8、CONTROL_CHARACTER、INVALID_FORMAT、JSON_SYNTAX、JSON_STRUCTURE、DUPLICATE_KEY、UNKNOWN_FIELD、CSV_SYNTAX、CSV_HEADER、CSV_COLUMNS、TOO_MANY_RECORDS。
逐条错误：REQUIRED、INVALID_TYPE、TOO_LONG、INVALID_FILE_TYPE、INVALID_SIZE、CATEGORY_UNCONFIRMED、INVALID_CATEGORY、INVALID_TEXT。错误 field 只取六字段固定名称。业务错误保留其他有效行供预览。

## 虚构样例

```csv
name,fileType,sizeBytes,sourceLabel,note
示例练习,pdf,120,手动清单,"示例，待复核"
```

```json
[{"name":"示例练习","fileType":"pdf","sizeBytes":120,"sourceLabel":"手动清单"}]
```

## 验证与 3B-2 接口

新增用例使用虚构数据，Node 环境测试；生产模块只使用标准 TextDecoder 和相对模块，无文件 API、网络、持久化或 UI。静态源码约束测试及禁止 fetch 的针对性测试共同验证纯函数边界。

运行新增测试：`node node_modules/vitest/vitest.mjs run src/offlineCatalog/manualImport/manualImport.test.ts --config vitest.config.ts --maxWorkers 1`。
既有 TS 回归：用现有 Python 执行 `-I -B -S src/offlineCatalog/run_offline_tests.py ts`。不安装依赖，不运行 MCP/Python 业务候选。

3B-2 可在单独授权后负责浏览器选择/读取、分类快照提供、文本预览和内存清除；不得把结果传入 myData/localStorage。选择新文件/取消时清除旧候选，不记录原文。保存仍 BLOCKED，可信后端、身份认证及对象授权需另行批准。未做浏览器、部署、真实数据或服务端验收。

## R13-D-3B-2A 内存工作区与安全导出

`workspace.ts` 提供纯逻辑 API，3B-1 解析契约保持不变；`index.ts` 仅把原字段校验函数命名为 `validateManualRecord` 并导出，解析器继续调用同一实现。

| API | 用途 |
| --- | --- |
| `createWorkspace(result, usableCategoryIds?)` | accepted 解析结果创建工作区；rejected 返回 IMPORT_REJECTED；计数/形状不合法返回 INVALID_STATE |
| `updateWorkspace(state, action, usableCategoryIds?)` | edit、exclude、review 三类不可变操作，每次重新校验 |
| `revalidateWorkspace(state, usableCategoryIds?)` | 使用当前分类集合重算字段与重复复核状态 |
| `getWorkspaceView(state, usableCategoryIds?, page=0, pageSize=20)` | 重校验后返回统计、页数据、匿名相似记录对；页码零基，页大小 1–100 |
| `prepareExport(state, usableCategoryIds?)` | 重新校验、过滤、规范化，仅返回 JSON 文本和统计，不触发下载 |
| `clearWorkspace()` | 返回 null，调用方丢弃旧引用；不承诺物理擦除 JS 内存 |

状态标记 `sensitive-in-memory`，只包含本地行标识、原始索引、六字段编辑值、排除/字段校验/人工复核状态和匿名错误。`local-row-N` 仅在传入的本次工作区内有效，不是网盘、数据库或正式资源 ID；不同导入之间不关联，应丢弃旧动作与 ID。行数固定在原始 0–100，不提供新增/删除/合并操作。编辑值可保留原样供修正，导出才 trim 和规范化；sizeBytes 编辑值应由未来 UI 明确转换成数字或 null，字符串依旧按 JSON 契约无效。

3B-1 无效行没有安全字段可恢复，创建时使用空白六字段占位，错误重算为 REQUIRED，原始错误仍由调用方原解析结果查看；不得从原文猜测。用户需重新填写整条记录信息，未填写 name 前不会成为有效行。未知状态键/字段、非标量值、异常对象原型、访问器、稀疏数组、不一致计数及未知行 ID 会安全拒绝；不会把嵌套可变对象共享给输入或其他返回结果。导出不信任缓存的 valid 标签。

疑似相似规则：有效且未排除行的名称经过既有 NFKC、trim、空白折叠和 zh-CN 小写处理，加上 trim/空值规范化后的 fileType 相同。忽略大小和来源差异，仅提示人工复核，不证明同一文件。每条相关记录需要单独 review:true；可以 review:false 撤销。similarRowIds 记录当前关联本地行集合，无云盘身份。编辑任何字段或排除/恢复会保守撤销全部已有审批；分类变化使相似成员增加/减少也会撤销受影响记录审批，防止旧复核覆盖新候选。无相似记录的行不需要审批；排除行不参与相似性，也不进入导出。

导出仅包含当前字段有效、未排除、无待复核问题的行，其余省略并计入 omittedCount；保持原始顺序。零条导出返回 NO_EXPORTABLE_ROWS。顶层数组，每行恰好六字段，不包含内部 ID、状态、错误或原文。JSON.stringify 序列化普通文本，并将 `< > & U+2028 U+2029` 写为 Unicode 转义；不是 HTML，未来 UI 仍须文本转义。输出编码说明 utf-8，返回 byteLength/exportedCount/omittedCount；超过 1 MiB 返回 EXPORT_TOO_LARGE。实际输出还会交给 3B-1 严格解析器确认可再次导入，否则 EXPORT_CONTRACT。函数不建立 Blob、不创建链接、不点击、不保存。

工作区匿名错误：IMPORT_REJECTED、INVALID_STATE、UNKNOWN_ROW、INVALID_FIELD、INVALID_VALUE、INVALID_ACTION、INVALID_PAGE、NO_DUPLICATE、NO_EXPORTABLE_ROWS、EXPORT_TOO_LARGE、EXPORT_CONTRACT。字段错误继续使用 3B-1 原有错误码；没有用户值、异常详情或堆栈。

3B-2A 新增 75 项定向测试，3B-1 119 项及既有 offlineCatalog TS 95 项回归通过；新增工作区及解析模块类型检查和定向 lint 另行验证。静态源码禁用外部调用，加上禁止网络/存储/下载对象的运行时针对性测试，只证明纯逻辑范围，不是浏览器验收。

运行工作区和解析回归：`node node_modules/vitest/vitest.mjs run src/offlineCatalog/manualImport/workspace.test.ts src/offlineCatalog/manualImport/manualImport.test.ts --config vitest.config.ts --maxWorkers 1`。

3B-2B 仍需 UI 实现：明确文件替换确认、离开提醒、输入转换、当前有效分类集合提供、文本展示、逐行复核和省略数量提示；仅在用户明确确认导出事件中调用 prepareExport，再由独立获准的 UI 实现下载。调用方不得自动调用导出，不得自动持久化或分析上报，取消/替换/离开时丢弃工作区引用。REAL SAVE READINESS 继续 BLOCKED；本轮未做 UI、真实下载或后端。

## R13-D-3B-2B 页面骨架（2026-10-14）

新增独立 `ImportSkeleton.tsx` 和完全作用域化的 `ImportSkeleton.css`；不修改 App、公开路由、学生导航、我的页面或正式资源。标题“资料导入 / 本地清单检查与整理”，明确“运营者工作区 · 开发预览”和“未启用管理员认证，不可公开发布”。默认空状态，可通过只读 display="example" prop 显示显著标注的虚构示例。

桌面左右 24:76，沿用既有 ink/forest/cream/paper/line/mist/shadow 变量及同值备用色，不载入外部字体/图像。800px 以下单栏，520px 以下摘要两列、记录卡片字段单列、底部操作单列；无六列表格。语义标题、列表、描述列表、禁用理由和焦点样式已提供。所有业务按钮原生 disabled，没有事件处理器、文件输入、拖放、文件读取、编辑接线、下载、保存、持久化或上报；未调用解析器与工作区 API。

### 仅本地开发预览

在项目根目录手动使用已有依赖：`npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`。仅绑定回环地址，不添加 --host 0.0.0.0，不开放隧道，不对外发布。

- 空状态：`http://127.0.0.1:5173/src/offlineCatalog/manualImport/preview/index.html`
- 虚构示例：上述 URL 加 `?example=1`

独立 preview/main.tsx 同时要求 import.meta.env.DEV 和回环主机名；不接入 App。DEV/主机名门禁只限制预览，不是管理员认证；禁止作为权限系统使用。预览 HTML 不在生产默认构建入口中，来源文件也不得另行复制到站点或配置成生产多页面入口。本轮未启动预览服务、未做真实浏览器截图/视觉/键盘/读屏器验收。

### 验证及上线阻断

ImportSkeleton.test.tsx：16 项 DOM/结构/禁用操作/纯展示/实际公开 App 渲染与入口隔离用例；现有 AppNavigation/CategoriesPage/ResourcesPage 回归 14 项；manualImport 119+75 项。ProductionIsolation.test.ts：1 项按现有 vite.config.ts 做 write:false、copyPublicDir:false 的内存生产构建检查；断言生产入口、输出文本及模块图不含骨架或预览，未生成 dist 产物或复制 OCR 包。既有 offlineCatalog TS 95 项另行运行。合计 320 项。

运行组件及回归：`node node_modules/vitest/vitest.mjs run src/offlineCatalog/manualImport/ImportSkeleton.test.tsx src/AppNavigation.test.tsx src/CategoriesPage.test.tsx src/ResourcesPage.test.tsx src/offlineCatalog/manualImport/manualImport.test.ts src/offlineCatalog/manualImport/workspace.test.ts --config vitest.config.ts --maxWorkers 1`。
生产隔离：`node node_modules/vitest/vitest.mjs run src/offlineCatalog/manualImport/ProductionIsolation.test.ts --config vitest.config.ts --maxWorkers 1`。既有 TS 回归仍使用 run_offline_tests.py ts。

生产入口隔离证据是当前默认构建模块图及公开 App 实际渲染测试，不是已部署服务器验收；响应式样式规则及 DOM 检查也不是浏览器视觉验收。3B-2C 文件选择、编辑、复核、确认导出接线必须另行批准，仍仅在受限本地预览中实施。

Release blockers：公开上线前必须建立并验收可信服务端运营者/管理员认证、对象级授权、受保护路由及正式资源隔离；隐藏入口、DEV 条件、客户端主机名或本地状态均不能替代。当前 ADMIN AUTH READINESS / REAL SAVE READINESS 继续 BLOCKED。

## R13-D-3B-2C 交互接线与精修（2026-10-14）

独立预览现在动态导入 `ImportWorkspace.tsx`；历史 `ImportSkeleton.tsx` 仍保留为未接线组件供原骨架回归，不更改解析器/工作区契约、App、公开入口或正式资源。preview/index.html 仍要求 DEV+回环主机；原 `?example=1` 静态示例开关不再使用，两个旧 URL 均打开空的真实本地导入工作区。预览服务仍只能监听 127.0.0.1，开发限制绝非管理员权限。

标题由 48px 上限缩至 40px（约 17%），顶部留白、步骤间距和摘要内边距缩小，管理员提示改为紧凑提示条；保留既有绿色变量、800px 单栏/520px 卡片字段及编辑器单栏布局。浏览器已观察 840px 桌面布局及 iPhone 14 的 390px 模拟视口，不代表真实手机或全部分辨率验收。

### 功能与数据生命周期

- 原生本地文件控件仅接收 .csv/.json。零字节/超过 1 MiB 在读取前拒绝，读取后的字节再次由 3B-1 严格检查，UTF-8、BOM、记录数、重复键/表头及未知字段规则不放宽。UI 不显示或保存文件名；控件选择后清空 value。无效行只创建空白占位并提示完整重填。
- 分类集合来自只读内置分类，要求分类结构整体有效，且为启用的三级分类及启用的完整祖先路径；编辑显示名称/路径，实际保持 ID。异步完成时使用当前分类快照，不使用旧闭包快照。
- 状态仅 React 内存，复用 createWorkspace/updateWorkspace/revalidateWorkspace/getWorkspaceView/prepareExport/clearWorkspace；所有计数来自实际状态。支持全部/有效/待确认/错误/已排除筛选、10 条分页、六字段详情、编辑应用/取消、重新校验、排除恢复及逐行重复复核，不合并/删除/发布。
- 编辑中的表单是单独草稿，不进入工作区或导出，应用后逐字段走同一校验。sizeBytes 仅十进制数字文本转为数字，空值转 null；其他非法文本仍由原 JSON 业务校验判错。保存草稿库始终禁用。
- 替换/清空/导出使用确认弹窗，取消保留状态；弹窗聚焦取消按钮、Tab 环绕、Esc 取消并恢复触发焦点。未导出数据/编辑/读取时挂标准 beforeunload 尽力提醒；不承诺所有浏览器均能阻止关闭。卸载/替换/取消读取用版本令牌防旧读取回写，刷新或重新挂载不恢复。
- 导出只由用户点击和二次确认触发；显示导出/省略数量及本机保存提示，确认前再次核对状态版本及最新分类，并重跑 prepareExport。未应用编辑时禁用导出；零合格记录不允许下载。部分导出后仍保留离开提醒，因为尚有未导出记录。
- downloadJson 仅把纯函数结果包装 UTF-8 JSON Blob，文件名 zhaowenguan-import-draft.json；点击后移除临时链接，约 1 秒后释放 object URL，失败时立即移除/释放并保留预览供重试。提示“已发起下载”，不声称浏览器落盘或已保存草稿库。

### 本轮验证

新增组件测试 31 项；既有 3B-1 119 项、3B-2A 75 项、骨架 16 项、页面回归 14 项、生产隔离 1 项、offlineCatalog TS 95 项均实际运行通过，共 351 个不同用例，0 失败/跳过。变更文件严格类型检查和定向 lint 通过。

主要命令：`node node_modules/vitest/vitest.mjs run src/offlineCatalog/manualImport/ImportWorkspace.test.tsx --config vitest.config.ts --maxWorkers 1`。
全相关回归在既有 3B-2B 命令中加入 ImportWorkspace.test.tsx、ProductionIsolation.test.ts；既有 Python 入口继续仅执行 ts。生产构建仍 write:false/copyPublicDir:false，断言整个 manualImport 目录均不进入当前生产模块图；不写 dist、不复制 public/OCR。

真实 Chromium/browser-skill 验收仅访问 127.0.0.1：上传合成 CSV 两条相似记录、修改备注、逐条人工复核、确认弹窗及实际 JSON 下载。下载 280 字节，随后再次由 3B-1 解析为 accepted/2 有效/0 无效。浏览器会话已停止，开发服务器保留供用户验收。

合成 fixture、截图和下载证据在 git 忽略的 `tmp/r13-d-3b-2c-20261014/`；没有真实资料。desktop-empty.png、mobile-records.png 已查看，手机模拟显示单栏卡片，无六列表格。浏览器未逐一重演所有错误边界、异步竞态、分页/替换/关闭提示；这些有组件/纯函数测试，不等同真实浏览器验收。未做实体手机、辅助技术读屏器、全部浏览器或部署验收。

验收建议：本地预览选择虚构 CSV/JSON→检查 10 条分页/错误占位→应用编辑→相似记录逐行复核→排除恢复→取消及确认导出→核对本机 JSON；再检查刷新无恢复、管理员提示和真实保存禁用。只能使用合成文件，不扩大网盘/资料访问。

正式上线 blocker 保持：可信服务端管理员认证、对象授权、受保护路由和正式资源隔离。禁止把开发入口或原始预览源码额外发布为生产页面。本轮已停止，等待用户截图及验收反馈。
