// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { build } from 'vite';

describe('production entry non-exposure', () => {
  it('excludes preview HTML, component and styles from the real production build graph', async () => {
    // Real existing config; in-memory output, no public directory copying or disk artifacts.
    const result = await build({ configFile: 'vite.config.ts', configLoader: 'runner', logLevel: 'silent', build: { write: false, copyPublicDir: false } });
    const bundles = Array.isArray(result) ? result : [result];
    const outputs = bundles.flatMap(bundle => 'output' in bundle ? bundle.output : []);
    expect(outputs.some(output => output.fileName === 'index.html')).toBe(true);
    expect(outputs.some(output => /preview|ImportSkeleton|ImportWorkspace|downloadJson/.test(output.fileName))).toBe(false);
    for (const output of outputs) {
      const text = output.type === 'chunk' ? output.code : typeof output.source === 'string' ? output.source : new TextDecoder().decode(output.source);
      expect(text).not.toMatch(/运营者工作区 · 开发预览|import-skeleton|import-preview|未启用管理员认证，不可公开发布/);
      if (output.type === 'chunk') expect(Object.keys(output.modules).some(id => /manualImport[/\\]/.test(id))).toBe(false);
    }
  }, 60_000);
});
