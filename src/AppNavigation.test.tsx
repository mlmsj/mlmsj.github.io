import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("home category navigation", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  afterEach(() => cleanup());

  it.each([
    ["初中", "stage-junior"],
    ["高中", "stage-senior"],
    ["大学", "stage-university"],
    ["考证", "purpose-certification"],
  ])("opens %s through its stable category ID", (name, categoryId) => {
    const { container } = render(<App />);
    const entrances = container.querySelector<HTMLElement>(".entrance-grid");
    expect(entrances).not.toBeNull();

    fireEvent.click(within(entrances!).getByRole("button", { name: new RegExp(name) }));

    expect(window.location.pathname).toBe("/categories");
    expect(window.location.search).toBe(`?category=${categoryId}`);
    expect(screen.getByRole("heading", { name: "分类浏览" })).toBeVisible();
  });

  it("opens the independent skill-growth entry without adding it to the core category grid", () => {
    const { container } = render(<App />);
    const entrances = container.querySelector<HTMLElement>(".entrance-grid");
    expect(entrances).not.toBeNull();
    expect(within(entrances!).getAllByRole("button")).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: /浏览技能成长/ }));

    expect(window.location.pathname).toBe("/skill-growth");
    expect(screen.getByRole("heading", { name: "技能成长" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "AI 与数字科技" })).toBeVisible();
  });

  it("keeps six fixed hot-search entries and routes AI to skill growth", () => {
    const { container } = render(<App />);
    const hotSearch = container.querySelector<HTMLElement>(".hot-search");
    expect(hotSearch).not.toBeNull();
    expect(within(hotSearch!).getAllByRole("button")).toHaveLength(6);

    fireEvent.click(within(hotSearch!).getByRole("button", { name: /^AI$/ }));

    expect(window.location.pathname).toBe("/skill-growth");
  });

  it.each([
    ["初中", "?category=stage-junior"],
    ["高中", "?category=stage-senior"],
    ["大学", "?category=stage-university"],
    ["四级", "?category=purpose-certification&subject=purpose-certification-cet"],
    ["考研", "?categoryPath=stage-university%2Cdomain-university-postgraduate%2Cdomain-university-postgraduate-kaoyan"],
  ])("routes hot-search %s through an existing category", (name, expectedSearch) => {
    const { container } = render(<App />);
    const hotSearch = container.querySelector<HTMLElement>(".hot-search");

    fireEvent.click(within(hotSearch!).getByRole("button", { name: new RegExp(`^${name}$`) }));

    expect(window.location.pathname).toBe("/categories");
    expect(window.location.search).toBe(expectedSearch);
  });
});
