import JSZip from "jszip";

// Reserve original names as well as assigned names so a suffix never hides a real input.
export function uniqueArchiveNames(names: readonly string[]): string[] {
  const reserved = new Set(names.map(name => name.toLowerCase()));
  const used = new Set<string>();
  return names.map(name => {
    let candidate = name;
    const dot = name.lastIndexOf(".");
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot) : "";
    let suffix = 2;
    while (used.has(candidate.toLowerCase())) {
      do {
        candidate = `${stem} (${suffix++})${extension}`;
      } while (reserved.has(candidate.toLowerCase()) || used.has(candidate.toLowerCase()));
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}

export function createImageArchive(entries: readonly { name: string; data: Blob | Uint8Array }[]) {
  const zip = new JSZip();
  const names = uniqueArchiveNames(entries.map(entry => entry.name));
  entries.forEach((entry, index) => zip.file(names[index], entry.data));
  if (Object.values(zip.files).filter(file => !file.dir).length !== entries.length) {
    throw new Error("打包失败：文件数量不一致，请重试。");
  }
  return zip;
}
