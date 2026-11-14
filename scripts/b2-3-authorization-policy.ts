import type {
  AuthorizationContext,
  AuthorizationEvidence,
} from "../src/catalogV2";
import { LEGACY_V1_COMPAT_DELIVERY_ID_PREFIX } from "../src/deliveryIdentity";
import type { PublicProjectionPolicy } from "../src/publicProjection";

/**
 * The owner authorization record explicitly covers the current university
 * public projection: twenty-one curated university/certification aggregate entries. The replaced leaf
 * records remain in source history but are intentionally omitted from the
 * current public projection. The computer aggregate is a clean study-material
 * subset; installation, activation, and executable packages stay out of it.
 */
export const B2_3_APPROVED_RESOURCE_IDS = [
  "university-topic-major-001",
  "university-topic-math-001",
  "university-topic-professional-courses-001",
  "university-topic-textbooks-001",
  "university-topic-ideology-001",
  "university-topic-competition-root-001",
  "university-topic-competition-001",
  "university-topic-cet-001",
  "university-topic-ielts-001",
  "university-topic-proof-001",
  "university-topic-computer-001",
  "university-topic-postgraduate-001",
  "university-topic-postgrad-001",
  "university-topic-planning-001",
  "university-topic-career-001",
  "university-quark-career-ppt-001",
  "university-quark-resume-templates-001",
  "certification-topic-university-001",
  "certification-topic-foreign-language-001",
  "certification-topic-upgrade-001",
  "certification-topic-civil-service-001",
] as const;

const B2_3_CURRENT_AGGREGATE_RESOURCE_IDS = new Set<string>([
  ...B2_3_APPROVED_RESOURCE_IDS,
]);
const B2_3_NEW_UNIVERSITY_PARENT_RESOURCE_IDS = new Set([
  "university-topic-major-001",
  "university-topic-competition-root-001",
  "university-topic-postgraduate-001",
  "university-topic-planning-001",
]);

export const B2_3_RESOURCE_TO_UFB = new Map<string, string>([
  ["university-quark-math-advanced-001", "UFB-001"],
  ["university-quark-linear-algebra-001", "UFB-002"],
  ["university-quark-probability-textbook-001", "UFB-003"],
  ["university-quark-probability-review-001", "UFB-004"],
  ["university-quark-mathematical-analysis-001", "UFB-005"],
  ["university-quark-calculus-001", "UFB-006"],
  ["university-quark-ideology-marxism-001", "UFB-007"],
  ["university-quark-cet4-001", "UFB-008"],
  ["university-quark-ielts-001", "UFB-009"],
  ["university-quark-postgrad-001", "UFB-011"],
  ["university-quark-career-ppt-001", "UFB-012"],
  ["university-quark-resume-templates-001", "UFB-013"],
  ["university-quark-biochemistry-001", "UFB-015"],
  ["university-quark-english-contest-001", "UFB-016"],
]);

export const JUNIOR_RELEASE_6_APPROVED_RESOURCE_IDS = [
  "jh-topic-textbooks-001",
  "jh-topic-workbooks-001",
  "jh-topic-exams-001",
  "jh-topic-courses-001",
  "jh-topic-subjects-001",
  "jh-topic-sprint-001",
] as const;

export const JUNIOR_RELEASE_6_DELIVERY_IDS = new Map<string, string>([
  ["jh-topic-textbooks-001", "dlv-jh-topic-textbooks-quark-01"],
  ["jh-topic-workbooks-001", "dlv-jh-topic-workbooks-quark-01"],
  ["jh-topic-exams-001", "dlv-jh-topic-exams-quark-01"],
  ["jh-topic-courses-001", "dlv-jh-topic-courses-quark-01"],
  ["jh-topic-subjects-001", "dlv-jh-topic-subjects-quark-01"],
  ["jh-topic-sprint-001", "dlv-jh-topic-sprint-quark-01"],
]);

export const JUNIOR_TEXTBOOK_SUBJECT_11_APPROVED_RESOURCE_IDS = [
  "jh-textbooks-subject-dao-fa-001",
  "jh-textbooks-subject-geography-001",
  "jh-textbooks-subject-geography-atlas-001",
  "jh-textbooks-subject-chemistry-001",
  "jh-textbooks-subject-science-001",
  "jh-textbooks-subject-history-001",
  "jh-textbooks-subject-biology-001",
  "jh-textbooks-subject-math-001",
  "jh-textbooks-subject-physics-001",
  "jh-textbooks-subject-english-001",
  "jh-textbooks-subject-chinese-001",
] as const;

export const JUNIOR_TEXTBOOK_SUBJECT_11_DELIVERY_IDS = new Map<string, string>([
  ["jh-textbooks-subject-dao-fa-001", "dlv-jh-textbooks-subject-dao-fa-quark-01"],
  ["jh-textbooks-subject-geography-001", "dlv-jh-textbooks-subject-geography-quark-01"],
  ["jh-textbooks-subject-geography-atlas-001", "dlv-jh-textbooks-subject-geography-atlas-quark-01"],
  ["jh-textbooks-subject-chemistry-001", "dlv-jh-textbooks-subject-chemistry-quark-01"],
  ["jh-textbooks-subject-science-001", "dlv-jh-textbooks-subject-science-quark-01"],
  ["jh-textbooks-subject-history-001", "dlv-jh-textbooks-subject-history-quark-01"],
  ["jh-textbooks-subject-biology-001", "dlv-jh-textbooks-subject-biology-quark-01"],
  ["jh-textbooks-subject-math-001", "dlv-jh-textbooks-subject-math-quark-01"],
  ["jh-textbooks-subject-physics-001", "dlv-jh-textbooks-subject-physics-quark-01"],
  ["jh-textbooks-subject-english-001", "dlv-jh-textbooks-subject-english-quark-01"],
  ["jh-textbooks-subject-chinese-001", "dlv-jh-textbooks-subject-chinese-quark-01"],
]);

export const JUNIOR_RESOURCE_DETAIL_24_APPROVED_RESOURCE_IDS = [
  "jh-workbooks-math-core-001",
  "jh-workbooks-lixiangshu-001",
  "jh-workbooks-yibanguo-001",
  "jh-workbooks-wanwei-001",
  "jh-workbooks-kuaijie-english-001",
  "jh-workbooks-kekezhixing-001",
  "jh-workbooks-xiaoti-kuangzuo-001",
  "jh-workbooks-zhongkao-english-vocab-001",
  "jh-workbooks-xinghuo-english-001",
  "jh-workbooks-wusan-001",
  "jh-workbooks-jinkaojuan-001",
  "jh-workbooks-baiti-daguoguan-001",
  "jh-workbooks-xueyi-jinjuan-001",
  "jh-exams-real-001",
  "jh-exams-mock-001",
  "jh-courses-by-org-001",
  "jh-courses-by-grade-001",
  "jh-subjects-math-001",
  "jh-subjects-physics-001",
  "jh-subjects-chinese-001",
  "jh-sprint-exam-papers-001",
  "jh-sprint-english-001",
  "jh-sprint-physics-001",
  "jh-sprint-math-001",
] as const;

export const JUNIOR_RESOURCE_DETAIL_24_DELIVERY_IDS = new Map<string, string>([
  ["jh-workbooks-math-core-001", "dlv-jh-workbooks-math-core-quark-01"],
  ["jh-workbooks-lixiangshu-001", "dlv-jh-workbooks-lixiangshu-quark-01"],
  ["jh-workbooks-yibanguo-001", "dlv-jh-workbooks-yibanguo-quark-01"],
  ["jh-workbooks-wanwei-001", "dlv-jh-workbooks-wanwei-quark-01"],
  ["jh-workbooks-kuaijie-english-001", "dlv-jh-workbooks-kuaijie-english-quark-01"],
  ["jh-workbooks-kekezhixing-001", "dlv-jh-workbooks-kekezhixing-quark-01"],
  ["jh-workbooks-xiaoti-kuangzuo-001", "dlv-jh-workbooks-xiaoti-kuangzuo-quark-01"],
  ["jh-workbooks-zhongkao-english-vocab-001", "dlv-jh-workbooks-zhongkao-english-vocab-quark-01"],
  ["jh-workbooks-xinghuo-english-001", "dlv-jh-workbooks-xinghuo-english-quark-01"],
  ["jh-workbooks-wusan-001", "dlv-jh-workbooks-wusan-quark-01"],
  ["jh-workbooks-jinkaojuan-001", "dlv-jh-workbooks-jinkaojuan-quark-01"],
  ["jh-workbooks-baiti-daguoguan-001", "dlv-jh-workbooks-baiti-daguoguan-quark-01"],
  ["jh-workbooks-xueyi-jinjuan-001", "dlv-jh-workbooks-xueyi-jinjuan-quark-01"],
  ["jh-exams-real-001", "dlv-jh-exams-real-quark-01"],
  ["jh-exams-mock-001", "dlv-jh-exams-mock-quark-01"],
  ["jh-courses-by-org-001", "dlv-jh-courses-by-org-quark-01"],
  ["jh-courses-by-grade-001", "dlv-jh-courses-by-grade-quark-01"],
  ["jh-subjects-math-001", "dlv-jh-subjects-math-quark-01"],
  ["jh-subjects-physics-001", "dlv-jh-subjects-physics-quark-01"],
  ["jh-subjects-chinese-001", "dlv-jh-subjects-chinese-quark-01"],
  ["jh-sprint-exam-papers-001", "dlv-jh-sprint-exam-papers-quark-01"],
  ["jh-sprint-english-001", "dlv-jh-sprint-english-quark-01"],
  ["jh-sprint-physics-001", "dlv-jh-sprint-physics-quark-01"],
  ["jh-sprint-math-001", "dlv-jh-sprint-math-quark-01"],
]);

export const HS_THEME_5_APPROVED_RESOURCE_IDS = [
  "hs-topic-textbooks-001",
  "hs-topic-workbooks-001",
  "hs-topic-courses-001",
  "hs-topic-mock-001",
  "hs-topic-sprint-001",
  "hs-topic-subjects-001",
  "hs-topic-one-series-001",
  "hs-topic-competition-001",
  "hs-topic-volunteer-001",
  "hs-topic-policies-001",
] as const;

export const HS_THEME_6_DELIVERY_IDS = new Map<string, string>([
  ["hs-topic-textbooks-001", "dlv-hs-topic-textbooks-quark-01"],
  ["hs-topic-workbooks-001", "dlv-hs-topic-workbooks-quark-01"],
  ["hs-topic-courses-001", "dlv-hs-topic-courses-quark-01"],
  ["hs-topic-mock-001", "dlv-hs-topic-mock-quark-01"],
  ["hs-topic-sprint-001", "dlv-hs-topic-sprint-quark-01"],
  ["hs-topic-subjects-001", "dlv-hs-topic-subjects-quark-01"],
  ["hs-topic-one-series-001", "dlv-hs-topic-one-series-quark-01"],
  ["hs-topic-competition-001", "dlv-hs-topic-competition-quark-01"],
  ["hs-topic-volunteer-001", "dlv-hs-topic-volunteer-quark-01"],
  ["hs-topic-policies-001", "dlv-hs-topic-policies-quark-01"],
]);

export const HS_RESOURCE_DETAIL_62_APPROVED_RESOURCE_IDS = [
  "hs-courses-2027-001",
  "hs-courses-by-org-001",
  "hs-one-series-yishu-001",
  "hs-one-series-yisheng-001",
  "hs-one-series-yiying-001",
  "hs-one-series-yidi-001",
  "hs-one-series-yihua-001",
  "hs-one-series-yizheng-001",
  "hs-one-series-yiwu-001",
  "hs-one-series-last-ten-lessons-001",
  "hs-one-series-free-gaokao-001",
  "hs-one-series-huang-furen-001",
  "hs-one-series-shiyou-yuwen-001",
  "hs-subjects-chinese-001",
  "hs-subjects-physics-001",
  "hs-subjects-chemistry-001",
  "hs-subjects-math-001",
  "hs-subjects-geography-001",
  "hs-subjects-english-001",
  "hs-subjects-history-001",
  "hs-subjects-biology-001",
  "hs-subjects-politics-001",
  "hs-competition-foundation-001",
  "hs-competition-real-001",
  "hs-workbooks-first-round-2027-001",
  "hs-workbooks-synchronous-2027-001",
  "hs-sprint-answering-001",
  "hs-sprint-papers-001",
  "hs-sprint-class-001",
  "hs-mocks-real-001",
  "hs-mocks-academic-001",
  "hs-mocks-mock-001",
  "hs-mocks-guangdong-spring-001",
  "hs-textbooks-after-school-answers-001",
  "hs-textbooks-japanese-001",
  "hs-textbooks-russian-001",
  "hs-textbooks-information-technology-001",
  "hs-textbooks-general-technology-001",
  "hs-textbooks-politics-001",
  "hs-textbooks-english-001",
  "hs-textbooks-chinese-001",
  "hs-textbooks-arts-001",
  "hs-textbooks-music-001",
  "hs-textbooks-physics-001",
  "hs-textbooks-physical-education-001",
  "hs-textbooks-math-001",
  "hs-textbooks-biology-001",
  "hs-textbooks-fine-arts-001",
  "hs-textbooks-history-001",
  "hs-textbooks-chemistry-001",
  "hs-textbooks-geography-001",
  "hs-textbooks-mental-health-001",
  "hs-volunteer-college-life-001",
  "hs-volunteer-admissions-friend-001",
  "hs-volunteer-zhang-xuefeng-001",
  "hs-volunteer-forms-001",
  "hs-volunteer-materials-001",
  "hs-volunteer-peoples-daily-001",
  "hs-policies-new-curriculum-001",
  "hs-policies-repeat-study-001",
  "hs-policies-textbook-comparison-001",
  "hs-policies-exam-notes-001",
] as const;

export const HS_RESOURCE_DETAIL_62_DELIVERY_IDS = new Map<string, string>([
  ["hs-courses-2027-001", "dlv-hs-courses-2027-001-quark-01"],
  ["hs-courses-by-org-001", "dlv-hs-courses-by-org-001-quark-01"],
  ["hs-one-series-yishu-001", "dlv-hs-one-series-yishu-001-quark-01"],
  ["hs-one-series-yisheng-001", "dlv-hs-one-series-yisheng-001-quark-01"],
  ["hs-one-series-yiying-001", "dlv-hs-one-series-yiying-001-quark-01"],
  ["hs-one-series-yidi-001", "dlv-hs-one-series-yidi-001-quark-01"],
  ["hs-one-series-yihua-001", "dlv-hs-one-series-yihua-001-quark-01"],
  ["hs-one-series-yizheng-001", "dlv-hs-one-series-yizheng-001-quark-01"],
  ["hs-one-series-yiwu-001", "dlv-hs-one-series-yiwu-001-quark-01"],
  ["hs-one-series-last-ten-lessons-001", "dlv-hs-one-series-last-ten-lessons-001-quark-01"],
  ["hs-one-series-free-gaokao-001", "dlv-hs-one-series-free-gaokao-001-quark-01"],
  ["hs-one-series-huang-furen-001", "dlv-hs-one-series-huang-furen-001-quark-01"],
  ["hs-one-series-shiyou-yuwen-001", "dlv-hs-one-series-shiyou-yuwen-001-quark-01"],
  ["hs-subjects-chinese-001", "dlv-hs-subjects-chinese-001-quark-01"],
  ["hs-subjects-physics-001", "dlv-hs-subjects-physics-001-quark-01"],
  ["hs-subjects-chemistry-001", "dlv-hs-subjects-chemistry-001-quark-01"],
  ["hs-subjects-math-001", "dlv-hs-subjects-math-001-quark-01"],
  ["hs-subjects-geography-001", "dlv-hs-subjects-geography-001-quark-01"],
  ["hs-subjects-english-001", "dlv-hs-subjects-english-001-quark-01"],
  ["hs-subjects-history-001", "dlv-hs-subjects-history-001-quark-01"],
  ["hs-subjects-biology-001", "dlv-hs-subjects-biology-001-quark-01"],
  ["hs-subjects-politics-001", "dlv-hs-subjects-politics-001-quark-01"],
  ["hs-competition-foundation-001", "dlv-hs-competition-foundation-001-quark-01"],
  ["hs-competition-real-001", "dlv-hs-competition-real-001-quark-01"],
  ["hs-workbooks-first-round-2027-001", "dlv-hs-workbooks-first-round-2027-001-quark-01"],
  ["hs-workbooks-synchronous-2027-001", "dlv-hs-workbooks-synchronous-2027-001-quark-01"],
  ["hs-sprint-answering-001", "dlv-hs-sprint-answering-001-quark-01"],
  ["hs-sprint-papers-001", "dlv-hs-sprint-papers-001-quark-01"],
  ["hs-sprint-class-001", "dlv-hs-sprint-class-001-quark-01"],
  ["hs-mocks-real-001", "dlv-hs-mocks-real-001-quark-01"],
  ["hs-mocks-academic-001", "dlv-hs-mocks-academic-001-quark-01"],
  ["hs-mocks-mock-001", "dlv-hs-mocks-mock-001-quark-01"],
  ["hs-mocks-guangdong-spring-001", "dlv-hs-mocks-guangdong-spring-001-quark-01"],
  ["hs-textbooks-after-school-answers-001", "dlv-hs-textbooks-after-school-answers-001-quark-01"],
  ["hs-textbooks-japanese-001", "dlv-hs-textbooks-japanese-001-quark-01"],
  ["hs-textbooks-russian-001", "dlv-hs-textbooks-russian-001-quark-01"],
  ["hs-textbooks-information-technology-001", "dlv-hs-textbooks-information-technology-001-quark-01"],
  ["hs-textbooks-general-technology-001", "dlv-hs-textbooks-general-technology-001-quark-01"],
  ["hs-textbooks-politics-001", "dlv-hs-textbooks-politics-001-quark-01"],
  ["hs-textbooks-english-001", "dlv-hs-textbooks-english-001-quark-01"],
  ["hs-textbooks-chinese-001", "dlv-hs-textbooks-chinese-001-quark-01"],
  ["hs-textbooks-arts-001", "dlv-hs-textbooks-arts-001-quark-01"],
  ["hs-textbooks-music-001", "dlv-hs-textbooks-music-001-quark-01"],
  ["hs-textbooks-physics-001", "dlv-hs-textbooks-physics-001-quark-01"],
  ["hs-textbooks-physical-education-001", "dlv-hs-textbooks-physical-education-001-quark-01"],
  ["hs-textbooks-math-001", "dlv-hs-textbooks-math-001-quark-01"],
  ["hs-textbooks-biology-001", "dlv-hs-textbooks-biology-001-quark-01"],
  ["hs-textbooks-fine-arts-001", "dlv-hs-textbooks-fine-arts-001-quark-01"],
  ["hs-textbooks-history-001", "dlv-hs-textbooks-history-001-quark-01"],
  ["hs-textbooks-chemistry-001", "dlv-hs-textbooks-chemistry-001-quark-01"],
  ["hs-textbooks-geography-001", "dlv-hs-textbooks-geography-001-quark-01"],
  ["hs-textbooks-mental-health-001", "dlv-hs-textbooks-mental-health-001-quark-01"],
  ["hs-volunteer-college-life-001", "dlv-hs-volunteer-college-life-001-quark-01"],
  ["hs-volunteer-admissions-friend-001", "dlv-hs-volunteer-admissions-friend-001-quark-01"],
  ["hs-volunteer-zhang-xuefeng-001", "dlv-hs-volunteer-zhang-xuefeng-001-quark-01"],
  ["hs-volunteer-forms-001", "dlv-hs-volunteer-forms-001-quark-01"],
  ["hs-volunteer-materials-001", "dlv-hs-volunteer-materials-001-quark-01"],
  ["hs-volunteer-peoples-daily-001", "dlv-hs-volunteer-peoples-daily-001-quark-01"],
  ["hs-policies-new-curriculum-001", "dlv-hs-policies-new-curriculum-001-quark-01"],
  ["hs-policies-repeat-study-001", "dlv-hs-policies-repeat-study-001-quark-01"],
  ["hs-policies-textbook-comparison-001", "dlv-hs-policies-textbook-comparison-001-quark-01"],
  ["hs-policies-exam-notes-001", "dlv-hs-policies-exam-notes-001-quark-01"],
]);

export const SKILL_GROWTH_AI_APPROVED_RESOURCE_IDS = [
  "ai-learning-cognition-001",
  "ai-chatgpt-001",
  "ai-chatgpt-002",
  "ai-deepseek-001",
  "ai-deepseek-002",
] as const;

export const SKILL_GROWTH_AI_DELIVERY_IDS = new Map<string, string>([
  ["ai-learning-cognition-001", "dlv-ai-learning-cognition-quark-01"],
  ["ai-chatgpt-001", "dlv-ai-chatgpt-001-quark-01"],
  ["ai-chatgpt-002", "dlv-ai-chatgpt-002-quark-01"],
  ["ai-deepseek-001", "dlv-ai-deepseek-001-quark-01"],
  ["ai-deepseek-002", "dlv-ai-deepseek-002-quark-01"],
]);

export const SKILL_GROWTH_NON_AI_APPROVED_RESOURCE_IDS = [
  "skill-coding-scratch-001",
  "skill-coding-python-001",
  "skill-coding-cpp-001",
  "skill-coding-robotics-001",
  "skill-coding-extension-001",
  "skill-ps-video-001",
  "skill-ps-online-001",
  "skill-jianying-001",
  "skill-premiere-001",
  "skill-video-assets-001",
  "skill-music-sfx-001",
  "skill-social-short-video-001",
  "skill-social-wechat-001",
  "skill-social-xiaohongshu-001",
  "skill-driving-subject-1-001",
  "skill-driving-subject-2-001",
  "skill-driving-subject-3-001",
  "skill-driving-subject-4-001",
  "skill-driving-question-bank-001",
  "skill-calligraphy-online-001",
  "skill-calligraphy-rubbings-001",
  "skill-travel-ticketing-001",
  "skill-clip-tutorial-01",
  "skill-clip-tutorial-02",
  "skill-clip-tutorial-05",
  "skill-clip-tutorial-08",
  "skill-clip-tutorial-09",
  "skill-clip-tutorial-10",
  "skill-clip-tutorial-11",
  "skill-clip-tutorial-13",
  "skill-clip-tutorial-15",
  "skill-clip-tutorial-21",
  "skill-clip-tutorial-22",
  "skill-clip-tutorial-25",
  "skill-clip-tutorial-26",
  "skill-clip-tutorial-31",
] as const;

export const SKILL_GROWTH_NON_AI_DELIVERY_IDS = new Map<string, string>([
  ["skill-coding-scratch-001", "dlv-skill-coding-scratch-001-quark-01"],
  ["skill-coding-python-001", "dlv-skill-coding-python-001-quark-01"],
  ["skill-coding-cpp-001", "dlv-skill-coding-cpp-001-quark-01"],
  ["skill-coding-robotics-001", "dlv-skill-coding-robotics-001-quark-01"],
  ["skill-coding-extension-001", "dlv-skill-coding-extension-001-quark-01"],
  ["skill-ps-video-001", "dlv-skill-ps-video-001-quark-01"],
  ["skill-ps-online-001", "dlv-skill-ps-online-001-quark-01"],
  ["skill-jianying-001", "dlv-skill-jianying-001-quark-01"],
  ["skill-premiere-001", "dlv-skill-premiere-001-quark-01"],
  ["skill-video-assets-001", "dlv-skill-video-assets-001-quark-01"],
  ["skill-music-sfx-001", "dlv-skill-music-sfx-001-quark-01"],
  ["skill-social-short-video-001", "dlv-skill-social-short-video-001-quark-01"],
  ["skill-social-wechat-001", "dlv-skill-social-wechat-001-quark-01"],
  ["skill-social-xiaohongshu-001", "dlv-skill-social-xiaohongshu-001-quark-01"],
  ["skill-driving-subject-1-001", "dlv-skill-driving-subject-1-001-quark-01"],
  ["skill-driving-subject-2-001", "dlv-skill-driving-subject-2-001-quark-01"],
  ["skill-driving-subject-3-001", "dlv-skill-driving-subject-3-001-quark-01"],
  ["skill-driving-subject-4-001", "dlv-skill-driving-subject-4-001-quark-01"],
  ["skill-driving-question-bank-001", "dlv-skill-driving-question-bank-001-quark-01"],
  ["skill-calligraphy-online-001", "dlv-skill-calligraphy-online-001-quark-01"],
  ["skill-calligraphy-rubbings-001", "dlv-skill-calligraphy-rubbings-001-quark-01"],
  ["skill-travel-ticketing-001", "dlv-skill-travel-ticketing-001-quark-01"],
  ["skill-clip-tutorial-01", "dlv-skill-clip-tutorial-01-quark-01"],
  ["skill-clip-tutorial-02", "dlv-skill-clip-tutorial-02-quark-01"],
  ["skill-clip-tutorial-05", "dlv-skill-clip-tutorial-05-quark-01"],
  ["skill-clip-tutorial-08", "dlv-skill-clip-tutorial-08-quark-01"],
  ["skill-clip-tutorial-09", "dlv-skill-clip-tutorial-09-quark-01"],
  ["skill-clip-tutorial-10", "dlv-skill-clip-tutorial-10-quark-01"],
  ["skill-clip-tutorial-11", "dlv-skill-clip-tutorial-11-quark-01"],
  ["skill-clip-tutorial-13", "dlv-skill-clip-tutorial-13-quark-01"],
  ["skill-clip-tutorial-15", "dlv-skill-clip-tutorial-15-quark-01"],
  ["skill-clip-tutorial-21", "dlv-skill-clip-tutorial-21-quark-01"],
  ["skill-clip-tutorial-22", "dlv-skill-clip-tutorial-22-quark-01"],
  ["skill-clip-tutorial-25", "dlv-skill-clip-tutorial-25-quark-01"],
  ["skill-clip-tutorial-26", "dlv-skill-clip-tutorial-26-quark-01"],
  ["skill-clip-tutorial-31", "dlv-skill-clip-tutorial-31-quark-01"],
]);

export const B2_3_CONTEXT: AuthorizationContext = {
  audience: "public",
  platform: "website",
  now: "2026-11-13T00:00:00+08:00",
};

/**
 * v1 has one current delivery row per Resource but no persisted deliveryId.
 * This deterministic compatibility identity is local to the candidate and
 * is not the URL, FID, share code, or a claim about the original provider ID.
 */
export const deliveryIdFor = (resourceId: string) =>
  `${LEGACY_V1_COMPAT_DELIVERY_ID_PREFIX}${resourceId}`;

const evidenceFor = (resourceId: string): readonly AuthorizationEvidence[] => {
  const deliveryId = deliveryIdFor(resourceId);
  const isAggregateEntry = B2_3_CURRENT_AGGREGATE_RESOURCE_IDS.has(resourceId);
  const isNewUniversityParent = B2_3_NEW_UNIVERSITY_PARENT_RESOURCE_IDS.has(resourceId);
  const evidenceIdPrefix = isNewUniversityParent
    ? "owner-auth-20261113"
    : isAggregateEntry
      ? "owner-auth-20261106"
      : "owner-auth-20261101";
  const evidenceRef = isNewUniversityParent
    ? "docs/ZWG-UNIVERSITY-RESOURCE-DETAILS-20261113.md#处理结论"
    : isAggregateEntry
      ? "ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果"
      : "docs/OWNER-AUTHORIZATION-20261101.md#适用范围";
  const reviewedAt = isNewUniversityParent
    ? "2026-11-13T00:00:00+08:00"
    : isAggregateEntry
      ? "2026-11-07T08:30:57+08:00"
      : "2026-11-01T00:00:00+08:00";
  return [
    {
      evidenceId: `${evidenceIdPrefix}:${resourceId}:resource`,
      subjectType: "resource",
      resourceId,
      actionScope: ["display_metadata", "expose_share_link"],
      audienceScope: ["public"],
      platformScope: ["website"],
      status: "approved",
      evidenceRef,
      reviewedAt,
    },
    {
      evidenceId: `${evidenceIdPrefix}:${resourceId}:delivery`,
      subjectType: "delivery",
      resourceId,
      deliveryId,
      actionScope: ["expose_share_link"],
      audienceScope: ["public"],
      platformScope: ["website"],
      status: "approved",
      evidenceRef: isNewUniversityParent
        ? evidenceRef
        : isAggregateEntry
          ? "ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果"
          : "docs/UNIVERSITY-FIRST-BATCH-AUTHORIZATION.md#当前候选状态",
      reviewedAt,
    },
  ];
};

export const B2_3_POLICIES = new Map<string, PublicProjectionPolicy>(
  [
    ...B2_3_APPROVED_RESOURCE_IDS.map((resourceId) => [
      resourceId,
      {
        deliveryId: deliveryIdFor(resourceId),
        browseState: "observed",
        evidence: evidenceFor(resourceId),
      },
    ] as const),
    ...JUNIOR_RELEASE_6_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = JUNIOR_RELEASE_6_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing junior Delivery ID: ${resourceId}`);
      return [
        resourceId,
        {
          deliveryId,
          browseState: "observed",
          evidence: [
            {
              evidenceId: `auth-${resourceId}-resource-01`,
              subjectType: "resource",
              resourceId,
              actionScope: ["display_metadata", "expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: `ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果`,
              reviewedAt: "2026-11-07T09:12:00+08:00",
            },
            {
              evidenceId: `auth-${resourceId}-delivery-01`,
              subjectType: "delivery",
              resourceId,
              deliveryId,
              actionScope: ["expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: `ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果`,
              reviewedAt: "2026-11-07T09:12:00+08:00",
            },
          ],
        },
      ] as const;
    }),
    ...JUNIOR_TEXTBOOK_SUBJECT_11_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = JUNIOR_TEXTBOOK_SUBJECT_11_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing junior textbook subject Delivery ID: ${resourceId}`);
      return [
        resourceId,
        {
          deliveryId,
          browseState: "observed",
          evidence: [
            {
              evidenceId: `auth-${resourceId}-resource-01`,
              subjectType: "resource",
              resourceId,
              actionScope: ["display_metadata", "expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-JUNIOR-TEXTBOOK-SUBJECT-LINKS-20261111.md#处理结论",
              reviewedAt: "2026-11-11",
            },
            {
              evidenceId: `auth-${resourceId}-delivery-01`,
              subjectType: "delivery",
              resourceId,
              deliveryId,
              actionScope: ["expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-JUNIOR-TEXTBOOK-SUBJECT-LINKS-20261111.md#公开链接核验",
              reviewedAt: "2026-11-11",
            },
          ],
        },
      ] as const;
    }),
    ...JUNIOR_RESOURCE_DETAIL_24_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = JUNIOR_RESOURCE_DETAIL_24_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing junior resource detail Delivery ID: ${resourceId}`);
      return [
        resourceId,
        {
          deliveryId,
          browseState: "observed",
          evidence: [
            {
              evidenceId: `auth-${resourceId}-resource-01`,
              subjectType: "resource",
              resourceId,
              actionScope: ["display_metadata", "expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-JUNIOR-RESOURCE-DETAILS-20261112.md#处理结论",
              reviewedAt: "2026-11-12",
            },
            {
              evidenceId: `auth-${resourceId}-delivery-01`,
              subjectType: "delivery",
              resourceId,
              deliveryId,
              actionScope: ["expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-JUNIOR-RESOURCE-DETAILS-20261112.md#公开链接核验",
              reviewedAt: "2026-11-12",
            },
          ],
        },
      ] as const;
    }),
    ...HS_THEME_5_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = HS_THEME_6_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing high-school theme Delivery ID: ${resourceId}`);
      return [
        resourceId,
        {
          deliveryId,
          browseState: "observed",
          evidence: [
            {
              evidenceId: `auth-${resourceId}-resource-01`,
              subjectType: "resource",
              resourceId,
              actionScope: ["display_metadata", "expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
                evidenceRef: `ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果`,
                reviewedAt: "2026-11-07T09:12:00+08:00",
            },
            {
              evidenceId: `auth-${resourceId}-delivery-01`,
              subjectType: "delivery",
              resourceId,
              deliveryId,
              actionScope: ["expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
                evidenceRef: `ZWG-CATEGORY-CERTIFICATION-HIGHSCHOOL-20261107-REPORT.md#核验结果`,
                reviewedAt: "2026-11-07T09:12:00+08:00",
            },
          ],
        },
      ] as const;
    }),
    ...HS_RESOURCE_DETAIL_62_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = HS_RESOURCE_DETAIL_62_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing high-school resource detail Delivery ID: ${resourceId}`);
      return [
        resourceId,
        {
          deliveryId,
          browseState: "observed",
          evidence: [
            {
              evidenceId: `auth-${resourceId}-resource-01`,
              subjectType: "resource",
              resourceId,
              actionScope: ["display_metadata", "expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-HIGH-SCHOOL-RESOURCE-DETAILS-20261113.md#公开链接核验",
              reviewedAt: "2026-11-13T00:00:00+08:00",
            },
            {
              evidenceId: `auth-${resourceId}-delivery-01`,
              subjectType: "delivery",
              resourceId,
              deliveryId,
              actionScope: ["expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-HIGH-SCHOOL-RESOURCE-DETAILS-20261113.md#公开链接核验",
              reviewedAt: "2026-11-13T00:00:00+08:00",
            },
          ],
        },
      ] as const;
    }),
    ...SKILL_GROWTH_AI_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = SKILL_GROWTH_AI_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing skill-growth AI Delivery ID: ${resourceId}`);
      return [
        resourceId,
        {
          deliveryId,
          browseState: "observed",
          evidence: [
            {
              evidenceId: `auth-${resourceId}-resource-01`,
              subjectType: "resource",
              resourceId,
              actionScope: ["display_metadata", "expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-SKILL-GROWTH-AI-PUBLIC-RELEASE-20261109.md#站长授权与公开接入确认",
              reviewedAt: "2026-11-09",
            },
            {
              evidenceId: `auth-${resourceId}-delivery-01`,
              subjectType: "delivery",
              resourceId,
              deliveryId,
              actionScope: ["expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-SKILL-GROWTH-AI-PUBLIC-RELEASE-20261109.md#站长授权与公开接入确认",
              reviewedAt: "2026-11-09",
            },
          ],
        },
      ] as const;
    }),
    ...SKILL_GROWTH_NON_AI_APPROVED_RESOURCE_IDS.map((resourceId) => {
      const deliveryId = SKILL_GROWTH_NON_AI_DELIVERY_IDS.get(resourceId);
      if (!deliveryId) throw new Error(`Missing skill-growth non-AI Delivery ID: ${resourceId}`);
      return [
        resourceId,
        {
          deliveryId,
          browseState: "observed",
          evidence: [
            {
              evidenceId: `auth-${resourceId}-resource-01`,
              subjectType: "resource",
              resourceId,
              actionScope: ["display_metadata", "expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-SKILL-GROWTH-NON-AI-PUBLIC-RELEASE-20261110.md#站长授权与公开接入确认",
              reviewedAt: "2026-11-10",
            },
            {
              evidenceId: `auth-${resourceId}-delivery-01`,
              subjectType: "delivery",
              resourceId,
              deliveryId,
              actionScope: ["expose_share_link"],
              audienceScope: ["public"],
              platformScope: ["website"],
              status: "approved",
              evidenceRef: "docs/ZWG-SKILL-GROWTH-NON-AI-PUBLIC-RELEASE-20261110.md#站长授权与公开接入确认",
              reviewedAt: "2026-11-10",
            },
          ],
        },
      ] as const;
    }),
  ],
);

export const B2_3_HOLD_REASONS = new Map<string, string>([
  [
    "university-series-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-topic-review-001",
    "历史聚合入口；授权文档未以该 Resource ID 建立 Resource/Delivery 精确证据",
  ],
  [
    "university-quark-english-contest-001",
    "UFB-016 权利授权已记录，但 strict-v2 来源范围仍为 HOLD_OWNER_SCOPE",
  ],
]);
