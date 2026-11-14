import {
  HIGH_SCHOOL_COURSE_INDEX,
  getHighSchoolCourse,
  type HighSchoolGrade,
  type HighSchoolSubject,
  type SourcePathMapping,
} from "./highSchoolCourseIndex";

export type HighSchoolTeacher = {
  teacherKey: string;
  entityId: string;
  rawDirectoryName: string;
  displayName: string;
  grade: HighSchoolGrade;
  subject: HighSchoolSubject;
  courseId: string;
  courseKey: string;
  sourcePath: string;
  sourcePathMapping: SourcePathMapping;
  courseSourcePathMapping: SourcePathMapping;
  shareUrl: string;
  linkStatus: "published";
  identityStatus: "raw_directory_label";
};

type TeacherLinkRecord = readonly [
  HighSchoolGrade,
  HighSchoolSubject,
  string,
  string,
  string,
];

export const HIGH_SCHOOL_TEACHER_LINK_RECORDS: readonly TeacherLinkRecord[] = [
  ["高二", "语文", "【03】2027年高二语文谢欣然", "谢欣然", "https://pan.quark.cn/s/0dd6b5f036b1"],
  ["高二", "语文", "【01】2027年高二语文国家玮", "国家玮", "https://pan.quark.cn/s/08650cff4665"],
  ["高二", "语文", "【04】2027年高二语文罗斐然", "罗斐然", "https://pan.quark.cn/s/06fcc82fd403"],
  ["高二", "语文", "【05】2027年高二语文姜博杨", "姜博杨", "https://pan.quark.cn/s/a7c388f3ab7a"],
  ["高二", "语文", "【06】2027年高二语文王淏然", "王淏然", "https://pan.quark.cn/s/3391d6c5be8c"],
  ["高二", "语文", "【02】2027年高二语文乘风", "乘风", "https://pan.quark.cn/s/8e8efa23f7da"],
  ["高三", "语文", "【06】2027年高三语文陈瑞春", "陈瑞春", "https://pan.quark.cn/s/f5fc74ca0388"],
  ["高三", "语文", "【04】2027年高三语文杨洋", "杨洋", "https://pan.quark.cn/s/e4c05f6828b2"],
  ["高三", "语文", "【01】2027年高三语文国家玮", "国家玮", "https://pan.quark.cn/s/ecd470876e9e"],
  ["高三", "语文", "【03】2027年高三语文姜博杨", "姜博杨", "https://pan.quark.cn/s/1b00a38fc7dc"],
  ["高三", "语文", "【02】2027年高三语文乘风", "乘风", "https://pan.quark.cn/s/9d744ffa94c3"],
  ["高三", "语文", "【07】2027年高三语文郭笑", "郭笑", "https://pan.quark.cn/s/4662265eba55"],
  ["高三", "语文", "【09】2027年高三金语文亦珊", "金语文亦珊", "https://pan.quark.cn/s/165640e3af09"],
  ["高三", "语文", "【05】2027年高三语文陈焕文", "陈焕文", "https://pan.quark.cn/s/8257bc01b84c"],
  ["高三", "语文", "【08】2027年高三语文叁月聚粮", "叁月聚粮", "https://pan.quark.cn/s/5eb26d0cf8f5"],
  ["高一", "语文", "【04】2027年高一语文谢欣然", "谢欣然", "https://pan.quark.cn/s/5e37a2075184"],
  ["高一", "语文", "【03】2027年高一语文马昕", "马昕", "https://pan.quark.cn/s/475ae501c13f"],
  ["高一", "语文", "【06】2027年高一语文张烔一", "张烔一", "https://pan.quark.cn/s/be107ff64871"],
  ["高一", "语文", "【01】2027年高一语文国家玮", "国家玮", "https://pan.quark.cn/s/7184f709e30d"],
  ["高一", "语文", "【07】2027年高一语文郑会英", "郑会英", "https://pan.quark.cn/s/cb0e0e3a204b"],
  ["高一", "语文", "【05】2027年高一语文李建华", "李建华", "https://pan.quark.cn/s/3e578f73c8c6"],
  ["高一", "语文", "【02】2027年高一语文乘风", "乘风", "https://pan.quark.cn/s/804c3d51906c"],
  ["高二", "数学", "【02】2027年高二数学胡源", "胡源", "https://pan.quark.cn/s/f4e8300ff7e4"],
  ["高二", "数学", "【08】2027年高二数学刘秋龙", "刘秋龙", "https://pan.quark.cn/s/76b629dee81a"],
  ["高二", "数学", "【01】2027年高二数学赵礼显", "赵礼显", "https://pan.quark.cn/s/d78de458a7b8"],
  ["高二", "数学", "【04】2027年高二数学韩佳伟", "韩佳伟", "https://pan.quark.cn/s/91fcf30725a0"],
  ["高二", "数学", "【03】2027年高二数学周帅", "周帅", "https://pan.quark.cn/s/b69ee12058d0"],
  ["高二", "数学", "【11】2027高二数学傅博宇", "傅博宇", "https://pan.quark.cn/s/0793be1204ce"],
  ["高二", "数学", "【05】2027年高二数学陈雪", "陈雪", "https://pan.quark.cn/s/3417cdb5481e"],
  ["高二", "数学", "【06】2027年高二数学祖少磊", "祖少磊", "https://pan.quark.cn/s/e4f26865cd70"],
  ["高二", "数学", "【10】2027年高二数学王子悦", "王子悦", "https://pan.quark.cn/s/954bec361919"],
  ["高二", "数学", "【07】2027年高二数学付力", "付力", "https://pan.quark.cn/s/7fd39970a90f"],
  ["高二", "数学", "【09】2027年高二数学徐迅", "徐迅", "https://pan.quark.cn/s/5bad0b274ac3"],
  ["高三", "数学", "【05】2027年高三数学肖晗", "肖晗", "https://pan.quark.cn/s/fd3c04dedb4f"],
  ["高三", "数学", "【06】2027年高三数学贾帅", "贾帅", "https://pan.quark.cn/s/d2e8aba8853d"],
  ["高三", "数学", "【07】2027年高三数学张华", "张华", "https://pan.quark.cn/s/16959bfc3833"],
  ["高三", "数学", "【01】2027年高三数学赵礼显", "赵礼显", "https://pan.quark.cn/s/09b5807c6086"],
  ["高三", "数学", "【12】2027年高三数学刘秋龙", "刘秋龙", "https://pan.quark.cn/s/d8bf4428f0e5"],
  ["高三", "数学", "【11】2027年高三数学王子豪", "王子豪", "https://pan.quark.cn/s/fb90cd26bc2c"],
  ["高三", "数学", "【10】2027年高三数学腾毅", "腾毅", "https://pan.quark.cn/s/7853123bcab1"],
  ["高三", "数学", "【09】2027年高三数学田夏林", "田夏林", "https://pan.quark.cn/s/b0d4799cd519"],
  ["高三", "数学", "【13】2027年高三数学周帅", "周帅", "https://pan.quark.cn/s/ecad02044dfe"],
  ["高三", "数学", "【08】2027年高三数学林泽田", "林泽田", "https://pan.quark.cn/s/88f00e6d682a"],
  ["高三", "数学", "【18】2027高三数学凉学长", "凉学长", "https://pan.quark.cn/s/b081f09f6c13"],
  ["高三", "数学", "【17】2027高三数学数心", "数心", "https://pan.quark.cn/s/64009a45e7c1"],
  ["高三", "数学", "【14】2027年高三数学小火车", "小火车", "https://pan.quark.cn/s/2d6a6aee8dac"],
  ["高三", "数学", "【16】2027年高三数学王子悦", "王子悦", "https://pan.quark.cn/s/86c1fb52e4aa"],
  ["高三", "数学", "【02】2027年高三数学胡源", "胡源", "https://pan.quark.cn/s/ca47e81e3c84"],
  ["高三", "数学", "【03】2027年高三数学阿不", "阿不", "https://pan.quark.cn/s/49c26e7bd9a6"],
  ["高一", "数学", "【07】2027年高一数学王子悦", "王子悦", "https://pan.quark.cn/s/f5a8677f9c22"],
  ["高一", "数学", "【01】2027年高一数学赵礼显", "赵礼显", "https://pan.quark.cn/s/148c7dee0202"],
  ["高一", "数学", "【05】2027年高一数学刘秋龙", "刘秋龙", "https://pan.quark.cn/s/2956cab261c3"],
  ["高一", "数学", "【06】2027年高一数学王子豪", "王子豪", "https://pan.quark.cn/s/4230f1d417c2"],
  ["高一", "数学", "【08】2027年高一数学张磊", "张磊", "https://pan.quark.cn/s/f854319d534c"],
  ["高一", "数学", "【02】2027年高一数学胡源", "胡源", "https://pan.quark.cn/s/0ee9815e77bc"],
  ["高一", "数学", "【03】2027年高一数学杨震", "杨震", "https://pan.quark.cn/s/69d30a3cdb47"],
  ["高一", "数学", "【04】2027年高一数学刘天麒", "刘天麒", "https://pan.quark.cn/s/59ffea632fe3"],
  ["高二", "英语", "【05】2027年高二英语何红艳", "何红艳", "https://pan.quark.cn/s/deb739ca7c1c"],
  ["高二", "英语", "【07】2027年高二英语顾斐", "顾斐", "https://pan.quark.cn/s/a8ab232fbd62"],
  ["高二", "英语", "【06】2027年高二英语张亮", "张亮", "https://pan.quark.cn/s/0e6b8cc537a7"],
  ["高二", "英语", "【03】2027年高二英语朱汉祺", "朱汉祺", "https://pan.quark.cn/s/9432593c2758"],
  ["高二", "英语", "【04】2027年高二英语卫宇晴", "卫宇晴", "https://pan.quark.cn/s/9d53b8b7bb06"],
  ["高二", "英语", "【02】2027年高二英语张冰瑶", "张冰瑶", "https://pan.quark.cn/s/33fdb226f7ea"],
  ["高二", "英语", "【01】2027年高二英语龙坚", "龙坚", "https://pan.quark.cn/s/20cbc3db24b7"],
  ["高三", "英语", "【05】2027年高三英语王赞", "王赞", "https://pan.quark.cn/s/0c4d553bffa5"],
  ["高三", "英语", "【07】2027年高三英语朱汉祺", "朱汉祺", "https://pan.quark.cn/s/48965be7257d"],
  ["高三", "英语", "【01】2027年高三英语龙坚", "龙坚", "https://pan.quark.cn/s/f7b1e893ae9d"],
  ["高三", "英语", "【08】2027年高三英语聂宁", "聂宁", "https://pan.quark.cn/s/84c0970c0577"],
  ["高三", "英语", "【03】2027年高三英语沈嘉柯", "沈嘉柯", "https://pan.quark.cn/s/7db48b91a480"],
  ["高三", "英语", "【09】2027年高三英语袁慧", "袁慧", "https://pan.quark.cn/s/abbcae9903df"],
  ["高三", "英语", "【06】2027年高三英语王双林", "王双林", "https://pan.quark.cn/s/00e5f4f6f6a1"],
  ["高三", "英语", "【02】2027年高三英语李辉", "李辉", "https://pan.quark.cn/s/28efe8c2faac"],
  ["高三", "英语", "【04】2027年高三英语Larry", "Larry", "https://pan.quark.cn/s/b43258f8435f"],
  ["高三", "英语", "【10】2027年高三英语张亮", "张亮", "https://pan.quark.cn/s/bbe770a8412c"],
  ["高一", "英语", "【05】2027年高一英语李博恩", "李博恩", "https://pan.quark.cn/s/59a31830ada4"],
  ["高一", "英语", "【02】2027年高一英语杨文哲", "杨文哲", "https://pan.quark.cn/s/db8785c9b038"],
  ["高一", "英语", "【01】2027年高一英语龙坚", "龙坚", "https://pan.quark.cn/s/68da5f022fab"],
  ["高一", "英语", "【04】2027年高一英语顾斐", "顾斐", "https://pan.quark.cn/s/432c87bceda7"],
  ["高一", "英语", "【03】2027年高一英语郭艺", "郭艺", "https://pan.quark.cn/s/7d0bd885a17a"],
  ["高一", "英语", "【06】2027年高一英语古容容", "古容容", "https://pan.quark.cn/s/7ed90b3be4ae"],
  ["高二", "物理", "【01】2027年高二物理夏梦迪", "夏梦迪", "https://pan.quark.cn/s/cee8819db845"],
  ["高二", "物理", "【06】2027年高二物理孙竟轩", "孙竟轩", "https://pan.quark.cn/s/c4ff0b73b285"],
  ["高二", "物理", "【05】2027年高二物理宋雨晴", "宋雨晴", "https://pan.quark.cn/s/05cc4acb741d"],
  ["高二", "物理", "【07】2027年高二物理俞伯勋", "俞伯勋", "https://pan.quark.cn/s/4288a7a92493"],
  ["高二", "物理", "【02】2027年高二物理刘杰", "刘杰", "https://pan.quark.cn/s/c4dbd2cb7c75"],
  ["高二", "物理", "【11】2027年高二物理章进", "章进", "https://pan.quark.cn/s/0fc270f6a242"],
  ["高二", "物理", "【04】2027年高二物理张展博", "张展博", "https://pan.quark.cn/s/7382538d485e"],
  ["高二", "物理", "【03】2027年高二物理赵玉峰", "赵玉峰", "https://pan.quark.cn/s/2666566db876"],
  ["高二", "物理", "【10】2027年高二物理赵星义", "赵星义", "https://pan.quark.cn/s/f31fcb6cf65a"],
  ["高二", "物理", "【09】2027年高二物理跳跳", "跳跳", "https://pan.quark.cn/s/906f87e931a1"],
  ["高二", "物理", "【08】2027年高二物理林婉晴", "林婉晴", "https://pan.quark.cn/s/f36d706d64bd"],
  ["高三", "物理", "【05】2027年高三物理于冲", "于冲", "https://pan.quark.cn/s/28bc1f779bfa"],
  ["高三", "物理", "【14】2027高三物理莫慌年", "莫慌年", "https://pan.quark.cn/s/e19b666cacb6"],
  ["高三", "物理", "【08】2027年高三物理许纪跃", "许纪跃", "https://pan.quark.cn/s/4f60bf49662c"],
  ["高三", "物理", "【13】2027年高三物理彭娟娟", "彭娟娟", "https://pan.quark.cn/s/22689e4c1798"],
  ["高三", "物理", "【17】2027高三物理蔡尚儒", "蔡尚儒", "https://pan.quark.cn/s/ed74df99afdd"],
  ["高三", "物理", "【15】2027高三物理高明静", "高明静", "https://pan.quark.cn/s/7557d1de9b7a"],
  ["高三", "物理", "【01】2027年高三物理夏梦迪", "夏梦迪", "https://pan.quark.cn/s/e272dd1b70e8"],
  ["高三", "物理", "【03】2027年高三物理赵玉峰", "赵玉峰", "https://pan.quark.cn/s/727cb850d805"],
  ["高三", "物理", "【11】2027年高三物理袁帅", "袁帅", "https://pan.quark.cn/s/1089124038aa"],
  ["高三", "物理", "【10】2027年高三物理何连伟", "何连伟", "https://pan.quark.cn/s/cb20c8ca37c5"],
  ["高三", "物理", "【06】2027年高三物理跳跳学长", "跳跳学长", "https://pan.quark.cn/s/7acebd06d1ea"],
  ["高三", "物理", "【09】2027年高三物理龚昱晗", "龚昱晗", "https://pan.quark.cn/s/44df34f2fb7d"],
  ["高三", "物理", "【02】2027年高三物理王羽", "王羽", "https://pan.quark.cn/s/8b9f35d52c25"],
  ["高三", "物理", "【04】2027年高三物理李楠", "李楠", "https://pan.quark.cn/s/18fcc15b36e5"],
  ["高三", "物理", "【12】2027年高三物理崔珊珊", "崔珊珊", "https://pan.quark.cn/s/5ad9b32ae1a9"],
  ["高三", "物理", "【16】2027高三物理蔡钧安", "蔡钧安", "https://pan.quark.cn/s/1361c3e40aa1"],
  ["高一", "物理", "【06】2027年高一物理俞伯勋", "俞伯勋", "https://pan.quark.cn/s/c2580e96a00d"],
  ["高一", "物理", "【04】2027年高一物理章进", "章进", "https://pan.quark.cn/s/9ad7f73d971a"],
  ["高一", "物理", "【08】2027年高一物理鲜朝阳", "鲜朝阳", "https://pan.quark.cn/s/55f6cc324a01"],
  ["高一", "物理", "【10】2027年高一物理赵玉峰", "赵玉峰", "https://pan.quark.cn/s/2021a3076464"],
  ["高一", "物理", "【03】2027年高一物理张雯", "张雯", "https://pan.quark.cn/s/c1dae37a9057"],
  ["高一", "物理", "【01】2027年高一物理夏梦迪", "夏梦迪", "https://pan.quark.cn/s/46fd981b4449"],
  ["高一", "物理", "【09】2027年高一物理跳跳&胡婷", "跳跳&胡婷", "https://pan.quark.cn/s/d5ba0aad665d"],
  ["高一", "物理", "【11】2027年高一物理武东博", "武东博", "https://pan.quark.cn/s/a8a6ce9fc48b"],
  ["高一", "物理", "【02】2027年高一物理莫荒年", "莫荒年", "https://pan.quark.cn/s/e514ce5e7781"],
  ["高一", "物理", "【07】2027年高一物理蔺天威", "蔺天威", "https://pan.quark.cn/s/652d9aac36fc"],
  ["高一", "物理", "【05】2027年高一物理郑梦瑶", "郑梦瑶", "https://pan.quark.cn/s/7c368fb00c7c"],
  ["高二", "化学", "【01】2027年高二化学李政", "李政", "https://pan.quark.cn/s/a18fab8f0207"],
  ["高二", "化学", "【04】2027年高二化学成功", "成功", "https://pan.quark.cn/s/a3aae21c6ecc"],
  ["高二", "化学", "【02】2027年高二化学冷士强", "冷士强", "https://pan.quark.cn/s/d0eb945d2f6c"],
  ["高二", "化学", "【05】2027年高二化学王堇", "王堇", "https://pan.quark.cn/s/3b9d22176d26"],
  ["高二", "化学", "【06】2027年高二化学郑瑞", "郑瑞", "https://pan.quark.cn/s/634b8a84eb74"],
  ["高二", "化学", "【03】2027年高二化学高展", "高展", "https://pan.quark.cn/s/a33090fee66d"],
  ["高三", "化学", "【10】2027年高三化学刘玉", "刘玉", "https://pan.quark.cn/s/0e579c3c3361"],
  ["高三", "化学", "【04】2027年高三化学马凯鹏", "马凯鹏", "https://pan.quark.cn/s/a2a535a76525"],
  ["高三", "化学", "【01】2027年高三化学李政", "李政", "https://pan.quark.cn/s/3e7f281b794b"],
  ["高三", "化学", "【05】2027年高三化学马旭悦", "马旭悦", "https://pan.quark.cn/s/a3bf54976733"],
  ["高三", "化学", "【03】2027年高三化学张苗苗", "张苗苗", "https://pan.quark.cn/s/6d47d52b80e4"],
  ["高三", "化学", "【09】2027年高三化学孔维钢", "孔维钢", "https://pan.quark.cn/s/87c746cbe498"],
  ["高三", "化学", "【06】2027年高三化学康冲", "康冲", "https://pan.quark.cn/s/501b1c55d380"],
  ["高三", "化学", "【08】2027年高三化学缑振东", "缑振东", "https://pan.quark.cn/s/2f3af041ed9c"],
  ["高三", "化学", "【07】2027年高三化学郑瑞", "郑瑞", "https://pan.quark.cn/s/e405a4b7d3d1"],
  ["高三", "化学", "【02】2027年高三化学冷士强", "冷士强", "https://pan.quark.cn/s/89e321732f42"],
  ["高一", "化学", "【07】2027年高一化学郑慎捷", "郑慎捷", "https://pan.quark.cn/s/90a30b65e093"],
  ["高一", "化学", "【06】2027年高一化学赵怡然", "赵怡然", "https://pan.quark.cn/s/25986af2870b"],
  ["高一", "化学", "【03】2027年高一化学吕子正", "吕子正", "https://pan.quark.cn/s/b360012654c2"],
  ["高一", "化学", "【04】2027年高一化学李伟", "李伟", "https://pan.quark.cn/s/603c1b999f84"],
  ["高一", "化学", "【02】2027年高一化学高东辉", "高东辉", "https://pan.quark.cn/s/87f9ce606fb4"],
  ["高一", "化学", "【08】2027年高一化学钟啸", "钟啸", "https://pan.quark.cn/s/5e82c9976ecc"],
  ["高一", "化学", "【01】2027年高一化学李政", "李政", "https://pan.quark.cn/s/ff918f681eb9"],
  ["高一", "化学", "【05】2027年高一化学林森", "林森", "https://pan.quark.cn/s/190e67f5764e"],
  ["高二", "生物", "【01】2027年高二生物李林", "李林", "https://pan.quark.cn/s/fefae4182ed2"],
  ["高二", "生物", "【04】2027年高二生物安智琛", "安智琛", "https://pan.quark.cn/s/f3bb0b08b317"],
  ["高二", "生物", "【02】2027年高二生物马阳洋", "马阳洋", "https://pan.quark.cn/s/771652ae8e86"],
  ["高二", "生物", "【03】2027年高二生物周云", "周云", "https://pan.quark.cn/s/39efafe4a845"],
  ["高三", "生物", "【02】2027年高三生物张鹏", "张鹏", "https://pan.quark.cn/s/8d202906c726"],
  ["高三", "生物", "【06】2027年高三生物万猛", "万猛", "https://pan.quark.cn/s/cb4ac67dc8d4"],
  ["高三", "生物", "【04】2027年高三生物段瑞莹", "段瑞莹", "https://pan.quark.cn/s/1aa3ee5da39c"],
  ["高三", "生物", "【08】2027年高三生物毛慧", "毛慧", "https://pan.quark.cn/s/ae59798f8e97"],
  ["高三", "生物", "【07】2027年高三生物张元振", "张元振", "https://pan.quark.cn/s/05757e25ab02"],
  ["高三", "生物", "【01】2027年高三生物李林", "李林", "https://pan.quark.cn/s/b23d95a7438b"],
  ["高三", "生物", "【03】2027年高三生物金晶", "金晶", "https://pan.quark.cn/s/08c78eba24ad"],
  ["高三", "生物", "【05】2027年高三生物谢一凡", "谢一凡", "https://pan.quark.cn/s/96dc5d568593"],
  ["高一", "生物", "【01】2027年高一生物李林", "李林", "https://pan.quark.cn/s/ca41a9c4d370"],
  ["高一", "生物", "【03】2027年高一生物杨雪", "杨雪", "https://pan.quark.cn/s/0c6ed1d494a9"],
  ["高一", "生物", "【04】2027年高一生物段瑞莹", "段瑞莹", "https://pan.quark.cn/s/bcaa4b55484a"],
  ["高一", "生物", "【02】2027年高一生物张继光", "张继光", "https://pan.quark.cn/s/dc3fbdfbb9f6"],
  ["高二", "历史", "【01】2027年高二历史刘莹莹", "刘莹莹", "https://pan.quark.cn/s/d29266005573"],
  ["高三", "历史", "【01】2027年高三历史刘勖雯", "刘勖雯", "https://pan.quark.cn/s/dde3f33007d9"],
  ["高三", "历史", "【02】2027年高三历史刘莹莹", "刘莹莹", "https://pan.quark.cn/s/c929bb125058"],
  ["高一", "历史", "【01】2027年高一历史任旺", "任旺", "https://pan.quark.cn/s/3afeb5bbfa99"],
  ["高二", "地理", "【01】2027年高二地理王媛韬", "王媛韬", "https://pan.quark.cn/s/5b69995ce525"],
  ["高三", "地理", "【04】2027年高三地理林潇", "林潇", "https://pan.quark.cn/s/1e8c386212a0"],
  ["高三", "地理", "【05】2027年高三地理孙国勇", "孙国勇", "https://pan.quark.cn/s/dbfa3568fbfa"],
  ["高三", "地理", "【03】2027年高三地理张艳平", "张艳平", "https://pan.quark.cn/s/5aba2aa16414"],
  ["高三", "地理", "【02】2027年高三地理杨笠", "杨笠", "https://pan.quark.cn/s/3cfd1f0b0fe2"],
  ["高三", "地理", "【06】2027年高三地理王群", "王群", "https://pan.quark.cn/s/ae6849ca93a8"],
  ["高三", "地理", "【01】2027年高三地理刘勖雯", "刘勖雯", "https://pan.quark.cn/s/cf6e0fa67938"],
  ["高一", "地理", "【01】2027年高一地理王媛韬", "王媛韬", "https://pan.quark.cn/s/1a64f78cb792"],
  ["高二", "政治", "【01】2027年高二政治周峤矞", "周峤矞", "https://pan.quark.cn/s/5d8ace105a9e"],
  ["高二", "政治", "【02】2027年高二政治李东林", "李东林", "https://pan.quark.cn/s/2c1ea6794487"],
  ["高三", "政治", "【01】2027年高三政治刘勖雯", "刘勖雯", "https://pan.quark.cn/s/1e2b3c4f98dd"],
  ["高三", "政治", "【04】2027年高三政治周峤矞", "周峤矞", "https://pan.quark.cn/s/62593ec841fd"],
  ["高三", "政治", "【03】2027年高三政治秦琳", "秦琳", "https://pan.quark.cn/s/11780272ccee"],
  ["高三", "政治", "【02】2027年高三政治朱法垚", "朱法垚", "https://pan.quark.cn/s/9210dfc1356a"],
  ["高三", "政治", "【05】2027年高三政治李东林", "李东林", "https://pan.quark.cn/s/a9763a489213"],
  ["高一", "政治", "【01】2027年高一政治秦琳", "秦琳", "https://pan.quark.cn/s/01e43dd14963"],
];

const courseFor = (grade: HighSchoolGrade, subject: HighSchoolSubject) => {
  const course = getHighSchoolCourse(grade, subject);
  if (!course) {
    throw new Error(`Missing high-school course for ${grade} / ${subject}`);
  }
  return course;
};

const teacherRecords = HIGH_SCHOOL_TEACHER_LINK_RECORDS.map(
  ([grade, subject, rawDirectoryName, displayName, shareUrl], index) => {
    const course = courseFor(grade, subject);
    const sourcePath = `${course.sourcePath}/${rawDirectoryName}`;
    const teacherKey = `ht_${String(index + 1).padStart(3, "0")}_${course.registryKey}`;
    return {
      teacherKey,
      entityId: teacherKey,
      rawDirectoryName,
      displayName,
      grade,
      subject,
      courseId: course.courseId,
      courseKey: `${course.packageYear}:${grade}:${subject}`,
      sourcePath,
      sourcePathMapping: {
        mappingId: `teacher-spm_${String(index + 1).padStart(3, "0")}`,
        currentSourcePath: sourcePath,
        previousSourcePath: null,
      },
      courseSourcePathMapping: course.sourcePathMapping,
      shareUrl,
      linkStatus: "published" as const,
      identityStatus: "raw_directory_label" as const,
    } satisfies HighSchoolTeacher;
  },
);

export const HIGH_SCHOOL_TEACHERS: readonly HighSchoolTeacher[] = teacherRecords;

export const HIGH_SCHOOL_TEACHER_COUNT = HIGH_SCHOOL_TEACHERS.length;

export const isPublicHighSchoolTeacher = (teacher: HighSchoolTeacher): boolean =>
  teacher.linkStatus === "published" &&
  teacher.courseId.length > 0 &&
  /^https:\/\/pan\.quark\.cn\/s\/[A-Za-z0-9]+$/.test(teacher.shareUrl) &&
  HIGH_SCHOOL_COURSE_INDEX.courses.some(
    (course) =>
      course.courseId === teacher.courseId &&
      course.grade === teacher.grade &&
      course.subject === teacher.subject &&
      course.reviewStatus === "VERIFIED",
  );

export const getHighSchoolTeachers = (
  grade: HighSchoolGrade,
  subject: HighSchoolSubject,
): readonly HighSchoolTeacher[] =>
  HIGH_SCHOOL_TEACHERS.filter(
    (teacher) =>
      teacher.grade === grade &&
      teacher.subject === subject &&
      isPublicHighSchoolTeacher(teacher),
  );

