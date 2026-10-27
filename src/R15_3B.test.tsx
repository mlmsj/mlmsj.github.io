import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { decodePDFRawStream, PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InfoPage } from './InfoPages';
import { MyPage } from './MyPage';
import { Toolbox, ToolDetail } from './Toolbox';
import { emptyMyData } from './myData';
import { toolCatalog } from './toolCatalog';
import { addTextWatermarkWithFont } from './pdfTextCore';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from './publicContact';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('R15-3B capability copy', () => {
  it('keeps the 15 tool names consistent and describes text watermarking without a speed promise', () => {
    render(<Toolbox openTool={() => undefined} />);
    expect(toolCatalog).toHaveLength(15);
    for (const tool of toolCatalog) expect(screen.getByText(tool.name, { exact: true })).toBeVisible();
    expect(screen.getByText('添加文字水印', { exact: true })).toBeVisible();
    expect(screen.getByText('多张图片整理排版')).toBeVisible();
    expect(document.body).not.toHaveTextContent(/快速|秒级|极速|无损|完全保真|绝对安全|所有格式|完全兼容|文字或图片水印/);
  });

  it('exposes only PDF input and the supported text watermark controls', () => {
    render(<ToolDetail tool="watermark" back={() => undefined} />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'PDF 添加文字水印' })).toBeVisible();
    expect(screen.getByText(/目前仅支持文字水印/)).toBeVisible();
    expect(document.querySelectorAll('input[type=file]')).toHaveLength(1);
    expect(document.querySelector('input[type=file]')).toHaveAttribute('accept', 'application/pdf');
    expect(within(screen.getByLabelText('位置')).getAllByRole('option').map(option => option.textContent))
      .toEqual(['居中', '左上', '右上', '左下', '右下']);
    expect(screen.getByLabelText('透明度')).toHaveAttribute('min', '.05');
    expect(screen.getByLabelText('透明度')).toHaveAttribute('max', '.8');
    expect(screen.getByLabelText('旋转角度')).toHaveAttribute('min', '-180');
    expect(screen.getByLabelText('旋转角度')).toHaveAttribute('max', '180');
    expect(screen.getByLabelText('字号')).toHaveAttribute('min', '8');
    expect(screen.getByLabelText('字号')).toHaveAttribute('max', '120');
    for (const label of ['水印文字', '颜色', '水平偏移', '垂直偏移', '指定页面（可选）', '跳过封面']) {
      expect(screen.getByLabelText(label)).toBeVisible();
    }
  });

  it('states the catalog service condition and the unavailable file retrieval step', () => {
    const go = vi.fn();
    render(<InfoPage page="guide" go={go} />);
    expect(screen.getByText('欢迎通过项目联系邮箱与我们联系。')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /联系我们/ }));
    expect(go).toHaveBeenCalledWith('contact');
    expect(screen.getByText(/学习资料目录已可浏览/)).toHaveTextContent('需公开资料服务可用');
    expect(screen.getByRole('heading', { name: '查看获取状态' })).toBeVisible();
    expect(screen.getByText('当前未开放资料文件获取，请以详情页提示为准。')).toBeVisible();
    fireEvent.click(screen.getByRole('tab', { name: '学生工具箱' }));
    expect(screen.getByText(/已开放 15 个浏览器本地处理工具/)).toBeVisible();
    expect(screen.getByText(/PDF 水印仅支持文字/)).toHaveTextContent('以 JPEG 重新编码，可能降低清晰度');
    fireEvent.click(screen.getByRole('tab', { name: '常见问题' }));
    expect(screen.getByText(/字体、OCR 组件和模型可能需要通过网络加载/)).toHaveTextContent('本地处理不表示所有数据都不会离开设备');
    expect(screen.getByText(/目录访问问题可通过/)).toHaveTextContent('页面所列邮箱');
  });

  it('keeps the authorized project email actions and unavailable public feedback', () => {
    render(<InfoPage page="contact" go={() => undefined} />);
    expect(screen.getByText(PUBLIC_CONTACT_EMAIL, { selector: 'a' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '在线反馈暂未开放' })).toBeVisible();
    expect(screen.getByText(/当前公开网站尚未接入反馈接收接口/)).toHaveTextContent('目录管理后台的本地能力不等于公开反馈服务已经开放');
    expect(screen.getByText(/请勿在邮件中提供密码、身份证号等敏感信息/)).toBeVisible();
    expect(document.querySelector('form')).toBeNull();
    const links = document.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]');
    expect(links).toHaveLength(2);
    for (const link of links) expect(link.getAttribute('href')).toBe(PUBLIC_CONTACT_MAILTO);
  });

  it('announces project email copy success and failure without losing the manual fallback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<InfoPage page="contact" go={() => undefined} />);
    const button = screen.getByRole('button', { name: '复制项目联系邮箱' });
    expect(button).toHaveAttribute('aria-live', 'polite');
    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveTextContent('已复制'));
    expect(writeText).toHaveBeenCalledWith(PUBLIC_CONTACT_EMAIL);

    writeText.mockRejectedValueOnce(new Error('clipboard unavailable'));
    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveTextContent('请手动复制'));
  });

  it('keeps MyPage feedback unavailable online while preserving the project email exit', () => {
    render(<MyPage section="feedback" data={emptyMyData()} setData={() => undefined} resources={[]} onSection={() => undefined} onResource={() => undefined} onTool={() => undefined} onHome={() => undefined} />);
    expect(screen.getByRole('heading', { name: '在线提交尚未配置' })).toBeVisible();
    expect(screen.getByRole('link', { name: `发送邮件至项目联系邮箱 ${PUBLIC_CONTACT_EMAIL}` })).toHaveAttribute('href', PUBLIC_CONTACT_MAILTO);
    expect(screen.getByText(/请勿提供密码、身份证号等敏感信息/)).toBeVisible();
    expect(screen.getByRole('button', { name: '暂未配置提交服务' })).toBeDisabled();
  });

  it('keeps the authorized address literal in the shared config only', () => {
    const files = ['src/publicContact.ts', 'src/InfoPages.tsx', 'src/MyPage.tsx', 'src/R15_3B.test.tsx'];
    const occurrences = files.reduce((count, file) => count + readFileSync(file, 'utf8').split(PUBLIC_CONTACT_EMAIL).length - 1, 0);
    expect(occurrences).toBe(1);
  });

  it('describes the current catalog in the disclaimer and qualifies compression quality', () => {
    const view = render(<InfoPage page="disclaimer" go={() => undefined} />);
    expect(screen.getByText(/本站提供学习资源目录的整理/)).toHaveTextContent('当前未开放资料文件获取');
    expect(screen.getByText(/请通过「联系我们」页面所列邮箱提交具体链接/)).toBeVisible();
    expect(screen.getByText(/权利归各自合法权利人所有/)).toBeVisible();
    view.unmount();
    render(<ToolDetail tool="pdf-compress" back={() => undefined} />);
    expect(screen.getByText(/检测到文本层时保留原文件/)).toHaveTextContent('无文本层时以 JPEG 重新编码，可能降低清晰度');
  });
});

describe('R15-3B real text watermark serialization', () => {
  // This is a PDF text font, not an OCR model or language pack.
  const fontBytes = new Uint8Array(readFileSync('public/fonts/NotoSansSC-GB2312.ttf'));
  it.each(['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'] as const)(
    'writes selected pages and passes actual drawing parameters at %s', async position => {
      const doc = await PDFDocument.create();
      const cover = doc.addPage([420, 595]);
      const page = doc.addPage([420, 595]);
      const coverDraw = vi.spyOn(cover, 'drawText');
      const draw = vi.spyOn(page, 'drawText');
      expect(await addTextWatermarkWithFont(doc, {
        text: '仅供学习使用', selectedPages: new Set([2]), position,
        opacity: .35, angle: -45, fontSize: 22,
        color: { r: .2, g: .3, b: .4 }, offsetX: 7, offsetY: -9, fontBytes,
      })).toBe(1);
      expect(coverDraw).not.toHaveBeenCalled();
      expect(draw).toHaveBeenCalledOnce();
      const [text, options] = draw.mock.calls[0];
      expect(text).toBe('仅供学习使用');
      expect(options).toMatchObject({ size: 22, opacity: .35, rotate: { angle: -45 }, color: { red: .2, green: .3, blue: .4 } });
      expect(Number.isFinite(options!.x)).toBe(true);
      expect(Number.isFinite(options!.y)).toBe(true);
      if (position.endsWith('left')) expect(options!.x).toBeLessThan(100);
      if (position.endsWith('right')) expect(options!.x).toBeGreaterThan(200);
      if (position.startsWith('top')) expect(options!.y).toBeGreaterThan(400);
      if (position.startsWith('bottom')) expect(options!.y).toBeLessThan(200);
      if (position === 'center') {
        const font = options!.font!;
        const ascent = font.heightAtSize(22, { descender: false });
        const descent = font.heightAtSize(22) - ascent;
        const middleX = font.widthOfTextAtSize(text, 22) / 2;
        const middleY = (ascent - descent) / 2;
        const angle = -Math.PI / 4;
        expect(options!.x! + middleX * Math.cos(angle) - middleY * Math.sin(angle)).toBeCloseTo(217);
        expect(options!.y! + middleX * Math.sin(angle) + middleY * Math.cos(angle)).toBeCloseTo(288.5);
      }
      const reopened = await PDFDocument.load(await doc.save());
      expect(reopened.getPageCount()).toBe(2);
      expect(reopened.getPage(0).node.Contents()).toBeUndefined();
      const streams = reopened.getPage(1).node.Contents() as PDFArray;
      const operators = streams.asArray().map(ref => decodePDFRawStream(reopened.context.lookup(ref) as PDFRawStream).decode());
      const content = operators.map(bytes => new TextDecoder().decode(bytes)).join('\n');
      expect(content).toContain(' Tj');
      expect(content).toContain(' gs');
      expect(content).toContain('0.2 0.3 0.4 rg');
      const state = reopened.getPage(1).node.Resources()!.lookupMaybe(
        // The actual opacity is serialized in the page's ExtGState resource.
        PDFName.of('ExtGState'), PDFDict,
      );
      expect(state?.toString()).toContain('/ca 0.35');
    },
  );
});
