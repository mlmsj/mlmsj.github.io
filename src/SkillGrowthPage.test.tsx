import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SkillGrowthPage } from "./SkillGrowthPage";

describe("skill-growth entry", () => {
  it("renders the three approved boards and real public counts", () => {
    render(
      <SkillGrowthPage
        counts={{
          "skill-ai-digital-tech": 2,
          "skill-ai-knowledge": 2,
          "skill-ai-deepseek": 1,
          "skill-digital-creation-media": 0,
          "skill-life-interests": 0,
        }}
        onHome={vi.fn()}
        onOpenCategories={vi.fn()}
        onOpenResources={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "技能成长" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "AI 与数字科技" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "数字创作与自媒体" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "生活技能与兴趣" })).toBeVisible();
    expect(screen.getAllByText("2 份公开资料").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("1 份公开资料")).toBeVisible();
  });

  it("uses existing category and resource routes for group and leaf links", () => {
    const onOpenCategories = vi.fn();
    const onOpenResources = vi.fn();
    render(
      <SkillGrowthPage
        counts={{}}
        onHome={vi.fn()}
        onOpenCategories={onOpenCategories}
        onOpenResources={onOpenResources}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: /AI 与人工智能/ }));
    expect(onOpenCategories).toHaveBeenCalledWith(
      "/categories?category=skill-ai-digital-tech&subject=skill-ai-knowledge",
    );

    fireEvent.click(screen.getByRole("link", { name: /DeepSeek 教程/ }));
    expect(onOpenResources).toHaveBeenCalledWith(
      "/resources?category=skill-ai-deepseek",
    );
  });
});
