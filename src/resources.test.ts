import { describe, expect, it } from "vitest";
import { resources } from "./resources";

describe("resource migration contract", () => {
  it("preserves all ten resource IDs and leaves them explicitly unclassified", () => {
    expect(resources.map(({ id }) => id)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
    ]);
    expect(
      resources.every(
        ({ categoryId, classificationStatus }) =>
          categoryId === null && classificationStatus === "pending",
      ),
    ).toBe(true);
  });

  it("preserves every legacy title, date, tag, and description", () => {
    expect(
      resources.map(({ id, title, meta, tag, description }) => ({
        id,
        title,
        meta,
        tag,
        description,
      })),
    ).toEqual([
      { id: "01", title: "2026高考数学真题及答案（全国卷）", meta: "2024-12-10", tag: "高中", description: "全国卷高考数学真题与答案整理。" },
      { id: "02", title: "大学英语四级高频词汇整理", meta: "2024-12-09", tag: "大学", description: "适合备考四级的高频词汇资料。" },
      { id: "03", title: "计算机二级Office操作题合集", meta: "2024-12-08", tag: "考证", description: "Office 计算机二级操作题练习合集。" },
      { id: "04", title: "初中数学知识点总结（全册）", meta: "2024-12-06", tag: "初中", description: "初中数学全册知识点梳理。" },
      { id: "05", title: "高中物理必修一重点知识整理", meta: "2024-12-05", tag: "高中", description: "高中物理必修一重点知识整理。" },
      { id: "06", title: "考研英语历年真题及解析", meta: "2024-12-04", tag: "考证", description: "考研英语历年真题与解析。" },
      { id: "07", title: "公务员考试行测资料合集", meta: "2024-12-03", tag: "考证", description: "公务员行测备考资料合集。" },
      { id: "08", title: "大学专业课笔记（计算机类）", meta: "2024-12-02", tag: "大学", description: "计算机专业课程笔记整理。" },
      { id: "09", title: "高中化学实验题专项训练", meta: "2024-12-01", tag: "高中", description: "高中化学实验题专项练习。" },
      { id: "10", title: "中考英语真题汇总（近五年）", meta: "2024-11-30", tag: "初中", description: "近五年中考英语真题汇总。" },
    ]);
  });
});
