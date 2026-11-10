import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MyPage } from "./MyPage";
import { Toolbox } from "./Toolbox";
import { emptyMyData } from "./myData";

describe("UI-M03 mobile layout hooks", () => {
  it("keeps the compact personal overview and real empty learning state", () => {
    const onSection = vi.fn();
    const onHome = vi.fn();
    const { container } = render(
      <MyPage
        section="overview"
        data={emptyMyData()}
        setData={vi.fn()}
        resources={[]}
        onSection={onSection}
        onResource={vi.fn()}
        onTool={vi.fn()}
        onHome={onHome}
      />,
    );

    expect(screen.getByRole("heading", { name: "学习记录" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "常用服务" })).toBeVisible();
    expect(screen.getByText("还没有学习记录")).toBeVisible();
    expect(container.querySelector(".my-sidebar")).toBeInTheDocument();

    fireEvent.click(within(container.querySelector(".my-quick-links") as HTMLElement).getByRole("button", { name: "我的工具" }));
    expect(onSection).toHaveBeenCalledWith("tools");
    fireEvent.click(within(container.querySelector(".my-study-empty") as HTMLElement).getByRole("button", { name: /去找资料/ }));
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it("keeps every toolbox favorite action independently clickable", () => {
    const onToggleFavorite = vi.fn();
    render(<Toolbox openTool={vi.fn()} onToggleFavorite={onToggleFavorite} />);

    const favoriteButtons = screen.getAllByRole("button", { name: /^添加常用：/ });
    expect(favoriteButtons).toHaveLength(15);
    expect(favoriteButtons[0]).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(favoriteButtons[0]);
    expect(onToggleFavorite).toHaveBeenCalledWith("nup");
  });

  it("renders the category filters and switches the active category", () => {
    render(<Toolbox openTool={vi.fn()} />);

    const filterGroup = screen.getByRole("group", { name: "工具分类" });
    const filterButtons = within(filterGroup).getAllByRole("button");
    expect(filterButtons).toHaveLength(5);
    expect(filterButtons[0]).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(within(filterGroup).getByRole("button", { name: "PDF 文档" }));
    expect(within(filterGroup).getByRole("button", { name: "PDF 文档" })).toHaveAttribute("aria-pressed", "true");
    expect(within(filterGroup).getByRole("button", { name: "全部" })).toHaveAttribute("aria-pressed", "false");
  });

  it("explains toolbox workflows and routes recommended tools", () => {
    const openTool = vi.fn();
    render(<Toolbox openTool={openTool} />);

    const scenarioGroup = screen.getByRole("group", { name: "学习工具使用场景" });
    expect(within(scenarioGroup).getAllByRole("button")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "从你的学习任务开始" })).toBeVisible();

    fireEvent.click(within(scenarioGroup).getByRole("button", { name: /资料已经有了/ }));
    expect(screen.getByRole("heading", { name: "把零散文件整理成一份完整讲义" })).toBeVisible();

    const recommendedTools = document.querySelector(".scenario-tool-list") as HTMLElement;
    fireEvent.click(within(recommendedTools).getByRole("button", { name: /PDF 合并/ }));
    expect(openTool).toHaveBeenCalledWith("merge");
  });
});
