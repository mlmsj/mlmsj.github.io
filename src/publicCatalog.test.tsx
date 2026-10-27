import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  canOpenPublicShare,
  mapManifestRecordToResource,
  usePublicCatalog,
} from "./publicCatalog";
import { PublicDeliveryPanel, PublicDetail } from "./PublicDetail";
import { ResourcesPage } from "./ResourcesPage";
import { MY_DATA_KEY, validateMyData } from "./myData";
import type { PublicManifest, PublicManifestRecord } from "./publicManifest";

const syntheticRecord: PublicManifestRecord = {
  id: "synthetic-public-id",
  title: "合成公开标题",
  categoryId: "type-junior-math-notes",
  provider: "quark",
  shareUrl: "https://pan.quark.cn/s/fixture-only",
  passcode: "0123",
  accessStatus: "verified",
  checkedOn: "2026-10-17",
  publishedAt: "2026-10-14T08:00:00Z",
  description: "合成公开说明",
  fileType: "pdf",
  sizeBytes: 12,
};

const syntheticManifest: PublicManifest = {
  schemaVersion: 1,
  generatedAt: "2026-10-17T16:00:00Z",
  records: [syntheticRecord],
};

const responseFor = (body: unknown, ok = true, status = 200) =>
  ({ ok, status, json: async () => body }) as Response;

function CatalogProbe() {
  const state = usePublicCatalog();
  return (
    <div>
      <span data-testid="catalog-phase">{state.phase}</span>
      <span data-testid="catalog-count">{state.items.length}</span>
      <output data-testid="catalog-counts">{JSON.stringify(state.counts)}</output>
      {state.status && <span>{state.status}</span>}
      {state.items.map((item) => <span key={item.id}>{item.title}</span>)}
    </div>
  );
}

const statusRecord = (
  accessStatus: PublicManifestRecord["accessStatus"],
): PublicManifestRecord => ({
  ...syntheticRecord,
  id: `synthetic-${accessStatus}`,
  accessStatus,
  checkedOn: accessStatus === "verified" ? "2026-10-17" : null,
});

beforeEach(() => {
  window.history.replaceState({}, "", "/resources");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("static public manifest catalog", () => {
  it("keeps mixed-level aggregate category counts consistent with the public records", async () => {
    const records: PublicManifestRecord[] = [
      { ...syntheticRecord, id: "fixture-university", categoryId: "stage-university" },
      { ...syntheticRecord, id: "fixture-junior", categoryId: "stage-junior" },
      { ...syntheticRecord, id: "fixture-math", categoryId: "subject-junior-math" },
      { ...syntheticRecord, id: "fixture-notes", categoryId: "type-junior-math-notes" },
      { ...syntheticRecord, id: "fixture-unchecked", categoryId: "stage-university", accessStatus: "unchecked", checkedOn: null },
      { ...syntheticRecord, id: "fixture-withdrawn", categoryId: "stage-university", accessStatus: "withdrawn" },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(responseFor({ ...syntheticManifest, records })));
    render(<CatalogProbe />);
    await screen.findByText("ready");
    expect(JSON.parse(screen.getByTestId("catalog-counts").textContent ?? "{}")).toEqual({
      "stage-junior": 3,
      "stage-senior": 0,
      "stage-university": 1,
      "purpose-certification": 0,
      "subject-junior-math": 2,
      "type-junior-math-notes": 1,
    });
  });

  it("loads the static manifest once and maps delivery fields without using the API", async () => {
    const fetcher = vi.fn().mockResolvedValue(responseFor(syntheticManifest));
    vi.stubGlobal("fetch", fetcher);

    render(<CatalogProbe />);

    await screen.findByText(syntheticRecord.title);
    expect(screen.getByTestId("catalog-phase")).toHaveTextContent("ready");
    expect(screen.getByTestId("catalog-count")).toHaveTextContent("1");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toContain("data/manifest.v1.json");
    expect(fetcher.mock.calls[0][0]).not.toContain("/api/public/resources");
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      cache: "no-store",
      credentials: "omit",
    });
  });

  it("keeps a valid empty manifest distinct from loading and failure", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      responseFor({ ...syntheticManifest, records: [] }),
    );
    vi.stubGlobal("fetch", fetcher);

    render(<CatalogProbe />);
    await screen.findByText("ready");
    expect(screen.getByTestId("catalog-phase")).toHaveTextContent("ready");
    expect(screen.getByTestId("catalog-count")).toHaveTextContent("0");
    cleanup();

    render(
      <ResourcesPage
        resourceValues={[]}
        catalogPhase="ready"
        catalogStatus=""
        detail={vi.fn()}
      />,
    );

    expect(screen.getByText("暂无正式发布资料")).toBeVisible();
    expect(screen.getByText(/不代表网盘内没有资料/)).toBeVisible();
    expect(screen.queryByText("正在加载公开资料清单…")).not.toBeInTheDocument();
  });

  it("shows loading without an empty claim", () => {
    render(
      <ResourcesPage
        resourceValues={[]}
        catalogPhase="loading"
        catalogStatus="正在加载公开资料清单…"
        detail={vi.fn()}
      />,
    );

    expect(screen.getByText("正在加载公开资料清单…")).toBeVisible();
    expect(screen.queryByText("暂无正式发布资料")).not.toBeInTheDocument();
  });

  it("fails closed for network, HTTP, JSON and manifest validation errors", async () => {
    const cases = [
      {
        name: "network",
        response: Promise.reject(new Error("synthetic network failure")),
      },
      {
        name: "http",
        response: Promise.resolve(responseFor({}, false, 503)),
      },
      {
        name: "json",
        response: Promise.resolve({ ok: true, json: async () => { throw new Error("bad json"); } } as unknown as Response),
      },
      {
        name: "validation",
        response: Promise.resolve(responseFor({ ...syntheticManifest, extra: "no" })),
      },
    ];

    for (const testCase of cases) {
      cleanup();
      vi.unstubAllGlobals();
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(testCase.response));
      render(<CatalogProbe />);
      await screen.findByText("公开资料清单暂不可用，请重试。");
      expect(screen.queryByText(syntheticRecord.title)).not.toBeInTheDocument();
      expect(testCase.name).toBeTruthy();
    }
  });

  it("maps invalid provider/url input to a non-clickable delivery", () => {
    const resource = mapManifestRecordToResource({
      ...syntheticRecord,
      provider: "baidu",
      shareUrl: "https://pan.quark.cn/s/fixture-only",
    } as PublicManifestRecord);

    expect(resource.delivery?.shareUrl).toBeNull();
    expect(canOpenPublicShare(resource)).toBe(false);
    render(<PublicDeliveryPanel resource={resource} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("searches and filters only verified resources in the browser", () => {
    const resource = mapManifestRecordToResource(syntheticRecord);
    const unchecked = mapManifestRecordToResource({
      ...statusRecord("unchecked"),
      title: "搜索未核验资料",
    });
    const withdrawn = mapManifestRecordToResource({
      ...statusRecord("withdrawn"),
      title: "搜索已撤回资料",
    });
    const unknown = mapManifestRecordToResource({
      ...syntheticRecord,
      id: "synthetic-unknown",
      title: "搜索未知状态资料",
      accessStatus: "unknown" as unknown as PublicManifestRecord["accessStatus"],
      checkedOn: null,
    });
    render(
      <ResourcesPage
        resourceValues={[resource, unchecked, withdrawn, unknown]}
        catalogPhase="ready"
        detail={vi.fn()}
      />,
    );

    expect(screen.getByText(syntheticRecord.title)).toBeVisible();
    expect(screen.queryByText("搜索未核验资料")).not.toBeInTheDocument();
    expect(screen.queryByText("搜索已撤回资料")).not.toBeInTheDocument();
    expect(screen.queryByText("搜索未知状态资料")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "关键词" }), {
      target: { value: "不存在的关键词" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));
    expect(screen.getByText("没有匹配的公开资料")).toBeVisible();
    expect(screen.queryByText(syntheticRecord.title)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "查看全部公开资料" }));
    expect(screen.getByText(syntheticRecord.title)).toBeVisible();
    window.history.pushState({}, "", "/resources?category=type-junior-math-notes");
    fireEvent.popState(window);
    expect(screen.getByText(syntheticRecord.title)).toBeVisible();
  });

  it("maps detail data without a second request", () => {
    const resource = mapManifestRecordToResource(syntheticRecord);
    render(
      <PublicDetail
        id={resource.id}
        resourceValues={[resource]}
        catalogPhase="ready"
        catalogStatus=""
        render={(item) => <h1>{item.title}</h1>}
      />,
    );
    expect(screen.getByRole("heading", { name: syntheticRecord.title })).toBeVisible();
  });

  it.each([
    ["unchecked", false, "尚未核验"],
    ["verified", true, "已核验"],
    ["degraded", false, "访问异常"],
    ["expired", false, "已确认失效"],
    ["withdrawn", false, "已撤回"],
  ] as const)("applies the %s share-entry policy", (status, linkEnabled, label) => {
    const resource = mapManifestRecordToResource(statusRecord(status));
    render(<PublicDeliveryPanel resource={resource} />);

    expect(screen.getByText(label)).toBeVisible();
    if (linkEnabled) {
      expect(screen.getByRole("link", { name: /打开夸克网盘分享/ })).toHaveAttribute(
        "rel",
        "noopener noreferrer",
      );
    } else {
      expect(screen.queryByRole("link", { name: /打开夸克网盘分享/ })).not.toBeInTheDocument();
      expect(screen.getByText("当前暂不提供正常访问入口")).toBeVisible();
    }
  });

  it("fails closed for an unknown access status", () => {
    const resource = mapManifestRecordToResource({
      ...syntheticRecord,
      id: "synthetic-unknown-status",
      accessStatus: "unknown" as unknown as PublicManifestRecord["accessStatus"],
      checkedOn: null,
    });

    expect(resource.isPubliclyAccessible).toBe(false);
    expect(canOpenPublicShare(resource)).toBe(false);
    render(<PublicDeliveryPanel resource={resource} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "复制提取码" })).not.toBeInTheDocument();
  });

  it("hides withdrawn detail access", () => {
    const resource = mapManifestRecordToResource(statusRecord("withdrawn"));
    render(
      <PublicDetail
        id={resource.id}
        resourceValues={[resource]}
        catalogPhase="ready"
        catalogStatus=""
        render={() => <h1>不应显示</h1>}
      />,
    );
    expect(screen.getByText("该资料已撤回，不再提供公开访问入口。")).toBeVisible();
    expect(screen.queryByText("不应显示")).not.toBeInTheDocument();
  });

  it.each([
    ["unchecked", "尚未核验"],
    ["unknown", "未知状态"],
  ] as const)("does not allow direct detail access for %s", (status, _label) => {
    const resource = mapManifestRecordToResource(
      status === "unknown"
        ? {
            ...syntheticRecord,
            id: "synthetic-unknown-detail",
            accessStatus: "unknown" as unknown as PublicManifestRecord["accessStatus"],
            checkedOn: null,
          }
        : statusRecord("unchecked"),
    );
    render(
      <PublicDetail
        id={resource.id}
        resourceValues={[resource]}
        catalogPhase="ready"
        catalogStatus=""
        render={() => <h1>不应显示</h1>}
      />,
    );
    expect(screen.getByText("资料不存在、未发布或已撤回。")).toBeVisible();
    expect(screen.queryByText("不应显示")).not.toBeInTheDocument();
  });

  it("copies a leading-zero passcode only after clipboard success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<PublicDeliveryPanel resource={mapManifestRecordToResource(syntheticRecord)} />);

    expect(screen.getByText("0123")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "复制提取码" }));
    await screen.findByText("提取码已复制");
    expect(writeText).toHaveBeenCalledWith("0123");
  });

  it("reports clipboard failure instead of claiming success", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("synthetic clipboard failure"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<PublicDeliveryPanel resource={mapManifestRecordToResource(syntheticRecord)} />);

    fireEvent.click(screen.getByRole("button", { name: "复制提取码" }));
    await screen.findByText("复制失败，请手动记录提取码。");
    expect(screen.queryByText("提取码已复制")).not.toBeInTheDocument();
  });

  it("does not render a passcode area when the manifest omits it", () => {
    const recordWithoutPasscode = Object.fromEntries(
      Object.entries(syntheticRecord).filter(([key]) => key !== "passcode"),
    ) as unknown as PublicManifestRecord;
    render(
      <PublicDeliveryPanel resource={mapManifestRecordToResource(recordWithoutPasscode)} />,
    );
    expect(screen.queryByText("提取码")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "复制提取码" })).not.toBeInTheDocument();
  });

  it("keeps the existing local personal-data contract", () => {
    expect(MY_DATA_KEY).toBe("zhaowenguan.my.v1");
    const input = {
      version: 1,
      favorites: [{ id: "01", at: "2026-10-14" }],
      recentViews: [{ id: "withdrawn", at: "2026-10-14" }],
      downloads: [],
      favoriteTools: [],
      theme: "light",
    };
    expect(validateMyData(input)).toEqual(input);
  });

  it("uses the static source from App instead of the old public API", async () => {
    const fetcher = vi.fn().mockResolvedValue(responseFor(syntheticManifest));
    vi.stubGlobal("fetch", fetcher);
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    window.history.replaceState({}, "", "/resources");

    render(<App />);

    await screen.findByText(syntheticRecord.title);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toContain("data/manifest.v1.json");
    expect(fetcher.mock.calls[0][0]).not.toContain("/api/public/resources");
  });

  it("keeps unchecked and withdrawn records out of homepage recent updates", async () => {
    const records: PublicManifestRecord[] = [
      { ...syntheticRecord, id: "home-verified", title: "首页已核验资料" },
      { ...syntheticRecord, id: "home-unchecked", title: "首页未核验资料", accessStatus: "unchecked", checkedOn: null },
      { ...syntheticRecord, id: "home-withdrawn", title: "首页已撤回资料", accessStatus: "withdrawn" },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(responseFor({ ...syntheticManifest, records })));
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    window.history.replaceState({}, "", "/");

    render(<App />);

    await screen.findByText("首页已核验资料");
    expect(screen.queryByText("首页未核验资料")).not.toBeInTheDocument();
    expect(screen.queryByText("首页已撤回资料")).not.toBeInTheDocument();
  });
});
