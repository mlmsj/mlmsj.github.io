export type SkillGrowthCandidateStatus = "MAPPING_READY" | "NEEDS_REVIEW";

export type SkillGrowthCandidate = {
  candidateId: string;
  sourcePath: string;
  title: string;
  status: SkillGrowthCandidateStatus;
  proposedCategoryId: string | null;
  reviewNote: string;
};

/**
 * Private implementation register only. These records deliberately contain
 * no Resource IDs, share URLs, public flags, or Quark file IDs. They are not
 * imported by the public catalog and cannot make a candidate public by
 * themselves.
 */
export const skillGrowthCandidates: readonly SkillGrowthCandidate[] = [
  {
    candidateId: "clip-tutorial-01",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/bilibili剪辑教程",
    title: "bilibili剪辑教程",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "剪辑思维、音乐、包装、音效和案例问答视频，主目标为视频剪辑。",
  },
  {
    candidateId: "clip-tutorial-02",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/新片场-奥斯卡剪辑拉片课 -《爆裂鼓手》",
    title: "新片场-奥斯卡剪辑拉片课 -《爆裂鼓手》",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "动作剪辑、电影色调、长短风格、对比风格与高潮剪辑。",
  },
  {
    candidateId: "clip-tutorial-03",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/轻而易剪——剪映保姆级创作教程",
    title: "轻而易剪——剪映保姆级创作教程",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-jianying",
    reviewNote: "目录指向剪映基础与进阶，但叶节点尚未全部展开，待确认课程主线。",
  },
  {
    candidateId: "clip-tutorial-04",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/微电影_影视编剧教程_影视剧本前期构思教程[剧本创作]",
    title: "微电影_影视编剧教程_影视剧本前期构思教程[剧本创作]",
    status: "NEEDS_REVIEW",
    proposedCategoryId: null,
    reviewNote: "故事、剧本、版权、合同与侵权规避内容，现有批准树没有独立编剧分类。",
  },
  {
    candidateId: "clip-tutorial-05",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/B站-剪辑思维训练营-南门录像厅",
    title: "B站-剪辑思维训练营-南门录像厅",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "剪辑思维、节奏、情绪、叙事及案例。",
  },
  {
    candidateId: "clip-tutorial-06",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/婚礼电影全流程制作视频课程",
    title: "婚礼电影全流程制作视频课程",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "婚礼拍摄、器材、镜头、后期剪辑、FCPX、音乐和风格，属于全流程制作。",
  },
  {
    candidateId: "clip-tutorial-07",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/新片场-【怒豆渣】电影自习室pro版",
    title: "新片场-【怒豆渣】电影自习室pro版",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "摄影、镜头、灯光、收音、剪辑、调色、达芬奇、分镜与后期均有涉及。",
  },
  {
    candidateId: "clip-tutorial-08",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/南门录像厅从小白到剪辑师2020",
    title: "南门录像厅从小白到剪辑师2020",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "求职、面试、项目剪辑、调色、商业片与产品片剪辑。",
  },
  {
    candidateId: "clip-tutorial-09",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/狼叔视频号运营实战课",
    title: "狼叔视频号运营实战课",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-short-video-ops",
    reviewNote: "视频号趋势、注册、账号定位、标题、命名、选题与增长。",
  },
  {
    candidateId: "clip-tutorial-10",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/剪映手机最新课程（2020）",
    title: "剪映手机最新课程（2020）",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "手机剪映基础、工具与实用效果，作为视频剪辑课程归档。",
  },
  {
    candidateId: "clip-tutorial-11",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/零基础系统学剪辑思维训练营",
    title: "零基础系统学剪辑思维训练营",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "剪辑思维、镜头语言、节奏、声音与案例。",
  },
  {
    candidateId: "clip-tutorial-12",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/从创作开始踏入电影界视频课程",
    title: "从创作开始踏入电影界视频课程",
    status: "NEEDS_REVIEW",
    proposedCategoryId: null,
    reviewNote: "剧本、市场、商业核算与案例，目标不止后期剪辑。",
  },
  {
    candidateId: "clip-tutorial-13",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/剪映手机最新课程（2021）",
    title: "剪映手机最新课程（2021）",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "手机剪映工具与实用效果，作为视频剪辑课程归档。",
  },
  {
    candidateId: "clip-tutorial-14",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/抖音超清60帧视频教程+素材+插件",
    title: "抖音超清60帧视频教程+素材+插件",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "插帧、帧率、画质、颜色、锐化、PR 参数，且包含工具与插件。",
  },
  {
    candidateId: "clip-tutorial-15",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/新片场-《剪辑大师课》奥斯卡最佳剪辑师的剪辑思路与技巧",
    title: "新片场-《剪辑大师课》奥斯卡最佳剪辑师的剪辑思路与技巧",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "剪辑技巧、电影分析、剪辑风格与团队创作。",
  },
  {
    candidateId: "clip-tutorial-16",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/从零开始掌握视频导演全部技能",
    title: "从零开始掌握视频导演全部技能",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "摄像器材、收音、美学、构图、剪辑软件、分镜与导演流程。",
  },
  {
    candidateId: "clip-tutorial-17",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/卡牌影视剪辑运营涨粉暴力玩法",
    title: "卡牌影视剪辑运营涨粉暴力玩法",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-short-video-ops",
    reviewNote: "账号养成、抖音机制、PR 剪辑、封面与涨粉，剪辑和运营交叉。",
  },
  {
    candidateId: "clip-tutorial-18",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/视频剪辑教学全部内容",
    title: "视频剪辑教学全部内容",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "软件、封面、PR、配音、BGM、文案、素材下载与收益内容混合。",
  },
  {
    candidateId: "clip-tutorial-19",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/冯朋摄影剪辑课程（完结）",
    title: "冯朋摄影剪辑课程（完结）",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "剪映基础、实用效果，同时包含摄影与拍摄课程。",
  },
  {
    candidateId: "clip-tutorial-20",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/大神同款定格动画保姆级教学",
    title: "大神同款定格动画保姆级教学",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "定格动画、黏土、道具、角色、场景与叙事，创作方向交叉。",
  },
  {
    candidateId: "clip-tutorial-21",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/电影解说自媒体超系统课程，从小白到解说大神的逆袭之路",
    title: "电影解说自媒体超系统课程，从小白到解说大神的逆袭之路",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-short-video-ops",
    reviewNote: "账号、标题/文案、选题、配音降噪、PR、平台与变现。",
  },
  {
    candidateId: "clip-tutorial-22",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/【剪辑】短视频涨粉+变现实战训练营",
    title: "【剪辑】短视频涨粉+变现实战训练营",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-short-video-ops",
    reviewNote: "平台运营、算法、电商/直播、IP 孵化、数据与 MCN。",
  },
  {
    candidateId: "clip-tutorial-23",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/收益21万的中视频电影解说剪辑教学，含账号打造、选剧、文案、配音",
    title: "收益21万的中视频电影解说剪辑教学，含账号打造、选剧、文案、配音",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-short-video-ops",
    reviewNote: "账号打造、选剧、文案、配音、PR、封面、BGM 与规避违规。",
  },
  {
    candidateId: "clip-tutorial-24",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/短视频学院拍视频摄剪辑核心课",
    title: "短视频学院拍视频摄剪辑核心课",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "手机拍摄、相机语言、运动、灯光、导演思维、剪辑、调色与声音。",
  },
  {
    candidateId: "clip-tutorial-25",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/视频号风口21天从0到1视频课程",
    title: "视频号风口21天从0到1视频课程",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-short-video-ops",
    reviewNote: "账号名、简介、头像/封面、内容设计、运营指标与制作。",
  },
  {
    candidateId: "clip-tutorial-26",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/最新微信视频号无人直播课程",
    title: "最新微信视频号无人直播课程",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-short-video-ops",
    reviewNote: "视频号平台、运营、规则、更新与剪辑应用操作。",
  },
  {
    candidateId: "clip-tutorial-27",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/100种生活短视频创作营",
    title: "100种生活短视频创作营",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "构图、发现生活、创作、朋友圈平台与创意故事，创作和运营边界不清。",
  },
  {
    candidateId: "clip-tutorial-28",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/渣哥电影自习室Pro视频课程",
    title: "渣哥电影自习室Pro视频课程",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "主要文件为编号视频，语义文件名不足以确认主学习目标。",
  },
  {
    candidateId: "clip-tutorial-29",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/7天学会抖音电影解说4.0课",
    title: "7天学会抖音电影解说4.0课",
    status: "NEEDS_REVIEW",
    proposedCategoryId: "skill-short-video-ops",
    reviewNote: "电影解说、片源、文案、PR、配音、字幕、音频、封面与工具，运营比重待确认。",
  },
  {
    candidateId: "clip-tutorial-30",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/跟着李新学编剧（完结）",
    title: "跟着李新学编剧（完结）",
    status: "NEEDS_REVIEW",
    proposedCategoryId: null,
    reviewNote: "故事、人物、结构、悬念、对白、场景与共情，现有批准树没有独立编剧分类。",
  },
  {
    candidateId: "clip-tutorial-31",
    sourcePath: "文明其精神，野蛮其体魄/剪辑/教程/从0到1玩转手机短视频：从前期拍摄到后期剪辑，结合实操案例，快速入门",
    title: "从0到1玩转手机短视频：从前期拍摄到后期剪辑，结合实操案例，快速入门",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-editing-system",
    reviewNote: "手机拍摄、画质/帧率、构图/色彩、防抖、转场与手机剪辑。",
  },
] as const;

export const readySkillGrowthCandidates = skillGrowthCandidates.filter(
  (candidate) => candidate.status === "MAPPING_READY",
);

export const needsReviewSkillGrowthCandidates = skillGrowthCandidates.filter(
  (candidate) => candidate.status === "NEEDS_REVIEW",
);
