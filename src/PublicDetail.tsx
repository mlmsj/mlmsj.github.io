import { useState, type ReactNode } from "react";
import { categories, type Category } from "./categories";
import {
  canOpenPublicShare,
  getResourceAccessLabel,
  getResourceAccessMessage,
  type PublicCatalogPhase,
} from "./publicCatalog";
import { isPublishedPublicResource } from "./categoryCounts";
import type { Resource } from "./resources";

const providerLabels = {
  quark: "夸克网盘",
  baidu: "百度网盘",
} as const;

export function PublicDeliveryPanel({ resource }: { resource: Resource }) {
  const [copyMessage, setCopyMessage] = useState("");
  const delivery = resource.delivery;

  if (!delivery) {
    return (
      <section className="resource-delivery" aria-label="资料访问信息">
        <p className="resource-delivery-status" role="status">
          该资料尚未配置公开网盘入口。
        </p>
      </section>
    );
  }

  const accessLabel = getResourceAccessLabel(resource);
  const accessMessage = getResourceAccessMessage(resource);
  const canOpen = canOpenPublicShare(resource);
  const copyPasscode = async () => {
    if (!delivery.passcode) return;
    try {
      const writeText = navigator.clipboard?.writeText;
      if (typeof writeText !== "function") throw new Error("clipboard-unavailable");
      await writeText.call(navigator.clipboard, delivery.passcode);
      setCopyMessage("提取码已复制");
    } catch {
      setCopyMessage("复制失败，请手动记录提取码。");
    }
  };

  return (
    <section className="resource-delivery" aria-label="资料访问信息">
      <div className="resource-delivery-header">
        <div>
          <span className="resource-delivery-eyebrow">资料入口</span>
          <strong>{providerLabels[delivery.provider]}</strong>
        </div>
        {accessLabel && (
          <span className={`resource-access-status resource-access-status-${delivery.accessStatus}`}>
            {accessLabel}
          </span>
        )}
      </div>
      {accessMessage && (
        <p className="resource-delivery-status" role="status">{accessMessage}</p>
      )}
      {delivery.accessStatus === "verified" && delivery.checkedOn && (
        <p className="resource-delivery-checked">最近人工核验：{delivery.checkedOn}</p>
      )}
      {canOpen && delivery.shareUrl ? (
        <a
          className="resource-delivery-link"
          href={delivery.shareUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          打开{providerLabels[delivery.provider]}分享
        </a>
      ) : (
        <span className="resource-delivery-disabled" aria-disabled="true">
          当前暂不提供正常访问入口
        </span>
      )}
      {canOpen && delivery.passcode && (
        <div className="resource-passcode">
          <span>提取码</span>
          <code>{delivery.passcode}</code>
          <button type="button" onClick={() => void copyPasscode()}>复制提取码</button>
          <span className="resource-copy-status" role="status" aria-live="polite">
            {copyMessage}
          </span>
        </div>
      )}
    </section>
  );
}

export function PublicDetail({
  id,
  resourceValues,
  categoryValues = categories,
  catalogPhase,
  catalogStatus,
  render,
}: {
  id: string | null;
  resourceValues: readonly Resource[];
  categoryValues?: readonly Category[];
  catalogPhase: PublicCatalogPhase;
  catalogStatus: string;
  render: (resource: Resource) => ReactNode;
}) {
  if (!id) {
    return <section className="page-section" role="status">资料不存在、未发布或已撤回。</section>;
  }
  if (catalogPhase === "loading") {
    return <section className="page-section" role="status">正在加载公开资料清单…</section>;
  }
  if (catalogPhase === "error") {
    return (
      <section className="page-section" role="alert">
        {catalogStatus || "公开资料清单暂不可用，请重试。"}
      </section>
    );
  }

  const resource = resourceValues.find((item) => item.id === id);
  const isWithdrawn = resource?.publicationStatus === "withdrawn" ||
    resource?.delivery?.accessStatus === "withdrawn";
  if (!resource || !isPublishedPublicResource(resource, categoryValues)) {
    return (
      <section className="page-section" role="status">
        {isWithdrawn ? "该资料已撤回，不再提供公开访问入口。" : "资料不存在、未发布或已撤回。"}
      </section>
    );
  }
  return render(resource);
}
