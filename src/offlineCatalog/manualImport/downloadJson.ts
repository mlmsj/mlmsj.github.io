/** Explicit user-confirmed call only. A click is initiation, not proof of disk save. */
export function downloadJson(jsonText: string): boolean {
  let url: string | undefined;
  let link: HTMLAnchorElement | undefined;
  try {
    url = URL.createObjectURL(new Blob([jsonText], { type: 'application/json;charset=utf-8' }));
    link = document.createElement('a');
    link.href = url; link.download = 'zhaowenguan-import-draft.json';
    document.body.appendChild(link); link.click(); link.remove();
    const release = url;
    setTimeout(() => URL.revokeObjectURL(release), 1000);
    return true;
  } catch {
    link?.remove();
    if (url) URL.revokeObjectURL(url);
    return false;
  }
}
