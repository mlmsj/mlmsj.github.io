export type PostgraduateSubject = "英语" | "政治" | "数学" | "专业课" | "专四专八";

export type PostgraduateCourse = {
  id: string;
  subject: PostgraduateSubject;
  rawTitle: string;
  shareUrl: string;
  itemCount: number;
  keywords?: readonly string[];
};

export type PostgraduateEnglishCourse = Omit<PostgraduateCourse, "subject">;

export const POSTGRADUATE_SUBJECTS: readonly PostgraduateSubject[] = [
  "英语",
  "政治",
  "数学",
  "专业课",
  "专四专八",
];

export const POSTGRADUATE_INDEX_META = {
  canonicalRoute: "/postgraduate/courses",
  sourceFolder: "27考研网课",
  sourceDirectoryCount: 134,
  emptyDirectoryCount: 12,
  publishedDirectoryCount: 122,
  publishedItemCount: 381,
} as const;

export const POSTGRADUATE_SUBJECT_META: Record<PostgraduateSubject, { directoryCount: number; publishedCount: number; publishedItemCount: number }> = {
  英语: { directoryCount: 41, publishedCount: 38, publishedItemCount: 127 },
  政治: { directoryCount: 24, publishedCount: 19, publishedItemCount: 45 },
  数学: { directoryCount: 38, publishedCount: 35, publishedItemCount: 103 },
  专业课: { directoryCount: 29, publishedCount: 28, publishedItemCount: 104 },
  专四专八: { directoryCount: 2, publishedCount: 2, publishedItemCount: 2 },
};

export const POSTGRADUATE_ENGLISH_COURSES: readonly PostgraduateEnglishCourse[] = [
  { id: "pg-eng-00", rawTitle: "00.【2027考研英语】书籍扫描", shareUrl: "https://pan.quark.cn/s/7e6768f7d3b8", itemCount: 3, keywords: ["考研英语", "书籍", "扫描", "2027"] },
  { id: "pg-eng-01", rawTitle: "01.【2027考研英语】李旭高途腾飞班！", shareUrl: "https://pan.quark.cn/s/df7079b3bfe0", itemCount: 1, keywords: ["考研英语", "李旭", "高途", "腾飞班", "2027"] },
  { id: "pg-eng-02", rawTitle: "02.【2027考研英语】周思成一笑而过！", shareUrl: "https://pan.quark.cn/s/497e2fa86ed0", itemCount: 2, keywords: ["考研英语", "周思成", "一笑而过", "2027"] },
  { id: "pg-eng-03", rawTitle: "03.【2027考研英语】田静启航全程班！", shareUrl: "https://pan.quark.cn/s/6bc0d82006bd", itemCount: 2, keywords: ["考研英语", "田静", "启航", "全程班", "2027"] },
  { id: "pg-eng-04", rawTitle: "04.【2027考研英语】陈锦斌马天启航！", shareUrl: "https://pan.quark.cn/s/89abe84e6e23", itemCount: 2, keywords: ["考研英语", "陈锦斌", "马天", "启航", "2027"] },
  { id: "pg-eng-05", rawTitle: "05.【2027考研英语】屠浩民研途全程！", shareUrl: "https://pan.quark.cn/s/ce1ca1c2b4b8", itemCount: 4, keywords: ["考研英语", "屠浩民", "研途", "全程", "2027"] },
  { id: "pg-eng-06", rawTitle: "06.【2027考研英语】刘晓燕学丞全程！", shareUrl: "https://pan.quark.cn/s/36066c02f0eb", itemCount: 2, keywords: ["考研英语", "刘晓燕", "学丞", "全程", "2027"] },
  { id: "pg-eng-07", rawTitle: "07.【2027考研英语】王江涛新东方班！", shareUrl: "https://pan.quark.cn/s/c789e15b8d7f", itemCount: 3, keywords: ["考研英语", "王江涛", "新东方", "2027"] },
  { id: "pg-eng-08", rawTitle: "08.【2027考研英语】无忧计划新东方！", shareUrl: "https://pan.quark.cn/s/85c23a984557", itemCount: 1, keywords: ["考研英语", "无忧计划", "新东方", "2027"] },
  { id: "pg-eng-09", rawTitle: "09.【2027考研英语】直通车新东方班！", shareUrl: "https://pan.quark.cn/s/bf904435c413", itemCount: 1, keywords: ["考研英语", "直通车", "新东方", "2027"] },
  { id: "pg-eng-10", rawTitle: "10.【2027考研英语】北大老祁金榜班！", shareUrl: "https://pan.quark.cn/s/362925e57fef", itemCount: 5, keywords: ["考研英语", "北大老祁", "金榜", "2027"] },
  { id: "pg-eng-11", rawTitle: "11.【2027考研英语】石雷鹏橙啦SPA！", shareUrl: "https://pan.quark.cn/s/dca21c73ca6d", itemCount: 3, keywords: ["考研英语", "石雷鹏", "橙啦", "SPA", "2027"] },
  { id: "pg-eng-12", rawTitle: "12.【2027考研英语】商志笑傲江湖班！", shareUrl: "https://pan.quark.cn/s/39065b5aa583", itemCount: 1, keywords: ["考研英语", "商志", "笑傲江湖", "2027"] },
  { id: "pg-eng-13", rawTitle: "13.【2027考研英语】颉斌斌哔哩全程！", shareUrl: "https://pan.quark.cn/s/1ad6cbcf7ad3", itemCount: 6, keywords: ["考研英语", "颉斌斌", "哔哩", "全程", "2027"] },
  { id: "pg-eng-14", rawTitle: "14.【2027考研英语】杨帆新文道全程！", shareUrl: "https://pan.quark.cn/s/a6b57d4b2c53", itemCount: 9, keywords: ["考研英语", "杨帆", "新文道", "全程", "2027"] },
  { id: "pg-eng-15", rawTitle: "15.【2027考研英语】王晶婷英语全程！", shareUrl: "https://pan.quark.cn/s/eaf93a12ea44", itemCount: 5, keywords: ["考研英语", "王晶婷", "英语", "全程", "2027"] },
  { id: "pg-eng-16", rawTitle: "16.【2027考研英语】柴荣英语全程班！", shareUrl: "https://pan.quark.cn/s/87d8c3f46a99", itemCount: 4, keywords: ["考研英语", "柴荣", "英语", "全程班", "2027"] },
  { id: "pg-eng-17", rawTitle: "17.【2027考研英语】石雷鹏李达哔哩！", shareUrl: "https://pan.quark.cn/s/06d63eb7cd93", itemCount: 8, keywords: ["考研英语", "石雷鹏", "李达", "哔哩", "2027"] },
  { id: "pg-eng-18", rawTitle: "18.【2027考研英语】唐迟有道领学班！", shareUrl: "https://pan.quark.cn/s/fedd1989108a", itemCount: 2, keywords: ["考研英语", "唐迟", "有道", "领学班", "2027"] },
  { id: "pg-eng-19", rawTitle: "19.【2027考研英语】童琴粉笔全程班！", shareUrl: "https://pan.quark.cn/s/0cb979ad3cbc", itemCount: 2, keywords: ["考研英语", "童琴", "粉笔", "全程班", "2027"] },
  { id: "pg-eng-20", rawTitle: "20.【2027考研英语】陈正康乐学全程！", shareUrl: "https://pan.quark.cn/s/f6e7e746839e", itemCount: 2, keywords: ["考研英语", "陈正康", "乐学", "全程", "2027"] },
  { id: "pg-eng-21", rawTitle: "21.【2027考研英语】刘琦英语弟子班！", shareUrl: "https://pan.quark.cn/s/d4eed629277f", itemCount: 4, keywords: ["考研英语", "刘琦", "弟子班", "2027"] },
  { id: "pg-eng-22", rawTitle: "22.【2027考研英语】韩苏陈曲小黑班！", shareUrl: "https://pan.quark.cn/s/d023a4c94018", itemCount: 9, keywords: ["考研英语", "韩苏", "陈曲", "小黑班", "2027"] },
  { id: "pg-eng-23", rawTitle: "23.【2027考研英语】哔哩唐迟全程班！", shareUrl: "https://pan.quark.cn/s/0c174d7046aa", itemCount: 7, keywords: ["考研英语", "唐迟", "哔哩", "全程班", "2027"] },
  { id: "pg-eng-24", rawTitle: "24.【2027考研英语】飞飞哔哩全程班！", shareUrl: "https://pan.quark.cn/s/00f494bc310b", itemCount: 1, keywords: ["考研英语", "飞飞", "哔哩", "全程班", "2027"] },
  { id: "pg-eng-25", rawTitle: "25.【2027考研英语】皮卡爽爽全程班！", shareUrl: "https://pan.quark.cn/s/d0c2c10d8788", itemCount: 1, keywords: ["考研英语", "皮卡爽爽", "全程班", "2027"] },
  { id: "pg-eng-26", rawTitle: "26.【2027考研英语】刘晓燕小鹅全程！", shareUrl: "https://pan.quark.cn/s/459d38ba32bd", itemCount: 6, keywords: ["考研英语", "刘晓燕", "小鹅", "全程", "2027"] },
  { id: "pg-eng-27", rawTitle: "27.【2027考研英语】曲成超小鹅全程！", shareUrl: "https://pan.quark.cn/s/b7cbf6a6b6ae", itemCount: 2, keywords: ["考研英语", "曲成超", "小鹅", "全程", "2027"] },
  { id: "pg-eng-28", rawTitle: "28.【2027考研英语】Monkey全心全意！", shareUrl: "https://pan.quark.cn/s/e61d4f4d82e1", itemCount: 2, keywords: ["考研英语", "Monkey", "全心全意", "2027"] },
  { id: "pg-eng-29", rawTitle: "29.【2027考研英语】周兆鑫小鹅全程！", shareUrl: "https://pan.quark.cn/s/ab5b6612cf39", itemCount: 3, keywords: ["考研英语", "周兆鑫", "小鹅", "全程", "2027"] },
  { id: "pg-eng-30", rawTitle: "30.【2027考研英语】KiKi英语大迈保姆！", shareUrl: "https://pan.quark.cn/s/a7e3f7e98be0", itemCount: 7, keywords: ["考研英语", "KiKi", "大迈", "保姆", "2027"] },
  { id: "pg-eng-31", rawTitle: "31.【2027考研英语】琦哥零基础全程！", shareUrl: "https://pan.quark.cn/s/e248208fa132", itemCount: 1, keywords: ["考研英语", "琦哥", "零基础", "全程", "2027"] },
  { id: "pg-eng-34", rawTitle: "34.【2027考研英语】数大仙英语全程！", shareUrl: "https://pan.quark.cn/s/ae4e359e851a", itemCount: 1, keywords: ["考研英语", "数大仙", "英语", "全程", "2027"] },
  { id: "pg-eng-35", rawTitle: "35.【2027考研英语】朱伟英语全程班！", shareUrl: "https://pan.quark.cn/s/8cd83aa251ff", itemCount: 4, keywords: ["考研英语", "朱伟", "英语", "全程班", "2027"] },
  { id: "pg-eng-36", rawTitle: "36.【2027考研英语】程思斐英语全程！", shareUrl: "https://pan.quark.cn/s/b4b250f5dafc", itemCount: 1, keywords: ["考研英语", "程思斐", "英语", "全程", "2027"] },
  { id: "pg-eng-37", rawTitle: "37.【2027考研英语】八哥英语全程班！", shareUrl: "https://pan.quark.cn/s/27d8197d0e39", itemCount: 5, keywords: ["考研英语", "八哥", "英语", "全程班", "2027"] },
  { id: "pg-eng-39", rawTitle: "39.【2027考研英语】鹿吖英语全程班！", shareUrl: "https://pan.quark.cn/s/e7619e018130", itemCount: 3, keywords: ["考研英语", "鹿吖", "英语", "全程班", "2027"] },
  { id: "pg-eng-40", rawTitle: "40.【2027考研英语】优路英语全程班！", shareUrl: "https://pan.quark.cn/s/b912a64e0579", itemCount: 2, keywords: ["考研英语", "优路", "英语", "全程班", "2027"] },
] as const;

type PostgraduateSeed = Omit<PostgraduateCourse, "subject" | "keywords">;

const buildPostgraduateCourses = (
  subject: PostgraduateSubject,
  seeds: readonly PostgraduateSeed[],
): readonly PostgraduateCourse[] => seeds.map((course) => ({
  ...course,
  subject,
  keywords: [
    subject,
    course.rawTitle
      .replace(/^\d+\./, "")
      .replace(/^【[^】]+】/, "")
      .replace(/[！!]+$/, "")
      .trim(),
  ],
}));

export const POSTGRADUATE_POLITICS_COURSES = buildPostgraduateCourses("政治", [
  { id: "pg-pol-01", rawTitle: "01.【2027考研政治】徐涛研途全程班！", shareUrl: "https://pan.quark.cn/s/f8d40e367fc3", itemCount: 3 },
  { id: "pg-pol-02", rawTitle: "02.【2027考研政治】腿姐笑过全程班！", shareUrl: "https://pan.quark.cn/s/b1376e208b92", itemCount: 2 },
  { id: "pg-pol-03", rawTitle: "03.【2027考研政治】石磊高途早鸟班！", shareUrl: "https://pan.quark.cn/s/e68d0052820f", itemCount: 1 },
  { id: "pg-pol-04", rawTitle: "04.【2027考研政治】王一珉东方全程！", shareUrl: "https://pan.quark.cn/s/a759bc34b0c2", itemCount: 1 },
  { id: "pg-pol-05", rawTitle: "05.【2027考研政治】王一珉东方直通！", shareUrl: "https://pan.quark.cn/s/eda238fbd4f9", itemCount: 1 },
  { id: "pg-pol-06", rawTitle: "06.【2027考研政治】喻攀橙啦SPA班！", shareUrl: "https://pan.quark.cn/s/21e0bb77e811", itemCount: 2 },
  { id: "pg-pol-07", rawTitle: "07.【2027考研政治】万磊新文道全程！", shareUrl: "https://pan.quark.cn/s/829aaa3e42a2", itemCount: 1 },
  { id: "pg-pol-08", rawTitle: "08.【2027考研政治】王吉启航SVIP班！", shareUrl: "https://pan.quark.cn/s/fb3c7cb733cf", itemCount: 1 },
  { id: "pg-pol-09", rawTitle: "09.【2027考研政治】王吉启航全程包！", shareUrl: "https://pan.quark.cn/s/0c90b0269b42", itemCount: 1 },
  { id: "pg-pol-10", rawTitle: "10.【2027考研政治】韩雪金榜SVIP班！", shareUrl: "https://pan.quark.cn/s/ca6df047a587", itemCount: 1 },
  { id: "pg-pol-11", rawTitle: "11.【2027考研政治】喻攀哔哩全程班！", shareUrl: "https://pan.quark.cn/s/02db3bf2ffe2", itemCount: 4 },
  { id: "pg-pol-12", rawTitle: "12.【2027考研政治】米鹏有道领学班！", shareUrl: "https://pan.quark.cn/s/458d09189d15", itemCount: 1 },
  { id: "pg-pol-13", rawTitle: "13.【2027考研政治】卢欣粉笔全程班！", shareUrl: "https://pan.quark.cn/s/b886bfc8cc77", itemCount: 2 },
  { id: "pg-pol-15", rawTitle: "15.【2027考研政治】米鹏小黑全程班！", shareUrl: "https://pan.quark.cn/s/f79445eb89f7", itemCount: 2 },
  { id: "pg-pol-19", rawTitle: "19.【2027考研政治】孔昱力政治全程！", shareUrl: "https://pan.quark.cn/s/5bb0bc9e5038", itemCount: 1 },
  { id: "pg-pol-20", rawTitle: "20.【2027考研政治】余峰政治全程班！", shareUrl: "https://pan.quark.cn/s/5eaa35e6c780", itemCount: 8 },
  { id: "pg-pol-21", rawTitle: "21.【2027考研政治】苏一政治托管班！", shareUrl: "https://pan.quark.cn/s/1251a1939cfb", itemCount: 10 },
  { id: "pg-pol-23", rawTitle: "23.【2027考研政治】鹿吖政治全程班！", shareUrl: "https://pan.quark.cn/s/2d48556b3935", itemCount: 1 },
  { id: "pg-pol-24", rawTitle: "24.【2027考研政治】优路政治全程班！", shareUrl: "https://pan.quark.cn/s/2c743b37bfd2", itemCount: 2 },
]);

export const POSTGRADUATE_MATH_COURSES = buildPostgraduateCourses("数学", [
  { id: "pg-math-00", rawTitle: "00.书籍扫描", shareUrl: "https://pan.quark.cn/s/7417379a919b", itemCount: 4 },
  { id: "pg-math-01", rawTitle: "01.【2027考研数学】武忠祥有道领学班！", shareUrl: "https://pan.quark.cn/s/e11d3afb9df7", itemCount: 4 },
  { id: "pg-math-02", rawTitle: "02.【2027考研数学】周洋鑫笑过全程班！", shareUrl: "https://pan.quark.cn/s/3f20efffdb3e", itemCount: 9 },
  { id: "pg-math-03", rawTitle: "03.【2027考研数学】张宇等启航专属班！", shareUrl: "https://pan.quark.cn/s/55d9b75c0769", itemCount: 2 },
  { id: "pg-math-04", rawTitle: "04.【2027考研数学】高坤轮启航全程班！", shareUrl: "https://pan.quark.cn/s/2b13a9bd8bc4", itemCount: 1 },
  { id: "pg-math-05", rawTitle: "05.【2027考研数学】杨超等研途全程班！", shareUrl: "https://pan.quark.cn/s/f7c8142bca33", itemCount: 4 },
  { id: "pg-math-06", rawTitle: "06.【2027考研数学】王博等全程PRO班！", shareUrl: "https://pan.quark.cn/s/462d7f2ce237", itemCount: 3 },
  { id: "pg-math-07", rawTitle: "07.【2027考研数学】汤家凤哔哩全程班！", shareUrl: "https://pan.quark.cn/s/ca8c18f0dc3d", itemCount: 5 },
  { id: "pg-math-08", rawTitle: "08.【2027考研数学】宋浩等哔哩全程班！", shareUrl: "https://pan.quark.cn/s/23b3c8791f4a", itemCount: 6 },
  { id: "pg-math-09", rawTitle: "09.【2027考研数学】边一橙啦SPA班！", shareUrl: "https://pan.quark.cn/s/9dd59a6b238f", itemCount: 6 },
  { id: "pg-math-10", rawTitle: "10.【2027考研数学】唐五龙文道全程班！", shareUrl: "https://pan.quark.cn/s/cecea2be4d01", itemCount: 3 },
  { id: "pg-math-11", rawTitle: "11.【2027考研数学】王喆等高途腾飞班！", shareUrl: "https://pan.quark.cn/s/4e70fad1f290", itemCount: 2 },
  { id: "pg-math-12", rawTitle: "12.【2027考研数学】聂岩新东方全程班！", shareUrl: "https://pan.quark.cn/s/3727e5d13913", itemCount: 1 },
  { id: "pg-math-13", rawTitle: "13.【2027考研数学】聂岩新东方直通车！", shareUrl: "https://pan.quark.cn/s/ef66aad6480f", itemCount: 1 },
  { id: "pg-math-14", rawTitle: "14.【2027考研数学】李永乐金榜SVIP班！", shareUrl: "https://pan.quark.cn/s/8408a7e83b49", itemCount: 1 },
  { id: "pg-math-15", rawTitle: "15.【2027考研数学】宋浩、薛威金榜班！", shareUrl: "https://pan.quark.cn/s/185dacfe366e", itemCount: 2 },
  { id: "pg-math-16", rawTitle: "16.【2027考研数学】Kira数学全程VIP班！", shareUrl: "https://pan.quark.cn/s/b363311b957a", itemCount: 2 },
  { id: "pg-math-17", rawTitle: "17.【2027考研数学】李振等粉笔全程班！", shareUrl: "https://pan.quark.cn/s/00c2990f105e", itemCount: 2 },
  { id: "pg-math-18", rawTitle: "18.【2027考研数学】李飞小黑课堂全程！", shareUrl: "https://pan.quark.cn/s/24cac25d8cc3", itemCount: 13 },
  { id: "pg-math-21", rawTitle: "21.【2027考研数学】李烈有赞课堂全程！", shareUrl: "https://pan.quark.cn/s/13426c550601", itemCount: 3 },
  { id: "pg-math-22", rawTitle: "22.【2027考研数学】张宇哔哩零基础班！", shareUrl: "https://pan.quark.cn/s/e3d387291984", itemCount: 1 },
  { id: "pg-math-23", rawTitle: "23.【2027考研数学】大头圆小鹅高配班！", shareUrl: "https://pan.quark.cn/s/da2892ce31b0", itemCount: 1 },
  { id: "pg-math-24", rawTitle: "24.【2027考研数学】小侯七✖亚瑟弟子！", shareUrl: "https://pan.quark.cn/s/506a69098ff6", itemCount: 5 },
  { id: "pg-math-25", rawTitle: "25.【2027考研数学】大雪深埋epsilon班！", shareUrl: "https://pan.quark.cn/s/e81d783dedb5", itemCount: 1 },
  { id: "pg-math-26", rawTitle: "26.【2027考研数学】李永乐线代全程班！", shareUrl: "https://pan.quark.cn/s/13eb67716623", itemCount: 2 },
  { id: "pg-math-27", rawTitle: "27.【2027考研数学】没咋了数学全程班！", shareUrl: "https://pan.quark.cn/s/1881e953b467", itemCount: 2 },
  { id: "pg-math-28", rawTitle: "28.【2027考研数学】777考研数学全程！", shareUrl: "https://pan.quark.cn/s/339587b684cb", itemCount: 3 },
  { id: "pg-math-29", rawTitle: "29.【2027考研数学】李永乐哔哩线代班！", shareUrl: "https://pan.quark.cn/s/67c7dad23e7b", itemCount: 2 },
  { id: "pg-math-30", rawTitle: "30.【2027考研数学】俞老、良哥全程班！", shareUrl: "https://pan.quark.cn/s/883d3e0782f3", itemCount: 2 },
  { id: "pg-math-31", rawTitle: "31.【2027考研数学】郭伟数学弟子全程！", shareUrl: "https://pan.quark.cn/s/ce66876fe7d5", itemCount: 2 },
  { id: "pg-math-32", rawTitle: "32.【2027考研数学】王谱数学欧拉全程！", shareUrl: "https://pan.quark.cn/s/5c2d92d7e7ca", itemCount: 2 },
  { id: "pg-math-33", rawTitle: "33.【2027考研数学】邂逅遗憾思维课班！", shareUrl: "https://pan.quark.cn/s/626e1ebf7bee", itemCount: 2 },
  { id: "pg-math-34", rawTitle: "34.【2027考研数学】泰勒学长零基础班！", shareUrl: "https://pan.quark.cn/s/bfa82aeae2b6", itemCount: 1 },
  { id: "pg-math-36", rawTitle: "36.【2027考研数学】娜姐考研数学全程！", shareUrl: "https://pan.quark.cn/s/45e2b32f92c9", itemCount: 1 },
  { id: "pg-math-37", rawTitle: "37.【2027考研数学】优路考研数学全程！", shareUrl: "https://pan.quark.cn/s/9f9824a9441d", itemCount: 2 },
]);

export const POSTGRADUATE_PROFESSIONAL_COURSES = buildPostgraduateCourses("专业课", [
  { id: "pg-pro-01", rawTitle: "01.【2027考研专业课】管综高端全程！", shareUrl: "https://pan.quark.cn/s/4e66a32834df", itemCount: 19 },
  { id: "pg-pro-02", rawTitle: "02.【2027考研专业课】计算机高端班！", shareUrl: "https://pan.quark.cn/s/170a36bf11c8", itemCount: 11 },
  { id: "pg-pro-03", rawTitle: "03.【2027考研专业课】口腔高端全程！", shareUrl: "https://pan.quark.cn/s/e8cc3e4cec2e", itemCount: 1 },
  { id: "pg-pro-04", rawTitle: "04.【2027考研专业课】中医高端全程！", shareUrl: "https://pan.quark.cn/s/4457da0231d2", itemCount: 3 },
  { id: "pg-pro-05", rawTitle: "05.【2027考研专业课】西医高端全程！", shareUrl: "https://pan.quark.cn/s/63befaa5820c", itemCount: 8 },
  { id: "pg-pro-06", rawTitle: "06.【2027考研专业课】机械高端全程！", shareUrl: "https://pan.quark.cn/s/8bf91aefdccd", itemCount: 3 },
  { id: "pg-pro-07", rawTitle: "07.【2027考研专业课】日语高端全程！", shareUrl: "https://pan.quark.cn/s/88e42a677c7f", itemCount: 5 },
  { id: "pg-pro-08", rawTitle: "08.【2027考研专业课】护理高端全程！", shareUrl: "https://pan.quark.cn/s/9eeb306463a2", itemCount: 7 },
  { id: "pg-pro-09", rawTitle: "09.【2027考研专业课】教育学高端班！", shareUrl: "https://pan.quark.cn/s/b691c8b438c7", itemCount: 2 },
  { id: "pg-pro-10", rawTitle: "10.【2027考研专业课】法硕高端全程！", shareUrl: "https://pan.quark.cn/s/b892ce2f514c", itemCount: 5 },
  { id: "pg-pro-11", rawTitle: "11.【2027考研专业课】翻译硕士高端！", shareUrl: "https://pan.quark.cn/s/687c61ebef00", itemCount: 2 },
  { id: "pg-pro-12", rawTitle: "12.【2027考研专业课】431金融高端！", shareUrl: "https://pan.quark.cn/s/713cbec3cafa", itemCount: 4 },
  { id: "pg-pro-13", rawTitle: "13.【2027考研专业课】396经综高端！", shareUrl: "https://pan.quark.cn/s/c10a351cc253", itemCount: 6 },
  { id: "pg-pro-14", rawTitle: "14.【2027考研专业课】心理学高端班！", shareUrl: "https://pan.quark.cn/s/4ab40497f0b4", itemCount: 2 },
  { id: "pg-pro-15", rawTitle: "15.【2027考研专业课】历史学高端班！", shareUrl: "https://pan.quark.cn/s/b5224ff2e644", itemCount: 3 },
  { id: "pg-pro-16", rawTitle: "16.【2027考研专业课】公共卫生高端！", shareUrl: "https://pan.quark.cn/s/571d9d64da5a", itemCount: 1 },
  { id: "pg-pro-18", rawTitle: "18.【2027考研专业课】马克思高端班！", shareUrl: "https://pan.quark.cn/s/d792ded9de3e", itemCount: 1 },
  { id: "pg-pro-19", rawTitle: "19.【2027考研专业课】材料科学基础！", shareUrl: "https://pan.quark.cn/s/bf5646f09ba3", itemCount: 1 },
  { id: "pg-pro-20", rawTitle: "20.【2027考研专业课】社会工作高端！", shareUrl: "https://pan.quark.cn/s/bf19595ca49f", itemCount: 1 },
  { id: "pg-pro-21", rawTitle: "21.【2027考研专业课】艺术美术高端！", shareUrl: "https://pan.quark.cn/s/5a2cce58903a", itemCount: 1 },
  { id: "pg-pro-22", rawTitle: "22.【2027考研专业课】信号系统高端！", shareUrl: "https://pan.quark.cn/s/0de9701681e0", itemCount: 1 },
  { id: "pg-pro-23", rawTitle: "23.【2027考研专业课】电路电子高端！", shareUrl: "https://pan.quark.cn/s/3ba692021db1", itemCount: 6 },
  { id: "pg-pro-24", rawTitle: "24.【2027考研专业课】自动控制高端！", shareUrl: "https://pan.quark.cn/s/09db700684b7", itemCount: 1 },
  { id: "pg-pro-25", rawTitle: "25.【2027考研专业课】电气电分高端！", shareUrl: "https://pan.quark.cn/s/6a55a307da66", itemCount: 2 },
  { id: "pg-pro-26", rawTitle: "26.【2027考研专业课】农学高端班！", shareUrl: "https://pan.quark.cn/s/3b179cd7d7e5", itemCount: 4 },
  { id: "pg-pro-27", rawTitle: "27.【2027考研专业课】经济学高端！", shareUrl: "https://pan.quark.cn/s/d7cbdb02cb6c", itemCount: 1 },
  { id: "pg-pro-28", rawTitle: "28.【2027考研专业课】化工原理高端！", shareUrl: "https://pan.quark.cn/s/589564341e56", itemCount: 1 },
  { id: "pg-pro-29", rawTitle: "29.【2027考研专业课】应统432高端！", shareUrl: "https://pan.quark.cn/s/e505b7ff196e", itemCount: 2 },
]);

export const POSTGRADUATE_SPECIAL_COURSES = buildPostgraduateCourses("专四专八", [
  { id: "pg-special-01", rawTitle: "01.【专四英语】", shareUrl: "https://pan.quark.cn/s/f035f8c09d92", itemCount: 1 },
  { id: "pg-special-02", rawTitle: "02.【专八英语】", shareUrl: "https://pan.quark.cn/s/1b1f589c16ba", itemCount: 1 },
]);

export const POSTGRADUATE_COURSES_BY_SUBJECT: Record<PostgraduateSubject, readonly PostgraduateCourse[]> = {
  英语: POSTGRADUATE_ENGLISH_COURSES.map((course) => ({ ...course, subject: "英语" })),
  政治: POSTGRADUATE_POLITICS_COURSES,
  数学: POSTGRADUATE_MATH_COURSES,
  专业课: POSTGRADUATE_PROFESSIONAL_COURSES,
  专四专八: POSTGRADUATE_SPECIAL_COURSES,
};

export const postgraduateCourseDisplayName = (course: { rawTitle: string }) =>
  course.rawTitle
    .replace(/^\d+\./, "")
    .replace(/^【[^】]+】/, "")
    .replace(/[！!]+$/, "")
    .trim();

export const searchPostgraduateCourses = (
  courses: readonly PostgraduateCourse[],
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...courses];
  return courses.filter((course) =>
    [course.rawTitle, postgraduateCourseDisplayName(course), ...(course.keywords ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
};

export type PostgraduateSearchTarget = {
  subject: PostgraduateSubject;
  matches: readonly PostgraduateCourse[];
};

/**
 * Resolve a global search term to the most relevant postgraduate subject.
 * The course page can then preserve its subject-scoped layout while the
 * homepage and library search still reach teacher/agency entries directly.
 */
export const getPostgraduateSearchTarget = (
  query: string,
): PostgraduateSearchTarget | null => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return null;

  const candidates = POSTGRADUATE_SUBJECTS.map((subject) => ({
    subject,
    matches: searchPostgraduateCourses(
      POSTGRADUATE_COURSES_BY_SUBJECT[subject],
      normalizedQuery,
    ),
  })).filter((candidate) => candidate.matches.length > 0);

  if (candidates.length === 0) return null;

  const exactSubject = candidates.find(
    (candidate) => candidate.subject.toLowerCase() === normalizedQuery,
  );
  if (exactSubject) return exactSubject;

  return candidates.reduce((best, candidate) =>
    candidate.matches.length > best.matches.length ? candidate : best,
  );
};

export const searchPostgraduateEnglishCourses = (query: string) =>
  searchPostgraduateCourses(POSTGRADUATE_COURSES_BY_SUBJECT.英语, query);
