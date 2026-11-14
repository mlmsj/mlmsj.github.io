# 高中课程索引整合说明

## 数据层

- `src/highSchoolCourseIndex.ts`：统一的 2027 高中课程索引。
- `src/highSchoolTeacherIndex.ts`：教师展示层适配器，按课程核心键分组，不改变课程主键。
- `src/highSchoolCourseIndex.test.ts` 与 `src/highSchoolTeacherIndex.test.ts`：课程和教师入口完整性测试。

教师记录保留 `courseId`、`resourceId`、`entityId`、`registryKey`、`sourcePath`、`sourcePathMapping` 与原始目录标签。教师仅是展示层辅助信息，不建立教师级资源树，也没有新增年份筛选器。

## 门禁

教师卡片只接受关联课程已验证且符合 `https://pan.quark.cn/s/...` 形式的公开分享链接。候选资源不参与教师公开列表，正式 manifest 的发布数量与课程入口数量分开统计。

## UI

`src/HighSchoolCoursesPage.tsx` 保留三级选择逻辑：2027 课程版本 → 年级 → 学科 → 教师资料入口。教师卡片为外链，不增加课程详情、讲次或视频讲义中间页。

`src/highSchoolSearch.ts` 复用同一课程索引，将已审核正式资源的名称、文件名、来源路径与教师目录路径纳入关键词匹配；隔离候选不参与搜索。

