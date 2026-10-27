import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { InfoPage } from "./InfoPages";
import { MyPage } from "./MyPage";
import { Toolbox, ToolDetail, type ToolKey } from "./Toolbox";
import { emptyMyData } from "./myData";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("R15-3 capability copy", () => {
  it("describes the currently available catalog and local tools without planned-state copy", () => {
    render(<InfoPage page="guide" go={() => undefined} />);

    expect(screen.getByText(/学习资料目录已可浏览、搜索和收藏/)).toBeVisible();
    fireEvent.click(screen.getByRole("tab", { name: "学生工具箱" }));
    expect(screen.getByText(/已开放 15 个浏览器本地处理工具/)).toBeVisible();
    expect(document.body).not.toHaveTextContent("学生工具箱正在规划与完善中");
  });

  it("moves both selection and keyboard focus across guide tabs", () => {
    render(<InfoPage page="guide" go={() => undefined} />);
    const catalogTab = screen.getByRole("tab", { name: "学习资料" });
    catalogTab.focus();
    fireEvent.keyDown(catalogTab, { key: "ArrowRight" });
    const toolsTab = screen.getByRole("tab", { name: "学生工具箱" });
    expect(toolsTab).toHaveFocus();
    expect(toolsTab).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(toolsTab, { key: "End" });
    expect(screen.getByRole("tab", { name: "常见问题" })).toHaveFocus();
  });

  it("limits download history copy to catalog actions", () => {
    render(
      <MyPage
        section="downloads"
        data={emptyMyData()}
        setData={() => undefined}
        resources={[]}
        onSection={() => undefined}
        onResource={() => undefined}
        onTool={() => undefined}
        onHome={() => undefined}
      />,
    );

    expect(screen.getByText(/只记录资料目录发起下载的动作/)).toHaveTextContent(
      "不包含学生工具生成的文件",
    );
    expect(screen.getByText("尚无资料下载发起记录。")).toBeVisible();
  });

  it("states that public feedback is separate from the local catalog admin", () => {
    render(<InfoPage page="contact" go={() => undefined} />);
    expect(screen.getByText(/当前公开网站尚未接入反馈接收接口/)).toHaveTextContent(
      "目录管理后台的本地能力不等于公开反馈服务已经开放",
    );
  });
});

describe("R15-3 accessible names and heading hierarchy", () => {
  it("gives the home search field a stable accessible name", () => {
    window.history.replaceState({}, "", "/");
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    render(<App />);
    expect(screen.getByRole("textbox", { name: "搜索学习资料" })).toBeVisible();
  });

  it.each([
    ["pdf-compress", "PDF 压缩"],
    ["ocr", "OCR 文字识别"],
    ["page-number", "PDF 添加页码"],
    ["watermark", "PDF 添加文字水印"],
  ] as [ToolKey, string][])("keeps one level-one heading for %s", (tool, title) => {
    render(<ToolDetail tool={tool} back={() => undefined} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeVisible();
    expect(screen.queryByRole("heading", { level: 2, name: title })).toBeNull();
  });

  it("advertises text watermarking only", () => {
    render(<ToolDetail tool="watermark" back={() => undefined} />);
    expect(screen.getByText("添加文字水印。处理过程仅在当前浏览器中完成。")).toBeVisible();
    expect(document.body).not.toHaveTextContent("图片水印");
  });

  it("keeps profile to one main landmark and one level-one heading", () => {
    window.history.replaceState({}, "", "/profile");
    render(<App />);

    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { level: 1, name: "我的" }),
    );
    expect(document.querySelectorAll(".my-page h1")).toHaveLength(1);
  });

  it("keeps profile heading levels continuous when the section heading is visually compact", () => {
    window.history.replaceState({}, "", "/profile");
    render(<App />);

    const levels = Array.from(document.querySelectorAll(".my-page h1, .my-page h2, .my-page h3"))
      .map(node => Number(node.tagName.slice(1)));
    expect(levels.filter(level => level === 1)).toHaveLength(1);
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index]).toBeLessThanOrEqual(levels[index - 1] + 1);
    }
  });
});

describe("R15-3 navigation and tool state semantics", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it.each([
    ["/", "首页", "首页"],
    ["/resources", "找资料", "找资料"],
    ["/categories", "分类", "分类"],
    ["/tools", "学习工具", "工具"],
    ["/profile", "我的", "我的"],
  ])("marks %s as the current page in both navigation surfaces", (path, headerLabel, bottomLabel) => {
    window.history.replaceState({}, "", path);
    render(<App />);

    const header = within(screen.getByRole("navigation", { name: "主导航" }));
    const bottom = within(screen.getByRole("navigation", { name: "移动底部导航" }));
    expect(header.getByRole("button", { name: headerLabel })).toHaveAttribute("aria-current", "page");
    expect(bottom.getByRole("button", { name: bottomLabel })).toHaveAttribute("aria-current", "page");
  });

  it("keeps the mobile menu state and controlled region synchronized", () => {
    render(<App />);
    const menuButton = screen.getByRole("button", { name: "打开菜单" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveAttribute("aria-controls", "mobile-navigation");

    fireEvent.click(menuButton);
    expect(screen.getByRole("button", { name: "关闭菜单" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "移动主导航" })).toBeVisible();
  });

  it("exposes toolbox filter state and keeps it synchronized after a change", () => {
    render(<Toolbox openTool={() => undefined} />);
    const filters = within(screen.getByRole("group", { name: "工具分类" }));
    const all = filters.getByRole("button", { name: "全部" });
    const pdf = filters.getByRole("button", { name: "PDF 文档" });
    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(pdf).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(pdf);
    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(pdf).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("PDF 合并")).toBeVisible();
  });

  it("announces tool errors as alerts without duplicating the message node", async () => {
    const { container } = render(<ToolDetail tool="merge" back={() => undefined} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { files: [new File(["not a pdf"], "broken.pdf", { type: "application/pdf" })] } });

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("无法读取"));
    expect(container.querySelectorAll(".tool-message")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it.each([
    ["ocr", "选择 OCR 文件"],
    ["page-number", "选择 PDF 文件"],
    ["watermark", "选择 PDF 文件"],
    ["pdf-compress", "选择 PDF 文件"],
  ] as [ToolKey, string][])("makes %s upload keyboard-operable", (tool, label) => {
    const inputClick = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
    render(<ToolDetail tool={tool} back={() => undefined} />);
    const upload = screen.getByRole("button", { name: label });
    expect(upload).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(upload, { key: "Enter" });
    fireEvent.keyDown(upload, { key: " " });
    expect(inputClick).toHaveBeenCalledTimes(2);
  });
});
