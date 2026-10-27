# PDF 中文字体资产

- `NotoSansSC-GB2312.ttf`：从 Noto Sans SC 官方可变 TTF 固定为 400 字重后制作，保留 ASCII 与 GB2312 常用简体中文字符。该项目级子集会完整嵌入 PDF，以避免 `pdf-lib/fontkit` 对 CJK 字体二次子集化时丢失字形。
- `NotoSansSC-OFL-1.1.txt`：随字体分发的 SIL Open Font License 1.1 全文。
- 上游来源：<https://github.com/notofonts/noto-cjk/blob/main/Sans/Variable/TTF/Subset/NotoSansSC-VF.ttf>

如果输入字符不在该子集内，生成流程会明确中止并提示缺失字符，不会导出缺字或乱码的 PDF。

- 本站以固定字体的字符到字形映射和宽度生成 PDF；`src/notoFontMetrics.json` 由上述字体提取，随同字体遵循 OFL，字体校验不一致时拒绝生成。
- 页码和水印支持该字体包含的字符；逐字符排版不执行自动英文连字或完整复杂文字整形。字体不含的字符会拒绝导出。
