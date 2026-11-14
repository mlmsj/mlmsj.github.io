# 昭文馆｜初中课本教材学科入口迁移记录

日期：2026-11-11  
处理区域：夸克网盘 `长伴云衢千里明 / 初中系列 / 1.初中课本教材`  
正确工作区：`ZWG-MY-PAGE-REFINEMENT-20261110`  
状态：已在正确工作区完成本地候选映射；未提交、未推送、未部署。

## 处理结论

- 保留线上已有总入口「初中课本教材」及其原有分享链接。
- 在现有「初中课本教材」分类 `domain-junior-textbooks` 下新增 11 个三级学科分类，并将 11 条学科资料分别映射到对应三级分类。
- 不继续增加第四级分类，不把年级、版本、PDF 或更深层目录转换为网站资料入口。
- 搜索关键词沿用现有公开资料搜索机制：标题、描述和分类路径。新增入口的标题与描述包含 `初中`、学科名、`课本`、`教材` 等语义关键词。
- 目录内 PNG「【00】自动查找资料教程.png」不是学科目录入口，本批次排除，不公开。

## 扫描统计

| 项目 | 数量 | 说明 |
| --- | ---: | --- |
| 本次扫描目录 | 1 | 仅扫描指定目录 |
| 直接子项 | 12 | 11 个第一层文件夹 + 1 个 PNG 文件 |
| 新增独立资料入口 | 11 | 11 个学科文件夹入口 |
| 内部文件夹 | 11 | 只保留为第一层入口，不展开内部结构 |
| 可直接展示的新入口 | 11 | 既有永久公开分享链接已完成详情核验 |
| 保留总入口 | 1 | 线上已有「初中课本教材」 |
| 本分类候选展示总数 | 12 | 总入口 + 11 个并列学科入口 |
| 重复或异常资料 | 1 | PNG 教程文件，排除 |
| 建议专题合集 | 0 | 本批次不新增专题合集 |

## 资料、原始路径与关键词映射

| 资料入口 | 原始网盘路径 | 网站分类 | 关键词 | 夸克分享链接 |
| --- | --- | --- | --- | --- |
| 初中数学 | `长伴云衢千里明 / 初中系列 / 1.初中课本教材 / 初中数学` | `domain-junior-textbooks → type-junior-textbooks-math` | 初中、数学、初中数学、课本、教材 | https://pan.quark.cn/s/f2a5f8db1488 |
| 初中道法 | `长伴云衢千里明 / 初中系列 / 1.初中课本教材 / 初中道法` | `domain-junior-textbooks → type-junior-textbooks-dao-fa` | 初中、道法、政治、初中道法、课本、教材 | https://pan.quark.cn/s/069356cf37ac |
| 初中化学 | `长伴云衢千里明 / 初中系列 / 1.初中课本教材 / 初中化学` | `domain-junior-textbooks → type-junior-textbooks-chemistry` | 初中、化学、初中化学、课本、教材 | https://pan.quark.cn/s/400d605ff985 |
| 初中科学 | `长伴云衢千里明 / 初中系列 / 1.初中课本教材 / 初中科学` | `domain-junior-textbooks → type-junior-textbooks-science` | 初中、科学、初中科学、课本、教材 | https://pan.quark.cn/s/fc50433ee116 |
| 初中地理图册 | `长伴云衢千里明 / 初中系列 / 1.初中课本教材 / 初中地理图册` | `domain-junior-textbooks → type-junior-textbooks-geography-atlas` | 初中、地理、图册、初中地理图册、课本、教材 | https://pan.quark.cn/s/deb913818901 |
| 初中物理 | `长伴云衢千里明 / 初中系列 / 1.初中课本教材 / 初中物理` | `domain-junior-textbooks → type-junior-textbooks-physics` | 初中、物理、初中物理、课本、教材 | https://pan.quark.cn/s/80ae0a8dcb52 |
| 初中英语 | `长伴云衢千里明 / 初中系列 / 1.初中课本教材 / 初中英语` | `domain-junior-textbooks → type-junior-textbooks-english` | 初中、英语、初中英语、课本、教材 | https://pan.quark.cn/s/177698dcd33d |
| 初中地理 | `长伴云衢千里明 / 初中系列 / 1.初中课本教材 / 初中地理` | `domain-junior-textbooks → type-junior-textbooks-geography` | 初中、地理、初中地理、课本、教材 | https://pan.quark.cn/s/8c3b1f36692c |
| 初中生物 | `长伴云衢千里明 / 初中系列 / 1.初中课本教材 / 初中生物` | `domain-junior-textbooks → type-junior-textbooks-biology` | 初中、生物、初中生物、课本、教材 | https://pan.quark.cn/s/53a11989a2e0 |
| 初中语文 | `长伴云衢千里明 / 初中系列 / 1.初中课本教材 / 初中语文` | `domain-junior-textbooks → type-junior-textbooks-chinese` | 初中、语文、初中语文、课本、教材 | https://pan.quark.cn/s/1baeff9d6467 |
| 初中历史 | `长伴云衢千里明 / 初中系列 / 1.初中课本教材 / 初中历史` | `domain-junior-textbooks → type-junior-textbooks-history` | 初中、历史、初中历史、课本、教材 | https://pan.quark.cn/s/9bded0ceeadf |

## 分享链接核验

本批次复用前序已创建的 11 个永久公开分享链接，不重复创建。每个链接均已通过只读 `share-detail` 核验：返回成功、文件数为 1，分享标题与第一层文件夹名称一致；未收到额外通知或异常提示。

## 实际修改文件

1. `src/categories.ts`：新增 11 个「初中课本教材」下的三级学科分类。
2. `scripts/input/manifest.v1.source.fixture.json`：新增 11 条学科入口记录并映射到对应三级分类，保留总入口。
3. `scripts/b2-3-authorization-policy.ts`：新增 11 条入口的 Resource/Delivery 公开授权映射。
4. `scripts/verify-b2-3-public-output.mjs`：将 11 条入口纳入候选公开输出白名单。
5. `scripts/b2-3-build-input.test.ts`、`src/publicManifest.test.ts`、`src/categories.test.ts`：同步清单、分类树和入口断言。
6. `public/data/manifest.v1.json`：由构建脚本生成 85 条候选公开清单，其中本分类 12 条。

## 验证结果

- 候选清单构建：PASS，`sourceRecords=99`、`publicRecords=85`、`exposedLinks=85`、`omitted=14`。
- 完整构建：PASS，Vite 产物和 provenance 已生成。
- 公开输出门禁：PASS，`publicRecords=85`、`exposedLinks=85`、`metadataOnly=0`、`hiddenHistoricalRecords=14`。
- 全量测试：PASS，46 个测试文件、839 个测试通过。
- Lint：PASS，保留 3 条已有警告，未发现本批次新增错误。
- 浏览器预览：PASS，`http://127.0.0.1:4177/categories?categoryPath=stage-junior%2Cdomain-junior-textbooks` 显示「初中 / 课本教材」下的 11 个三级学科分类；`/resources?category=type-junior-textbooks-math` 显示 1 条初中数学资料。

## 追溯与发布边界

- 每条新增入口均保留原始网盘路径、网站分类和分享链接。
- 未修改网盘原始文件、目录或分享权限。
- 未修改既有分类 ID、路由、页面结构、搜索实现或收藏功能；仅新增 11 个已确认的三级分类 ID。
- 本记录只代表正确工作区的本地候选映射，不代表已经发布到线上。
