export type SkillGrowthAiCandidate = {
  candidateId: string;
  sourcePath: string;
  title: string;
  status: "MAPPING_READY";
  proposedCategoryId: string;
  registrationStatus: "PRIVATE_CANDIDATE_SHARE_CREATED";
  quarkObservedItemCount: number;
  reviewNote: string;
};

/**
 * Private AI-material registration only. These records deliberately contain
 * no Resource IDs, Delivery IDs, share URLs, passcodes, public flags, or Quark
 * file IDs. The observed item count is a Quark folder listing count, not a
 * public-resource count, and is never used by the public catalog.
 */
export const skillGrowthAiCandidates: readonly SkillGrowthAiCandidate[] = [
  {
    candidateId: "ai-learning-cognition-001",
    sourcePath: "文明其精神，野蛮其体魄/AI/AI时代学习、思考与创作",
    title: "AI时代学习、思考与创作",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-ai-learning-cognition",
    registrationStatus: "PRIVATE_CANDIDATE_SHARE_CREATED",
    quarkObservedItemCount: 37,
    reviewNote: "按资料目录名称登记为 AI 学习与认知方向；待后续核验内容完整性、来源与公开授权。",
  },
  {
    candidateId: "ai-chatgpt-001",
    sourcePath: "文明其精神，野蛮其体魄/AI/chatGPT（1）",
    title: "chatGPT（1）",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-ai-chatgpt",
    registrationStatus: "PRIVATE_CANDIDATE_SHARE_CREATED",
    quarkObservedItemCount: 9,
    reviewNote: "按资料目录名称登记为 ChatGPT 教程方向；待后续核验内容完整性、来源与公开授权。",
  },
  {
    candidateId: "ai-chatgpt-002",
    sourcePath: "文明其精神，野蛮其体魄/AI/chatGPT（2）",
    title: "chatGPT（2）",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-ai-chatgpt",
    registrationStatus: "PRIVATE_CANDIDATE_SHARE_CREATED",
    quarkObservedItemCount: 12,
    reviewNote: "按资料目录名称登记为 ChatGPT 教程方向；待后续核验内容完整性、来源与公开授权。",
  },
  {
    candidateId: "ai-deepseek-001",
    sourcePath: "文明其精神，野蛮其体魄/AI/DeepSeek（1）",
    title: "DeepSeek（1）",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-ai-deepseek",
    registrationStatus: "PRIVATE_CANDIDATE_SHARE_CREATED",
    quarkObservedItemCount: 7,
    reviewNote: "按资料目录名称登记为 DeepSeek 教程方向；待后续核验内容完整性、来源与公开授权。",
  },
  {
    candidateId: "ai-deepseek-002",
    sourcePath: "文明其精神，野蛮其体魄/AI/DeepSeek（2）",
    title: "DeepSeek（2）",
    status: "MAPPING_READY",
    proposedCategoryId: "skill-ai-deepseek",
    registrationStatus: "PRIVATE_CANDIDATE_SHARE_CREATED",
    quarkObservedItemCount: 2,
    reviewNote: "按资料目录名称登记为 DeepSeek 教程方向；待后续核验内容完整性、来源与公开授权。",
  },
] as const;
