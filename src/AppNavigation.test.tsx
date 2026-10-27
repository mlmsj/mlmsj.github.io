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
});
