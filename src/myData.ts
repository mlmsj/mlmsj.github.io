export const MY_DATA_KEY = "zhaowenguan.my.v1";
export const MY_DATA_VERSION = 1;
export const MAX_RECENT_VIEWS = 50;
export const MAX_IMPORT_BYTES = 1024 * 1024;

export type TimedId = { id: string; at: string };
export type DownloadRecord = TimedId & {
  recordId: string;
  title: string;
  source: string;
  status: "started";
};
export type ThemePreference = "light" | "dark";

export type MyData = {
  version: 1;
  favorites: TimedId[];
  recentViews: TimedId[];
  downloads: DownloadRecord[];
  favoriteTools: TimedId[];
  theme: ThemePreference;
};

export const emptyMyData = (): MyData => ({
  version: MY_DATA_VERSION,
  favorites: [],
  recentViews: [],
  downloads: [],
  favoriteTools: [],
  theme: "light",
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isIsoDate = (value: unknown) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));
const isTimedId = (value: unknown): value is TimedId =>
  isObject(value) && typeof value.id === "string" && value.id.length > 0 && isIsoDate(value.at);
const isDownload = (value: unknown): value is DownloadRecord => {
  if (!isObject(value) || !isTimedId(value)) return false;
  const record = value as unknown as Record<string, unknown>;
  return typeof record.recordId === "string" && typeof record.title === "string" && typeof record.source === "string" && record.status === "started";
};

const uniqueLatest = <T extends TimedId>(items: T[], limit = Number.POSITIVE_INFINITY) => {
  const seen = new Set<string>();
  return [...items]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .filter(item => !seen.has(item.id) && !!seen.add(item.id))
    .slice(0, limit);
};

export function validateMyData(value: unknown): MyData {
  if (!isObject(value) || value.version !== MY_DATA_VERSION) throw new Error("备份版本不受支持");
  const { favorites, recentViews, downloads, favoriteTools, theme } = value;
  if (!Array.isArray(favorites) || !Array.isArray(recentViews) || !Array.isArray(downloads) || !Array.isArray(favoriteTools)) throw new Error("备份结构不完整");
  if (![...favorites, ...recentViews, ...favoriteTools].every(isTimedId)) throw new Error("备份包含无效记录");
  if (theme !== "light" && theme !== "dark") throw new Error("主题设置无效");
  if (!downloads.every(isDownload)) throw new Error("下载记录无效");
  return {
    version: MY_DATA_VERSION,
    favorites: uniqueLatest(favorites as TimedId[]),
    recentViews: uniqueLatest(recentViews as TimedId[], MAX_RECENT_VIEWS),
    downloads: (downloads as DownloadRecord[]).slice(0, 200),
    favoriteTools: uniqueLatest(favoriteTools as TimedId[]),
    theme,
  };
}

export function loadMyData(): MyData {
  try {
    const raw = localStorage.getItem(MY_DATA_KEY);
    return raw ? validateMyData(JSON.parse(raw)) : emptyMyData();
  } catch {
    return emptyMyData();
  }
}

export function saveMyData(data: MyData) {
  localStorage.setItem(MY_DATA_KEY, JSON.stringify(data));
}

export function toggleTimed(items: TimedId[], id: string, now = new Date().toISOString()) {
  return items.some(item => item.id === id)
    ? items.filter(item => item.id !== id)
    : [{ id, at: now }, ...items];
}

export function recordRecent(items: TimedId[], id: string, now = new Date().toISOString()) {
  return [{ id, at: now }, ...items.filter(item => item.id !== id)].slice(0, MAX_RECENT_VIEWS);
}

export function mergeMyData(current: MyData, incoming: MyData): MyData {
  return {
    version: MY_DATA_VERSION,
    favorites: uniqueLatest([...current.favorites, ...incoming.favorites]),
    recentViews: uniqueLatest([...current.recentViews, ...incoming.recentViews], MAX_RECENT_VIEWS),
    downloads: [...incoming.downloads, ...current.downloads].filter((item, index, all) => all.findIndex(other => other.recordId === item.recordId) === index).slice(0, 200),
    favoriteTools: uniqueLatest([...current.favoriteTools, ...incoming.favoriteTools]),
    theme: incoming.theme,
  };
}
