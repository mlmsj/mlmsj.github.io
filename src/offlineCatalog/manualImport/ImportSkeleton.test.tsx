import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import App from '../../App';
import { ImportSkeleton } from './ImportSkeleton';
const sourceFile = (file: string) => readFileSync(resolve('src/offlineCatalog/manualImport', file), 'utf8');
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.history.replaceState({}, '', '/'); });
describe('unwired skeleton', () => {
  it('shows the operator preview, auth blocker, and accessible three-step structure', () => {
    render(<ImportSkeleton />);
    expect(screen.getByRole('heading', { name: '资料导入', level: 1 })).toBeVisible();
    expect(screen.getByText('运营者工作区 · 开发预览')).toBeVisible();
    expect(screen.getByText('未启用管理员认证，不可公开发布')).toBeVisible();
    expect(screen.getByRole('list')).toBeVisible(); expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('尚未选择清单')).toBeVisible();
    expect(screen.getByRole('region', { name: '清单工作区' })).toBeVisible();
  });
  it.each(['empty', 'example'] as const)('disables every business action in %s state', display => {
    const { container } = render(<ImportSkeleton display={display} />);
    for (const button of screen.getAllByRole('button')) { expect(button).toBeDisabled(); fireEvent.click(button); }
    expect(screen.getByRole('button', { name: /保存为草稿/ })).toHaveAccessibleDescription(/缺少可信后端/);
    expect(container.querySelector('input[type=file]')).toBeNull();
    expect(container.querySelector('a[download]')).toBeNull();
  });
  it('marks mock counts and all fictional records visibly', () => {
    render(<ImportSkeleton display="example" />);
    expect(screen.getByText('模拟统计 · 全部为虚构示例')).toBeVisible();
    expect(screen.getByLabelText('虚构示例记录')).toBeVisible();
    expect(screen.getByText('虚构示例')).toBeVisible();
    expect(screen.getByText('仅供布局展示，不会进入正式资源')).toBeVisible();
  });
  it('uses a card and description list instead of an overflowing six-column table', () => {
    const { container } = render(<ImportSkeleton display="example" />);
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('.import-skeleton-record dl')?.children).toHaveLength(6);
    const css = sourceFile('ImportSkeleton.css');
    expect(css).toContain('minmax(0, 24fr) minmax(0, 76fr)');
    expect(css).toContain('@media (max-width: 800px)'); expect(css).toContain('@media (max-width: 520px)');
    expect(css).toContain('.import-skeleton-record dl { grid-template-columns: minmax(0, 1fr); }');
    expect(css).toContain(':focus-visible');
  });
  it('reuses green theme tokens without external resources or global CSS changes', () => {
    const css = sourceFile('ImportSkeleton.css');
    for (const token of ['ink', 'forest', 'cream', 'paper', 'line', 'mist', 'shadow']) expect(css).toContain(`var(--${token},`);
    expect(css).not.toMatch(/@import|url\(/);
  });
  it('does not connect parser/workspace, network, persistence or download APIs', () => {
    const source = sourceFile('ImportSkeleton.tsx');
    expect(source).not.toMatch(/onClick|onChange|onDrop|fetch|localStorage|sessionStorage|indexedDB|Blob|createObjectURL|prepareExport|parseManualImport|updateWorkspace|dangerouslySetInnerHTML/);
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('forbidden'));
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    render(<ImportSkeleton display="example" />); screen.getAllByRole('button').forEach(button => fireEvent.click(button));
    expect(network).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
  });
});
describe('public entry isolation: actual App rendering', () => {
  it.each(['/import', '/admin/import', '/src/offlineCatalog/manualImport/preview/index.html', '/zhaowenguan-v2/import'])('does not render workspace at %s in the public App', path => {
    window.history.replaceState({}, '', path); render(<App />);
    expect(screen.queryByRole('heading', { name: '资料导入' })).not.toBeInTheDocument();
    expect(screen.queryByText('运营者工作区 · 开发预览')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '昭文馆', level: 1 })).toBeVisible();
  });
  it.each(['/', '/profile', '/categories', '/resources'])('adds no operator navigation at %s', path => {
    window.history.replaceState({}, '', path); render(<App />);
    expect(screen.queryByRole('button', { name: /资料导入|运营者工作区/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /资料导入|运营者工作区/ })).not.toBeInTheDocument();
  });
  it('keeps preview separate from production root and explicitly DEV gated', () => {
    for (const file of ['../../App.tsx', '../../main.tsx']) expect(sourceFile(file)).not.toMatch(/ImportSkeleton|manualImport\/preview/);
    const preview = sourceFile('preview/main.tsx');
    expect(preview).toContain('if (import.meta.env.DEV)'); expect(preview).toContain('if (localHost)');
    expect(preview).not.toMatch(/localStorage|password|role\s*=/);
  });
});
