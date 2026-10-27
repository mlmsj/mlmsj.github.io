const IMAGE_DECODE_TIMEOUT_MS = 8_000;

export async function validateImageContent(file: File): Promise<void> {
  if (file.size === 0) throw new Error("图片为空，无法读取");

  let finished = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const decoding = Promise.resolve().then(() =>
    createImageBitmap(file, { imageOrientation: "from-image" }),
  );

  void decoding.then(
    bitmap => {
      if (finished) bitmap.close();
    },
    () => undefined,
  );

  try {
    const bitmap = await Promise.race([
      decoding,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("图片解码超时")),
          IMAGE_DECODE_TIMEOUT_MS,
        );
      }),
    ]);
    if (bitmap.width < 1 || bitmap.height < 1) {
      bitmap.close();
      throw new Error("图片尺寸无效");
    }
    bitmap.close();
  } catch {
    throw new Error("图片无法读取，文件可能已损坏或格式不受支持");
  } finally {
    finished = true;
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
