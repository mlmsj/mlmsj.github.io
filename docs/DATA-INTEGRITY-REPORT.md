# 高中课程数据完整性报告

## 课程核心索引

- 总课程数：27。
- 高一：9 门。
- 高二：9 门。
- 高三：9 门。
- `packageYear + grade + subject` 核心键唯一。
- 未新增 `academicYear` 字段或年份筛选器。

## 教师展示层

- 教师入口总数：178。
- `teacherKey` 唯一。
- 分享链接唯一且均为允许的 Quark 分享 URL。
- 同名教师在不同年级或学科中按原始目录标签分别保留。
- 未虚构教师介绍、评价或资源数量。

## 发布门禁

- 当前正式公开 manifest：175 条 public records、175 条 exposed links。
- `metadataOnly=0`、`omitted=14`。
- 隔离候选 15,231 条未加入公开资源列表。
- 课程入口验收不等同于候选 Resource 发布；没有已审核公开资料的课程显示空状态。

