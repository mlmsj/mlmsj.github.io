import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MyPage } from "./MyPage";
import { Toolbox } from "./Toolbox";
import { emptyMyData } from "./myData";

describe("UI-M03 mobile layout hooks", () => {
  it("keeps the common-tools empty state and mobile ordering hooks", () => {
    const onTool = vi.fn();
    const { container } = render(
      <MyPage
        section="overview"
        data={emptyMyData()}
        setData={vi.fn()}
        resources={[]}
        onSection={vi.fn()}
        onResource={vi.fn()}
        onTool={onTool}
        onHome={vi.fn()}
      />,
    );

    const toolsPanel = screen.getByRole("heading", { name: "常用工具" }).closest("section");
    const favoritesPanel = screen.getByRole("heading", { name: "最近收藏" }).closest("section");
    expect(toolsPanel).toHaveClass("my-panel-tools");
    expect(favoritesPanel).toHaveClass("my-panel-favorites");
    expect(container.querySelector(".my-sidebar")).toBeInTheDocument();

    fireEvent.click(within(toolsPanel as HTMLElement).getByRole("button", { name: /去工具箱/ }));
    expect(onTool).toHaveBeenCalledWith("");
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
});
